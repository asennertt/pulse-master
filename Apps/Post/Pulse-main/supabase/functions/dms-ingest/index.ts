import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Mileage parser ─────────────────────────────────
function parseMileage(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  let str = raw.trim().replace(/[^\d.,k]/gi, "");
  if (/k$/i.test(str)) {
    return Math.round(parseFloat(str.replace(/k$/i, "")) * 1000) || 0;
  }
  str = str.replace(/,/g, "");
  return parseInt(str, 10) || 0;
}

// ── Price parser — looks for sale/internet price, ignores MSRP ──
function parsePrice(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

// ── CSV parser ──────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(
  raw: string
): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().replace(/^"|"$/g, "")
  );
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || "").trim();
    });
    return row;
  });
  return { headers, rows };
}

// ── Default field mapping — auto-detect common DMS column names ──
const FIELD_ALIASES: Record<string, string[]> = {
  vin: ["vin", "vehicle_vin", "vehiclevin", "v.i.n.", "vinno", "vin_number"],
  make: ["make", "manufacturer", "vehicle_make", "brand"],
  model: ["model", "vehicle_model", "model_name"],
  year: ["year", "model_year", "vehicle_year", "yr"],
  trim: ["trim", "trim_level", "trimlevel", "package"],
  mileage: [
    "mileage",
    "odometer",
    "miles",
    "odo",
    "km",
    "kilometers",
    "vehicle_mileage",
  ],
  price: [
    "price",
    "sale_price",
    "saleprice",
    "internet_price",
    "internetprice",
    "asking_price",
    "list_price",
    "listprice",
    "selling_price",
    "retail_price",
    "our_price",
    "dealer_price",
    "special_price",
    "web_price",
    "advertised_price",
    "final_price",
    "amount",
    "cost",
  ],
  exterior_color: [
    "exterior_color",
    "exteriorcolor",
    "ext_color",
    "color",
    "colour",
    "paint",
    "exterior",
  ],
  images: [
    "images",
    "photos",
    "photo_urls",
    "image_urls",
    "picture_urls",
    "vehicle_photos",
    "image_list",
    "photo_list",
    "media",
    "imageurl",
    "photourl",
  ],
  days_on_lot: [
    "days_on_lot",
    "daysonlot",
    "age",
    "lot_days",
    "stock_age",
    "days_in_stock",
    "daysinstocK",
  ],
};

function autoMapHeaders(
  headers: string[],
  customMappings?: Record<string, string>
): Record<string, string> {
  const mapping: Record<string, string> = {};

  // Custom mappings from dms_field_mappings table take priority
  if (customMappings) {
    for (const [csvCol, appField] of Object.entries(customMappings)) {
      const found = headers.find(
        (h) => h.toLowerCase() === csvCol.toLowerCase()
      );
      if (found) mapping[found] = appField;
    }
  }

  // Auto-detect remaining unmapped fields
  for (const header of headers) {
    if (Object.values(mapping).length > 0 && mapping[header]) continue;
    const lower = header.toLowerCase().replace(/[\s_-]+/g, "_").trim();

    for (const [appField, aliases] of Object.entries(FIELD_ALIASES)) {
      if (Object.values(mapping).includes(appField)) continue; // already mapped
      if (aliases.some((a) => lower === a || lower.includes(a))) {
        mapping[header] = appField;
        break;
      }
    }
  }

  return mapping;
}

// ── Apply mapping to a row ──────────────────────────
function applyMapping(
  row: Record<string, string>,
  mapping: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [csvCol, appField] of Object.entries(mapping)) {
    const raw = (row[csvCol] || "").trim();
    if (!raw) continue;

    if (["year", "days_on_lot"].includes(appField)) {
      result[appField] = parseInt(raw, 10) || 0;
    } else if (appField === "mileage") {
      result[appField] = parseMileage(raw);
    } else if (appField === "price") {
      result[appField] = parsePrice(raw);
    } else if (appField === "images") {
      // Split pipe or comma-delimited URLs
      result[appField] = raw.includes("|")
        ? raw
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
        : raw
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.startsWith("http"));
    } else {
      result[appField] = raw;
    }
  }
  return result;
}

