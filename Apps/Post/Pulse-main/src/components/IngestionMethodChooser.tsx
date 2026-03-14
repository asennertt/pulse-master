import { useState, useEffect, useRef, useCallback } from "react";
import { Database, Globe, FileText, Loader2, CheckCircle2, Play, Clock, AlertTriangle, ImageIcon, Trash2, Unplug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { toast } from "sonner";
import { DMSIntegrationWizard } from "@/components/DMSIntegrationWizard";

type IngestionMethod = "dms" | "scraper" | "csv";

const inputCls = "w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

const METHOD_OPTIONS: { key: IngestionMethod; label: string; description: string; icon: React.ElementType }[] = [
  {
    key: "dms",
    label: "DMS / SFTP",
    description: "Automated sync from your dealer management system via SFTP pull.",
    icon: Database,
  },
  {
    key: "scraper",
    label: "Website Scraper",
    description: "AI-powered scraper that reads your dealer website inventory page.",
    icon: Globe,
  },
  {
    key: "csv",
    label: "CSV Upload",
    description: "Manually upload a CSV export from your DMS or spreadsheet.",
    icon: FileText,
  },
];

// ── VIN extraction helper ─────────────────────────────────
function extractVinFromDetailHtml(html: string): string | null {
  // Pattern 1: CarsForSale-style "js-vin-message" class
  const jsVinMatch = html.match(/js-vin-message[^>]*>\s*([A-HJ-NPR-Z0-9]{17})\s*</i);
  if (jsVinMatch) return jsVinMatch[1].toUpperCase();

  // Pattern 2: Label "VIN" followed by a 17-char value nearby
  const vinLabelMatch = html.match(/VIN\s*(?:<[^>]*>\s*)*\s*(?:#?:?\s*)(?:<[^>]*>\s*)*([A-HJ-NPR-Z0-9]{17})/i);
  if (vinLabelMatch) return vinLabelMatch[1].toUpperCase();

  // Pattern 3: data-vin attribute
  const dataVinMatch = html.match(/data-vin=["']([A-HJ-NPR-Z0-9]{17})["']/i);
  if (dataVinMatch) return dataVinMatch[1].toUpperCase();

  // Pattern 4: JSON-LD structured data with VIN
  const jsonLdMatch = html.match(/"vin"\s*:\s*"([A-HJ-NPR-Z0-9]{17})"/i);
  if (jsonLdMatch) return jsonLdMatch[1].toUpperCase();

  // Pattern 5: Meta tag with VIN
  const metaVinMatch = html.match(/meta[^>]+(?:name|property)=["'][^"]*vin[^"]*["'][^>]+content=["']([A-HJ-NPR-Z0-9]{17})["']/i);
  if (metaVinMatch) return metaVinMatch[1].toUpperCase();

  // Pattern 6: Standalone 17-char VIN pattern near a "VIN" label (broader search)
  const vinSection = html.match(/VIN[^]*?([A-HJ-NPR-Z0-9]{17})/i);
  if (vinSection) {
    // Verify it looks like a real VIN (not a hash or random string)
    const candidate = vinSection[1].toUpperCase();
    // Real VINs have a mix of letters and numbers
    if (/[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
      return candidate;
    }
  }

  // Pattern 7: Any standalone 17-char VIN-like string in the page
  const allVins = html.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g);
  if (allVins) {
    for (const v of allVins) {
      const upper = v.toUpperCase();
      // Filter out things that are clearly not VINs
      if (/^[0-9]+$/.test(upper)) continue; // All numbers
      if (/^[A-Z]+$/.test(upper)) continue; // All letters
      if (/[A-Z]/.test(upper) && /[0-9]/.test(upper)) {
        return upper;
      }
    }
  }

  return null;
}

// ── Image extraction helpers ─────────────────────────────
function extractImagesFromDetailHtml(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Pattern 1: data-lazy attributes (CarsForSale Bootstrap carousel)
  const lazyMatches = html.matchAll(/data-lazy="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi);
  for (const m of lazyMatches) {
    if (!seen.has(m[1])) { seen.add(m[1]); images.push(m[1]); }
  }

  // Pattern 2: data-src attributes (common lazy-load pattern)
  if (images.length === 0) {
    const dataSrcMatches = html.matchAll(/data-src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi);
    for (const m of dataSrcMatches) {
      if (!seen.has(m[1])) { seen.add(m[1]); images.push(m[1]); }
    }
  }

  // Pattern 3: Standard img src inside gallery/carousel containers
  if (images.length === 0) {
    const imgMatches = html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi);
    for (const m of imgMatches) {
      const url = m[1];
      // Filter out tiny icons, logos, tracking pixels
      if (url.includes("logo") || url.includes("icon") || url.includes("pixel") || url.includes("1x1")) continue;
      if (!seen.has(url)) { seen.add(url); images.push(url); }
    }
  }

  // Pattern 4: Background images in style attributes
  if (images.length === 0) {
    const bgMatches = html.matchAll(/background(?:-image)?\s*:\s*url\(['"]?(https?:\/\/[^'")]+\.(jpg|jpeg|png|webp)[^'")]*)/gi);
    for (const m of bgMatches) {
      if (!seen.has(m[1])) { seen.add(m[1]); images.push(m[1]); }
    }
  }

  return images;
}

// List of CORS proxies to try (in order)
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchDetailPage(url: string, useProxy: boolean): Promise<string | null> {
  if (!useProxy) {
    // Direct fetch (will fail with CORS for most cross-origin sites but try anyway)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) return null;
      const text = await res.text();
      if (text.length < 1000 || /captcha|datadome|challenge/i.test(text.slice(0, 500))) return null;
      return text;
    } catch {
      return null;
    }
  }

  // Try each CORS proxy until one works
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 1000 || /captcha|datadome|challenge/i.test(text.slice(0, 500))) continue;
      return text;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Progress bar component ───────────────────────────────
interface ScrapeProgress {
  phase: "idle" | "inventory" | "images" | "saving" | "done" | "error";
  percent: number;
  message: string;
  detail?: string;
}

function ScrapeProgressBar({ progress }: { progress: ScrapeProgress }) {
  if (progress.phase === "idle") return null;

  const phaseColors: Record<string, string> = {
    inventory: "bg-blue-500",
    images: "bg-violet-500",
    saving: "bg-emerald-500",
    done: "bg-emerald-500",
    error: "bg-destructive",
  };

  const phaseIcons: Record<string, React.ReactNode> = {
    inventory: <Globe className="h-3.5 w-3.5" />,
    images: <ImageIcon className="h-3.5 w-3.5" />,
    saving: <Database className="h-3.5 w-3.5" />,
    done: <CheckCircle2 className="h-3.5 w-3.5" />,
    error: <AlertTriangle className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Phase indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          {progress.phase !== "done" && progress.phase !== "error" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          {(progress.phase === "done" || progress.phase === "error") && phaseIcons[progress.phase]}
          {progress.message}
        </div>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
          {Math.round(progress.percent)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${phaseColors[progress.phase] || "bg-primary"}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Detail text */}
      {progress.detail && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{progress.detail}</p>
      )}

      {/* Phase steps */}
      <div className="flex items-center gap-1 pt-1">
        {["inventory", "images", "saving"].map((phase, i) => {
          const phases = ["inventory", "images", "saving"];
          const currentIdx = phases.indexOf(progress.phase);
          const isDone = progress.phase === "done" || i < currentIdx;
          const isCurrent = phase === progress.phase;
          return (
            <div key={phase} className="flex items-center gap-1">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                isDone ? "bg-emerald-500/15 text-emerald-400" :
                isCurrent ? "bg-primary/15 text-primary" :
                "bg-secondary text-muted-foreground/50"
              }`}>
                {isDone ? <CheckCircle2 className="h-2.5 w-2.5" /> : isCurrent ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                {phase === "inventory" ? "Inventory" : phase === "images" ? "Photos" : "Saving"}
              </div>
              {i < 2 && <div className="w-3 h-px bg-border" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────
export function IngestionMethodChooser() {
  const { activeDealerId } = useAuth();
  const [method, setMethod] = useState<IngestionMethod>("csv");
  const [loading, setLoading] = useState(true);

  // Scraper state
  const [scraperUrl, setScraperUrl] = useState("");
  const [scraperStatus, setScraperStatus] = useState("idle");
  const [scraperLastRun, setScraperLastRun] = useState<string | null>(null);
  const [scraperVehicleCount, setScraperVehicleCount] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress>({ phase: "idle", percent: 0, message: "" });
  const abortRef = useRef(false);

  // Disconnect state
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<IngestionMethod | null>(null);
  const [sourceVehicleCounts, setSourceVehicleCounts] = useState<Record<string, number>>({ scraper: 0, csv: 0, dms: 0 });

  useEffect(() => {
    if (activeDealerId) {
      loadSettings();
      loadSourceCounts();
    }
  }, [activeDealerId]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("dealer_settings")
      .select("ingestion_method, scraper_url, scraper_status, scraper_last_run, scraper_vehicle_count")
      .eq("dealership_id", activeDealerId)
      .maybeSingle();

    if (data) {
      setMethod((data.ingestion_method as IngestionMethod) || "csv");
      setScraperUrl(data.scraper_url || "");
      setScraperStatus(data.scraper_status || "idle");
      setScraperLastRun(data.scraper_last_run || null);
      setScraperVehicleCount(data.scraper_vehicle_count || 0);
    }
    setLoading(false);
  };

  const loadSourceCounts = async () => {
    const counts: Record<string, number> = { scraper: 0, csv: 0, dms: 0 };
    for (const src of ["scraper", "csv", "dms"] as const) {
      if (src === "csv") {
        // CSV vehicles may have source="csv" or source=null (legacy imports)
        const { count: csvCount } = await supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .or(`dealer_id.eq.${activeDealerId},dealership_id.eq.${activeDealerId}`)
          .eq("source", "csv");
        const { count: nullCount } = await supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .or(`dealer_id.eq.${activeDealerId},dealership_id.eq.${activeDealerId}`)
          .is("source", null);
        counts[src] = (csvCount || 0) + (nullCount || 0);
      } else {
        const { count } = await supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .or(`dealer_id.eq.${activeDealerId},dealership_id.eq.${activeDealerId}`)
          .eq("source", src);
        counts[src] = count || 0;
      }
    }
    setSourceVehicleCounts(counts);
  };

  const disconnectSource = async (source: IngestionMethod) => {
    const sourceKey = source === "scraper" ? "scraper" : source;
    setDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("disconnect-source", {
        body: { source: sourceKey },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const deleted = data?.deleted_count || 0;
      toast.success(`Disconnected ${source === "dms" ? "DMS / SFTP" : source === "scraper" ? "Website Scraper" : "CSV"}`, {
        description: `${deleted} vehicle${deleted !== 1 ? "s" : ""} removed`,
      });

      // Reset local state
      if (source === "scraper") {
        setScraperUrl("");
        setScraperStatus("idle");
        setScraperLastRun(null);
        setScraperVehicleCount(0);
        setProgress({ phase: "idle", percent: 0, message: "" });
      }

      setShowDisconnectConfirm(null);
      loadSourceCounts();
    } catch (err: any) {
      toast.error("Disconnect failed", { description: err.message });
    } finally {
      setDisconnecting(false);
    }
  };

  const selectMethod = async (m: IngestionMethod) => {
    setMethod(m);
    const { error } = await supabase
      .from("dealer_settings")
      .update({ ingestion_method: m })
      .eq("dealership_id", activeDealerId);

    if (error) {
      await supabase.from("dealer_settings").upsert({
        dealership_id: activeDealerId,
        ingestion_method: m,
      });
    }
  };

  const saveScraperUrl = async () => {
    if (!scraperUrl.trim()) { toast.error("Please enter a URL"); return; }
    try { new URL(scraperUrl.trim()); } catch { toast.error("Please enter a valid URL (including https://)"); return; }

    setSavingUrl(true);
    const { error } = await supabase
      .from("dealer_settings")
      .update({ scraper_url: scraperUrl.trim() })
      .eq("dealership_id", activeDealerId);

    if (error) {
      await supabase.from("dealer_settings").upsert({
        dealership_id: activeDealerId,
        scraper_url: scraperUrl.trim(),
      });
    }

    setSavingUrl(false);
    toast.success("Scraper URL saved");
  };

  // ── Main scrape flow ─────────────────────────────────
  const runScraper = useCallback(async () => {
    if (!scraperUrl.trim()) { toast.error("Please enter and save a URL first"); return; }
    const url = scraperUrl.trim();

    setScraping(true);
    setScraperStatus("scraping");
    abortRef.current = false;

    try {
      // ═══════════════════════════════════════════════════
      // PHASE 1: Fetch inventory pages (0-20%)
      // ═══════════════════════════════════════════════════
      setProgress({ phase: "inventory", percent: 2, message: "Scanning inventory pages...", detail: "Fetching page 1..." });

      // Try server-side first (skipDetailFetch so we get raw vehicles back for image enrichment)
      const { data: serverData, error: serverError } = await supabase.functions.invoke("scrape-inventory", {
        body: { url, skipDetailFetch: true },
      });

      let vehiclesFromEdge: any[] = [];
      let pagesScraped = 0;
      let useClientFallback = false;

      // Detect server-side blocking — trigger client-side fallback
      const serverErrorMsg = serverData?.error || serverError?.message || "";
      const needsClientFallback = serverErrorMsg.includes("Failed to fetch page")
        || serverErrorMsg.includes("502")
        || serverErrorMsg.includes("non-2xx")
        || serverErrorMsg.includes("blocking")
        || (serverError && !serverData?.vehicles_raw);

      if (needsClientFallback) {
        useClientFallback = true;
        setProgress({ phase: "inventory", percent: 5, message: "Scanning inventory pages...", detail: "Server blocked — using your browser to fetch pages..." });

        // Client-side: fetch all inventory pages
        const proxyBase = "https://api.allorigins.win/raw?url=";
        let page1Html: string | null = null;

        // Try proxy first, then direct
        page1Html = await fetchDetailPage(url, true);
        if (!page1Html) page1Html = await fetchDetailPage(url, false);

        if (!page1Html || page1Html.length < 500) {
          throw new Error("Could not fetch inventory page — this site has bot protection (DataDome/Cloudflare). Try using a CSV upload instead, or contact support for help.");
        }

        const allPages: string[] = [page1Html];
        const pageMatch = page1Html.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
        const totalPages = pageMatch ? Math.min(parseInt(pageMatch[2]), 10) : 1;

        if (totalPages > 1) {
          setProgress({ phase: "inventory", percent: 8, message: "Scanning inventory pages...", detail: `Found ${totalPages} pages — fetching all...` });
          for (let p = 2; p <= totalPages; p++) {
            if (abortRef.current) break;
            const sep = url.includes("?") ? "&" : "?";
            // Detect page param from HTML
            let pageParam = "page";
            if (/PageNumber/i.test(page1Html!)) pageParam = "PageNumber";
            else if (/[?&]Page=/i.test(page1Html!)) pageParam = "Page";

            const pageUrl = `${url}${sep}${pageParam}=${p}`;
            const html = await fetchDetailPage(pageUrl, true) || await fetchDetailPage(pageUrl, false);
            if (html && html.length > 500) allPages.push(html);
            setProgress({ phase: "inventory", percent: 8 + (p / totalPages) * 10, message: "Scanning inventory pages...", detail: `Fetched page ${p} of ${totalPages}` });
          }
        }

        pagesScraped = allPages.length;
        setProgress({ phase: "inventory", percent: 18, message: "Extracting vehicle data...", detail: `Processing ${pagesScraped} pages with AI...` });

        // Send to edge function for AI extraction
        const bodyPayload = allPages.length > 1
          ? { url, htmlPages: allPages }
          : { url, html: page1Html };

        const { data: retryData, error: retryError } = await supabase.functions.invoke("scrape-inventory", {
          body: { ...bodyPayload, skipDetailFetch: true },
        });

        if (retryError) throw new Error(retryError.message);
        if (retryData?.error) throw new Error(retryData.error);

        vehiclesFromEdge = retryData?.vehicles_raw || [];
        pagesScraped = retryData?.pages_scraped || pagesScraped;
      } else if (serverError) {
        throw new Error(serverError.message);
      } else if (serverData?.error) {
        throw new Error(serverData.error);
      } else {
        // Server fetch worked — get the raw vehicles before image enrichment
        vehiclesFromEdge = serverData?.vehicles_raw || [];
        pagesScraped = serverData?.pages_scraped || 1;
      }

      // If the edge function already saved everything (no vehicles_raw = old behavior / no detail URLs)
      if (!vehiclesFromEdge || vehiclesFromEdge.length === 0) {
        // The edge function handled everything including saving
        setScraperStatus("idle");
        setScraperLastRun(new Date().toISOString());
        setScraperVehicleCount(serverData?.vehicles_found || 0);
        const pages = (serverData?.pages_scraped || 1) > 1 ? ` · ${serverData.pages_scraped} pages` : "";
        setProgress({ phase: "done", percent: 100, message: "Scrape complete!", detail: `${serverData?.vehicles_found || 0} vehicles · ${serverData?.new_vehicles || 0} new · ${serverData?.updated_vehicles || 0} updated${pages}` });
        toast.success("Scrape complete!", {
          description: `${serverData?.vehicles_found || 0} found · ${serverData?.new_vehicles || 0} new · ${serverData?.updated_vehicles || 0} updated · ${serverData?.marked_sold || 0} marked sold${pages}`,
        });
        return;
      }

      setProgress({ phase: "inventory", percent: 20, message: "Inventory scanned!", detail: `Found ${vehiclesFromEdge.length} vehicles across ${pagesScraped} pages. Now fetching photos...` });

      // ═══════════════════════════════════════════════════
      // PHASE 2: Fetch detail pages for full image galleries (20-85%)
      // ═══════════════════════════════════════════════════
      setProgress({ phase: "images", percent: 22, message: "Fetching vehicle photos...", detail: `0 of ${vehiclesFromEdge.length} vehicles processed` });

      const detailUrls = vehiclesFromEdge
        .map((v: any, i: number) => ({ index: i, url: v.detail_url }))
        .filter((d: any) => d.url && d.url.startsWith("http"));

      let processedCount = 0;
      let imagesFound = 0;
      let vinsFound = 0;
      const BATCH_SIZE = 3; // Fetch 3 detail pages at a time to avoid overwhelming

      for (let batch = 0; batch < detailUrls.length; batch += BATCH_SIZE) {
        if (abortRef.current) break;

        const batchItems = detailUrls.slice(batch, batch + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batchItems.map(async (item: any) => {
            // Try proxy first for sites with bot protection, then direct
            let html = await fetchDetailPage(item.url, true);
            if (!html) html = await fetchDetailPage(item.url, false);
            let imgCount = 0;
            let foundVin = false;
            if (html) {
              // Extract images
              const imgs = extractImagesFromDetailHtml(html, item.url);
              if (imgs.length > 0) {
                vehiclesFromEdge[item.index].images = imgs;
                imgCount = imgs.length;
              }
              // Extract real VIN from detail page
              const vin = extractVinFromDetailHtml(html);
              if (vin) {
                vehiclesFromEdge[item.index].vin = vin;
                foundVin = true;
              }
            }
            return { imgCount, foundVin };
          })
        );

        for (const result of batchResults) {
          processedCount++;
          if (result.status === "fulfilled") {
            imagesFound += result.value.imgCount;
            if (result.value.foundVin) vinsFound++;
          }
        }

        const pct = 22 + (processedCount / detailUrls.length) * 63;
        setProgress({
          phase: "images",
          percent: Math.min(pct, 85),
          message: "Fetching vehicle details & photos...",
          detail: `${processedCount} of ${detailUrls.length} vehicles · ${imagesFound} photos · ${vinsFound} VINs found`,
        });

        // Small delay between batches to be polite to the server
        if (batch + BATCH_SIZE < detailUrls.length) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      setProgress({ phase: "images", percent: 85, message: "Details collected!", detail: `${imagesFound} photos · ${vinsFound} VINs across ${processedCount} vehicles` });

      // ═══════════════════════════════════════════════════
      // PHASE 3: Save enriched vehicles to database (85-100%)
      // ═══════════════════════════════════════════════════
      setProgress({ phase: "saving", percent: 87, message: "Saving to database...", detail: `Uploading ${vehiclesFromEdge.length} vehicles with photos...` });

      const { data: saveData, error: saveError } = await supabase.functions.invoke("scrape-inventory", {
        body: { url, vehiclesEnriched: vehiclesFromEdge, pagesScraped },
      });

      if (saveError) throw new Error(saveError.message);
      if (saveData?.error) throw new Error(saveData.error);

      setScraperStatus("idle");
      setScraperLastRun(new Date().toISOString());
      setScraperVehicleCount(saveData?.vehicles_found || vehiclesFromEdge.length);

      const pages = pagesScraped > 1 ? ` · ${pagesScraped} pages` : "";
      setProgress({
        phase: "done",
        percent: 100,
        message: "Scrape complete!",
        detail: `${saveData?.vehicles_found || vehiclesFromEdge.length} vehicles · ${saveData?.new_vehicles || 0} new · ${saveData?.updated_vehicles || 0} updated · ${imagesFound} photos${pages}`,
      });

      toast.success("Scrape complete!", {
        description: `${saveData?.vehicles_found || vehiclesFromEdge.length} found · ${saveData?.new_vehicles || 0} new · ${saveData?.updated_vehicles || 0} updated · ${imagesFound} photos${pages}`,
      });

    } catch (err: any) {
      setProgress({ phase: "error", percent: progress.percent, message: "Scrape failed", detail: err.message });
      toast.error("Scrape failed", { description: err.message });
      setScraperStatus("error");
    } finally {
      setScraping(false);
    }
  }, [scraperUrl, activeDealerId]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Method selector cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {METHOD_OPTIONS.map((opt) => {
          const active = method === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => selectMethod(opt.key)}
              className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                active
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 bg-secondary/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  active ? "bg-primary/15 border border-primary/30" : "bg-secondary border border-border"
                }`}>
                  <opt.icon className={`h-4.5 w-4.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {opt.label}
                    </span>
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Method-specific content */}
      {method === "scraper" && (
        <div className="space-y-4">
          {/* URL config */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Website Scraper Configuration</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the URL of your dealership's inventory page. Our AI will extract vehicle data including year, make, model, price, mileage, and all photos from every listing.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Inventory Page URL
              </label>
              <div className="flex gap-2">
                <input
                  value={scraperUrl}
                  onChange={(e) => setScraperUrl(e.target.value)}
                  placeholder="https://yourdealership.com/inventory"
                  className={inputCls}
                  disabled={scraping}
                />
                <button
                  onClick={saveScraperUrl}
                  disabled={savingUrl || scraping}
                  className="shrink-0 flex items-center gap-1.5 rounded-md bg-secondary border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {savingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>

            {/* Status bar */}
            {scraperLastRun && !scraping && (
              <div className="flex items-center gap-4 rounded-lg bg-secondary/60 border border-border px-4 py-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Last run: {formatTime(scraperLastRun)}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  {scraperVehicleCount} vehicles found
                </div>
                {scraperStatus === "error" && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Error on last run
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            <ScrapeProgressBar progress={progress} />

            {/* Run button */}
            <button
              onClick={runScraper}
              disabled={scraping || !scraperUrl.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {scraping ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Scraping — please keep this tab open</>
              ) : (
                <><Play className="h-4 w-4" /> Run Scraper Now</>
              )}
            </button>

            {/* Disconnect button */}
            {sourceVehicleCounts.scraper > 0 && (
              <button
                onClick={() => setShowDisconnectConfirm("scraper")}
                disabled={scraping || disconnecting}
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Unplug className="h-4 w-4" />
                Disconnect Scraper ({sourceVehicleCounts.scraper} vehicles)
              </button>
            )}
          </div>
        </div>
      )}

      {/* DMS + CSV both show the existing DMSIntegrationWizard */}
      {(method === "dms" || method === "csv") && (
        <div className="space-y-4">
          <DMSIntegrationWizard />

          {/* Disconnect button for DMS/CSV */}
          {sourceVehicleCounts[method] > 0 && (
            <div className="glass-card rounded-xl p-4">
              <button
                onClick={() => setShowDisconnectConfirm(method)}
                disabled={disconnecting}
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Unplug className="h-4 w-4" />
                Disconnect {method === "dms" ? "DMS / SFTP" : "CSV"} ({sourceVehicleCounts[method]} vehicles)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Disconnect confirmation dialog ── */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Disconnect {showDisconnectConfirm === "scraper" ? "Website Scraper" : showDisconnectConfirm === "dms" ? "DMS / SFTP" : "CSV Upload"}?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
              <p className="text-sm text-foreground">
                This will permanently delete <span className="font-bold text-destructive">{sourceVehicleCounts[showDisconnectConfirm]} vehicle{sourceVehicleCounts[showDisconnectConfirm] !== 1 ? "s" : ""}</span> imported from this source.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {showDisconnectConfirm === "scraper" && "The scraper URL and all settings will be reset."}
                {showDisconnectConfirm === "dms" && "DMS connection settings will be cleared."}
                {showDisconnectConfirm === "csv" && "All CSV-imported vehicles will be removed."}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDisconnectConfirm(null)}
                disabled={disconnecting}
                className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => disconnectSource(showDisconnectConfirm)}
                disabled={disconnecting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {disconnecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Disconnecting...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Delete All & Disconnect</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
