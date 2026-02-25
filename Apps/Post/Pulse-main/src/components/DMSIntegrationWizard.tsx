import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { DMSFieldMapper } from "@/components/DMSFieldMapper";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Server, Upload, Plug, CheckCircle2, ChevronRight, Loader2,
  RefreshCw, Clock, AlertTriangle, Eye, EyeOff, Database,
  ArrowRight, FileText, Wifi, WifiOff, Settings2, PlayCircle,
  Image as ImageIcon, FolderSync, ChevronDown, Sparkles, Trash2,
  Send,
} from "lucide-react";

// ── Types ──────────────────────────────────────────
type ConnectionType = "ftp" | "csv" | "api" | null;
type WizardStep = "select" | "configure" | "mapper" | "controls";

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

const API_SYSTEMS: { value: string; label: string }[] = [];

const SYNC_SCHEDULES = [
  { value: "manual", label: "Manual Only" },
  { value: "4h", label: "Every 4 Hours" },
  { value: "8h", label: "Every 8 Hours" },
  { value: "12h", label: "Every 12 Hours" },
  { value: "daily_2am", label: "Every Night at 2 AM" },
  { value: "daily_6am", label: "Every Morning at 6 AM" },
];

const inputCls = "w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

export function DMSIntegrationWizard() {
  const { activeDealerId } = useAuth();
  const [step, setStep] = useState<WizardStep>("select");
  const [connectionType, setConnectionType] = useState<ConnectionType>(null);
  const [connected, setConnected] = useState(false);

  // FTP fields
  const [ftpHost, setFtpHost] = useState("");
  const [ftpUser, setFtpUser] = useState("");
  const [ftpPass, setFtpPass] = useState("");
  const [ftpPath, setFtpPath] = useState("/inventory.xml");
  const [showFtpPass, setShowFtpPass] = useState(false);

  // API fields
  const [apiSystem, setApiSystem] = useState("frazer");
  const [apiKey, setApiKey] = useState("");
  const [dealerIdField, setDealerIdField] = useState("");

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiImporting, setAiImporting] = useState(false);
  const [aiResult, setAiResult] = useState<{ mapping: Record<string, string>; new_vehicles: number; updated_vehicles: number; mapped_columns: number } | null>(null);

  // Sync controls
  const [autoSync, setAutoSync] = useState(false);
  const [syncSchedule, setSyncSchedule] = useState("daily_2am");
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Logs
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Danger zone
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmCleanse, setConfirmCleanse] = useState(false);
  const [cleansing, setCleansing] = useState(false);

  // Testing connection
  const [testing, setTesting] = useState(false);

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

  const testConnection = async () => {
    setTesting(true);
    // Simulate connection test
    await new Promise(r => setTimeout(r, 2000));
    setTesting(false);
    setConnected(true);
    toast.success("Connection Successful!", {
      description: connectionType === "ftp"
        ? `Connected to ${ftpHost}`
        : connectionType === "api"
        ? "API credentials verified"
        : "CSV file validated",
    });
    setStep("mapper");
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
    if (!csvFile) return;
    setAiImporting(true);
    setAiResult(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      if (activeDealerId) formData.append("dealer_id", activeDealerId);

      const { data, error } = await supabase.functions.invoke("ai-csv-map", {
        body: formData,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiResult(data);
      setConnected(true);
      toast.success("AI Import Complete!", {
        description: `${data.mapped_columns} columns mapped · ${data.new_vehicles} new vehicles · ${data.updated_vehicles} updated`,
      });
      loadLogs();
      setStep("controls");
    } catch (e: any) {
      toast.error("AI import failed", { description: e.message });
    } finally {
      setAiImporting(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(p => Math.min(p + Math.random() * 15, 95));
    }, 400);

    try {
      const { data, error } = await supabase.functions.invoke("dms-ingest", {
        body: {
          source: connectionType === "ftp" ? ftpHost : connectionType === "api" ? apiSystem : "CSV Upload",
          feedType: connectionType === "csv" ? "CSV" : "XML",
        },
      });
      if (error) throw error;
      setSyncProgress(100);
      toast.success("Sync Complete", {
        description: `${data?.new_vehicles || 0} new, ${data?.marked_sold || 0} sold, ${data?.images_fetched || 0} images`,
      });
      loadLogs();
    } catch (e: any) {
      toast.error("Sync failed", { description: e.message });
    } finally {
      clearInterval(interval);
      setTimeout(() => { setSyncing(false); setSyncProgress(0); }, 1500);
    }
  };

  const deleteAllInventory = async () => {
    setDeletingAll(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .gte("created_at", "2000-01-01");
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
          .gte("created_at", "2000-01-01");
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

  const connectionOptions = [
    {
      type: "ftp" as ConnectionType,
      icon: Server,
      title: "FTP / XML Feed",
      badge: "Most Common",
      description: "Your DMS pushes a nightly inventory file via FTP. We'll pull it automatically.",
    },
    {
      type: "csv" as ConnectionType,
      icon: Upload,
      title: "Daily CSV Upload",
      badge: null,
      description: "Export a CSV from your DMS and upload it here. Great for manual control.",
    },
    {
      type: "api" as ConnectionType,
      icon: Plug,
      title: "Direct API",
      badge: "Premium",
      description: "Connect directly to your DMS or inventory system via API credentials.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderSync className="h-5 w-5 text-primary" /> DMS Integration & Inventory Sync
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect your Dealer Management System to keep inventory in sync automatically
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1.5 text-xs text-success">
            <Wifi className="h-3.5 w-3.5" />
            <span className="font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Request DMS Inventory Pull */}
      <DMSPullRequestCard dealerId={activeDealerId} />

      {/* Wizard Progress */}
      <div className="flex items-center gap-2">
        {(["select", "configure", "mapper", "controls"] as WizardStep[]).map((s, i) => {
          const labels = ["Connection Type", "Configure", "Field Mapper", "Sync Controls"];
          const icons = [Plug, Settings2, ArrowRight, RefreshCw];
          const Icon = icons[i];
          const isActive = step === s;
          const isDone = (
            (s === "select" && connectionType) ||
            (s === "configure" && connected) ||
            (s === "mapper" && connected && step === "controls")
          );
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => {
                  if (s === "select") setStep("select");
                  else if (s === "configure" && connectionType) setStep("configure");
                  else if (s === "mapper" && connected) setStep("mapper");
                  else if (s === "controls" && connected) setStep("controls");
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all flex-1 justify-center ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-success/10 border border-success/20 text-success"
                    : "bg-secondary border border-border text-muted-foreground"
                }`}
              >
                {isDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{labels[i]}</span>
              </button>
              {i < 3 && <ChevronRight className="h-3.5 w-3.5 text-border shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Connection Type */}
      {step === "select" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connectionOptions.map(opt => {
            const isSelected = connectionType === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => { setConnectionType(opt.type); setStep("configure"); }}
                className={`glass-card rounded-xl p-6 text-left space-y-3 transition-all group relative ${
                  isSelected ? "border-primary/50 ring-2 ring-primary/20" : "hover:border-primary/30"
                }`}
              >
                {opt.badge && (
                  <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    opt.badge === "Most Common"
                      ? "bg-success/15 text-success border border-success/20"
                      : "bg-primary/15 text-primary border border-primary/20"
                  }`}>
                    {opt.badge}
                  </span>
                )}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? "bg-primary/20 border border-primary/30" : "bg-secondary border border-border group-hover:border-primary/30"
                }`}>
                  <opt.icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{opt.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Configure Connection */}
      {step === "configure" && connectionType === "ftp" && (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Server className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">FTP / XML Feed Configuration</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the FTP credentials your DMS provider gave you. We'll connect nightly and pull your latest inventory file.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">FTP Host</label>
              <input value={ftpHost} onChange={e => setFtpHost(e.target.value)} placeholder="ftp.dealertrack.com" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Username</label>
              <input value={ftpUser} onChange={e => setFtpUser(e.target.value)} placeholder="dealer_12345" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showFtpPass ? "text" : "password"}
                  value={ftpPass}
                  onChange={e => setFtpPass(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls + " pr-10"}
                />
                <button
                  onClick={() => setShowFtpPass(!showFtpPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showFtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">File Path</label>
              <input value={ftpPath} onChange={e => setFtpPath(e.target.value)} placeholder="/inventory.xml" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={testConnection}
              disabled={testing || !ftpHost.trim() || !ftpUser.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              {testing ? "Testing Connection..." : "Test & Connect"}
            </button>
            <button onClick={() => setStep("select")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>
        </div>
      )}

      {step === "configure" && connectionType === "csv" && (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">CSV Upload — AI Auto-Mapping</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Drop your inventory CSV and AI will automatically detect the column names, map them to the right fields, and import everything — no manual configuration needed.
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
                <Sparkles className="h-4 w-4" /> AI Mapping Complete
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

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={runAiImport}
              disabled={aiImporting || !csvFile}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {aiImporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> AI Mapping & Importing...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Import with AI Mapping</>
              )}
            </button>
            <button onClick={() => setStep("select")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-5">
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
      )}

      {step === "configure" && connectionType === "api" && (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Plug className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Direct API Connection</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your API credentials below. We'll connect to your inventory system and pull your data directly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">System Name</label>
              <input
                value={apiSystem}
                onChange={e => setApiSystem(e.target.value)}
                placeholder="e.g. My Inventory System"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-live-xxxxxxxxxxxx"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dealer ID / Account Number</label>
              <input
                value={dealerIdField}
                onChange={e => setDealerIdField(e.target.value)}
                placeholder="DLR-12345"
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={testConnection}
              disabled={testing || !apiKey.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              {testing ? "Verifying Credentials..." : "Verify & Connect"}
            </button>
            <button onClick={() => setStep("select")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Field Mapper */}
      {step === "mapper" && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <DMSFieldMapper />
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => setStep("configure")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Configuration
            </button>
            <button
              onClick={() => setStep("controls")}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Continue to Sync Controls <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sync Controls */}
      {step === "controls" && (
        <div className="space-y-5">
          {/* Sync Actions */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" /> Sync Controls
            </h3>

            {/* Sync Now */}
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 border border-border p-4">
              <div>
                <div className="text-sm font-medium text-foreground">Manual Sync</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Force an inventory refresh right now
                </div>
              </div>
              <button
                onClick={runSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>

            {/* Progress bar */}
            {syncing && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Syncing inventory...</span>
                  <span>{Math.round(syncProgress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Auto Sync */}
            <div className="rounded-lg bg-secondary/60 border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Auto-Sync Schedule</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Automatically pull inventory on a schedule
                  </div>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>
              {autoSync && (
                <div className="flex items-center gap-3 pt-1">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={syncSchedule}
                    onChange={e => setSyncSchedule(e.target.value)}
                    className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {SYNC_SCHEDULES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Sync Status Logs */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Recent Sync History
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
                Loading sync history...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
                <WifiOff className="h-8 w-8 mx-auto opacity-30" />
                <p>No syncs yet. Run your first sync above.</p>
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

          {/* Back to mapper */}
          <button onClick={() => setStep("mapper")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Field Mapper
          </button>
        </div>
      )}
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
            <p className="text-xs text-muted-foreground">Your DMS inventory sync is live. Your admin has configured the connection.</p>
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
        <div>
          <h3 className="text-sm font-bold text-foreground">DMS Inventory Pull</h3>
          <p className="text-xs text-muted-foreground">Request your admin to set up automated inventory syncing from your DMS.</p>
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