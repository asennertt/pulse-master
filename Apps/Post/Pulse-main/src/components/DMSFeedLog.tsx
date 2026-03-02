import { useState, useEffect } from "react";
import { Database, FileText, RefreshCw, CheckCircle2, AlertTriangle, Clock, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedEntry {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  vehiclesFound: number;
  newVehicles: number;
  markedSold: number;
  status: "success" | "warning" | "error";
  message: string;
}

interface DMSFeedLogProps {
  onClose: () => void;
}

export function DMSFeedLog({ onClose }: DMSFeedLogProps) {
  const [feeds, setFeeds] = useState<FeedEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from("ingestion_logs")
        .select("id, source, feed_type, vehicles_scanned, new_vehicles, marked_sold, status, message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching ingestion logs:", error);
        return;
      }

      if (data) {
        const mapped: FeedEntry[] = data.map((row: any) => ({
          id: row.id,
          timestamp: row.created_at,
          source: row.source ?? "Unknown",
          type: row.feed_type ?? "CSV",
          vehiclesFound: row.vehicles_scanned ?? 0,
          newVehicles: row.new_vehicles ?? 0,
          markedSold: row.marked_sold ?? 0,
          status: row.status === "error" ? "error" : row.status === "warning" ? "warning" : "success",
          message: row.message ?? "",
        }));
        setFeeds(mapped);
      }
    } catch (err) {
      console.error("Error fetching feed log:", err);
    }
  };

  useEffect(() => {
    fetchFeeds().finally(() => setInitialLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFeeds();
    setRefreshing(false);
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Loading feed log...</p>
            </div>
          ) : feeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No ingestion logs yet</p>
              <p className="text-xs mt-1">Feed entries will appear here after your first DMS sync or CSV upload.</p>
            </div>
          ) : (
            feeds.map((feed) => (
              <div key={feed.id} className="flex items-start gap-3 rounded-lg bg-secondary/50 border border-border p-3">
                {statusIcon(feed.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{feed.source}</span>
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {feed.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{feed.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60">
                    <span>{feed.vehiclesFound} vehicles scanned</span>
                    {feed.newVehicles > 0 && (
                      <span className="text-success">+{feed.newVehicles} new</span>
                    )}
                    {feed.markedSold > 0 && (
                      <span className="text-warning">{feed.markedSold} sold</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatTime(feed.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
