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

    const { vehicleId, description } = await req.json();
    if (!vehicleId) {
      return new Response(JSON.stringify({ error: "vehicleId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: vehicle, error } = await supabase
      .from("pulse_vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (error || !vehicle) {
      return new Response(JSON.stringify({ error: "Vehicle not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no description provided, generate one via AI
    let listingDescription = description || "";
    if (!listingDescription) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: "You are a top-tier automotive digital marketer. Create a concise, high-conversion Facebook Marketplace listing with a catchy headline, 5 key features, mileage callout, and a CTA. Under 200 words. Professional tone.",
                },
                {
                  role: "user",
                  content: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}, ${vehicle.mileage} miles, ${vehicle.exterior_color || "N/A"} exterior, VIN: ${vehicle.vin}`,
                },
              ],
              stream: false,
            }),
          });
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            listingDescription = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) {
          console.error("AI generation failed, using fallback:", e);
        }
      }
      if (!listingDescription) {
        listingDescription = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""} — ${vehicle.mileage.toLocaleString()} miles. Contact us for details!`;
      }
    }

    // Build the extension-readable payload
    const payload = {
      version: "1.0",
      source: "autopilot",
      vehicle: {
        id: vehicle.id,
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim || "",
        mileage: vehicle.mileage,
        exterior_color: vehicle.exterior_color || "",
      },
      listing: {
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim(),
        price: Number(vehicle.price),
        description: listingDescription,
        condition: vehicle.mileage < 500 ? "new" : "used",
        category: "vehicles",
      },
      images: (vehicle.images || []).length > 0
        ? vehicle.images
        : [`https://placehold.co/1200x900/1a1f2e/3b82f6?text=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`],
      metadata: {
        generated_at: new Date().toISOString(),
        facebook_post_id: vehicle.facebook_post_id || null,
        synced: vehicle.synced_to_facebook,
      },
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("listing-payload error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
