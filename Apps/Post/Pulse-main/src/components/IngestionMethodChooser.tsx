import { useState, useEffect } from "react";
import { Database, Globe, FileText, Loader2, CheckCircle2, Play, ExternalLink, Clock, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    if (activeDealerId) loadSettings();
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

  const selectMethod = async (m: IngestionMethod) => {
    setMethod(m);
    // Persist to dealer_settings
    const { error } = await supabase
      .from("dealer_settings")
      .update({ ingestion_method: m })
      .eq("dealership_id", activeDealerId);

    if (error) {
      // If no row exists yet, try upsert
      await supabase.from("dealer_settings").upsert({
        dealership_id: activeDealerId,
        ingestion_method: m,
      });
    }
  };

  const saveScraperUrl = async () => {
    if (!scraperUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    try {
      new URL(scraperUrl.trim());
    } catch {
      toast.error("Please enter a valid URL (including https://)");
      return;
    }

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

  const runScraper = async () => {
    if (!scraperUrl.trim()) {
      toast.error("Please enter and save a URL first");
      return;
    }

    setScraping(true);
    setScraperStatus("scraping");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-inventory", {
        body: { url: scraperUrl.trim() },
      });

      if (error) {
        toast.error("Scrape failed", { description: error.message });
        setScraperStatus("error");
        return;
      }

      if (data?.error) {
        toast.error("Scrape failed", { description: data.error });
        setScraperStatus("error");
        return;
      }

      setScraperStatus("idle");
      setScraperLastRun(new Date().toISOString());
      setScraperVehicleCount(data.vehicles_found || 0);
      toast.success("Scrape complete!", {
        description: `${data.vehicles_found} found · ${data.new_vehicles} new · ${data.updated_vehicles} updated · ${data.marked_sold} marked sold`,
      });
    } catch (err: any) {
      toast.error("Scrape failed", { description: err.message });
      setScraperStatus("error");
    } finally {
      setScraping(false);
    }
  };

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
              Enter the URL of your dealership's inventory page. Our AI will extract vehicle data including year, make, model, price, mileage, and photos.
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
                />
                <button
                  onClick={saveScraperUrl}
                  disabled={savingUrl}
                  className="shrink-0 flex items-center gap-1.5 rounded-md bg-secondary border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {savingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>

            {/* Status bar */}
            {scraperLastRun && (
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

            {/* Run button */}
            <button
              onClick={runScraper}
              disabled={scraping || !scraperUrl.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {scraping ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Scraping — this may take a minute...</>
              ) : (
                <><Play className="h-4 w-4" /> Run Scraper Now</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* DMS + CSV both show the existing DMSIntegrationWizard */}
      {(method === "dms" || method === "csv") && <DMSIntegrationWizard />}
    </div>
  );
}
