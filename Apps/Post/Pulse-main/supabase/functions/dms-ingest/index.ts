import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Mileage parser — handles "43,221", "43221", "43.221", "43k" etc. ──
function parseMileage(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  let str = raw.trim().replace(/[^\d.,k]/gi, "");
  // Handle shorthand like "43k" or "43.5k"
  if (/k$/i.test(str)) {
    return Math.round(parseFloat(str.replace(/k$/i, "")) * 1000) || 0;
  }
  // Remove comma thousand-separators (e.g. "43,221" → "43221")
  str = str.replace(/,/g, "");
  return parseInt(str, 10) || 0;
}

// ── CSV Parser ─────────────────────────────────────
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
    return row;
  });
}

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
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

// ── Apply field mappings ───────────────────────────
function applyMappings(
  row: Record<string, string>,
  mappings: { dms_field: string; app_field: string; transform: string | null }[]
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const m of mappings) {
    const raw = row[m.dms_field];
    if (raw === undefined || raw === "") continue;
    let value: any = raw;
    switch (m.transform) {
      case "parseInt": value = parseInt(raw, 10) || 0; break;
      case "parseMileage": value = parseMileage(raw); break;
      case "parseFloat": value = parseFloat(raw) || 0; break;
      case "uppercase": value = raw.toUpperCase(); break;
      case "lowercase": value = raw.toLowerCase(); break;
      case "splitPipe": value = raw.split("|").map(s => s.trim()).filter(Boolean); break;
      case "splitComma": value = raw.split(",").map(s => s.trim()).filter(Boolean); break;
    }
    result[m.app_field] = value;
  }
  return result;
}

// ── Default column mapping (fallback when no custom mappings exist) ──
const DEFAULT_COLUMN_MAP: Record<string, string> = {
  VIN: "vin", vin: "vin",
  Vehicle_Make: "make", Make: "make", make: "make",
  Vehicle_Model: "model", Model: "model", model: "model",
  Model_Year: "year", Year: "year", year: "year",
  Trim_Level: "trim", Trim: "trim", trim: "trim",
  Odometer: "mileage", Mileage: "mileage", mileage: "mileage",
  Retail_Price: "price", Price: "price", price: "price", Asking_Price: "price", Sticker_Price: "price",
  Ext_Color: "exterior_color", Exterior_Color: "exterior_color", Color: "exterior_color",
  Photo_URLs: "images", Photos: "images", Images: "images", Image_URLs: "images",
  Days_In_Stock: "days_on_lot", Days_On_Lot: "days_on_lot",
};

