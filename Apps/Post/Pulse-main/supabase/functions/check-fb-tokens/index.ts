import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all dealer settings with FB tokens
    const { data: settings, error } = await supabase
      .from("dealer_settings")
      .select("id, dealer_id, dealership_name, fb_page_token, fb_token_expires_at, fb_token_status")
      .not("fb_page_token", "is", null)
      .neq("fb_page_token", "");

    if (error) throw error;

    const now = new Date();
    const results: { dealer: string; status: string; emailed: boolean }[] = [];

    for (const s of settings || []) {
      if (!s.fb_token_expires_at) {
        // No expiry set — mark as connected (assume valid)
        if (s.fb_token_status !== "connected") {
          await supabase
            .from("dealer_settings")
            .update({ fb_token_status: "connected" })
            .eq("id", s.id);
        }
        results.push({ dealer: s.dealership_name, status: "connected", emailed: false });
        continue;
      }

      const expiresAt = new Date(s.fb_token_expires_at);
      const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      let newStatus: string;
      let shouldEmail = false;

      if (daysUntilExpiry <= 0) {
        newStatus = "expired";
        shouldEmail = s.fb_token_status !== "expired"; // Only email on first detection
      } else if (daysUntilExpiry <= 7) {
        newStatus = "expiring_soon";
        shouldEmail = s.fb_token_status !== "expiring_soon"; // Only email on first detection
      } else {
        newStatus = "connected";
        shouldEmail = false;
      }

      if (newStatus !== s.fb_token_status) {
        await supabase
          .from("dealer_settings")
          .update({ fb_token_status: newStatus })
          .eq("id", s.id);
      }

      // Send email alert if status changed to expired or expiring_soon
      if (shouldEmail && s.dealer_id) {
        // Get dealer owner email
        const { data: dealership } = await supabase
          .from("dealerships")
          .select("owner_email, name")
          .eq("id", s.dealer_id)
          .single();

        if (dealership?.owner_email) {
          // Log the alert (in production, integrate with an email service)
          console.log(
            `[FB Token Alert] Dealer: ${dealership.name} (${dealership.owner_email}) — Status: ${newStatus}, Days until expiry: ${Math.round(daysUntilExpiry)}`
          );
        }
      }

      results.push({
        dealer: s.dealership_name,
        status: newStatus,
        emailed: shouldEmail,
      });
    }

    return new Response(
      JSON.stringify({ checked: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-fb-tokens error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
