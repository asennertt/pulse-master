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

    const body = await req.json();

    // Validate required fields
    const name = (body.name || "").trim();
    const vin = (body.vin || "").trim();
    if (!name || !vin) {
      return new Response(JSON.stringify({ error: "name and vin are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone format if provided
    const phone = (body.phone || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();

    if (name.length > 200 || vin.length > 20 || phone.length > 30 || email.length > 255 || message.length > 2000) {
      return new Response(JSON.stringify({ error: "Input exceeds maximum length" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to match VIN to a vehicle
    const { data: vehicle } = await supabase
      .from("pulse_vehicles")
      .select("id")
      .eq("vin", vin)
      .single();

    // Insert lead
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        vin,
        vehicle_id: vehicle?.id || null,
        source: body.source || "facebook",
        message: message || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Insert lead error:", error);
      return new Response(JSON.stringify({ error: "Failed to save lead" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      lead_id: lead.id,
      message: "Lead captured successfully",
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lead-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
