import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// P20 - CORS origin from env, not hardcoded wildcard
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*-_=+";
  const all = upper + lower + digits + symbols;
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  let password = "";
  password += upper[arr[0] % upper.length];
  password += lower[arr[1] % lower.length];
  password += digits[arr[2] % digits.length];
  password += symbols[arr[3] % symbols.length];
  for (let i = 4; i < 16; i++) password += all[arr[i] % all.length];
  const shuffled = password.split("");
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.join("");
}

// P18 - Generate unique username with 6-digit suffix
async function generateUsername(supabase: any): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const arr = new Uint8Array(3);
    crypto.getRandomValues(arr);
    const num = ((arr[0] << 16) | (arr[1] << 8) | arr[2]) % 1_000_000;
    const username = `dlr_${num.toString().padStart(6, "0")}`;
    const { data } = await supabase.from("dealerships").select("id").eq("sftp_username", username).maybeSingle();
    if (!data) return username;
  }
  const arr = new Uint8Array(3);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr).map((b: number) => b.toString(16).padStart(2, "0")).join("");
  return `dlr_${Date.now().toString().slice(-6)}${hex}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // C13 - JWT-based authorization check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile, error: profileErr } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileErr || !profile || !["admin", "super_admin"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { dealer_id, action } = body;
    if (!dealer_id) {
      return new Response(JSON.stringify({ error: "dealer_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: dealer, error: dealerErr } = await supabase.from("dealerships").select("id, name, sftp_username").eq("id", dealer_id).single();
    if (dealerErr || !dealer) {
      return new Response(JSON.stringify({ error: "Dealership not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate" || action === "regenerate") {
      const username = (dealer as any).sftp_username && action !== "regenerate"
        ? (dealer as any).sftp_username
        : await generateUsername(supabase);
      const password = generatePassword();

      // R18 - SFTP host from env, not hardcoded
      const sftpApiKey = Deno.env.get("SFTPCLOUD_API_KEY");
      const sftpHost = Deno.env.get("SFTP_HOST") || "us-east-1.sftpcloud.io";

      // C6 - Provision the SFTP user account BEFORE storing the hash
      const provisionResponse = await fetch(`https://api.sftpcloud.io/v1/users`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${sftpApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, home_directory: `/uploads/${username}`, status: "active" }),
      });
      if (!provisionResponse.ok) {
        const errBody = await provisionResponse.text();
        throw new Error(`Failed to provision SFTP account: ${errBody}`);
      }

      // C5 - bcrypt instead of SHA-256
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { error: updateErr } = await supabase.from("dealerships").update({ sftp_username: username, sftp_password_hash: hashedPassword }).eq("id", dealer_id);
      if (updateErr) {
        console.error("Failed to store credentials:", updateErr);
        return new Response(JSON.stringify({ error: "Failed to store credentials" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`Generated SFTP credentials for dealer ${(dealer as any).name}: ${username}`);
      return new Response(JSON.stringify({ success: true, credentials: { host: sftpHost, port: 22, username, password } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "check") {
      const sftpHost = Deno.env.get("SFTP_HOST") || "us-east-1.sftpcloud.io";
      return new Response(JSON.stringify({ has_credentials: !!(dealer as any).sftp_username, username: (dealer as any).sftp_username || null, host: sftpHost, port: 22 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'generate', 'regenerate', or 'check'" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-sftp-creds error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
