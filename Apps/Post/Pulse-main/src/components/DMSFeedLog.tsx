import { useState, useEffect } from "react";
import { Database, FileText, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedEntry {
  id: string;
  timestamp: string;
  source: string;
  type: "XML" | "CSV";
  vehiclesFound: number;
  newVehicles: number;
  status: "success" | "warning" | "error";
  message: string;
}

interface DMSFeedLogProps {
  onClose: () => void;
  dealerId: string;
}

export function DMSFeedLog({ onClose, dealerId }: DMSFeedLogProps) {
  const [feeds, setFeeds] = useState<FeedEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadLogs = async () => {
    setRefreshing(true);
    setError(null);
    try {
      let query = supabase
        .from("pulse_ingestion_logs")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (startDate) query = query.gte("created_at", new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query = query.lt("created_at", end.toISOString());
      }
      const { data, error: queryError } = await query;
      if (queryError) { setError(queryError.message); return; }
      const mapped: FeedEntry[] = (data ?? []).map((row: any) => ({
        id: String(row.id),
        timestamp: row.created_at,
        source: row.source ?? "Unknown Source",
        type: (row.file_type ?? "XML") as "XML" | "CSV",
        vehiclesFound: row.vehicles_found ?? 0,
        newVehicles: row.new_vehicles ?? 0,
        status: (row.status ?? "success") as "success" | "warning" | "error",
        message: row.message ?? "",
      }));
      setFeeds(mapped);
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [dealerId]);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  };

  const statusIcon = (status: FeedEntry["status"]) => {
    if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    if (status === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
    return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-2xl mx-4 p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">DMS Feed Ingestion Log</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadLogs()} disabled={refreshing} className="flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">x</button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs text-muted-foreground shrink-0">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md bg-secondary border border-border px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <label className="text-xs text-muted-foreground shrink-0">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md bg-secondary border border-border px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={() => { setLoading(true); loadLogs(); }} disabled={refreshing} className="rounded-md bg-secondary border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Apply</button>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); setLoading(true); setTimeout(loadLogs, 0); }} className="rounded-md bg-secondary border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {loading && !refreshing ? (
            <div className="flex items-center justify-center py-10 text-xs text-muted-foreground gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading feed logs...</div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>
          ) : feeds.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">No log entries found.</div>
          ) : (
            feeds.map((feed) => (
              <div key={feed.id} className="flex items-start gap-3 rounded-lg bg-secondary/50 border border-border p-3">
                {statusIcon(feed.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{feed.source}</span>
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{feed.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{feed.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60">
                    <span>{feed.vehiclesFound} vehicles scanned</span>
                    {feed.newVehicles > 0 && <span className="text-success">+{feed.newVehicles} new</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 shrink-0">
                  <Clock className="h-3 w-3" />{formatTime(feed.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
