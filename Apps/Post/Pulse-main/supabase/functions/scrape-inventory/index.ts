import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const MAX_VEHICLES = 500;
const MAX_PAGES = 10;
const FETCH_TIMEOUT_MS = 30000;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

interface PaginationInfo {
  totalPages: number;
  currentPage: number;
  nextPageUrls: string[];
}

function detectPagination(html: string, baseUrl: string): PaginationInfo {
  const result: PaginationInfo = { totalPages: 1, currentPage: 1, nextPageUrls: [] };
  const pageOfMatch = html.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
  if (pageOfMatch) {
    result.currentPage = parseInt(pageOfMatch[1]);
    result.totalPages = Math.min(parseInt(pageOfMatch[2]), MAX_PAGES);
  }
  if (result.totalPages <= 1) {
    const resultsMatch = html.match(/(\d+)\s*[-\u2013]\s*(\d+)\s+of\s+(\d+)/);
    if (resultsMatch) {
      const start = parseInt(resultsMatch[1]);
      const end = parseInt(resultsMatch[2]);
      const total = parseInt(resultsMatch[3]);
      const perPage = end - start + 1;
      if (perPage > 0 && total > perPage) result.totalPages = Math.min(Math.ceil(total / perPage), MAX_PAGES);
    }
  }
  if (result.totalPages <= 1) {
    const pageLinks = html.match(/href="[^"]*[?&](page|Page|PageNumber|p|pg|offset|start)=(\d+)[^"]*"/gi);
    if (pageLinks && pageLinks.length > 0) {
      let maxPage = 1;
      for (const link of pageLinks) {
        const numMatch = link.match(/[?&](?:page|Page|PageNumber|p|pg)=(\d+)/i);
        if (numMatch) maxPage = Math.max(maxPage, parseInt(numMatch[1]));
      }
      if (maxPage > 1) result.totalPages = Math.min(maxPage, MAX_PAGES);
    }
  }
  if (result.totalPages <= 1) {
    const ariaPages = html.match(/aria-label="(?:Page|Go to page)\s*(\d+)"/gi);
    if (ariaPages && ariaPages.length > 0) {
      let maxPage = 1;
      for (const ap of ariaPages) {
        const n = ap.match(/(\d+)/);
        if (n) maxPage = Math.max(maxPage, parseInt(n[1]));
      }
      if (maxPage > 1) result.totalPages = Math.min(maxPage, MAX_PAGES);
    }
  }
  if (result.totalPages > 1) {
    for (let p = 2; p <= result.totalPages; p++) {
      const nextUrl = buildPageUrl(html, baseUrl, p);
      if (nextUrl) result.nextPageUrls.push(nextUrl);
    }
  }
  return result;
}

