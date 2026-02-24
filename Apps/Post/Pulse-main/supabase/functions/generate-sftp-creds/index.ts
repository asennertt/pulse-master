import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a secure random password (16 chars, no ambiguous characters)
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
  const lower = "abcdefghjkmnpqrstuvwxyz"; // no l, o
  const digits = "23456789"; // no 0, 1
  const symbols = "!@#$%&*-_=+";
  const all = upper + lower + digits + symbols;

  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);

  // Ensure at least one of each category
  let password = "";
  password += upper[arr[0] % upper.length];
  password += lower[arr[1] % lower.length];
  password += digits[arr[2] % digits.length];
  password += symbols[arr[3] % symbols.length];

  for (let i = 4; i < 16; i++) {
    password += all[arr[i] % all.length];
  }

  // Shuffle
  const shuffled = password.split("");
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.join("");
}

// Generate unique username
async function generateUsername(supabase: any): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const arr = new Uint8Array(2);
    crypto.getRandomValues(arr);
    const num = ((arr[0] << 8) | arr[1]) % 10000;
    const username = `dlr_${num.toString().padStart(4, "0")}`;

    const { data } = await supabase
      .from("dealerships")
      .select("id")
      .eq("sftp_username", username)
      .maybeSingle();

    if (!data) return username;
  }
  // Fallback: use timestamp
  return `dlr_${Date.now().toString().slice(-6)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const { dealer_id, action } = body;

    if (!dealer_id) {
      return new Response(JSON.stringify({ error: "dealer_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify dealership exists
    const { data: dealer, error: dealerErr } = await supabase
      .from("dealerships")
      .select("id, name, sftp_username")
      .eq("id", dealer_id)
      .single();

    if (dealerErr || !dealer) {
      return new Response(JSON.stringify({ error: "Dealership not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate" || action === "regenerate") {
      const username = (dealer as any).sftp_username && action !== "regenerate"
        ? (dealer as any).sftp_username
        : await generateUsername(supabase);

      const password = generatePassword();

      // Hash the password for storage (using Web Crypto API)
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Store credentials
      const { error: updateErr } = await supabase
        .from("dealerships")
        .update({
          sftp_username: username,
          sftp_password_hash: hashHex,
        })
        .eq("id", dealer_id);

      if (updateErr) {
        console.error("Failed to store credentials:", updateErr);
        return new Response(JSON.stringify({ error: "Failed to store credentials" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Generated SFTP credentials for dealer ${(dealer as any).name}: ${username}`);

      // Return the plaintext password ONE TIME ONLY
      return new Response(JSON.stringify({
        success: true,
        credentials: {
          host: "us-east-1.sftpcloud.io",
          port: 22,
          username,
          password, // Only returned here, never stored in plaintext
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: "check" — return whether credentials exist (no password)
    if (action === "check") {
      return new Response(JSON.stringify({
        has_credentials: !!(dealer as any).sftp_username,
        username: (dealer as any).sftp_username || null,
        host: "us-east-1.sftpcloud.io",
        port: 22,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'generate', 'regenerate', or 'check'" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sftp-creds error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
