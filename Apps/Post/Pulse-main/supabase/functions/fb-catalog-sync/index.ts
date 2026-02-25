import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// 1. Using postgres.js for a direct connection to Neon
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 2. Setup Neon connection
const sql = postgres(Deno.env.get("DATABASE_URL")!, {
  ssl: "require",
  prepare: false, // Required for PGBouncer/Pooled connections
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vehicleId } = await req.json();
    if (!vehicleId) {
      return new Response(JSON.stringify({ error: "vehicleId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch vehicle directly from Neon using raw SQL
    const [vehicle] = await sql`
      SELECT * FROM public.pulse_vehicles 
      WHERE id = ${vehicleId} 
      LIMIT 1
    `;

    if (!vehicle) {
      return new Response(JSON.stringify({ error: "Vehicle not found in Neon" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Map the payload (Using your logic)
    const aiaPayload = {
      vehicle_id: vehicle.id,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim || "",
      mileage: { value: vehicle.mileage, unit: "MI" },
      price: { amount: Number(vehicle.price), currency: "USD" },
      exterior_color: vehicle.exterior_color || "",
      body_style: "SEDAN",
      drivetrain: "FWD",
      fuel_type: "GASOLINE",
      transmission: "AUTOMATIC",
      condition: vehicle.mileage < 500 ? "NEW" : "USED",
      availability: vehicle.status === "available" ? "IN_STOCK" : 
                    vehicle.status === "pending" ? "PENDING" : "SOLD",
      image_url: vehicle.images && vehicle.images.length > 0 
        ? vehicle.images[0] 
        : `https://placehold.co/800x600/1a1f2e/3b82f6?text=${vehicle.year}+${vehicle.make}+${vehicle.model}`,
      url: `https://dealership.example.com/inventory/${vehicle.vin}`,
      description: vehicle.ai_description || `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.mileage.toLocaleString()} miles`,
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim(),
    };

    return new Response(JSON.stringify({ 
      payload: aiaPayload,
      status: "ready",
      source: "Neon Direct",
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