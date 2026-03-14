import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const MAX_VEHICLES = 200;
const FETCH_TIMEOUT_MS = 55000;

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

    // Service-role client for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve dealership
    const userId = userData.user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.dealership_id) {
      return new Response(JSON.stringify({ error: "No dealership found for user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dealershipId = profile.dealership_id;

    // ── Get scraper URL from body or dealer_settings ─────
    const body = await req.json().catch(() => ({}));
    let scrapeUrl: string = body.url || "";

    if (!scrapeUrl) {
      const { data: settings } = await supabase
        .from("dealer_settings")
        .select("scraper_url")
        .eq("dealership_id", dealershipId)
        .maybeSingle();
      scrapeUrl = settings?.scraper_url || "";
    }

    if (!scrapeUrl) {
      return new Response(JSON.stringify({ error: "No scraper URL configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL
    try {
      const parsed = new URL(scrapeUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status → scraping
    await supabase
      .from("dealer_settings")
      .update({ scraper_status: "scraping", scraper_url: scrapeUrl })
      .eq("dealership_id", dealershipId);

    // ── Fetch the webpage ────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const res = await fetch(scrapeUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PulsePost/1.0; +https://pulsepost.io)",
          Accept: "text/html",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err: any) {
      clearTimeout(timeout);
      await supabase
        .from("dealer_settings")
        .update({ scraper_status: "error" })
        .eq("dealership_id", dealershipId);

      return new Response(JSON.stringify({ error: `Failed to fetch page: ${err.message}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      clearTimeout(timeout);
    }

    // ── Clean HTML — strip scripts, styles, SVGs ─────────
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Truncate to ~120k chars to stay within Gemini token limits
    const truncated = cleaned.length > 120_000 ? cleaned.slice(0, 120_000) : cleaned;

    // ── Gemini extraction ────────────────────────────────
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      await supabase
        .from("dealer_settings")
        .update({ scraper_status: "error" })
        .eq("dealership_id", dealershipId);

      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiPrompt = `You are a vehicle inventory extraction engine. Extract every vehicle listing from the following dealer website HTML.

For each vehicle return a JSON object with these fields (use null if not found):
- vin (string | null) — 17-character VIN
- year (number)
- make (string)
- model (string)
- trim (string | null)
- price (number | null) — numeric, no currency symbols
- mileage (number | null)
- exterior_color (string | null)
- images (string[]) — array of image URLs found for this vehicle (full URLs, not relative)
- detail_url (string | null) — link to the vehicle detail page (full URL)

Rules:
- Return ONLY a JSON array of objects. No markdown, no explanation.
- Maximum ${MAX_VEHICLES} vehicles.
- Ignore navigation, footer, and non-vehicle content.
- If a price has commas or dollar signs, strip them and return a plain number.
- If VIN is not visible, set it to null.
- Convert relative image URLs to absolute using the base URL: ${scrapeUrl}
- If no vehicles are found, return an empty array [].`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: geminiPrompt },
                { text: truncated },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini error:", errBody);
      await supabase
        .from("dealer_settings")
        .update({ scraper_status: "error" })
        .eq("dealership_id", dealershipId);

      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Strip markdown code fences if present
    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let vehicles: any[];
    try {
      vehicles = JSON.parse(rawText);
      if (!Array.isArray(vehicles)) vehicles = [];
    } catch {
      console.error("Failed to parse Gemini response:", rawText.slice(0, 500));
      await supabase
        .from("dealer_settings")
        .update({ scraper_status: "error" })
        .eq("dealership_id", dealershipId);

      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap at MAX_VEHICLES
    vehicles = vehicles.slice(0, MAX_VEHICLES);

    // ── Upsert vehicles ──────────────────────────────────
    let newCount = 0;
    let updatedCount = 0;
    let markedSold = 0;

    // Track scraped VINs for marking sold
    const scrapedVins = new Set<string>();

    for (const v of vehicles) {
      if (!v.year || !v.make || !v.model) continue;

      const year = Number(v.year);
      const price = v.price ? Number(v.price) : null;
      const mileage = v.mileage ? Number(v.mileage) : null;
      if (isNaN(year) || year < 1900 || year > 2030) continue;

      const vin = v.vin && typeof v.vin === "string" && v.vin.length === 17 ? v.vin.toUpperCase() : null;
      if (vin) scrapedVins.add(vin);

      const images = Array.isArray(v.images) ? v.images.filter((u: any) => typeof u === "string" && u.startsWith("http")) : [];

      const vehicleData: Record<string, unknown> = {
        year,
        make: String(v.make).trim(),
        model: String(v.model).trim(),
        trim: v.trim ? String(v.trim).trim() : null,
        price: price && !isNaN(price) ? price : null,
        mileage: mileage && !isNaN(mileage) ? mileage : null,
        exterior_color: v.exterior_color ? String(v.exterior_color).trim() : null,
        images,
        source: "scraper",
        source_url: v.detail_url || scrapeUrl,
        dealer_id: dealershipId,
        updated_at: new Date().toISOString(),
      };

      if (vin) {
        // Try to find existing vehicle by VIN
        const { data: existing } = await supabase
          .from("vehicles")
          .select("id")
          .eq("vin", vin)
          .eq("dealer_id", dealershipId)
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase
            .from("vehicles")
            .update(vehicleData)
            .eq("id", existing.id);
          updatedCount++;
        } else {
          // Insert new
          vehicleData.vin = vin;
          vehicleData.status = "available";
          vehicleData.synced_to_facebook = false;
          vehicleData.days_on_lot = 0;
          vehicleData.leads = 0;
          vehicleData.created_at = new Date().toISOString();
          await supabase.from("vehicles").insert(vehicleData);
          newCount++;
        }
      } else {
        // No VIN — try to match by year+make+model+trim
        const { data: existing } = await supabase
          .from("vehicles")
          .select("id")
          .eq("year", year)
          .eq("make", vehicleData.make as string)
          .eq("model", vehicleData.model as string)
          .eq("dealer_id", dealershipId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("vehicles")
            .update(vehicleData)
            .eq("id", existing.id);
          updatedCount++;
        } else {
          // Generate a placeholder VIN
          vehicleData.vin = `SCRAPE${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`.slice(0, 17);
          vehicleData.status = "available";
          vehicleData.synced_to_facebook = false;
          vehicleData.days_on_lot = 0;
          vehicleData.leads = 0;
          vehicleData.created_at = new Date().toISOString();
          await supabase.from("vehicles").insert(vehicleData);
          newCount++;
        }
      }
    }

    // ── Mark vehicles not in scrape as sold ──────────────
    if (scrapedVins.size > 0) {
      const { data: existingVehicles } = await supabase
        .from("vehicles")
        .select("id, vin")
        .eq("dealer_id", dealershipId)
        .eq("source", "scraper")
        .eq("status", "available");

      if (existingVehicles) {
        for (const ev of existingVehicles) {
          if (ev.vin && !scrapedVins.has(ev.vin)) {
            await supabase
              .from("vehicles")
              .update({ status: "sold", updated_at: new Date().toISOString() })
              .eq("id", ev.id);
            markedSold++;
          }
        }
      }
    }

    // ── Update dealer_settings with results ──────────────
    await supabase
      .from("dealer_settings")
      .update({
        scraper_status: "idle",
        scraper_last_run: new Date().toISOString(),
        scraper_vehicle_count: vehicles.length,
      })
      .eq("dealership_id", dealershipId);

    // ── Log the ingestion ────────────────────────────────
    await supabase.from("ingestion_logs").insert({
      dealership_id: dealershipId,
      source: "Website Scraper",
      feed_type: "html_scrape",
      vehicles_scanned: vehicles.length,
      new_vehicles: newCount,
      marked_sold: markedSold,
      images_fetched: vehicles.reduce((sum: number, v: any) => sum + (Array.isArray(v.images) ? v.images.length : 0), 0),
      status: "success",
      message: `Scraped ${scrapeUrl} — ${newCount} new, ${updatedCount} updated, ${markedSold} marked sold`,
    });

    console.log(`Scrape complete: ${vehicles.length} found, ${newCount} new, ${updatedCount} updated, ${markedSold} sold`);

    return new Response(
      JSON.stringify({
        success: true,
        vehicles_found: vehicles.length,
        new_vehicles: newCount,
        updated_vehicles: updatedCount,
        marked_sold: markedSold,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("scrape-inventory error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
