import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Use the admin client to run a raw SQL query via rpc
  // Since we can't run raw SQL directly, we'll just test if the column exists
  // by trying to query it
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .select("id")
    .limit(1);

  // We'll use the postgres connection through the admin API
  // Actually, let's use the Supabase Management API approach
  // Edge functions can use the service role to add columns via the SQL endpoint
  
  const dbUrl = Deno.env.get("SUPABASE_DB_URL") || 
    `postgresql://postgres.jfyfbjybbbsiovihrpal:${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  try {
    // Try a different approach - use fetch against the Supabase SQL API
    const projectRef = "jfyfbjybbbsiovihrpal";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use the PostgREST RPC approach - create a function first
    const { error: rpcError } = await supabaseAdmin.rpc('exec', {
      query: 'ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS body_style TEXT;'
    });

    if (rpcError) {
      // Fallback: try connecting directly to postgres
      return new Response(JSON.stringify({ 
        error: rpcError.message,
        hint: "Need to add body_style column manually in Supabase Dashboard SQL Editor",
        sql: "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS body_style TEXT;"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, message: "body_style column added" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
