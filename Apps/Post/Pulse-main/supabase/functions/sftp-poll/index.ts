/**
 * sftp-poll — Pulls the latest inventory feed from SFTPCloud and triggers ingestion.
 *
 * Two modes:
 *  1. WEBHOOK (POST from SFTPCloud event listener) — instant, triggered when DMS uploads a file
 *  2. CRON (GET with ?cron=true header or Supabase scheduled invoke) — daily backup poll
 *
 * Flow:
 *  - Identify the dealer from the SFTP username (stored in dealerships table)
 *  - Download the latest feed file from SFTPCloud via SFTP
 *  - Pass the raw CSV/XML content to the dms-ingest function
 *
 * Required env vars:
 *  - SFTPCLOUD_API_URL  (e.g. https://app.sftpcloud.io/api/v1)
 *  - SFTPCLOUD_API_KEY  (API key from your SFTPCloud account)
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 */

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

// ── Resolve dealer from SFTP username ──────────────
async function getDealerByUsername(
  supabase: any,
  sftpUsername: string
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from("dealerships")
    .select("id, name")
    .eq("sftp_username", sftpUsername)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

// ── Download file content from SFTPCloud via their API ──
async function downloadFromSFTPCloud(
  apiUrl: string,
  apiKey: string,
  sftpUserId: string,
  filePath: string
): Promise<string> {
  // SFTPCloud API: GET /api/v1/users/{userId}/files?path={filePath}
  const url = `${apiUrl}/users/${sftpUserId}/files?path=${encodeURIComponent(filePath)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SFTPCloud download failed (${res.status}): ${errText}`);
  }

  return await res.text();
}

