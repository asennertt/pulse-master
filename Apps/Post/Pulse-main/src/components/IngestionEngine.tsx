import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { DMSFieldMapper } from "@/components/DMSFieldMapper";
import { Database, RefreshCw, Clock, CheckCircle2, AlertTriangle, Image, Loader2, Settings2, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface IngestionLog {
  id: string;
  source: string;
  feed_type: string;
  vehicles_scanned: number;
  new_vehicles: number;
  marked_sold: number;
  images_fetched: number;
  status: string;
  message: string | null;
  created_at: string;
  dealer_id: string | null;
}

export function IngestionEngine() {
  const { activeDealerId } = useAuth();
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showMapper, setShowMapper] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // FIX P9: track actual vehicle count for dealer instead of summing log rows
  const [totalVehicles, setTotalVehicles] = useState<number | null>(null);

  // FIX: resolve dealer ID via RPC if not already available from auth context
  const [resolvedDealerId, setResolvedDealerId] = useState<string | null>(activeDealerId ?? null);

  useEffect(() => {
    if (activeDealerId) {
      setResolvedDealerId(activeDealerId);
    } else {
      supabase.rpc("get_my_dealership_id").then(({ data }) => {
        if (data) setResolvedDealerId(data as string);
      });
    }
  }, [activeDealerId]);

  useEffect(() => {
    if (resolvedDealerId) {
      loadLogs();
      loadTotalVehicles();
    }
  }, [resolvedDealerId]);

  const loadLogs = async () => {
    if (!resolvedDealerId) return;
    // FIX C9: scope query by dealer_id so only this dealer's logs are returned
    const { data } = await supabase
      .from("pulse_ingestion_logs")
      .select("*")
      .eq("dealer_id", resolvedDealerId)
      .order("created_at", { ascending: false })
      .limit(20);
    setLogs((data as unknown as IngestionLog[]) || []);
    setLoading(false);
  };

  // FIX P9: query the actual vehicle count for the dealer rather than summing new_vehicles across logs
  const loadTotalVehicles = async () => {
    if (!resolvedDealerId) return;
    const { count } = await supabase
      .from("pulse_vehicles")
      .select("*", { count: "exact", head: true })
      .eq("dealer_id", resolvedDealerId);
    setTotalVehicles(count ?? 0);
  };

  const runIngestion = async () => {
    if (!resolvedDealerId) return;
    setRunning(true);
    try {
      // FIX C9: look up the dealer's actual DMS connection instead of hardcoding source/feedType
      const { data: conn } = await supabase
        .from("dms_connections")
        .select("*")
        .eq("dealer_id", resolvedDealerId)
        .single();

      const source = conn?.ftp_host ?? "Unknown Source";
      const feedType = conn?.connection_type ?? "Unknown";

      const { data, error } = await supabase.functions.invoke("dms-ingest", {
        body: { source, feedType, dealer_id: resolvedDealerId },
      });
      if (error) throw error;
      toast.success("Ingestion Complete", {
        description: `${data.new_vehicles} new, ${data.marked_sold} sold, ${data.images_fetched} images fetched`,
      });
      loadLogs();
      loadTotalVehicles();
    } catch (e: any) {
      toast.error("Ingestion failed", { description: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteImport = async (log: IngestionLog) => {
    setDeletingId(log.id);
    try {
      if (log.feed_type.toLowerCase().includes("csv")) {
        const logTime = new Date(log.created_at).getTime();
        const windowMs = 5000;
        const rangeStart = new Date(logTime - windowMs).toISOString();
        const rangeEnd = new Date(logTime + windowMs).toISOString();

        const { count: affectedCount } = await supabase
          .from("pulse_vehicles")
          .select("*", { count: "exact", head: true })
          .eq("dealer_id", log.dealer_id ?? "")
          .filter("created_at", "gte", rangeStart)
          .filter("created_at", "lte", rangeEnd);

        toast.info(`Deleting ${affectedCount ?? 0} vehicle(s) from this import...`);

        const { error: vehicleError } = await supabase
          .from("pulse_vehicles")
          .delete()
          .eq("dealer_id", log.dealer_id ?? "")
          .filter("created_at", "gte", rangeStart)
          .filter("created_at", "lte", rangeEnd);

        if (vehicleError) throw vehicleError;
      }

      const { error: logError } = await supabase
        .from("pulse_ingestion_logs")
        .delete()
        .eq("id", log.id);

      if (logError) throw logError;

      toast.success("Import deleted", {
        description: `Removed "${log.source}" and its vehicles from inventory.`,
      });
      setLogs(prev => prev.filter(l => l.id !== log.id));
      loadTotalVehicles();
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Inventory Ingestion Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Polls DMS feeds every 60 minutes · Reconciles VINs · Scrapes images</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMapper(!showMapper)}
            className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" /> Field Mapper
          </button>
          <button
            onClick={runIngestion}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {running ? "Ingesting..." : "Run Now"}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary glow-text">60m</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Poll Interval</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{logs.length > 0 ? logs[0].vehicles_scanned : "—"}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Scan Count</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{totalVehicles ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{logs.reduce((s, l) => s + l.images_fetched, 0)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Images Fetched</div>
          </div>
        </div>
      </div>

      {showMapper && (
        <div className="glass-card rounded-lg p-4">
          <DMSFieldMapper dealerId={resolvedDealerId ?? undefined} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Ingestion History</h3>
          <button onClick={loadLogs} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No ingestion runs yet. Click "Run Now" to start.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="rounded-lg bg-secondary/50 border border-border p-3 space-y-2">
                <div className="flex items-start gap-3">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-foreground">{log.source}</span>
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{log.feed_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/70">
                      <span>{log.vehicles_scanned} scanned</span>
                      {log.new_vehicles > 0 && <span className="text-success">+{log.new_vehicles} new</span>}
                      {log.marked_sold > 0 && <span className="text-destructive">{log.marked_sold} sold</span>}
                      {log.images_fetched > 0 && (
                        <span className="text-primary flex items-center gap-0.5">
                          <Image className="h-2.5 w-2.5" /> {log.images_fetched} images
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                      <Clock className="h-3 w-3" />
                      {formatTime(log.created_at)}
                    </div>
                    {log.feed_type.toLowerCase().includes("csv") && (
                      confirmDeleteId === log.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteImport(log)}
                            disabled={deletingId === log.id}
                            className="rounded px-2 py-0.5 text-[10px] font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {deletingId === log.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground border border-border transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(log.id)}
                          className="rounded p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete this import and its vehicles"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
