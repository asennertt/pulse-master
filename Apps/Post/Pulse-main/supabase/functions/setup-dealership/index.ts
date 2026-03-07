import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const { bizName, bizAddress } = await req.json();
    if (!bizName?.trim() || !bizAddress?.trim()) throw new Error("Business name and address are required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Invalid auth");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check if user already has a dealership
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("dealership_id")
      .eq("user_id", user.id)
      .single();
    if (existingProfile?.dealership_id) throw new Error("Already linked to a dealership");

    // Create dealership
    const slug = bizName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
    const { data: dealership, error: dealerErr } = await adminClient
      .from("dealerships")
      .insert({
        name: bizName.trim(),
        slug,
        address: bizAddress.trim(),
        status: "active",
      })
      .select()
      .single();
    if (dealerErr) throw dealerErr;

    // Link profile to dealership
    await adminClient
      .from("profiles")
      .update({ dealership_id: dealership.id, onboarding_step: 3 })
      .eq("user_id", user.id);

    // Assign dealer_admin role
    await adminClient
      .from("user_roles")
      .insert({ user_id: user.id, role: "dealer_admin" });

    // Create dealer settings
    await adminClient
      .from("dealer_settings")
      .insert({
        dealer_id: dealership.id,
        dealership_name: bizName.trim(),
        address: bizAddress.trim(),
      });

    // Add to activation queue
    await adminClient
      .from("activation_queue")
      .insert({
        dealership_id: dealership.id,
        request_type: "new_dealer_verification",
      });

    return new Response(
      JSON.stringify({ success: true, dealership_id: dealership.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
