import { useState, useEffect } from "react";
import { Database, FileText, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

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

const generateMockFeeds = (): FeedEntry[] => {
  const now = Date.now();
  return [
    { id: "1", timestamp: new Date(now - 300000).toISOString(), source: "DealerTrack DMS", type: "XML", vehiclesFound: 47, newVehicles: 3, status: "success", message: "Full inventory sync completed" },
    { id: "2", timestamp: new Date(now - 1800000).toISOString(), source: "vAuto Feed", type: "CSV", vehiclesFound: 45, newVehicles: 0, status: "success", message: "No new vehicles detected" },
    { id: "3", timestamp: new Date(now - 3600000).toISOString(), source: "DealerTrack DMS", type: "XML", vehiclesFound: 46, newVehicles: 1, status: "warning", message: "1 VIN failed validation — skipped" },
    { id: "4", timestamp: new Date(now - 7200000).toISOString(), source: "Homenet Feed", type: "CSV", vehiclesFound: 44, newVehicles: 2, status: "success", message: "2 new units added to inventory" },
    { id: "5", timestamp: new Date(now - 14400000).toISOString(), source: "DealerTrack DMS", type: "XML", vehiclesFound: 0, newVehicles: 0, status: "error", message: "Connection timeout — retrying in 30m" },
    { id: "6", timestamp: new Date(now - 21600000).toISOString(), source: "vAuto Feed", type: "CSV", vehiclesFound: 43, newVehicles: 5, status: "success", message: "5 new units ingested successfully" },
  ];
};

interface DMSFeedLogProps {
  onClose: () => void;
}

export function DMSFeedLog({ onClose }: DMSFeedLogProps) {
  const [feeds, setFeeds] = useState<FeedEntry[]>(generateMockFeeds());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setFeeds(generateMockFeeds());
      setRefreshing(false);
    }, 1200);
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
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
          {feeds.map((feed) => (
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
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 shrink-0">
                <Clock className="h-3 w-3" />
                {formatTime(feed.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
