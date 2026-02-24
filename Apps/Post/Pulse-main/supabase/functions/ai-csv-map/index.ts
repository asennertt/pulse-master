import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Target vehicle fields the app understands
const APP_FIELDS = [
  { field: "vin",            description: "Vehicle Identification Number (17-char alphanumeric)" },
  { field: "make",           description: "Vehicle manufacturer / brand (e.g. Toyota, Ford)" },
  { field: "model",          description: "Vehicle model name (e.g. Camry, F-150)" },
  { field: "year",           description: "Model year (4-digit integer)" },
  { field: "trim",           description: "Trim level / package (e.g. XSE, Sport, LT)" },
  { field: "mileage",        description: "Odometer reading in miles (integer)" },
  { field: "price",          description: "Asking / retail price in USD (numeric)" },
  { field: "exterior_color", description: "Exterior paint color name" },
  { field: "images",         description: "Photo URLs (pipe- or comma-separated)" },
  { field: "days_on_lot",    description: "Number of days the vehicle has been in stock (integer)" },
];

// ── Mileage parser — handles "43,221", "43221", "43.221", "43k" etc. ──
function parseMileage(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  let str = raw.trim().replace(/[^\d.,k]/gi, "");
  if (/k$/i.test(str)) {
    return Math.round(parseFloat(str.replace(/k$/i, "")) * 1000) || 0;
  }
  str = str.replace(/,/g, "");
  return parseInt(str, 10) || 0;
}

// ── Simple CSV parser ───────────────────────────────
function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
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

// ── Apply AI-generated mapping to a CSV row ─────────
function applyMapping(
  row: Record<string, string>,
  mapping: Record<string, string>  // { csvColumn -> appField }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Use service role for writes, but user token to resolve dealer_id
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Accept multipart/form-data with a 'file' field + optional 'dealer_id'
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let dealerId = (formData.get("dealer_id") as string) || null;

    // If dealer_id wasn't sent by client, resolve it from the auth token
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
      }
    }

    if (!dealerId) {
      return new Response(JSON.stringify({ error: "No dealership linked to your account. Please complete onboarding first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!file) {
      return new Response(JSON.stringify({ error: "No CSV file provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csvText = await file.text();
    const { headers, rows } = parseCSV(csvText);

    if (headers.length === 0 || rows.length === 0) {
      return new Response(JSON.stringify({ error: "CSV is empty or has no data rows" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sample up to 3 rows for context
    const sampleRows = rows.slice(0, 3).map(r =>
      headers.map(h => `${h}: ${r[h] || ""}`).join(", ")
    ).join("\n");

    const systemPrompt = `You are a data-mapping assistant for a car dealership inventory system.
Your task: map CSV column names to the correct vehicle database fields.
Return ONLY a JSON object (no markdown, no explanation) in this exact format:
{ "mapping": { "CSV_COLUMN_NAME": "app_field_name", ... } }
Only include mappings you are confident about. Skip columns that don't match any app field.
If a CSV column doesn't clearly match any app field, omit it.`;

    const userPrompt = `CSV Headers: ${headers.join(", ")}

Sample data (first 3 rows):
${sampleRows}

Available app fields:
${APP_FIELDS.map(f => `- ${f.field}: ${f.description}`).join("\n")}

Map each CSV column to the most appropriate app field.`;

    // Call Gemini via Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";

    // Parse JSON from AI response (strip markdown fences if any)
    let mapping: Record<string, string> = {};
    try {
      const cleaned = rawContent.replace(/```json?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      mapping = parsed.mapping || parsed;
    } catch {
      console.error("Failed to parse AI mapping response:", rawContent);
      return new Response(JSON.stringify({ error: "AI returned an invalid mapping. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI-generated mapping:", JSON.stringify(mapping));

    // ── Apply mapping to all rows and upsert into DB ──
    let newVehicles = 0;
    let updatedVehicles = 0;
    let skipped = 0;

    // Pre-fetch existing VINs for this dealer to detect new vs updated
    const dbQuery = supabase.from("vehicles").select("vin");
    if (dealerId) dbQuery.eq("dealer_id", dealerId);
    const { data: dbVehicles } = await dbQuery;
    const existingVins = new Set((dbVehicles || []).map((v: any) => v.vin));

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
        ...(dealerId ? { dealer_id: dealerId } : {}),
      };

      const isNew = !existingVins.has(mapped.vin);

      // Use upsert with onConflict:'vin' to handle duplicates gracefully
      const { error } = await supabase
        .from("vehicles")
        .upsert(record, { onConflict: "vin", ignoreDuplicates: false });

      if (!error) {
        if (isNew) newVehicles++;
        else updatedVehicles++;
      } else {
        console.error(`Upsert failed for VIN ${mapped.vin}:`, error.message);
      }
    }

    // ── Log the run ──
    await supabase.from("ingestion_logs").insert({
      source: file.name,
      feed_type: "CSV (AI-Mapped)",
      vehicles_scanned: rows.length,
      new_vehicles: newVehicles,
      marked_sold: 0,
      images_fetched: 0,
      status: "success",
      message: `AI auto-mapped ${Object.keys(mapping).length} columns · ${newVehicles} new · ${updatedVehicles} updated · ${skipped} skipped (no VIN)`,
      dealer_id: dealerId,
    });

    return new Response(JSON.stringify({
      success: true,
      mapping,
      vehicles_scanned: rows.length,
      new_vehicles: newVehicles,
      updated_vehicles: updatedVehicles,
      skipped,
      mapped_columns: Object.keys(mapping).length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("ai-csv-map error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
