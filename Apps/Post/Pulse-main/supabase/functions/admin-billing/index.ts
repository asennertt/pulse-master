import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-BILLING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Verify super admin via profiles table
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      throw new Error("Unauthorized: super admin access required");
    }

    logStep("Super admin verified", { userId: user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch all customers from Stripe (paginate up to 100)
    const customers = await stripe.customers.list({ limit: 100 });
    logStep("Fetched customers", { count: customers.data.length });

    // Fetch all active + past_due + trialing subscriptions
    const [activeSubs, pastDueSubs, trialingSubs, canceledSubs] =
      await Promise.all([
        stripe.subscriptions.list({ status: "active", limit: 100 }),
        stripe.subscriptions.list({ status: "past_due", limit: 100 }),
        stripe.subscriptions.list({ status: "trialing", limit: 100 }),
        stripe.subscriptions.list({ status: "canceled", limit: 100 }),
      ]);

    const allSubs = [
      ...activeSubs.data,
      ...pastDueSubs.data,
      ...trialingSubs.data,
      ...canceledSubs.data,
    ];

    logStep("Fetched subscriptions", { total: allSubs.length });

    // Build a map of customer_id -> subscriptions
    const subsByCustomer: Record<string, any[]> = {};
    for (const sub of allSubs) {
      const custId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      if (!subsByCustomer[custId]) subsByCustomer[custId] = [];
      subsByCustomer[custId].push({
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created: sub.created,
        items: sub.items.data.map((item: any) => ({
          price_id: item.price.id,
          product_id:
            typeof item.price.product === "string"
              ? item.price.product
              : item.price.product.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency,
          interval: item.price.recurring?.interval || null,
        })),
      });
    }

    // Also fetch all products so we can show names
    const products = await stripe.products.list({ limit: 100, active: true });
    const productMap: Record<string, string> = {};
    for (const p of products.data) {
      productMap[p.id] = p.name;
    }

    logStep("Fetched products", { count: products.data.length });

    // Cross-reference with dealerships table by email
    const { data: dealerships } = await supabaseClient
      .from("dealerships")
      .select("id, name, owner_email, subscription_tier, status");

    const dealerByEmail: Record<string, any> = {};
    for (const d of dealerships || []) {
      if (d.owner_email) {
        dealerByEmail[d.owner_email.toLowerCase()] = d;
      }
    }

    // Build response: each customer with subs + dealership info
    const billingData = customers.data.map((cust) => {
      const email = cust.email?.toLowerCase() || "";
      const dealer = dealerByEmail[email] || null;
      const subs = subsByCustomer[cust.id] || [];

      // Attach product names to subscription items
      const enrichedSubs = subs.map((sub) => ({
        ...sub,
        items: sub.items.map((item: any) => ({
          ...item,
          product_name: productMap[item.product_id] || "Unknown Product",
        })),
      }));

      // Calculate monthly amount from active subs
      let monthlyAmount = 0;
      for (const sub of enrichedSubs) {
        if (sub.status === "active" || sub.status === "trialing") {
          for (const item of sub.items) {
            if (item.unit_amount) {
              if (item.interval === "month") {
                monthlyAmount += item.unit_amount;
              } else if (item.interval === "year") {
                monthlyAmount += Math.round(item.unit_amount / 12);
              }
            }
          }
        }
      }

      return {
        customer_id: cust.id,
        email: cust.email,
        name: cust.name,
        created: cust.created,
        dealership: dealer
          ? {
              id: dealer.id,
              name: dealer.name,
              subscription_tier: dealer.subscription_tier,
              status: dealer.status,
            }
          : null,
        subscriptions: enrichedSubs,
        monthly_amount_cents: monthlyAmount,
      };
    });

    // Calculate aggregate MRR
    const totalMRR = billingData.reduce(
      (sum, c) => sum + c.monthly_amount_cents,
      0
    );
    const activeCustomers = billingData.filter((c) =>
      c.subscriptions.some(
        (s: any) => s.status === "active" || s.status === "trialing"
      )
    ).length;

    const response = {
      customers: billingData,
      summary: {
        total_customers: billingData.length,
        active_subscribers: activeCustomers,
        mrr_cents: totalMRR,
        currency: "usd",
      },
    };

    logStep("Response built", {
      customers: billingData.length,
      mrr: totalMRR,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
