import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const action = body.action || "check";

  if (action === "check") {
    // Check RLS policies on vehicles table
    const { data, error } = await supabaseAdmin.rpc("check_rls_policies", {});
    
    // Fallback: just try to delete with service role to verify it works
    const { data: vehicles, error: countErr } = await supabaseAdmin
      .from("vehicles")
      .select("id", { count: "exact", head: true });
    
    return new Response(JSON.stringify({ 
      vehicle_count: vehicles,
      count_error: countErr?.message,
      note: "Service role can bypass RLS"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "delete_all_vehicles") {
    const dealership_id = body.dealership_id;
    if (!dealership_id) {
      return new Response(JSON.stringify({ error: "dealership_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data, error, count } = await supabaseAdmin
      .from("vehicles")
      .delete()
      .eq("dealership_id", dealership_id)
      .select("id", { count: "exact" });

    return new Response(JSON.stringify({ 
      success: !error,
      deleted_count: data?.length || 0,
      error: error?.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "system_cleanse") {
    const dealership_id = body.dealership_id;
    if (!dealership_id) {
      return new Response(JSON.stringify({ error: "dealership_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const results: Record<string, any> = {};
    const tables = ["sold_alerts", "price_history", "vehicle_performance", "leads", "vehicles", "ingestion_logs"];
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("dealership_id", dealership_id)
        .select("id");
      results[table] = { deleted: data?.length || 0, error: error?.message };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "bulk_insert_vehicles") {
    const dealership_id = body.dealership_id;
    const vehicles = body.vehicles;
    if (!dealership_id || !vehicles || !Array.isArray(vehicles)) {
      return new Response(JSON.stringify({ error: "dealership_id and vehicles array required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Insert in batches of 50
    let totalInserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < vehicles.length; i += 50) {
      const batch = vehicles.slice(i, i + 50);
      const { data, error } = await supabaseAdmin
        .from("vehicles")
        .insert(batch)
        .select("id");
      if (error) {
        errors.push(`Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
      } else {
        totalInserted += data?.length || 0;
      }
    }

    return new Response(JSON.stringify({
      success: errors.length === 0,
      inserted_count: totalInserted,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "add_body_style_column") {
    // Use service role to add the column
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql: "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS body_style TEXT;"
    });
    
    return new Response(JSON.stringify({ 
      success: !error,
      error: error?.message,
      note: "If exec_sql doesn't exist, column must be added via dashboard"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 400,
  });
});
