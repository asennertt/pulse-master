import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * disconnect-source
 *
 * Deletes all vehicles for a dealership that came from a specific source
 * ("scraper", "csv", or "dms") and resets the related dealer_settings fields.
 *
 * Also supports action: "fix-status" to bulk-update vehicles back to "available"
 * (used to fix the 82 vehicles wrongly marked as "sold").
 *
 * Body:
 *   { source: "scraper" | "csv" | "dms" }
 *   OR
 *   { action: "fix-status", source: "scraper", fromStatus: "sold", toStatus: "available" }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Check that user is a dealer_admin or super_admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("dealership_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.dealership_id) {
      return new Response(JSON.stringify({ error: "No dealership found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!role || !["super_admin", "dealer_admin"].includes(role.role)) {
      return new Response(JSON.stringify({ error: "Only admins can disconnect sources" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dealershipId = profile.dealership_id;
    const body = await req.json().catch(() => ({}));
    const source: string = body.source;
    const action: string = body.action || "disconnect";

    if (!source || !["scraper", "csv", "dms"].includes(source)) {
      return new Response(JSON.stringify({ error: "Invalid source. Must be: scraper, csv, or dms" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ══════════════════════════════════════════════════════
    // ACTION: fix-status — bulk update status for vehicles from a source
    // ══════════════════════════════════════════════════════
    if (action === "fix-status") {
      const fromStatus = body.fromStatus || "sold";
      const toStatus = body.toStatus || "available";

      const { data: vehicles, error: fetchErr } = await supabaseAdmin
        .from("vehicles")
        .select("id")
        .eq("dealer_id", dealershipId)
        .eq("source", source)
        .eq("status", fromStatus);

      if (fetchErr) throw fetchErr;

      let fixedCount = 0;
      for (const v of (vehicles || [])) {
        const { error: updateErr } = await supabaseAdmin
          .from("vehicles")
          .update({ status: toStatus, updated_at: new Date().toISOString() })
          .eq("id", v.id);
        if (!updateErr) fixedCount++;
      }

      return new Response(JSON.stringify({
        success: true,
        action: "fix-status",
        source,
        fixed_count: fixedCount,
        from_status: fromStatus,
        to_status: toStatus,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ══════════════════════════════════════════════════════
    // ACTION: disconnect — delete all vehicles from this source
    // ══════════════════════════════════════════════════════

    // Count vehicles before deleting
    const { count } = await supabaseAdmin
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("dealer_id", dealershipId)
      .eq("source", source);

    // Delete all vehicles from this source
    const { error: deleteErr } = await supabaseAdmin
      .from("vehicles")
      .delete()
      .eq("dealer_id", dealershipId)
      .eq("source", source);

    if (deleteErr) {
      console.error("Delete error:", deleteErr);
      throw new Error(`Failed to delete vehicles: ${deleteErr.message}`);
    }

    // Reset dealer_settings based on source type
    const settingsUpdate: Record<string, unknown> = {};

    if (source === "scraper") {
      settingsUpdate.scraper_url = null;
      settingsUpdate.scraper_status = "idle";
      settingsUpdate.scraper_last_run = null;
      settingsUpdate.scraper_vehicle_count = 0;
    }

    if (source === "dms" || source === "csv") {
      // Reset ingestion method to default
      settingsUpdate.ingestion_method = "csv";
    }

    if (Object.keys(settingsUpdate).length > 0) {
      await supabaseAdmin
        .from("dealer_settings")
        .update(settingsUpdate)
        .eq("dealership_id", dealershipId);
    }

    // Log it
    try {
      await supabaseAdmin.from("ingestion_logs").insert({
        dealership_id: dealershipId,
        source: source === "scraper" ? "Website Scraper" : source === "dms" ? "DMS / SFTP" : "CSV Upload",
        feed_type: "disconnect",
        vehicles_scanned: 0,
        new_vehicles: 0,
        marked_sold: 0,
        status: "success",
        message: `Disconnected ${source} — deleted ${count || 0} vehicles`,
      });
    } catch (_e) { /* non-critical */ }

    console.log(`Disconnected source="${source}" for dealer ${dealershipId}: deleted ${count || 0} vehicles`);

    return new Response(JSON.stringify({
      success: true,
      action: "disconnect",
      source,
      deleted_count: count || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("disconnect-source error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
