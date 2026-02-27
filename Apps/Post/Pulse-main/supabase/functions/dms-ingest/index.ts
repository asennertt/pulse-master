/**
 * fn-dms-ingest.ts — Supabase Edge Function (Deno)
 * Core DMS/FTP ingestion engine for Pulse inventory pipeline.
 *
 * Receives a POST with JSON body:
 *   dealer_id   — UUID of the dealer
 *   source      — string label for the feed source (e.g. "CDK", "Reynolds")
 *   feedType    — "XML" | "CSV"
 *   ftp_host    — FTP hostname (optional when feedRows provided)
 *   ftp_user    — FTP username (optional when feedRows provided)
 *   ftp_pass    — FTP password (optional when feedRows provided)
 *   ftp_path    — path to the inventory file on the FTP server (optional)
 *   feedRows    — pre-parsed array of row objects for direct ingestion (bypasses FTP)
 *
 * Auth: Bearer JWT verified via Supabase auth.
 * DB writes go directly to Neon via postgresjs.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

// P20 FIX: restrict CORS to APP_ORIGIN
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// C6 FIX: Use NEON_DATABASE_URL
const sql = postgres(Deno.env.get("NEON_DATABASE_URL")!, { ssl: "require", prepare: false });

// C1 FIX: fully implemented helper functions

function parseMileage(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return Math.round(val);
  const s = String(val).trim().toLowerCase();
  const stripped = s.replace(/\s*(miles?|mi|km)\s*$/i, "").trim();
  if (/^\d+(\.\d+)?k$/.test(stripped)) return Math.round(parseFloat(stripped) * 1000);
  const cleaned = stripped.replace(/,/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n);
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const len = line.length;
  while (i <= len) {
    if (i === len) break;
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') { field += '"'; i += 2; }
          else { i++; break; }
        } else { field += line[i]; i++; }
      }
      fields.push(field);
      if (i < len && line[i] === ",") i++;
    } else {
      const start = i;
      while (i < len && line[i] !== ",") i++;
      fields.push(line.slice(start, i));
      if (i < len && line[i] === ",") i++;
    }
  }
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (values[idx] ?? "").trim(); });
    rows.push(obj);
  }
  return rows;
}

const DEFAULT_FIELD_MAP: Record<string, string> = {
  vin: "vin", "vehicle identification number": "vin", vehicleidentificationnumber: "vin",
  year: "year", modelyear: "year", "model year": "year", yr: "year",
  make: "make", brand: "make", manufacturer: "make",
  model: "model", modelname: "model", "model name": "model",
  trim: "trim", trimlevel: "trim", "trim level": "trim", style: "trim", bodystyle: "trim",
  price: "price", saleprice: "price", "sale price": "price", listprice: "price", "list price": "price", retailprice: "price", "retail price": "price", askingprice: "price", "asking price": "price",
  mileage: "mileage", miles: "mileage", odometer: "mileage", odometerreading: "mileage", "odometer reading": "mileage",
  exteriorcolor: "exterior_color", "exterior color": "exterior_color", color: "exterior_color", extcolor: "exterior_color", "ext color": "exterior_color",
  interiorcolor: "interior_color", "interior color": "interior_color", intcolor: "interior_color", "int color": "interior_color",
  stocknumber: "stock_number", "stock number": "stock_number", stock: "stock_number", stockno: "stock_number", "stock no": "stock_number",
  images: "images", imageurl: "images", "image url": "images", imageurls: "images", photos: "images", photourl: "images", "photo url": "images",
  daysonlot: "days_on_lot", "days on lot": "days_on_lot", age: "days_on_lot", lotage: "days_on_lot",
  condition: "condition", vehiclecondition: "condition",
  body: "body_type", bodytype: "body_type", "body type": "body_type",
  fueltype: "fuel_type", "fuel type": "fuel_type", fuel: "fuel_type",
  transmission: "transmission", trans: "transmission",
  engine: "engine", enginedescription: "engine", "engine description": "engine",
};

function applyDefaultMapping(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const lookupKey = rawKey.trim().toLowerCase().replace(/\s+/g, " ");
    const mappedKey = DEFAULT_FIELD_MAP[lookupKey];
    if (mappedKey) {
      if (mappedKey === "year") { const n = parseInt(String(rawVal), 10); out[mappedKey] = isNaN(n) ? null : n; }
      else if (mappedKey === "price") { const cleaned = String(rawVal).replace(/[$,\s]/g, ""); const n = parseFloat(cleaned); out[mappedKey] = isNaN(n) ? 0 : n; }
      else if (mappedKey === "mileage") { out[mappedKey] = parseMileage(rawVal); }
      else if (mappedKey === "days_on_lot") { const n = parseInt(String(rawVal), 10); out[mappedKey] = isNaN(n) ? 0 : n; }
      else { out[mappedKey] = rawVal; }
    }
  }
  return out;
}

function applyMappings(row: Record<string, unknown>, mappings: Array<{ source_field: string; target_field: string }>): Record<string, unknown> {
  if (!mappings || mappings.length === 0) return applyDefaultMapping(row);
  const out: Record<string, unknown> = {};
  const mappingLookup = new Map(mappings.map(m => [m.source_field.trim().toLowerCase(), m.target_field.trim()]));
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const targetField = mappingLookup.get(rawKey.trim().toLowerCase());
    if (targetField) {
      if (targetField === "year") { const n = parseInt(String(rawVal), 10); out[targetField] = isNaN(n) ? null : n; }
      else if (targetField === "price") { const cleaned = String(rawVal).replace(/[$,\s]/g, ""); const n = parseFloat(cleaned); out[targetField] = isNaN(n) ? 0 : n; }
      else if (targetField === "mileage") { out[targetField] = parseMileage(rawVal); }
      else if (targetField === "days_on_lot") { const n = parseInt(String(rawVal), 10); out[targetField] = isNaN(n) ? 0 : n; }
      else { out[targetField] = rawVal; }
    }
  }
  const defaultMapped = applyDefaultMapping(row);
  for (const [k, v] of Object.entries(defaultMapped)) { if (!(k in out)) out[k] = v; }
  return out;
}

function normalizeImages(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images.map(String).filter(s => s.trim().length > 0);
  if (typeof images === "string") {
    const trimmed = images.trim();
    if (trimmed === "") return [];
    if (trimmed.startsWith("[")) {
      try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) return parsed.map(String).filter((s: string) => s.trim().length > 0); } catch {}
    }
    const delimiter = trimmed.includes("|") ? "|" : ",";
    return trimmed.split(delimiter).map(s => s.trim()).filter(s => s.length > 0);
  }
  return [];
}

function getChangedFields(existing: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> | null {
  const TRACKED_FIELDS = ["price", "mileage", "trim", "exterior_color", "interior_color", "images", "days_on_lot", "year", "make", "model", "status", "condition", "body_type", "fuel_type", "transmission", "engine", "stock_number"];
  const changes: Record<string, unknown> = {};
  for (const field of TRACKED_FIELDS) {
    const incomingVal = incoming[field];
    if (incomingVal === undefined || incomingVal === null) continue;
    const existingVal = existing[field];
    if (field === "images") {
      if (JSON.stringify(normalizeImages(incomingVal)) !== JSON.stringify(normalizeImages(existingVal))) changes[field] = normalizeImages(incomingVal);
      continue;
    }
    if (["price", "mileage", "days_on_lot", "year"].includes(field)) {
      const inNum = Number(incomingVal); const exNum = Number(existingVal);
      if (!isNaN(inNum) && inNum !== exNum) changes[field] = inNum;
      continue;
    }
    const inStr = String(incomingVal).trim();
    const exStr = existingVal != null ? String(existingVal).trim() : "";
    if (inStr !== exStr) changes[field] = incomingVal;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

async function downloadFTPFile(_host: string, _user: string, _pass: string, _path: string): Promise<string> {
  throw new Error("Direct FTP download is not supported in this edge function runtime. Please provide pre-parsed feed rows via the `feedRows` request body field, or set up a separate cron worker that POSTs rows to this endpoint.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // C13 FIX: JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user: authedUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authedUser) return new Response(JSON.stringify({ error: "Unauthorized: invalid or expired token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // C1 FIX: Complete Input Parsing
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    const dealerId = (body.dealer_id as string | undefined)?.trim();
    if (!dealerId) return new Response(JSON.stringify({ error: "Missing required field: dealer_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const feedSource: string = ((body.source as string | undefined) ?? "unknown").trim();
    const feedType: "XML" | "CSV" = (body.feedType as "XML" | "CSV") ?? "CSV";
    const ftpHost = (body.ftp_host as string | undefined)?.trim() ?? "";
    const ftpUser = (body.ftp_user as string | undefined)?.trim() ?? "";
    const ftpPass = (body.ftp_pass as string | undefined)?.trim() ?? "";
    const ftpPath = (body.ftp_path as string | undefined)?.trim() ?? "";
    const feedRowsRaw = body.feedRows as Array<Record<string, unknown>> | undefined;

    // C13 FIX: Dealer ID authorisation check
    const profileRows = await sql`SELECT dealer_id FROM public.profiles WHERE user_id = ${authedUser.id} LIMIT 1`;
    if (profileRows.length === 0) return new Response(JSON.stringify({ error: "Forbidden: no profile found for authenticated user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userDealerId: string = profileRows[0].dealer_id;
    if (userDealerId !== dealerId) return new Response(JSON.stringify({ error: "Forbidden: authenticated user does not belong to the requested dealer" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const useSimulated: boolean = Array.isArray(feedRowsRaw) && feedRowsRaw.length > 0;

    const dbMappings = await sql`SELECT source_field, target_field FROM public.dms_field_mappings WHERE dealer_id = ${dealerId}`;
    const fieldMappings: Array<{ source_field: string; target_field: string }> = dbMappings;

    let rawRows: Array<Record<string, unknown>> = [];
    if (useSimulated && feedRowsRaw) {
      rawRows = feedRowsRaw as Array<Record<string, unknown>>;
    } else if (ftpHost && ftpUser && ftpPass) {
      const fileContent = await downloadFTPFile(ftpHost, ftpUser, ftpPass, ftpPath);
      if (feedType === "CSV") {
        rawRows = parseCSV(fileContent);
      } else {
        const vehicleMatches = fileContent.matchAll(/<[Vv]ehicle[^>]*>([\s\S]*?)<\/[Vv]ehicle>/g);
        for (const match of vehicleMatches) {
          const row: Record<string, string> = {};
          for (const field of match[1].matchAll(/<([^/>\s]+)[^>]*>([^<]*)<\/\1>/g)) row[field[1]] = field[2].trim();
          rawRows.push(row);
        }
      }
    } else {
      return new Response(JSON.stringify({ error: "No feed data provided. Supply either `feedRows` in the request body or FTP credentials (ftp_host, ftp_user, ftp_pass, ftp_path)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const feedVehicles = rawRows.map(row => applyMappings(row, fieldMappings));
    const validFeedVehicles = feedVehicles.filter(v => typeof v.vin === "string" && (v.vin as string).trim().length > 0);
    const feedVinSet = new Set(validFeedVehicles.map(v => (v.vin as string).toUpperCase().trim()));

    const dbVehicles = await sql`SELECT id, vin, status, price, dealer_id, year, make, model, trim, mileage, exterior_color, days_on_lot, images FROM public.pulse_vehicles WHERE dealer_id = ${dealerId}`;
    const dbVinMap = new Map<string, Record<string, unknown>>((dbVehicles as Array<Record<string, unknown>>).map(v => [String(v.vin).toUpperCase().trim(), v]));

    const counters = { new: 0, updated: 0, sold: 0, images: 0, drops: 0 };

    for (const incoming of validFeedVehicles) {
      const vin = String(incoming.vin).toUpperCase().trim();
      const existing = dbVinMap.get(vin);
      const normalizedImages = normalizeImages(incoming.images);
      if (normalizedImages.length > 0) counters.images++;

      if (!existing) {
        await sql`INSERT INTO public.pulse_vehicles (vin, make, model, year, trim, mileage, price, exterior_color, interior_color, days_on_lot, images, status, dealer_id, stock_number, condition, body_type, fuel_type, transmission, engine) VALUES (${vin}, ${(incoming.make as string) || "Unknown"}, ${(incoming.model as string) || "Unknown"}, ${Number(incoming.year) || new Date().getFullYear()}, ${(incoming.trim as string) ?? null}, ${parseMileage(incoming.mileage)}, ${Number(incoming.price) || 0}, ${(incoming.exterior_color as string) ?? null}, ${(incoming.interior_color as string) ?? null}, ${Number(incoming.days_on_lot) || 0}, ${JSON.stringify(normalizedImages)}, 'available', ${dealerId}, ${(incoming.stock_number as string) ?? null}, ${(incoming.condition as string) ?? null}, ${(incoming.body_type as string) ?? null}, ${(incoming.fuel_type as string) ?? null}, ${(incoming.transmission as string) ?? null}, ${(incoming.engine as string) ?? null}) ON CONFLICT (vin) DO NOTHING`;
        counters.new++;
      } else {
        const changes = getChangedFields(existing as Record<string, unknown>, incoming);
        if (!changes) continue;
        if (changes.price !== undefined && Number(existing.price) > Number(changes.price) && Number(changes.price) > 0) {
          await sql`INSERT INTO public.pulse_price_history (vehicle_id, dealer_id, old_price, new_price, source) VALUES (${existing.id}, ${dealerId}, ${existing.price}, ${changes.price}, ${feedSource})`;
          counters.drops++;
        }
        if (changes.images !== undefined) changes.images = JSON.stringify(changes.images);
        await sql`UPDATE public.pulse_vehicles SET ${sql(changes as Record<string, unknown>)}, updated_at = NOW() WHERE id = ${existing.id}`;
        counters.updated++;
      }
    }

    // P19 FIX: Mark missing VINs as sold (batched)
    if (!useSimulated && feedVinSet.size > 0) {
      const feedVinArray = Array.from(feedVinSet);
      const BATCH_SIZE = 500;
      if (feedVinArray.length <= BATCH_SIZE) {
        const soldRows = await sql`UPDATE public.pulse_vehicles SET status = 'sold', synced_to_facebook = false WHERE dealer_id = ${dealerId} AND status != 'sold' AND vin NOT IN ${sql(feedVinArray)} RETURNING id`;
        counters.sold = soldRows.length;
      } else {
        await sql`CREATE TEMP TABLE IF NOT EXISTS _feed_vins (vin text PRIMARY KEY) ON COMMIT DROP`;
        for (let i = 0; i < feedVinArray.length; i += BATCH_SIZE) {
          const chunk = feedVinArray.slice(i, i + BATCH_SIZE);
          await sql`INSERT INTO _feed_vins ${sql(chunk.map(v => ({ vin: v })))} ON CONFLICT DO NOTHING`;
        }
        const soldRows = await sql`UPDATE public.pulse_vehicles pv SET status = 'sold', synced_to_facebook = false WHERE pv.dealer_id = ${dealerId} AND pv.status != 'sold' AND NOT EXISTS (SELECT 1 FROM _feed_vins fv WHERE fv.vin = pv.vin) RETURNING pv.id`;
        counters.sold = soldRows.length;
        await sql`DROP TABLE IF EXISTS _feed_vins`;
      }
    }

    await sql`INSERT INTO public.pulse_ingestion_logs (source, feed_type, vehicles_scanned, new_vehicles, updated_vehicles, marked_sold, images_fetched, price_drops, status, message, dealer_id) VALUES (${feedSource}, ${feedType}, ${validFeedVehicles.length}, ${counters.new}, ${counters.updated}, ${counters.sold}, ${counters.images}, ${counters.drops}, 'success', ${`Ingested ${validFeedVehicles.length} vehicles: ${counters.new} new, ${counters.updated} updated, ${counters.sold} marked sold, ${counters.images} with images, ${counters.drops} price drops`}, ${dealerId})`;

    return new Response(JSON.stringify({ success: true, vehicles_scanned: validFeedVehicles.length, new_vehicles: counters.new, updated_vehicles: counters.updated, marked_sold: counters.sold, images_fetched: counters.images, price_drops: counters.drops }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[dms-ingest] Unhandled error:", message);
    return new Response(JSON.stringify({ error: "Internal server error", details: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