function buildPageUrl(html: string, baseUrl: string, pageNum: number): string | null {
  const parsed = new URL(baseUrl);
  const patterns = [
    /href="([^"]*[?&]Page=)\d+/i, /href="([^"]*[?&]page=)\d+/i,
    /href="([^"]*[?&]PageNumber=)\d+/i, /href="([^"]*[?&]p=)\d+/i,
    /href="([^"]*[?&]pg=)\d+/i, /href="([^"]*[?&]offset=)\d+/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const prefix = match[1];
      if (prefix.toLowerCase().includes("offset=")) {
        const ppm = html.match(/(\d+)\s*[-\u2013]\s*(\d+)\s+of/);
        const pp = ppm ? parseInt(ppm[2]) - parseInt(ppm[1]) + 1 : 24;
        return prefix + ((pageNum - 1) * pp);
      }
      return prefix + pageNum;
    }
  }
  const sep = parsed.search ? "&" : "?";
  if (/PageNumber/i.test(html)) return `${baseUrl}${sep}PageNumber=${pageNum}`;
  if (/[?&]Page=/i.test(html)) return `${baseUrl}${sep}Page=${pageNum}`;
  return `${baseUrl}${sep}page=${pageNum}`;
}

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length < 2000 && /captcha|datadome|challenge/i.test(text)) return null;
    return text;
  } catch { return null; } finally { clearTimeout(timeout); }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<form(?![\s\S]{5000})[\s\S]*?<\/form>/gi, (m) => m.length < 5000 ? "" : m)
    .replace(/\s+(?:class|id|style|data-(?!lazy)[a-z-]+|aria-[a-z-]+|role|tabindex|onclick|onload|onerror|itemprop|itemscope|itemtype)="[^"]*"/gi, "")
    .replace(/<(?:input|select|textarea|button|option|optgroup|fieldset|legend|label)[^>]*(?:\/>|>[\s\S]*?<\/(?:select|textarea|button|option|optgroup|fieldset|legend|label)>)/gi, "")
    .replace(/<(div|span|p|li|ul|ol|section|article|aside|main)\s*>\s*<\/\1>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function extractVehiclesWithGemini(html: string, scrapeUrl: string, apiKey: string): Promise<any[]> {
  const truncated = html.length > 120_000 ? html.slice(0, 120_000) : html;
  const geminiPrompt = `You are a vehicle inventory extraction engine. Extract every vehicle listing from the following dealer website HTML.

For each vehicle return a JSON object with these fields (use null if not found):
- vin (string | null) - 17-character VIN
- year (number)
- make (string)
- model (string)
- trim (string | null)
- price (number | null) - numeric, no currency symbols
- mileage (number | null)
- exterior_color (string | null)
- images (string[]) - array of image URLs found for this vehicle (full URLs, not relative)
- detail_url (string | null) - link to the vehicle detail page (full URL)

Rules:
- Return ONLY a JSON array of objects. No markdown, no explanation.
- Maximum ${MAX_VEHICLES} vehicles.
- Ignore navigation, footer, and non-vehicle content.
- For the price field, look for the selling price, sale price, internet price, special price, or asking price. Do NOT use the MSRP or retail price. If multiple prices are shown, prefer the lowest non-MSRP price.
- If a price has commas or dollar signs, strip them and return a plain number.
- If VIN is not visible, set it to null.
- Convert relative image URLs to absolute using the base URL: ${scrapeUrl}
- Convert relative detail_url links to absolute using the base URL: ${scrapeUrl}
- If no vehicles are found, return an empty array [].`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }, { text: truncated }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    },
  );
  if (!geminiRes.ok) { console.error("Gemini error:", await geminiRes.text()); throw new Error("AI extraction failed"); }
  const geminiData = await geminiRes.json();
  let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { const parsed = JSON.parse(rawText); return Array.isArray(parsed) ? parsed : []; }
  catch { console.error("Failed to parse Gemini response:", rawText.slice(0, 500)); throw new Error("Failed to parse AI response"); }
}

