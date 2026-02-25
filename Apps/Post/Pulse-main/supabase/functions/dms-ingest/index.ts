import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 1. Initialize Direct Neon Client
const sql = postgres(Deno.env.get("DATABASE_URL")!, {
  ssl: "require",
  prepare: false,
});

// ... [Keep your existing helper functions: parseMileage, parseCSV, parseCSVLine, applyMappings, applyDefaultMapping, getChangedFields, normalizeImages] ...

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // We still use Supabase for Auth verification only
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ... [Keep your existing Input Parsing logic for feedRows, dealerId, etc.] ...

    // ── Get current DB vehicles from NEON ──
    const dbVehicles = await sql`
      SELECT id, vin, status, price, dealer_id, year, make, model, trim, mileage, exterior_color, days_on_lot, images 
      FROM public.vehicles 
      WHERE dealer_id = ${dealerId}
    `;
    const dbVinMap = new Map(dbVehicles.map((v: any) => [v.vin, v]));

    let counters = { new: 0, updated: 0, sold: 0, images: 0, drops: 0 };

    // ── Process each feed vehicle ──
    for (const incoming of feedVehicles) {
      const vin = incoming.vin;
      const existing = dbVinMap.get(vin);
      const normalizedImages = normalizeImages(incoming.images);

      if (!existing) {
        // ── NEW VEHICLE — Direct Neon Insert ──
        await sql`
          INSERT INTO public.vehicles (
            vin, make, model, year, trim, mileage, price, exterior_color, days_on_lot, images, status, dealer_id
          ) VALUES (
            ${vin}, ${incoming.make || "Unknown"}, ${incoming.model || "Unknown"}, 
            ${incoming.year || 2024}, ${incoming.trim || null}, ${incoming.mileage || 0}, 
            ${incoming.price || 0}, ${incoming.exterior_color || null}, ${incoming.days_on_lot || 0}, 
            ${normalizedImages}, 'available', ${dealerId}
          )
        `;
        counters.new++;
      } else {
        // ── EXISTING VEHICLE — Smart Update ──
        const changes = getChangedFields(existing, incoming);
        if (!changes) continue;

        // Handle Price Drops in Neon
        if (changes.price !== undefined && Number(existing.price) > Number(changes.price)) {
          await sql`
            INSERT INTO public.price_history (vehicle_id, dealer_id, old_price, new_price, source)
            VALUES (${existing.id}, ${dealerId}, ${existing.price}, ${changes.price}, ${feedSource})
          `;
          counters.drops++;
        }

        await sql`
          UPDATE public.vehicles 
          SET ${sql(changes)}, updated_at = NOW() 
          WHERE id = ${existing.id}
        `;
        counters.updated++;
      }
    }

    // ── Mark missing as Sold ──
    if (!useSimulated) {
      const feedVins = Array.from(feedVinSet);
      const soldResults = await sql`
        UPDATE public.vehicles 
        SET status = 'sold', synced_to_facebook = false 
        WHERE dealer_id = ${dealerId} AND status != 'sold' AND vin NOT IN (${feedVins})
        RETURNING id
      `;
      counters.sold = soldResults.length;
    }

    // ── Log the ingestion run ──
    await sql`
      INSERT INTO public.ingestion_logs (source, feed_type, vehicles_scanned, new_vehicles, status, dealer_id)
      VALUES (${feedSource}, ${feedType}, ${feedVehicles.length}, ${counters.new}, 'success', ${dealerId})
    `;

    return new Response(JSON.stringify({ success: true, ...counters }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("dms-ingest error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});