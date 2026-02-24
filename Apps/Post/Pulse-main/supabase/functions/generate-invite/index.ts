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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Invalid auth");

    // Check dealer_admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: hasAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "dealer_admin",
    });
    const { data: hasSuperAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "super_admin",
    });
    if (!hasAdmin && !hasSuperAdmin) throw new Error("Not authorized");

    // Get user's dealership
    const { data: profile } = await adminClient
      .from("profiles")
      .select("dealership_id")
      .eq("user_id", user.id)
      .single();
    if (!profile?.dealership_id) throw new Error("No dealership linked");

    // Get dealership name
    const { data: dealership } = await adminClient
      .from("dealerships")
      .select("name")
      .eq("id", profile.dealership_id)
      .single();

    // Create invitation
    const { data: invite, error: invErr } = await adminClient
      .from("invitation_links")
      .insert({
        created_by: user.id,
        dealership_id: profile.dealership_id,
        dealership_name: dealership?.name || "",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("token")
      .single();
    if (invErr) throw invErr;

    return new Response(JSON.stringify({ token: invite.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