async function upsertVehicles(supabase: any, vehicles: any[], dealershipId: string, scrapeUrl: string) {
  let newCount = 0, updatedCount = 0, markedSold = 0;
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
      year, make: String(v.make).trim(), model: String(v.model).trim(),
      trim: v.trim ? String(v.trim).trim() : null,
      price: price && !isNaN(price) ? price : null,
      mileage: mileage && !isNaN(mileage) ? mileage : null,
      exterior_color: v.exterior_color ? String(v.exterior_color).trim() : null,
      images, source: "scraper", source_url: v.detail_url || scrapeUrl,
      dealer_id: dealershipId, updated_at: new Date().toISOString(),
    };

    if (vin) {
      const { data: existing } = await supabase.from("vehicles").select("id").eq("vin", vin).eq("dealer_id", dealershipId).maybeSingle();
      if (existing) { await supabase.from("vehicles").update(vehicleData).eq("id", existing.id); updatedCount++; }
      else {
        vehicleData.vin = vin; vehicleData.status = "available"; vehicleData.synced_to_facebook = false;
        vehicleData.days_on_lot = 0; vehicleData.leads = 0; vehicleData.created_at = new Date().toISOString();
        await supabase.from("vehicles").insert(vehicleData); newCount++;
      }
    } else {
      const { data: existing } = await supabase.from("vehicles").select("id")
        .eq("year", year).eq("make", vehicleData.make as string).eq("model", vehicleData.model as string)
        .eq("dealer_id", dealershipId).maybeSingle();
      if (existing) { await supabase.from("vehicles").update(vehicleData).eq("id", existing.id); updatedCount++; }
      else {
        vehicleData.vin = `SCRAPE${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`.slice(0, 17);
        vehicleData.status = "available"; vehicleData.synced_to_facebook = false;
        vehicleData.days_on_lot = 0; vehicleData.leads = 0; vehicleData.created_at = new Date().toISOString();
        await supabase.from("vehicles").insert(vehicleData); newCount++;
      }
    }
  }

  if (scrapedVins.size > 0) {
    const { data: ev } = await supabase.from("vehicles").select("id, vin").eq("dealer_id", dealershipId).eq("source", "scraper").eq("status", "available");
    if (ev) { for (const e of ev) { if (e.vin && !scrapedVins.has(e.vin)) { await supabase.from("vehicles").update({ status: "sold", updated_at: new Date().toISOString() }).eq("id", e.id); markedSold++; } } }
  }
  return { newCount, updatedCount, markedSold, savedCount: newCount + updatedCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = userData.user.id;
    const { data: profile } = await supabase.from("profiles").select("dealership_id").eq("user_id", userId).single();
    if (!profile?.dealership_id) return new Response(JSON.stringify({ error: "No dealership found for user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const dealershipId = profile.dealership_id;

    const body = await req.json().catch(() => ({}));
    let scrapeUrl: string = body.url || "";
    const prefetchedHtml: string | null = body.html || null;
    const prefetchedPages: string[] | null = body.htmlPages || null;
    const skipDetailFetch: boolean = body.skipDetailFetch || false;
    const vehiclesEnriched: any[] | null = body.vehiclesEnriched || null;
    const pagesScrapedOverride: number = body.pagesScraped || 0;

    if (!scrapeUrl) {
      const { data: s } = await supabase.from("dealer_settings").select("scraper_url").eq("dealership_id", dealershipId).maybeSingle();
      scrapeUrl = s?.scraper_url || "";
    }
    if (!scrapeUrl) return new Response(JSON.stringify({ error: "No scraper URL configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try { const p = new URL(scrapeUrl); if (!["http:", "https:"].includes(p.protocol)) throw new Error("x"); } catch { return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    await supabase.from("dealer_settings").update({ scraper_status: "scraping", scraper_url: scrapeUrl }).eq("dealership_id", dealershipId);

    // MODE 3: Save pre-enriched vehicles
    if (vehiclesEnriched && vehiclesEnriched.length > 0) {
      console.log(`Saving ${vehiclesEnriched.length} pre-enriched vehicles`);
      const { newCount, updatedCount, markedSold, savedCount } = await upsertVehicles(supabase, vehiclesEnriched, dealershipId, scrapeUrl);
      const totalImages = vehiclesEnriched.reduce((s: number, v: any) => s + (Array.isArray(v.images) ? v.images.length : 0), 0);
      await supabase.from("dealer_settings").update({ scraper_status: "idle", scraper_last_run: new Date().toISOString(), scraper_vehicle_count: savedCount }).eq("dealership_id", dealershipId);
      await supabase.from("ingestion_logs").insert({ dealership_id: dealershipId, source: "Website Scraper", feed_type: "html_scrape", vehicles_scanned: vehiclesEnriched.length, new_vehicles: newCount, marked_sold: markedSold, images_fetched: totalImages, status: "success", message: `Scraped ${scrapeUrl} - ${pagesScrapedOverride} pages, ${newCount} new, ${updatedCount} updated, ${totalImages} photos` }).catch(() => {});
      return new Response(JSON.stringify({ success: true, vehicles_found: savedCount, new_vehicles: newCount, updated_vehicles: updatedCount, marked_sold: markedSold, pages_scraped: pagesScrapedOverride, total_images: totalImages }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE 1 & 2: Extract vehicles from HTML
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) { await supabase.from("dealer_settings").update({ scraper_status: "error" }).eq("dealership_id", dealershipId); return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    let allPages: string[] = [];
    let pagesScraped = 0;
    if (prefetchedPages && prefetchedPages.length > 0) { allPages = prefetchedPages.filter((p: string) => p && p.length > 500); pagesScraped = allPages.length; }
    else if (prefetchedHtml && prefetchedHtml.length > 500) { allPages.push(prefetchedHtml); pagesScraped = 1; }
    else {
      const page1 = await fetchPage(scrapeUrl);
      if (!page1) { await supabase.from("dealer_settings").update({ scraper_status: "error" }).eq("dealership_id", dealershipId); return new Response(JSON.stringify({ error: "Failed to fetch page: site may be blocking server requests" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
      allPages.push(page1); pagesScraped = 1;
      const pagination = detectPagination(page1, scrapeUrl);
      if (pagination.totalPages > 1) { for (const pu of pagination.nextPageUrls) { const ph = await fetchPage(pu); if (ph) { allPages.push(ph); pagesScraped++; } else break; } }
    }

    let allVehicles: any[] = [];
    for (let i = 0; i < allPages.length; i++) {
      const ph = cleanHtml(allPages[i]);
      console.log(`Processing page ${i + 1}/${allPages.length}: ${ph.length} chars`);
      try { const pv = await extractVehiclesWithGemini(ph, scrapeUrl, GEMINI_API_KEY); allVehicles.push(...pv); console.log(`Page ${i + 1}: ${pv.length} vehicles (total: ${allVehicles.length})`); }
      catch (err: any) { console.error(`Page ${i + 1} failed: ${err.message}`); if (i === 0) { await supabase.from("dealer_settings").update({ scraper_status: "error" }).eq("dealership_id", dealershipId); return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); } }
      if (allVehicles.length >= MAX_VEHICLES) break;
    }

    const seenVins = new Set<string>();
    const deduped: any[] = [];
    for (const v of allVehicles) { const vin = v.vin && typeof v.vin === "string" && v.vin.length === 17 ? v.vin.toUpperCase() : null; if (vin) { if (seenVins.has(vin)) continue; seenVins.add(vin); } deduped.push(v); }
    const vehicles = deduped.slice(0, MAX_VEHICLES);

    // MODE 2: Return raw vehicles for client-side image enrichment
    if (skipDetailFetch) {
      await supabase.from("dealer_settings").update({ scraper_status: "scraping" }).eq("dealership_id", dealershipId);
      return new Response(JSON.stringify({ success: true, vehicles_raw: vehicles, pages_scraped: pagesScraped, vehicles_count: vehicles.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE 1: Full server-side
    const { newCount, updatedCount, markedSold, savedCount } = await upsertVehicles(supabase, vehicles, dealershipId, scrapeUrl);
    await supabase.from("dealer_settings").update({ scraper_status: "idle", scraper_last_run: new Date().toISOString(), scraper_vehicle_count: savedCount }).eq("dealership_id", dealershipId);
    const totalImages = vehicles.reduce((s: number, v: any) => s + (Array.isArray(v.images) ? v.images.length : 0), 0);
    await supabase.from("ingestion_logs").insert({ dealership_id: dealershipId, source: "Website Scraper", feed_type: "html_scrape", vehicles_scanned: vehicles.length, new_vehicles: newCount, marked_sold: markedSold, images_fetched: totalImages, status: "success", message: `Scraped ${scrapeUrl} - ${pagesScraped} pages, ${newCount} new, ${updatedCount} updated, ${markedSold} sold` }).catch(() => {});
    return new Response(JSON.stringify({ success: true, vehicles_found: savedCount, new_vehicles: newCount, updated_vehicles: updatedCount, marked_sold: markedSold, pages_scraped: pagesScraped }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("scrape-inventory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
