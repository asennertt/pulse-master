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

    // Parse optional body
    const body = await req.json().catch(() => ({}));
    const recipientEmail = body.email?.trim() || null;
    const recipientName = body.name?.trim() || null;

    // Verify the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Invalid auth");

    // Check dealer_admin or super_admin role
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
      .select("dealership_id, full_name")
      .eq("user_id", user.id)
      .single();
    if (!profile?.dealership_id) throw new Error("No dealership linked");

    // Get dealership name
    const { data: dealership } = await adminClient
      .from("dealerships")
      .select("name")
      .eq("id", profile.dealership_id)
      .single();

    const dealershipName = dealership?.name || "your dealership";
    const inviterName = profile.full_name || "Your admin";

    // Create invitation
    const { data: invite, error: invErr } = await adminClient
      .from("invitation_links")
      .insert({
        created_by: user.id,
        dealership_id: profile.dealership_id,
        dealership_name: dealershipName,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("token")
      .single();
    if (invErr) throw invErr;

    const inviteLink = `https://post.pulse.lotlyauto.com/auth?invite=${invite.token}`;
    let emailSent = false;

    // Send email via Resend if recipient provided
    if (recipientEmail) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Pulse Post <noreply@pulse.lotlyauto.com>`,
            to: [recipientEmail],
            subject: `You're invited to join ${dealershipName} on Pulse Post`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="font-size: 24px; font-weight: 700; color: #111; margin: 0;">Pulse Post</h1>
                  <p style="font-size: 13px; color: #666; margin-top: 4px;">Automotive Inventory Intelligence</p>
                </div>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
                  <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 16px 0;">${greeting}</p>
                  <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 16px 0;">
                    ${inviterName} has invited you to join <strong>${dealershipName}</strong> on Pulse Post.
                  </p>
                  <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 24px 0;">
                    Click the button below to create your account and start posting inventory.
                  </p>
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background: #6366f1; color: #fff; font-weight: 600; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
                      Accept Invitation
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #999; margin: 24px 0 0 0; text-align: center;">
                    This invitation expires in 7 days.
                  </p>
                </div>
                <p style="font-size: 11px; color: #999; text-align: center; margin-top: 24px;">
                  Pulse Post by Lotly Auto &mdash; <a href="https://pulse.lotlyauto.com" style="color: #6366f1;">pulse.lotlyauto.com</a>
                </p>
              </div>
            `,
          }),
        });
        emailSent = emailResp.ok;
      }
    }

    return new Response(JSON.stringify({ token: invite.token, emailSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
