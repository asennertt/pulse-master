import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { toast } from "sonner";
import { importCSVWithMapping } from "@/utils/csvMapper";
import {
  Upload, CheckCircle2, Loader2,
  RefreshCw, Clock, AlertTriangle, Database,
  FileText, WifiOff, Sparkles, Trash2,
  Send, Wifi, FolderSync,
  Image as ImageIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────
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
}

const inputCls = "w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

export function DMSIntegrationWizard() {
  const { activeDealerId } = useAuth();

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiImporting, setAiImporting] = useState(false);
  const [aiResult, setAiResult] = useState<{ mapping: Record<string, string>; new_vehicles: number; updated_vehicles: number; marked_sold?: number; mapped_columns: number } | null>(null);

  // Logs
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Danger zone
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmCleanse, setConfirmCleanse] = useState(false);
  const [cleansing, setCleansing] = useState(false);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("ingestion_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setLogs((data as unknown as IngestionLog[]) || []);
    setLogsLoading(false);
  };

  const handleCSVDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".CSV"))) {
      setCsvFile(file);
      toast.success(`File ready: ${file.name}`);
    } else {
      toast.error("Please upload a .csv file");
    }
  };

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setAiResult(null);
      toast.success(`File ready: ${file.name}`);
    }
  };

  const runAiImport = async () => {
    if (!csvFile || !activeDealerId) return;
    setAiImporting(true);
    setAiResult(null);
    try {
      const data = await importCSVWithMapping(csvFile, activeDealerId);

      setAiResult(data);
      toast.success("Import Complete!", {
        description: `${data.mapped_columns} columns mapped · ${data.new_vehicles} new · ${data.updated_vehicles} updated${data.marked_sold ? ` · ${data.marked_sold} sold` : ""}`,
      });

      // Notify about sold vehicles — remind user to delete from Facebook
      if (data.sold_vehicles && data.sold_vehicles.length > 0) {
        for (const sv of data.sold_vehicles) {
          toast.warning(`${sv.year} ${sv.make} ${sv.model} — Sold`, {
            description: "This vehicle is no longer in your inventory. Remember to delete the listing on Facebook Marketplace.",
            duration: 15000,
            action: {
              label: "Open Facebook",
              onClick: () => window.open("https://www.facebook.com/marketplace/you/selling", "_blank"),
            },
          });
        }
      }

      loadLogs();
    } catch (e: any) {
      toast.error("Import failed", { description: e.message });
    } finally {
      setAiImporting(false);
    }
  };

  const deleteAllInventory = async () => {
    if (!activeDealerId) return;
    setDeletingAll(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("dealership_id", activeDealerId);
      if (error) throw error;
      toast.success("All inventory deleted", {
        description: "Every vehicle record has been removed from your inventory.",
      });
      setConfirmDeleteAll(false);
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message });
    } finally {
      setDeletingAll(false);
    }
  };

  const systemCleanse = async () => {
    if (!activeDealerId) return;
    setCleansing(true);
    try {
      const tables = [
        "sold_alerts",
        "price_history",
        "vehicle_performance",
        "leads",
        "vehicles",
        "ingestion_logs",
      ] as const;

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("dealership_id", activeDealerId);
        if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
      }

      toast.success("System cleansed", {
        description: "All vehicles, leads, alerts, and import logs have been wiped.",
      });
      setConfirmCleanse(false);
      loadLogs();
    } catch (e: any) {
      toast.error("Cleanse failed", { description: e.message });
    } finally {
      setCleansing(false);
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
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FolderSync className="h-5 w-5 text-primary" /> Inventory Management
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Import inventory via CSV or request automated DMS syncing
        </p>
      </div>

      {/* DMS Pull Request Card */}
      <DMSPullRequestCard dealerId={activeDealerId} />

      {/* CSV Upload Section */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">CSV Upload</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Export a CSV from your DMS and drop it here. Columns are automatically detected and mapped — no manual configuration needed.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleCSVDrop}
          onClick={() => !aiImporting && fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
            aiImporting ? "opacity-50 cursor-not-allowed" :
            dragActive ? "border-primary bg-primary/5" :
            csvFile ? "border-success/30 bg-success/5" :
            "border-border hover:border-primary/30 hover:bg-secondary/50"
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVSelect} />
          {csvFile ? (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
              <p className="text-sm font-medium text-foreground">{csvFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(csvFile.size / 1024).toFixed(1)} KB · Click to swap file
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
              <p className="text-xs text-muted-foreground">or click to browse · .csv files only</p>
            </div>
          )}
        </div>

        {/* AI import result */}
        {aiResult && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-success text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Import Complete
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="rounded-md bg-background/50 p-2">
                <div className="font-bold text-foreground text-base">{aiResult.mapped_columns}</div>
                <div className="text-muted-foreground">Columns Mapped</div>
              </div>
              <div className="rounded-md bg-background/50 p-2">
                <div className="font-bold text-success text-base">+{aiResult.new_vehicles}</div>
                <div className="text-muted-foreground">New Vehicles</div>
              </div>
              <div className="rounded-md bg-background/50 p-2">
                <div className="font-bold text-primary text-base">{aiResult.updated_vehicles}</div>
                <div className="text-muted-foreground">Updated</div>
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Detected Mappings</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(aiResult.mapping).map(([csv, app]) => (
                  <span key={csv} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary">
                    {csv} → {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={runAiImport}
          disabled={aiImporting || !csvFile}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {aiImporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Mapping & Importing...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Import with Auto Mapping</>
          )}
        </button>
      </div>

      {/* Recent Sync History */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Recent Import History
          </h3>
          <button
            onClick={loadLogs}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        {logsLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading import history...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
            <WifiOff className="h-8 w-8 mx-auto opacity-30" />
            <p>No imports yet. Upload a CSV above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg bg-secondary/50 border border-border p-3">
                {log.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{log.source}</span>
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {log.feed_type}
                    </span>
                    <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                      log.status === "success"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {log.status === "success" ? "Success" : "Warning"}
                    </span>
                  </div>
                  {log.message && (
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/70">
                    <span>{log.vehicles_scanned} scanned</span>
                    {log.new_vehicles > 0 && <span className="text-success">+{log.new_vehicles} new</span>}
                    {log.marked_sold > 0 && <span className="text-destructive">{log.marked_sold} sold</span>}
                    {log.images_fetched > 0 && (
                      <span className="text-primary flex items-center gap-0.5">
                        <ImageIcon className="h-2.5 w-2.5" /> {log.images_fetched}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatTime(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
        </div>

        {/* Delete All Inventory */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Delete All Inventory</p>
          <p className="text-xs text-muted-foreground">
            Remove all vehicle records only. Logs and other data are preserved.
          </p>
          {confirmDeleteAll ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-destructive">Are you sure?</span>
              <button
                onClick={deleteAllInventory}
                disabled={deletingAll}
                className="flex items-center gap-1.5 rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deletingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {deletingAll ? "Deleting..." : "Yes, Delete Vehicles"}
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="rounded-md border border-border bg-secondary px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete All Inventory
            </button>
          )}
        </div>

        <div className="border-t border-destructive/20" />

        {/* System Cleanse */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">System Cleanse</p>
          <p className="text-xs text-muted-foreground">
            <strong className="text-destructive">Nuclear option.</strong> Permanently wipes all vehicles, leads, sold alerts, price history, vehicle performance, and ingestion logs. Cannot be undone.
          </p>
          {confirmCleanse ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-destructive">This will wipe EVERYTHING — are you absolutely sure?</span>
              <button
                onClick={systemCleanse}
                disabled={cleansing}
                className="flex items-center gap-1.5 rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {cleansing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {cleansing ? "Cleansing..." : "Yes, Wipe Everything"}
              </button>
              <button
                onClick={() => setConfirmCleanse(false)}
                className="rounded-md border border-border bg-secondary px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCleanse(true)}
              className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/15 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/25 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> System Cleanse — Wipe Everything
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DMS Pull Request Card (Dealer-facing) ──────────────
function DMSPullRequestCard({ dealerId }: { dealerId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<{ status: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!dealerId || checked) return;
    checkExisting();
  }, [dealerId]);

  const checkExisting = async () => {
    if (!dealerId) return;
    const { data } = await supabase
      .from("activation_queue")
      .select("status")
      .eq("dealership_id", dealerId)
      .eq("request_type", "dms_pull")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setExisting(data as { status: string } | null);
    setChecked(true);
  };

  const submitRequest = async () => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("activation_queue").insert({
        dealership_id: dealerId,
        request_type: "dms_pull",
        notes: "Dealer requested DMS inventory pull setup",
      });
      if (error) throw error;
      setExisting({ status: "pending" });
      toast.success("Request submitted!", {
        description: "Your admin will be notified to set up the DMS inventory pull.",
      });
    } catch (e: any) {
      toast.error("Failed to submit request", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!checked) {
    return (
      <div className="glass-card rounded-xl p-6 flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking status...
      </div>
    );
  }

  if (existing?.status === "pending") {
    return (
      <div className="glass-card rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning/15 border border-warning/30 flex items-center justify-center">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">DMS Inventory Pull Requested</h3>
            <p className="text-xs text-muted-foreground">Your request is pending admin review. You'll be set up shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  if (existing?.status === "approved") {
    return (
      <div className="glass-card rounded-xl p-6 space-y-3 border-l-4 border-l-success">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center">
            <Wifi className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              DMS Connected
              <span className="flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] text-success font-medium">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Your inventory is syncing automatically via SFTP. New vehicles appear here within hours of being added to your DMS.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
          <FolderSync className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Automated DMS Inventory Pull</h3>
          <p className="text-xs text-muted-foreground">Want your inventory to sync automatically from your DMS? Request a setup and we'll handle the rest.</p>
        </div>
      </div>
      <button
        onClick={submitRequest}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Request DMS Inventory Pull
      </button>
    </div>
  );
}
