import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

/* ── Helper: fire-and-forget email via send-email function ── */
async function sendEmail(type: string, to: string, data: Record<string, string>) {
  try {
    const base = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    await fetch(`${base}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ type, to, data }),
    });
  } catch (e) {
    console.log(`[STRIPE-WEBHOOK] Email send failed (non-fatal): ${e.message}`);
  }
}

const log = (step: string, details?: any) => {
  const d = details ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  // Only POST allowed
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    log("ERROR", { message: "STRIPE_SECRET_KEY not set" });
    return new Response("Server configuration error", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let event: Stripe.Event;

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      log("ERROR", { message: "Missing stripe-signature header" });
      return new Response("Missing signature", { status: 400 });
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      log("ERROR", { message: `Signature verification failed: ${err.message}` });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  } else {
    // No webhook secret — parse body directly (dev mode)
    log("WARNING", { message: "No STRIPE_WEBHOOK_SECRET set — skipping signature verification" });
    const body = await req.json();
    event = body as Stripe.Event;
  }

  log("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      // ── Checkout completed — new subscription ──────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const subscriptionId = session.subscription as string;

        log("Checkout completed", { email: customerEmail, subscriptionId });

        if (customerEmail && subscriptionId) {
          // Get subscription details for the product ID
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const productId = subscription.items.data[0]?.price?.product as string;

          // Find the user by email and update their subscription status
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const matchedUser = authUsers?.users?.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );

          if (matchedUser) {
            // Update the dealership subscription tier
            const { data: profile } = await supabase
              .from("profiles")
              .select("dealership_id")
              .eq("user_id", matchedUser.id)
              .single();

            if (profile?.dealership_id) {
              await supabase.from("dealerships").update({
                subscription_tier: productId,
                status: "active",
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscriptionId,
              }).eq("id", profile.dealership_id);

              log("Dealership updated", { dealership_id: profile.dealership_id, productId });

              // Send subscription confirmation email
              const { data: dealershipData } = await supabase
                .from("dealerships")
                .select("name")
                .eq("id", profile.dealership_id)
                .single();

              const priceAmount = subscription.items.data[0]?.price?.unit_amount;
              const planLabel = priceAmount === 4900 ? "Starter" : priceAmount === 9900 ? "Unlimited" : "Pulse Post";
              const amountStr = priceAmount ? `$${(priceAmount / 100).toFixed(0)}` : "$49";

              await sendEmail("subscription_confirmed", customerEmail, {
                name: matchedUser.user_metadata?.full_name || customerEmail.split("@")[0],
                planName: planLabel,
                amount: amountStr,
              });
            }
          }
        }
        break;
      }

      // ── Subscription updated (upgrade/downgrade) ───────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const productId = subscription.items.data[0]?.price?.product as string;
        const status = subscription.status;

        log("Subscription updated", { customerId, productId, status });

        // Find dealership by stripe_customer_id
        const { data: dealership } = await supabase
          .from("dealerships")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (dealership) {
          await supabase.from("dealerships").update({
            subscription_tier: productId,
            status: status === "active" ? "active" : "past_due",
          }).eq("id", dealership.id);

          log("Dealership subscription synced", { dealership_id: dealership.id, status });
        }
        break;
      }

      // ── Subscription deleted (cancelled) ───────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        log("Subscription cancelled", { customerId });

        const { data: dealership } = await supabase
          .from("dealerships")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (dealership) {
          await supabase.from("dealerships").update({
            subscription_tier: "cancelled",
            status: "inactive",
          }).eq("id", dealership.id);

          log("Dealership deactivated", { dealership_id: dealership.id });
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        log("Payment failed", { customerId });

        const { data: dealership } = await supabase
          .from("dealerships")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (dealership) {
          await supabase.from("dealerships").update({
            status: "past_due",
          }).eq("id", dealership.id);

          log("Dealership marked past_due", { dealership_id: dealership.id });

          // Send payment failed email
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          if (customer.email) {
            await sendEmail("payment_failed", customer.email, {
              name: customer.name || customer.email.split("@")[0],
            });
          }
        }
        break;
      }

      // ── Payment succeeded (renewal) ────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        log("Payment succeeded", { customerId });

        const { data: dealership } = await supabase
          .from("dealerships")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (dealership) {
          await supabase.from("dealerships").update({
            status: "active",
          }).eq("id", dealership.id);

          log("Dealership reactivated on payment", { dealership_id: dealership.id });
        }
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    log("ERROR processing event", { type: event.type, error: error.message });
    // Return 200 anyway to prevent Stripe retries on processing errors
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
});
