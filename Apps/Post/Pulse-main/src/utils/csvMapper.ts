/**
 * Client-side CSV column mapper + vehicle importer.
 * Replaces the ai-csv-map Edge Function with a heuristic approach
 * that runs entirely in the browser — no server-side secrets needed.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Target vehicle fields the app understands ──
const APP_FIELDS = [
  { field: "vin",            keywords: ["vin", "vehicle identification", "vehicle_identification", "vehicleid", "vehicle_id"] },
  { field: "make",           keywords: ["make", "manufacturer", "brand", "oem"] },
  { field: "model",          keywords: ["model", "model_name", "modelname", "vehicle_model"] },
  { field: "year",           keywords: ["year", "model_year", "modelyear", "yr"] },
  { field: "trim",           keywords: ["trim", "trim_level", "trimlevel", "package", "trim_package"] },
  { field: "mileage",        keywords: ["mileage", "miles", "odometer", "odo", "km", "kilometers", "mileage_reading"] },
  { field: "price",          keywords: ["price", "asking_price", "askingprice", "retail_price", "retailprice", "list_price", "listprice", "selling_price", "sellingprice", "msrp", "cost", "sticker_price"] },
  { field: "exterior_color", keywords: ["exterior_color", "exteriorcolor", "ext_color", "extcolor", "color", "paint", "paint_color", "exterior"] },
  { field: "images",         keywords: ["images", "image", "photos", "photo", "photo_url", "image_url", "imageurl", "photourl", "picture", "pictures", "pic", "media"] },
  { field: "days_on_lot",    keywords: ["days_on_lot", "daysonlot", "days_in_stock", "daysinstock", "lot_days", "lotdays", "age", "stock_days", "stockdays", "days_listed"] },
] as const;

type AppField = typeof APP_FIELDS[number]["field"];

// ── Heuristic column mapper ──
export function mapColumns(csvHeaders: string[]): Record<string, AppField> {
  const mapping: Record<string, AppField> = {};
  const usedFields = new Set<AppField>();

  // Normalize a header for comparison
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Score how well a CSV header matches an app field
  const score = (header: string, field: typeof APP_FIELDS[number]): number => {
    const norm = normalize(header);
    // Exact keyword match
    for (const kw of field.keywords) {
      if (norm === normalize(kw)) return 100;
    }
    // Keyword contained in header
    for (const kw of field.keywords) {
      if (norm.includes(normalize(kw))) return 80;
    }
    // Header contained in keyword
    for (const kw of field.keywords) {
      if (normalize(kw).includes(norm) && norm.length >= 3) return 60;
    }
    return 0;
  };

  // Build scored candidates and greedily assign best matches
  const candidates: { header: string; field: AppField; score: number }[] = [];

  for (const header of csvHeaders) {
    for (const appField of APP_FIELDS) {
      const s = score(header, appField);
      if (s > 0) {
        candidates.push({ header, field: appField.field, score: s });
      }
    }
  }

  // Sort by score descending, then assign greedily
  candidates.sort((a, b) => b.score - a.score);

  const usedHeaders = new Set<string>();
  for (const c of candidates) {
    if (usedFields.has(c.field) || usedHeaders.has(c.header)) continue;
    mapping[c.header] = c.field;
    usedFields.add(c.field);
    usedHeaders.add(c.header);
  }

  return mapping;
}

// ── Parsers ──
function parseMileage(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  let str = raw.trim().replace(/[^\d.,k]/gi, "");
  if (/k$/i.test(str)) {
    return Math.round(parseFloat(str.replace(/k$/i, "")) * 1000) || 0;
  }
  str = str.replace(/,/g, "");
  return parseInt(str, 10) || 0;
}

function parsePrice(raw: string): number {
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

// ── CSV parser ──
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === "," && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

export function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
    return row;
  });
  return { headers, rows };
}

// ── Apply mapping to a single row ──
function applyMapping(
  row: Record<string, string>,
  mapping: Record<string, string>,
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
      result[appField] = raw.includes("|")
        ? raw.split("|").map(s => s.trim()).filter(Boolean)
        : raw.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      result[appField] = raw;
    }
  }
  return result;
}

// ── Main import function ──
export async function importCSVWithMapping(
  file: File,
  dealerId: string,
): Promise<{
  success: boolean;
  mapping: Record<string, string>;
  vehicles_scanned: number;
  new_vehicles: number;
  updated_vehicles: number;
  skipped: number;
  mapped_columns: number;
}> {
  const csvText = await file.text();
  const { headers, rows } = parseCSV(csvText);

  if (headers.length === 0 || rows.length === 0) {
    throw new Error("CSV is empty or has no data rows");
  }

  // Run heuristic mapping
  const mapping = mapColumns(headers);

  if (Object.keys(mapping).length === 0) {
    throw new Error("Could not detect any matching columns in your CSV. Please check the column headers.");
  }

  if (!Object.values(mapping).includes("vin")) {
    throw new Error("No VIN column detected. A VIN column is required for import.");
  }

  // Fetch existing VINs for this dealer to determine insert vs update
  const { data: dbVehicles } = await supabase
    .from("vehicles")
    .select("vin")
    .eq("dealer_id", dealerId);
  const existingVins = new Set((dbVehicles || []).map((v: any) => v.vin));

  let newVehicles = 0;
  let updatedVehicles = 0;
  let skipped = 0;

  for (const row of rows) {
    const mapped = applyMapping(row, mapping);
    if (!mapped.vin) { skipped++; continue; }

    const record: Record<string, any> = {
      vin: mapped.vin,
      make: mapped.make || "Unknown",
      model: mapped.model || "Unknown",
      year: mapped.year || new Date().getFullYear(),
      trim: mapped.trim || null,
      mileage: mapped.mileage || 0,
      price: mapped.price || 0,
      exterior_color: mapped.exterior_color || null,
      days_on_lot: mapped.days_on_lot || 0,
      images: mapped.images || [],
      status: "available",
      dealer_id: dealerId,
    };

    if (existingVins.has(mapped.vin)) {
      // Update existing vehicle
      const { error } = await supabase
        .from("vehicles")
        .update(record)
        .eq("vin", mapped.vin)
        .eq("dealer_id", dealerId);
      if (!error) {
        updatedVehicles++;
      } else {
        console.error(`Update failed for VIN ${mapped.vin}:`, error.message);
      }
    } else {
      // Insert new vehicle
      const { error } = await supabase
        .from("vehicles")
        .insert(record);
      if (!error) {
        newVehicles++;
        existingVins.add(mapped.vin); // track in case of duplicate VINs in CSV
      } else {
        console.error(`Insert failed for VIN ${mapped.vin}:`, error.message);
      }
    }
  }

  // Log the run
  await supabase.from("ingestion_logs").insert({
    source: file.name,
    feed_type: "CSV (Auto-Mapped)",
    vehicles_scanned: rows.length,
    new_vehicles: newVehicles,
    marked_sold: 0,
    images_fetched: 0,
    status: "success",
    message: `Auto-mapped ${Object.keys(mapping).length} columns · ${newVehicles} new · ${updatedVehicles} updated · ${skipped} skipped (no VIN)`,
    dealer_id: dealerId,
  });

  return {
    success: true,
    mapping,
    vehicles_scanned: rows.length,
    new_vehicles: newVehicles,
    updated_vehicles: updatedVehicles,
    skipped,
    mapped_columns: Object.keys(mapping).length,
  };
}
