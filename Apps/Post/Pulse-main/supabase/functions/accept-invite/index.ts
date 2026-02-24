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

    const { token } = await req.json();
    if (!token) throw new Error("Invite token required");

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

    // Validate invitation
    const { data: invite, error: invErr } = await adminClient
      .from("invitation_links")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (invErr || !invite) throw new Error("Invalid or expired invite link");
    if (!invite.dealership_id) throw new Error("Invite has no dealership");

    // Link profile to dealership
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({
        dealership_id: invite.dealership_id,
        onboarding_complete: true,
        onboarding_step: 4,
      })
      .eq("user_id", user.id);
    if (profileErr) throw profileErr;

    // Assign dealer_user role
    const { error: roleErr } = await adminClient
      .from("user_roles")
      .insert({ user_id: user.id, role: "dealer_user" });
    if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;

    // Mark invitation as used
    await adminClient
      .from("invitation_links")
      .update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({
        success: true,
        dealership_name: invite.dealership_name,
        dealership_id: invite.dealership_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
