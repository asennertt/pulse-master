import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { vin, source } = await req.json();
    if (!vin) {
      return new Response(JSON.stringify({ error: "VIN is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the vehicle
    const { data: vehicle, error: findErr } = await supabase
      .from("vehicles")
      .select("id, vin, year, make, model, trim, posted_by_staff_id, status")
      .eq("vin", vin)
      .single();

    if (findErr || !vehicle) {
      return new Response(JSON.stringify({ error: "Vehicle not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (vehicle.status === "sold") {
      return new Response(JSON.stringify({ message: "Already marked as sold" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as sold
    await supabase
      .from("vehicles")
      .update({ status: "sold", synced_to_facebook: false, facebook_post_id: null })
      .eq("id", vehicle.id);

    // Create sold alert for the salesperson who posted it
    const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim();
    await supabase.from("sold_alerts").insert({
      vehicle_id: vehicle.id,
      staff_id: vehicle.posted_by_staff_id || null,
      vin: vehicle.vin,
      vehicle_label: vehicleLabel,
    });

    console.log(`Sold webhook: ${vehicleLabel} (VIN: ${vin}) marked sold. Alert created.`);

    return new Response(JSON.stringify({
      success: true,
      message: `${vehicleLabel} marked as sold. Alert sent.`,
      vehicle_id: vehicle.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sold-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
