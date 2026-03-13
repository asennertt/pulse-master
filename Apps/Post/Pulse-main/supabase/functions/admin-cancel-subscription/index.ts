import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-CANCEL-SUB] ${step}${detailsStr}`);
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
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Verify super admin
    const { data: hasSuperAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "super_admin",
    });

    if (!hasSuperAdmin) {
      throw new Error("Unauthorized: super admin access required");
    }

    logStep("Super admin verified", { userId: user.id });

    const { subscriptionId, action } = await req.json();
    if (!subscriptionId) throw new Error("subscriptionId is required");
    if (!action || !["cancel", "reactivate"].includes(action)) {
      throw new Error("action must be 'cancel' or 'reactivate'");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    if (action === "cancel") {
      // Cancel at end of current billing period
      const updated = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      logStep("Subscription set to cancel at period end", {
        subscriptionId,
        cancel_at: new Date(updated.current_period_end * 1000).toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription will cancel at end of billing period",
          cancel_at: updated.current_period_end,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Reactivate — undo cancel_at_period_end
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      logStep("Subscription reactivated", { subscriptionId });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription reactivated — will continue to renew",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
