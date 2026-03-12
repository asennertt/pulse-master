import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Pulse Post <noreply@pulse.lotlyauto.com>";
const SUPPORT_EMAIL = "support@pulse.lotlyauto.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Email Templates ── */

function welcomeEmail(name: string, dealershipName: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Pulse Post! 🚗",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#ffffff;font-size:24px;margin:0">Pulse Post</h1>
      <p style="color:#888;font-size:13px;margin:4px 0 0">by Lotly Auto</p>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 24px">
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px">Welcome, ${name}!</h2>
      <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 20px">
        Your dealership <strong style="color:#fff">${dealershipName}</strong> is now set up on Pulse Post.
        Here's how to get started:
      </p>
      <div style="margin:20px 0">
        <div style="display:flex;margin-bottom:16px">
          <div style="background:#1a1a2e;border-radius:8px;padding:12px 16px;width:100%">
            <p style="color:#4ade80;font-size:12px;font-weight:600;margin:0 0 4px">STEP 1</p>
            <p style="color:#fff;font-size:14px;margin:0">Import your vehicle inventory</p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:16px">
          <div style="background:#1a1a2e;border-radius:8px;padding:12px 16px;width:100%">
            <p style="color:#facc15;font-size:12px;font-weight:600;margin:0 0 4px">STEP 2</p>
            <p style="color:#fff;font-size:14px;margin:0">Generate AI descriptions for your listings</p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:16px">
          <div style="background:#1a1a2e;border-radius:8px;padding:12px 16px;width:100%">
            <p style="color:#60a5fa;font-size:12px;font-weight:600;margin:0 0 4px">STEP 3</p>
            <p style="color:#fff;font-size:14px;margin:0">Install the Chrome extension & start posting</p>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin:28px 0 0">
        <a href="https://post.pulse.lotlyauto.com/dashboard" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
          Go to Dashboard →
        </a>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px">
      <p style="color:#555;font-size:12px;margin:0">
        Questions? Reach out at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6366f1;text-decoration:none">${SUPPORT_EMAIL}</a>
      </p>
      <p style="color:#333;font-size:11px;margin:8px 0 0">© ${new Date().getFullYear()} Lotly Auto · Pulse Post</p>
    </div>
  </div>
</body>
</html>`,
  };
}

function subscriptionConfirmEmail(name: string, planName: string, amount: string): { subject: string; html: string } {
  return {
    subject: `Subscription Confirmed — ${planName} Plan`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#ffffff;font-size:24px;margin:0">Pulse Post</h1>
      <p style="color:#888;font-size:13px;margin:4px 0 0">by Lotly Auto</p>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 24px">
      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;background:#4ade80;width:48px;height:48px;border-radius:50%;line-height:48px;font-size:24px">✓</div>
      </div>
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px;text-align:center">You're all set, ${name}!</h2>
      <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px;text-align:center">
        Your <strong style="color:#fff">${planName}</strong> subscription is now active.
      </p>
      <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#888;font-size:13px">Plan</span>
          <span style="color:#fff;font-size:13px;font-weight:600">${planName}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#888;font-size:13px">Monthly</span>
          <span style="color:#fff;font-size:13px;font-weight:600">${amount}/mo</span>
        </div>
      </div>
      <div style="text-align:center">
        <a href="https://post.pulse.lotlyauto.com/dashboard" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
          Go to Dashboard →
        </a>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px">
      <p style="color:#555;font-size:12px;margin:0">
        Manage your subscription anytime from <a href="https://post.pulse.lotlyauto.com/billing" style="color:#6366f1;text-decoration:none">Billing</a>
      </p>
      <p style="color:#333;font-size:11px;margin:8px 0 0">© ${new Date().getFullYear()} Lotly Auto · Pulse Post</p>
    </div>
  </div>
</body>
</html>`,
  };
}

function staffInviteEmail(dealershipName: string, inviteUrl: string): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${dealershipName} on Pulse Post`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#ffffff;font-size:24px;margin:0">Pulse Post</h1>
      <p style="color:#888;font-size:13px;margin:4px 0 0">by Lotly Auto</p>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 24px;text-align:center">
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px">You're Invited!</h2>
      <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px">
        <strong style="color:#fff">${dealershipName}</strong> has invited you to join their team on Pulse Post — the fastest way to post vehicles to Facebook Marketplace.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Accept Invite →
      </a>
      <p style="color:#555;font-size:12px;margin:24px 0 0">This invite link will expire in 7 days.</p>
    </div>
    <div style="text-align:center;margin-top:32px">
      <p style="color:#555;font-size:12px;margin:0">
        Questions? Reach out at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6366f1;text-decoration:none">${SUPPORT_EMAIL}</a>
      </p>
      <p style="color:#333;font-size:11px;margin:8px 0 0">© ${new Date().getFullYear()} Lotly Auto · Pulse Post</p>
    </div>
  </div>
</body>
</html>`,
  };
}

function paymentFailedEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Payment Failed — Action Required",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#ffffff;font-size:24px;margin:0">Pulse Post</h1>
      <p style="color:#888;font-size:13px;margin:4px 0 0">by Lotly Auto</p>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 24px;text-align:center">
      <div style="display:inline-block;background:#ef4444;width:48px;height:48px;border-radius:50%;line-height:48px;font-size:24px;margin-bottom:16px">!</div>
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px">Payment Failed</h2>
      <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px">
        Hey ${name}, we couldn't process your latest payment. Please update your payment method to keep your subscription active.
      </p>
      <a href="https://post.pulse.lotlyauto.com/billing" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Update Payment Method →
      </a>
    </div>
    <div style="text-align:center;margin-top:32px">
      <p style="color:#555;font-size:12px;margin:0">
        Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#6366f1;text-decoration:none">${SUPPORT_EMAIL}</a>
      </p>
      <p style="color:#333;font-size:11px;margin:8px 0 0">© ${new Date().getFullYear()} Lotly Auto · Pulse Post</p>
    </div>
  </div>
</body>
</html>`,
  };
}

/* ── Main Handler ── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data } = await req.json();

    if (!type || !to) {
      throw new Error("Missing required fields: type, to");
    }

    let subject: string;
    let html: string;

    switch (type) {
      case "welcome": {
        const email = welcomeEmail(data?.name || "there", data?.dealershipName || "Your Dealership");
        subject = email.subject;
        html = email.html;
        break;
      }
      case "subscription_confirmed": {
        const email = subscriptionConfirmEmail(
          data?.name || "there",
          data?.planName || "Starter",
          data?.amount || "$49"
        );
        subject = email.subject;
        html = email.html;
        break;
      }
      case "staff_invite": {
        const email = staffInviteEmail(
          data?.dealershipName || "A Dealership",
          data?.inviteUrl || "https://post.pulse.lotlyauto.com"
        );
        subject = email.subject;
        html = email.html;
        break;
      }
      case "payment_failed": {
        const email = paymentFailedEmail(data?.name || "there");
        subject = email.subject;
        html = email.html;
        break;
      }
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        reply_to: SUPPORT_EMAIL,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      throw new Error(`Resend error: ${err}`);
    }

    const result = await resendRes.json();

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
