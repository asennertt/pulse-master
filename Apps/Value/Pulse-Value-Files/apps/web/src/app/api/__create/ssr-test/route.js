// SSR test route — Create Auth removed, using Supabase now.
// This file is a no-op placeholder to prevent build errors.
export function GET() {
  return new Response(JSON.stringify({ ok: true, auth: "supabase" }), {
    headers: { "Content-Type": "application/json" },
  });
}