function applyDefaultMapping(row: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [csvCol, appField] of Object.entries(DEFAULT_COLUMN_MAP)) {
    const raw = row[csvCol];
    if (raw === undefined || raw === "") continue;
    if (result[appField] !== undefined) continue; // first match wins
    if (["year", "days_on_lot"].includes(appField)) {
      result[appField] = parseInt(raw, 10) || 0;
    } else if (appField === "mileage") {
      result[appField] = parseMileage(raw);
    } else if (appField === "price") {
      result[appField] = parseFloat(raw.replace(/[$,]/g, "")) || 0;
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

// ── Diff: only return changed fields ───────────────
function getChangedFields(
  existing: Record<string, any>,
  incoming: Record<string, any>
): Record<string, any> | null {
  const changes: Record<string, any> = {};
  const comparableFields = ["make", "model", "year", "trim", "mileage", "price", "exterior_color", "days_on_lot", "images"];
  for (const field of comparableFields) {
    if (incoming[field] === undefined) continue;
    const oldVal = existing[field];
    const newVal = incoming[field];
    if (Array.isArray(newVal)) {
      const oldArr = Array.isArray(oldVal) ? oldVal : [];
      if (JSON.stringify(oldArr.sort()) !== JSON.stringify([...newVal].sort())) {
        changes[field] = newVal;
      }
    } else if (String(oldVal) !== String(newVal)) {
      changes[field] = newVal;
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

// ── Simulated DMS feed (used when no CSV payload is provided) ──
const SIMULATED_DMS_FEED = [
  { VIN: "1HGCG5655WA039523", Vehicle_Make: "Honda", Vehicle_Model: "Accord", Model_Year: "2024", Trim_Level: "Sport 2.0T", Odometer: "1280", Retail_Price: "34990", Ext_Color: "Platinum White", Photo_URLs: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800|https://images.unsplash.com/photo-1606611013004-1a05332f8969?w=800", Days_In_Stock: "12" },
  { VIN: "5YJSA1E26MF123456", Vehicle_Make: "Tesla", Vehicle_Model: "Model 3", Model_Year: "2023", Trim_Level: "Long Range AWD", Odometer: "8500", Retail_Price: "36500", Ext_Color: "Midnight Silver", Photo_URLs: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800|https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=800", Days_In_Stock: "25" },
  { VIN: "WBAPH5C55BA123789", Vehicle_Make: "BMW", Vehicle_Model: "330i", Model_Year: "2024", Trim_Level: "xDrive M Sport", Odometer: "560", Retail_Price: "44900", Ext_Color: "Alpine White", Photo_URLs: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800", Days_In_Stock: "8" },
  { VIN: "1G1YY22G965109876", Vehicle_Make: "Chevrolet", Vehicle_Model: "Corvette", Model_Year: "2022", Trim_Level: "Stingray 3LT", Odometer: "11200", Retail_Price: "62900", Ext_Color: "Torch Red", Photo_URLs: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800|https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800", Days_In_Stock: "45" },
  { VIN: "2T1BURHE5JC098765", Vehicle_Make: "Toyota", Vehicle_Model: "Camry", Model_Year: "2024", Trim_Level: "XSE Hybrid", Odometer: "320", Retail_Price: "33200", Ext_Color: "Ice Cap", Photo_URLs: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800", Days_In_Stock: "5" },
  { VIN: "WAUFFAFL3EN012345", Vehicle_Make: "Audi", Vehicle_Model: "A4", Model_Year: "2023", Trim_Level: "Premium Plus 45", Odometer: "6700", Retail_Price: "39800", Ext_Color: "Daytona Gray", Photo_URLs: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800", Days_In_Stock: "18" },
  { VIN: "WP0AA2A97KS678901", Vehicle_Make: "Porsche", Vehicle_Model: "911", Model_Year: "2024", Trim_Level: "Carrera S", Odometer: "890", Retail_Price: "129500", Ext_Color: "GT Silver", Photo_URLs: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800|https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800", Days_In_Stock: "3" },
  { VIN: "WVWZZZ3CZWE123456", Vehicle_Make: "Volkswagen", Vehicle_Model: "Golf R", Model_Year: "2025", Trim_Level: "DSG", Odometer: "12", Retail_Price: "46890", Ext_Color: "Lapiz Blue", Photo_URLs: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800", Days_In_Stock: "1" },
  { VIN: "JTDKN3DU5A0123456", Vehicle_Make: "Lexus", Vehicle_Model: "IS 500", Model_Year: "2024", Trim_Level: "F Sport Performance", Odometer: "3200", Retail_Price: "56500", Ext_Color: "Ultrasonic Blue", Photo_URLs: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800", Days_In_Stock: "14" },
  { VIN: "3MW5R1J04M8B12345", Vehicle_Make: "BMW", Vehicle_Model: "M340i", Model_Year: "2025", Trim_Level: "xDrive", Odometer: "45", Retail_Price: "59800", Ext_Color: "Tanzanite Blue", Photo_URLs: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800|https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800", Days_In_Stock: "0" },
];

// ── Main Handler ───────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Parse input ──
    const contentType = req.headers.get("content-type") || "";
    let feedRows: Record<string, string>[] = [];
    let feedSource = "DealerTrack DMS";
    let feedType = "XML";
    let dealerId: string | null = null;

    if (contentType.includes("text/csv")) {
      // Raw CSV body (e.g. from an SFTP relay or cron webhook)
      const csvText = await req.text();
      feedRows = parseCSV(csvText);
      feedSource = "CSV Upload";
      feedType = "CSV";
      console.log(`Parsed ${feedRows.length} rows from raw CSV body`);
    } else if (contentType.includes("multipart/form-data")) {
      // File upload via form
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      feedSource = (formData.get("source") as string) || "CSV Upload";
      feedType = "CSV";
      dealerId = (formData.get("dealer_id") as string) || null;
      if (file) {
        const csvText = await file.text();
        feedRows = parseCSV(csvText);
        console.log(`Parsed ${feedRows.length} rows from uploaded file: ${file.name}`);
      }
    } else {
      // JSON body (existing behavior + optional csv_url or csv_data)
      const body = await req.json().catch(() => ({}));
      feedSource = body.source || "DealerTrack DMS";
      feedType = body.feedType || "XML";
      dealerId = body.dealer_id || null;

      if (body.csv_data) {
        // CSV string sent in JSON
        feedRows = parseCSV(body.csv_data);
        feedType = "CSV";
        console.log(`Parsed ${feedRows.length} rows from csv_data field`);
      } else if (body.csv_url) {
        // Fetch CSV from a remote URL (e.g. hosted on dealer's server)
        const resp = await fetch(body.csv_url);
        if (!resp.ok) throw new Error(`Failed to fetch CSV from ${body.csv_url}: ${resp.status}`);
        const csvText = await resp.text();
        feedRows = parseCSV(csvText);
        feedType = "CSV";
        console.log(`Fetched & parsed ${feedRows.length} rows from ${body.csv_url}`);
      }
    }

    // ── Resolve dealer_id from auth token if not provided ──
    if (!dealerId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data } = await userClient.rpc("get_my_dealership_id");
        if (data) dealerId = data;
        console.log(`Resolved dealer_id from auth token: ${dealerId}`);
      }
    }

    // ── Check if dealer account is active (Kill Switch) ──
    if (dealerId) {
      const { data: dealerCheck } = await supabase
        .from("dealerships")
        .select("status")
        .eq("id", dealerId)
        .single();
      if (dealerCheck && dealerCheck.status !== "active") {
        console.log(`⛔ Dealer ${dealerId} account is inactive — blocking ingestion`);
        await supabase.from("ingestion_logs").insert({
          source: feedSource, feed_type: feedType, vehicles_scanned: 0,
          new_vehicles: 0, marked_sold: 0, images_fetched: 0,
          status: "blocked", message: "Account deactivated by admin",
          dealer_id: dealerId,
        });
        return new Response(JSON.stringify({ error: "Account is inactive. Contact support." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Fallback to simulated feed if no CSV provided ──
    const useSimulated = feedRows.length === 0;
    if (useSimulated) {
      feedRows = SIMULATED_DMS_FEED.map(v => {
        const row: Record<string, string> = {};
        for (const [k, val] of Object.entries(v)) { row[k] = String(val); }
        return row;
      });
      console.log(`Using simulated DMS feed (${feedRows.length} vehicles)`);
    }

    // ── Load custom field mappings ──
    const { data: mappings } = await supabase
      .from("dms_field_mappings")
      .select("dms_field, app_field, transform")
      .eq("active", true);
    const hasCustomMappings = mappings && mappings.length > 0;

    // ── Transform rows to normalized vehicle records ──
    const feedVehicles: Record<string, any>[] = [];
    for (const row of feedRows) {
      const mapped = hasCustomMappings
        ? applyMappings(row, mappings as any)
        : applyDefaultMapping(row);
      if (!mapped.vin) continue; // skip rows without VIN
      feedVehicles.push(mapped);
    }

    const feedVinSet = new Set(feedVehicles.map(v => v.vin));
    console.log(`Processing ${feedVehicles.length} vehicles from feed`);

    // ── Get current DB vehicles ──
    const dbQuery = supabase
      .from("vehicles")
      .select("id, vin, status, price, dealer_id, year, make, model, trim, mileage, exterior_color, days_on_lot, images");
    if (dealerId) dbQuery.eq("dealer_id", dealerId);
    const { data: dbVehicles } = await dbQuery;
    const dbVinMap = new Map((dbVehicles || []).map((v: any) => [v.vin, v]));

    let newVehicles = 0;
    let updatedVehicles = 0;
    let markedSold = 0;
    let imagesFetched = 0;
    let priceDrops = 0;
    let skippedUnchanged = 0;

    // ── Normalize images to always be a proper array ──
    const normalizeImages = (val: any): string[] => {
      if (Array.isArray(val)) return val.map(String).filter(Boolean);
      if (typeof val === "string" && val.trim()) {
        return val.includes("|")
          ? val.split("|").map(s => s.trim()).filter(Boolean)
          : val.split(",").map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    // ── Process each feed vehicle ──
    for (const incoming of feedVehicles) {
      const vin = incoming.vin;
      const existing = dbVinMap.get(vin);

      const normalizedImages = normalizeImages(incoming.images);
      const imageCount = normalizedImages.length;

      if (!existing) {
        // ── NEW VEHICLE — Insert ──
        const record: Record<string, any> = {
          vin,
          make: incoming.make || "Unknown",
          model: incoming.model || "Unknown",
          year: incoming.year || new Date().getFullYear(),
          trim: incoming.trim || null,
          mileage: incoming.mileage || 0,
          price: incoming.price || 0,
          exterior_color: incoming.exterior_color || null,
          days_on_lot: incoming.days_on_lot || 0,
          images: normalizedImages,
          status: "available",
        };
        if (dealerId) record.dealer_id = dealerId;

        const { error: insertError } = await supabase.from("vehicles").insert(record);
        if (!insertError) {
          newVehicles++;
          imagesFetched += imageCount;
        } else {
          console.error(`Insert failed for VIN ${vin}:`, insertError.message);
        }
      } else {
        // ── EXISTING VEHICLE — Smart Diff ──
        const changes = getChangedFields(existing, incoming);

        if (!changes) {
          skippedUnchanged++;
          continue;
        }

        // ── Price change detection ──
        if (changes.price !== undefined) {
          const currentPrice = Number(existing.price);
          const incomingPrice = Number(changes.price);
          const now = new Date().toISOString();

          if (incomingPrice > 0 && currentPrice > 0 && incomingPrice !== currentPrice) {
            changes.last_price_change = now;

            const changeAmount = currentPrice - incomingPrice;
            const changePercent = ((changeAmount) / currentPrice) * 100;

            await supabase.from("price_history").insert({
              vehicle_id: existing.id,
              dealer_id: existing.dealer_id || dealerId || null,
              old_price: currentPrice,
              new_price: incomingPrice,
              change_amount: changeAmount,
              change_percent: Math.round(changePercent * 100) / 100,
              source: feedSource,
            });

            if (incomingPrice < currentPrice) {
              priceDrops++;
              console.log(`🚨 Price drop: ${existing.year} ${existing.make} ${existing.model} $${currentPrice} → $${incomingPrice} (-$${changeAmount})`);
            }
          }
        }

        if (changes.images !== undefined) {
          changes.images = normalizeImages(changes.images);
          imagesFetched += changes.images.length;
        }

        // If vehicle was previously sold and reappears, re-activate
        if (existing.status === "sold") {
          changes.status = "available";
          changes.synced_to_facebook = false;
        }

        const { error: updateErr } = await supabase
          .from("vehicles")
          .update(changes)
          .eq("id", existing.id);
        if (!updateErr) {
          updatedVehicles++;
        } else {
          console.error(`Update failed for VIN ${vin}:`, updateErr.message);
        }
      }
    }

    // ── Mark missing VINs as Sold + create sold alerts ──
    // IMPORTANT: Only reconcile sold status when using a real feed, never the simulated fallback
    if (useSimulated) {
      console.log("⚠️ Skipping sold-marking — using simulated feed, not a real DMS feed");
    }
    for (const [vin, dbVehicle] of dbVinMap) {
      const v = dbVehicle as any;
      if (!useSimulated && !feedVinSet.has(vin) && v.status !== "sold") {
        await supabase
          .from("vehicles")
          .update({ status: "sold", synced_to_facebook: false, facebook_post_id: null })
          .eq("id", v.id);

        // Create a sold alert so the dealer knows to pull the Facebook post
        await supabase.from("sold_alerts").insert({
          vehicle_id: v.id,
          vehicle_label: `${v.year} ${v.make} ${v.model}`,
          vin: vin,
          dealer_id: v.dealer_id || dealerId || null,
        });

        markedSold++;
        console.log(`🚗 Marked SOLD (missing from feed): ${v.year} ${v.make} ${v.model} [${vin}]`);
      }
    }

    // ── Log the ingestion run ──
    const message = [
      `${feedVehicles.length} scanned`,
      `${newVehicles} new`,
      `${updatedVehicles} updated`,
      `${skippedUnchanged} unchanged`,
      `${markedSold} sold`,
      priceDrops > 0 ? `${priceDrops} price drops` : null,
      imagesFetched > 0 ? `${imagesFetched} images` : null,
    ].filter(Boolean).join(" · ");

    await supabase.from("ingestion_logs").insert({
      source: feedSource,
      feed_type: feedType,
      vehicles_scanned: feedVehicles.length,
      new_vehicles: newVehicles,
      marked_sold: markedSold,
      images_fetched: imagesFetched,
      status: "success",
      message,
      dealer_id: dealerId || null,
    });

    const result = {
      success: true,
      vehicles_scanned: feedVehicles.length,
      new_vehicles: newVehicles,
      updated_vehicles: updatedVehicles,
      skipped_unchanged: skippedUnchanged,
      marked_sold: markedSold,
      price_drops: priceDrops,
      images_fetched: imagesFetched,
    };

    console.log("✅ Ingestion complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dms-ingest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
