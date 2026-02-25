import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const vin = url.searchParams.get("vin");

    if (!vin) {
      return json({ error: "VIN query parameter is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: vehicle, error } = await supabase
      .from("pulse_vehicles")
      .select("price, mileage, make, model, year, images, vin, ai_description")
      .eq("vin", vin)
      .maybeSingle();

    if (error || !vehicle) {
      return json({ error: "not found" }, 404);
    }

    // Ensure images are direct public URLs, filtered for validity
    const imageUrls = (vehicle.images || [])
      .filter((url: string) => url && url.startsWith("http"))
      .join("|");

    // Always return description — fallback chain: ai_description → year/make/model → "Processing..."
    const description = vehicle.ai_description
      || (vehicle.year && vehicle.make && vehicle.model
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "Processing...");

    return json({
      price: vehicle.price,
      description,
      mileage: vehicle.mileage,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      images: imageUrls,
    });
  } catch (e) {
    console.error("get-vehicle error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
