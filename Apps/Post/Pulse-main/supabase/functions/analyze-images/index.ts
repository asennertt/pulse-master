import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { vehicle_id } = body;

    if (!vehicle_id || typeof vehicle_id !== "string") {
      return new Response(
        JSON.stringify({ error: "vehicle_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use service role for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch the vehicle
    const { data: vehicle, error: vehicleErr } = await supabase
      .from("vehicles")
      .select("id, images")
      .eq("id", vehicle_id)
      .single();

    if (vehicleErr || !vehicle) {
      return new Response(
        JSON.stringify({ error: "Vehicle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const images: string[] = vehicle.images || [];
    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Limit to 20 images for efficiency
    const imagesToAnalyze = images.slice(0, 20);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build multi-image Gemini request
    const parts: Array<{ text?: string; inline_data?: never; file_data?: never } | { text?: never; image_url?: { url: string } }> = [];

    // Add the instruction text
    parts.push({
      text: `You are analyzing ${imagesToAnalyze.length} vehicle listing photos for a car dealership. For each image (numbered 1 to ${imagesToAnalyze.length} in the order provided), return:
- quality_score: 1-10 (10 = professional quality, consider lighting, resolution, composition, clarity)
- flags: array of applicable flags from ["bordered", "watermarked", "stock_photo", "blurry", "interior", "exterior", "engine", "damage"]
  - bordered: image has a dealer overlay, border, or frame around it
  - watermarked: has watermark text overlay
  - stock_photo: appears to be a stock/generic photo, not of the actual vehicle
  - blurry: image is blurry or very low quality
  - interior: it's an interior/cabin shot
  - exterior: it's an exterior shot
  - engine: engine bay shot
  - damage: shows visible damage
- hero_candidate: true if this would make a great main listing photo (clean exterior 3/4 angle shot, no borders/watermarks, good lighting, shows the whole vehicle attractively)
- reason: brief 1-line explanation of your assessment

Return ONLY a valid JSON array with exactly ${imagesToAnalyze.length} objects, one per image in order. No markdown, no code fences, just the JSON array.

Example for 2 images:
[{"quality_score": 8, "flags": ["exterior"], "hero_candidate": true, "reason": "Clean front 3/4 shot, good lighting"},{"quality_score": 4, "flags": ["interior", "blurry"], "hero_candidate": false, "reason": "Dark interior shot, slightly out of focus"}]`,
    });

    // Build Gemini content parts with image URLs
    const geminiParts: unknown[] = [
      { text: parts[0].text },
    ];

    for (let i = 0; i < imagesToAnalyze.length; i++) {
      geminiParts.push({
        text: `Image ${i + 1}:`,
      });
      geminiParts.push({
        file_data: {
          mime_type: "image/jpeg",
          file_uri: imagesToAnalyze[i],
        },
      });
    }

    // Call Gemini 2.0 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: geminiParts,
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response — strip markdown fences if present
    let analysisResults: Array<{
      quality_score: number;
      flags: string[];
      hero_candidate: boolean;
      reason: string;
    }>;

    try {
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      analysisResults = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: rawText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build the image_scores array, pairing each URL with its analysis
    const imageScores = imagesToAnalyze.map((url, i) => {
      const result = analysisResults[i] || {
        quality_score: 5,
        flags: [],
        hero_candidate: false,
        reason: "Analysis unavailable",
      };
      return {
        url,
        quality_score: Math.max(1, Math.min(10, Math.round(result.quality_score))),
        flags: Array.isArray(result.flags) ? result.flags : [],
        hero_candidate: Boolean(result.hero_candidate),
        reason: result.reason || "",
      };
    });

    // Store results on the vehicle
    const { error: updateErr } = await supabase
      .from("vehicles")
      .update({ image_scores: imageScores })
      .eq("id", vehicle_id);

    if (updateErr) {
      console.error("Failed to save image_scores:", updateErr);
    }

    return new Response(
      JSON.stringify({ success: true, image_scores: imageScores }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
