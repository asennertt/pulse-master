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

    const { vehicleId } = await req.json();
    if (!vehicleId) {
      return new Response(JSON.stringify({ error: "vehicleId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch vehicle from DB
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (error || !vehicle) {
      return new Response(JSON.stringify({ error: "Vehicle not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Facebook Automotive Inventory Ads (AIA) schema payload
    const aiaPayload = {
      vehicle_id: vehicle.id,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim || "",
      mileage: {
        value: vehicle.mileage,
        unit: "MI",
      },
      price: {
        amount: Number(vehicle.price),
        currency: "USD",
      },
      exterior_color: vehicle.exterior_color || "",
      body_style: "SEDAN", // Default, would be dynamic in production
      drivetrain: "FWD",   // Default
      fuel_type: "GASOLINE",
      transmission: "AUTOMATIC",
      condition: vehicle.mileage < 500 ? "NEW" : "USED",
      availability: vehicle.status === "available" ? "IN_STOCK" : vehicle.status === "pending" ? "PENDING" : "SOLD",
      image_url: vehicle.images && vehicle.images.length > 0 
        ? vehicle.images[0] 
        : `https://placehold.co/800x600/1a1f2e/3b82f6?text=${vehicle.year}+${vehicle.make}+${vehicle.model}`,
      url: `https://dealership.example.com/inventory/${vehicle.vin}`,
      description: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""} - ${vehicle.mileage.toLocaleString()} miles`,
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim(),
      state_of_vehicle: vehicle.mileage < 500 ? "NEW" : "USED",
    };

    return new Response(JSON.stringify({ 
      payload: aiaPayload,
      status: "ready",
      message: "Facebook AIA payload generated successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fb-catalog-sync error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
