import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vehicle, tone, dealer_id } = await req.json();

    // ── Kill Switch: check dealer status ──
    if (dealer_id) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: dealerCheck } = await sb.from("dealerships").select("status").eq("id", dealer_id).single();
      if (dealerCheck && dealerCheck.status !== "active") {
        return new Response(JSON.stringify({ error: "Account is inactive. AI generation disabled by admin." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneInstructions: Record<string, string> = {
      professional: "Write in a professional, trust-building tone. Highlight reliability, value proposition, and key specs. Use proper grammar and polished business language.",
      aggressive: "Write in an aggressive, high-urgency sales tone. Use phrases like 'WON'T LAST', 'BELOW MARKET', 'CALL NOW'. Create FOMO and extreme urgency. Use CAPS strategically.",
      emoji: "Write in a fun, emoji-heavy tone. Use lots of relevant emojis (🔥🚗💨💰✅⚡🏎️). Make it eye-catching and social-media friendly. Keep energy incredibly high!",
    };

    // Compliance check: restricted words that trigger Facebook shadow-bans
    const RESTRICTED_PHRASES = [
      "0% down", "zero down", "no money down", "guaranteed approval",
      "everyone approved", "no credit check", "buy here pay here",
      "no credit needed", "bad credit ok", "we finance everyone",
      "guaranteed financing", "instant approval", "100% approval",
      "bankruptcy ok", "repos ok", "first time buyer program",
    ];

    const systemPrompt = `You are a top-tier automotive digital marketer. Create a high-conversion Facebook Marketplace listing.

Structure it with:
1. 🏷️ Catchy Headline (one punchy line)
2. ✅ Key Features Bullet Points (5-7 highlights)
3. 📊 Condition & Mileage Callout (build trust)
4. 📞 Strong Call to Action (CTA) to message the dealership

${toneInstructions[tone] || toneInstructions.professional}

COMPLIANCE RULES (CRITICAL - Facebook will shadow-ban listings that violate these):
- NEVER use any of these phrases: ${RESTRICTED_PHRASES.join(", ")}
- NEVER make financing promises or guarantees
- NEVER mention specific interest rates or payment amounts
- DO NOT promise credit approval of any kind
- Focus on the VEHICLE, not financing terms

Rules:
- Keep it under 250 words
- Include the vehicle specs naturally
- Do NOT include the price (dealer adds separately)
- Format for Facebook Marketplace readability with line breaks
- Make every word count for conversion`;

    const userPrompt = `Generate a Facebook Marketplace listing for:
Year: ${vehicle.year}
Make: ${vehicle.make}
Model: ${vehicle.model}
Trim: ${vehicle.trim || "Base"}
Mileage: ${vehicle.mileage?.toLocaleString() || "N/A"} miles
Exterior Color: ${vehicle.exterior_color || "N/A"}
VIN: ${vehicle.vin}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "Failed to generate description.";

    // Post-generation compliance scan
    const complianceFlags: string[] = [];
    for (const phrase of RESTRICTED_PHRASES) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        complianceFlags.push(phrase);
        content = content.replace(new RegExp(phrase, "gi"), "[REMOVED]");
      }
    }

    return new Response(JSON.stringify({
      description: content,
      compliance: {
        passed: complianceFlags.length === 0,
        flagged_phrases: complianceFlags,
        message: complianceFlags.length > 0
          ? `⚠️ Removed ${complianceFlags.length} restricted phrase(s) to prevent Facebook shadow-ban.`
          : "✅ Compliance check passed — no restricted phrases detected.",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