// ── List files in a user's SFTP directory ──
async function listSFTPFiles(
  apiUrl: string,
  apiKey: string,
  sftpUserId: string,
  dirPath = "/"
): Promise<{ name: string; size: number; modTime: string }[]> {
  const url = `${apiUrl}/users/${sftpUserId}/files?path=${encodeURIComponent(dirPath)}&list=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SFTPCloud list failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.files || data || []).map((f: any) => ({
    name: f.name || f.filename,
    size: f.size || f.file_size || 0,
    modTime: f.mod_time || f.modified || f.timestamp || "",
  }));
}

// ── Find the most recent CSV/XML feed file ──
function findLatestFeed(
  files: { name: string; size: number; modTime: string }[]
): { name: string; size: number; modTime: string } | null {
  const feedFiles = files.filter((f) => {
    const lower = f.name.toLowerCase();
    return (
      (lower.endsWith(".csv") ||
        lower.endsWith(".tsv") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".xml")) &&
      f.size > 0
    );
  });

  if (feedFiles.length === 0) return null;

  // Sort by modification time descending — most recent first
  feedFiles.sort(
    (a, b) => new Date(b.modTime).getTime() - new Date(a.modTime).getTime()
  );

  return feedFiles[0];
}

// ═══════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const sftpApiUrl =
    Deno.env.get("SFTPCLOUD_API_URL") || "https://app.sftpcloud.io/api/v1";
  const sftpApiKey = Deno.env.get("SFTPCLOUD_API_KEY") || "";

  try {
    // ── MODE 1: SFTPCloud Webhook ──────────────────────
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";

      // Check if this is an SFTPCloud webhook event
      if (contentType.includes("json")) {
        const webhook = await req.json();

        // SFTPCloud webhook payload
        const sftpUsername = webhook?.user?.name;
        const event = webhook?.event;
        const filePath = webhook?.full_path;
        const status = webhook?.status;
        const fileSize = webhook?.file_size;

        console.log(
          `[sftp-poll] Webhook received: event=${event}, user=${sftpUsername}, file=${filePath}, status=${status}, size=${fileSize}`
        );

        // Only process successful upload/write events
        if (status !== "OK") {
          return json({ skipped: true, reason: "Event status is not OK" });
        }

        // Only process file types we care about
        const lower = (filePath || "").toLowerCase();
        if (
          !lower.endsWith(".csv") &&
          !lower.endsWith(".tsv") &&
          !lower.endsWith(".txt") &&
          !lower.endsWith(".xml")
        ) {
          return json({
            skipped: true,
            reason: "Not a feed file (csv/tsv/txt/xml)",
          });
        }

        if (!sftpUsername) {
          return json({ error: "No SFTP username in webhook payload" }, 400);
        }

        // Look up the dealer
        const dealer = await getDealerByUsername(supabase, sftpUsername);
        if (!dealer) {
          console.error(
            `[sftp-poll] No dealer found for SFTP username: ${sftpUsername}`
          );
          return json(
            { error: `No dealer found for username: ${sftpUsername}` },
            404
          );
        }

        console.log(
          `[sftp-poll] Dealer identified: ${dealer.name} (${dealer.id})`
        );

        // Download the file
        let csvContent: string;
        if (sftpApiKey) {
          // Use SFTPCloud API to download
          const sftpUserId = webhook?.user?.id || sftpUsername;
          csvContent = await downloadFromSFTPCloud(
            sftpApiUrl,
            sftpApiKey,
            sftpUserId,
            filePath
          );
        } else {
          return json(
            { error: "SFTPCLOUD_API_KEY not configured" },
            500
          );
        }

        // Call dms-ingest to process the file
        const { data: ingestResult, error: ingestError } =
          await supabase.functions.invoke("dms-ingest", {
            body: {
              csvContent,
              feedSource: `SFTP: ${filePath.split("/").pop() || "feed"}`,
              feedType: "SFTP (Webhook)",
              dealership_id: dealer.id,
            },
          });

        if (ingestError) {
          console.error("[sftp-poll] Ingestion error:", ingestError);
          return json(
            { error: "Ingestion failed", details: ingestError.message },
            500
          );
        }

        console.log("[sftp-poll] Ingestion complete:", ingestResult);
        return json({ success: true, dealer: dealer.name, ...ingestResult });
      }

      // ── Manual trigger (POST with JSON body) ──────────
      const body = await req.json().catch(() => ({}));
      const { dealer_id, dealership_id } = body;
      const dId = dealership_id || dealer_id;

      if (!dId) {
        return json({ error: "dealership_id is required" }, 400);
      }

      // Look up dealer's SFTP username
      const { data: dealerData } = await supabase
        .from("dealerships")
        .select("id, name, sftp_username")
        .eq("id", dId)
        .single();

      if (!dealerData?.sftp_username) {
        return json(
          { error: "No SFTP credentials configured for this dealer" },
          400
        );
      }

      return await pollDealerFeed(
        supabase,
        sftpApiUrl,
        sftpApiKey,
        dealerData
      );
    }

    // ── MODE 2: Cron / GET — poll ALL dealers ──────────
    if (req.method === "GET") {
      console.log("[sftp-poll] Cron trigger — polling all dealers");

      const { data: dealers } = await supabase
        .from("dealerships")
        .select("id, name, sftp_username")
        .not("sftp_username", "is", null);

      if (!dealers || dealers.length === 0) {
        return json({ message: "No dealers with SFTP credentials" });
      }

      const results: any[] = [];
      for (const dealer of dealers) {
        try {
          const result = await pollDealerFeed(
            supabase,
            sftpApiUrl,
            sftpApiKey,
            dealer
          );
          const resultData = await result.json();
          results.push({ dealer: dealer.name, ...resultData });
        } catch (e: any) {
          console.error(
            `[sftp-poll] Error polling ${dealer.name}:`,
            e.message
          );
          results.push({ dealer: dealer.name, error: e.message });
        }
      }

      return json({ success: true, polled: results.length, results });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e: any) {
    console.error("[sftp-poll] Error:", e);
    return json({ error: e.message || "Unknown error" }, 500);
  }
});

// ── Poll a single dealer's SFTP folder ──────────────
async function pollDealerFeed(
  supabase: any,
  sftpApiUrl: string,
  sftpApiKey: string,
  dealer: { id: string; name: string; sftp_username: string }
): Promise<Response> {
  if (!sftpApiKey) {
    return json({ error: "SFTPCLOUD_API_KEY not configured" }, 500);
  }

  console.log(
    `[sftp-poll] Polling SFTP for ${dealer.name} (user: ${dealer.sftp_username})`
  );

  // List files in the dealer's root directory
  const files = await listSFTPFiles(
    sftpApiUrl,
    sftpApiKey,
    dealer.sftp_username
  );

  console.log(`[sftp-poll] Found ${files.length} files for ${dealer.name}`);

  // Find the most recent feed file
  const latestFeed = findLatestFeed(files);
  if (!latestFeed) {
    console.log(`[sftp-poll] No feed files found for ${dealer.name}`);
    return json({ message: "No feed files found in SFTP directory" });
  }

  console.log(
    `[sftp-poll] Latest feed: ${latestFeed.name} (${latestFeed.size} bytes, modified: ${latestFeed.modTime})`
  );

  // Download the file
  const csvContent = await downloadFromSFTPCloud(
    sftpApiUrl,
    sftpApiKey,
    dealer.sftp_username,
    `/${latestFeed.name}`
  );

  // Pass to dms-ingest
  const { data: ingestResult, error: ingestError } =
    await supabase.functions.invoke("dms-ingest", {
      body: {
        csvContent,
        feedSource: `SFTP: ${latestFeed.name}`,
        feedType: "SFTP (Cron)",
        dealership_id: dealer.id,
      },
    });

  if (ingestError) {
    console.error(
      `[sftp-poll] Ingestion error for ${dealer.name}:`,
      ingestError
    );
    return json(
      {
        error: "Ingestion failed",
        dealer: dealer.name,
        details: ingestError.message,
      },
      500
    );
  }

  console.log(
    `[sftp-poll] Ingestion complete for ${dealer.name}:`,
    ingestResult
  );
  return json({
    success: true,
    dealer: dealer.name,
    file: latestFeed.name,
    ...ingestResult,
  });
}
