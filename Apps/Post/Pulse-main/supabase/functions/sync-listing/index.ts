import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { vin, fb_url } = body;

    if (!vin || typeof vin !== "string" || vin.length > 20) {
      return new Response(JSON.stringify({ error: "Valid VIN is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for the update
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get dealer_id from the user's profile
    const userId = claimsData.claims.sub;
    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.dealership_id) {
      return new Response(JSON.stringify({ error: "No dealership found for user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updateData: Record<string, unknown> = {
      last_posted_at: new Date().toISOString(),
    };

    if (fb_url && typeof fb_url === "string" && fb_url.length <= 500) {
      updateData.fb_listing_url = fb_url;
    }

    const { data, error } = await supabase
      .from("pulse_vehicles")
      .update(updateData)
      .eq("vin", vin)
      .eq("dealer_id", profile.dealership_id)
      .select("id, vin, make, model, year, last_posted_at")
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Vehicle not found or update failed" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Listing synced: ${data.year} ${data.make} ${data.model} (${vin})`);

    return new Response(JSON.stringify({ success: true, vehicle: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-listing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