// ── Detect changed fields between DB record and incoming data ──
function getChangedFields(
  existing: Record<string, any>,
  incoming: Record<string, any>
): Record<string, any> | null {
  const changes: Record<string, any> = {};
  const checkFields = [
    "price",
    "mileage",
    "trim",
    "exterior_color",
    "days_on_lot",
    "images",
  ];

  for (const field of checkFields) {
    if (incoming[field] === undefined || incoming[field] === null) continue;

    if (field === "images") {
      const incomingImgs = Array.isArray(incoming.images)
        ? incoming.images
        : [];
      const existingImgs = Array.isArray(existing.images)
        ? existing.images
        : [];
      if (
        incomingImgs.length > 0 &&
        JSON.stringify(incomingImgs) !== JSON.stringify(existingImgs)
      ) {
        changes.images = incomingImgs;
      }
    } else if (String(existing[field]) !== String(incoming[field])) {
      changes[field] = incoming[field];
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

// ═══════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      csvContent,
      feedSource = "DMS Feed",
      feedType = "CSV",
      dealer_id,
      dealership_id,
    } = body;

    // Accept either dealership_id or dealer_id for backwards compat
    const dId = dealership_id || dealer_id;
    if (!dId) {
      return json({ error: "dealership_id is required" }, 400);
    }

    if (!csvContent || typeof csvContent !== "string") {
      return json({ error: "csvContent is required (raw CSV string)" }, 400);
    }

    // Parse the CSV
    const { headers, rows } = parseCSV(csvContent);
    if (headers.length === 0 || rows.length === 0) {
      return json({ error: "CSV is empty or has no data rows" }, 400);
    }

    console.log(
      `[dms-ingest] Parsing ${rows.length} rows with headers:`,
      headers.join(", ")
    );

    // Load custom field mappings from DB (if dealer configured them)
    const { data: customMaps } = await supabase
      .from("dms_field_mappings")
      .select("dms_field, app_field")
      .eq("active", true);

    const customMapping: Record<string, string> = {};
    if (customMaps) {
      for (const m of customMaps as any[]) {
        customMapping[m.dms_field] = m.app_field;
      }
    }

    // Auto-detect + merge custom mappings
    const mapping = autoMapHeaders(headers, customMapping);
    console.log("[dms-ingest] Field mapping:", JSON.stringify(mapping));

    if (!mapping || !Object.values(mapping).includes("vin")) {
      return json(
        {
          error:
            "Could not detect a VIN column. Make sure your CSV has a column named 'VIN'.",
        },
        400
      );
    }

    // Get existing vehicles for this dealer
    const { data: dbVehicles } = await supabase
      .from("vehicles")
      .select("id, vin, status, price, mileage, trim, exterior_color, days_on_lot, images")
      .eq("dealership_id", dId);

    const dbVinMap = new Map(
      (dbVehicles || []).map((v: any) => [v.vin, v])
    );

    const feedVinSet = new Set<string>();
    let counters = { new: 0, updated: 0, sold: 0, images: 0, skipped: 0, price_drops: 0 };

    // Process each row
    for (const row of rows) {
      const mapped = applyMapping(row, mapping);
      if (!mapped.vin) {
        counters.skipped++;
        continue;
      }

      feedVinSet.add(mapped.vin);
      const existing = dbVinMap.get(mapped.vin);

      const imageArray = Array.isArray(mapped.images) ? mapped.images : [];
      if (imageArray.length > 0) counters.images += imageArray.length;

      if (!existing) {
        // ── New vehicle ──
        const { error } = await supabase.from("vehicles").insert({
          vin: mapped.vin,
          make: mapped.make || "Unknown",
          model: mapped.model || "Unknown",
          year: mapped.year || new Date().getFullYear(),
          trim: mapped.trim || null,
          mileage: mapped.mileage || 0,
          price: mapped.price || 0,
          exterior_color: mapped.exterior_color || null,
          days_on_lot: mapped.days_on_lot || 0,
          images: imageArray,
          status: "available",
          dealership_id: dId,
        });

        if (!error) counters.new++;
        else console.error(`[dms-ingest] Insert error for VIN ${mapped.vin}:`, error.message);
      } else {
        // ── Existing vehicle — smart update ──
        const changes = getChangedFields(existing, mapped);
        if (!changes) continue;

        // Track price drops
        if (
          changes.price !== undefined &&
          Number(existing.price) > Number(changes.price)
        ) {
          await supabase.from("price_history").insert({
            vehicle_id: existing.id,
            dealership_id: dId,
            old_price: existing.price,
            new_price: changes.price,
            source: feedSource,
          });
          counters.price_drops++;
        }

        const { error } = await supabase
          .from("vehicles")
          .update(changes)
          .eq("id", existing.id);

        if (!error) counters.updated++;
        else console.error(`[dms-ingest] Update error for VIN ${mapped.vin}:`, error.message);
      }
    }

    // ── Mark vehicles not in feed as sold ──
    if (feedVinSet.size > 0) {
      const feedVins = Array.from(feedVinSet);
      const { data: soldData } = await supabase
        .from("vehicles")
        .update({ status: "sold", synced_to_facebook: false })
        .eq("dealership_id", dId)
        .neq("status", "sold")
        .not("vin", "in", `(${feedVins.map((v) => `"${v}"`).join(",")})`)
        .select("id");

      counters.sold = soldData?.length || 0;
    }

    // ── Log the ingestion run ──
    const message = `Mapped ${Object.keys(mapping).length} columns · ${counters.new} new · ${counters.updated} updated · ${counters.sold} sold · ${counters.images} images · ${counters.skipped} skipped`;

    await supabase.from("ingestion_logs").insert({
      source: feedSource,
      feed_type: feedType,
      vehicles_scanned: rows.length,
      new_vehicles: counters.new,
      marked_sold: counters.sold,
      images_fetched: counters.images,
      status: "success",
      message,
      dealer_id: dId,
    });

    console.log(`[dms-ingest] Complete: ${message}`);

    return json({
      success: true,
      ...counters,
      vehicles_scanned: rows.length,
      mapped_columns: Object.keys(mapping).length,
      mapping,
    });
  } catch (e: any) {
    console.error("[dms-ingest] Error:", e);
    return json({ error: e.message || "Unknown error" }, 500);
  }
});
