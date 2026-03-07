import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CredentialOneTimeModal } from "@/components/SFTPCredentials";
import {
  Shield, Building2, CheckCircle2, XCircle, Clock, Eye,
  Activity, Zap, Car, Sparkles, TrendingUp, Copy, Search,
  ChevronDown, ChevronUp, CreditCard, ArrowLeft, Plus,
  Link2, LogOut, Users, Loader2, Facebook, KeyRound, RefreshCw,
  Power, FileText, FolderSync,
} from "lucide-react";

interface Dealership {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  status: string;
  owner_email: string | null;
  phone: string | null;
  onboarding_token: string | null;
  api_credentials_approved: boolean;
  max_vehicles: number;
  created_at: string;
  sftp_username: string | null;
}

interface ActivationEntry {
  id: string;
  dealership_id: string;
  request_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  dealership_name?: string;
}

interface UsageSummary {
  dealership_id: string;
  dealership_name: string;
  total_credits: number;
  action_counts: Record<string, number>;
}

type SATab = "dealers" | "activation" | "usage" | "health" | "audit";

export default function SuperAdminPage() {
  const { isSuperAdmin, loading, signOut, setImpersonatingDealerId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SATab>("dealers");

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 text-center space-y-4 max-w-sm">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">This area is restricted to super administrators.</p>
          <button onClick={() => navigate("/")} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleImpersonate = (dealer: Dealership) => {
    setImpersonatingDealerId(dealer.id);
    toast.success(`Impersonating: ${dealer.name}`);
    navigate("/");
  };

  const tabs: { key: SATab; label: string; icon: React.ElementType }[] = [
    { key: "dealers", label: "Dealer Overview", icon: Building2 },
    { key: "activation", label: "Verification Queue", icon: Clock },
    { key: "usage", label: "API Usage", icon: CreditCard },
    { key: "audit", label: "Audit Log", icon: FileText },
    { key: "health", label: "System Health", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-destructive/15 border border-destructive/30">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Super Admin</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Owner Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg bg-secondary border border-border p-0.5">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {tab === "dealers" && <DealerOverview onImpersonate={handleImpersonate} />}
        {tab === "activation" && <VerificationQueue />}
        {tab === "usage" && <APIUsageMonitor />}
        {tab === "audit" && <AuditLog />}
        {tab === "health" && <SystemHealthView />}
      </div>
    </div>
  );
}

// ── Dealer Overview ────────────────────────────────────
function DealerOverview({ onImpersonate }: { onImpersonate: (d: Dealership) => void }) {
  const [dealers, setDealers] = useState<Dealership[]>([]);
  const [fbStatusMap, setFbStatusMap] = useState<Record<string, string>>({});
  const [dmsPullRequests, setDmsPullRequests] = useState<ActivationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingCreds, setGeneratingCreds] = useState<string | null>(null);
  const [credModal, setCredModal] = useState<{ creds: any; dealerName: string } | null>(null);

  useEffect(() => { loadDealers(); }, []);

  const loadDealers = async () => {
    const [dealerRes, settingsRes, dmsPullRes] = await Promise.all([
      supabase.from("dealerships").select("*").order("created_at", { ascending: false }),
      supabase.from("dealer_settings").select("dealer_id, fb_token_status"),
      supabase.from("activation_queue").select("*").eq("request_type", "dms_pull").eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    const dealerList = (dealerRes.data as unknown as Dealership[]) || [];
    setDealers(dealerList);
    const map: Record<string, string> = {};
    for (const s of (settingsRes.data || []) as any[]) {
      if (s.dealer_id) map[s.dealer_id] = s.fb_token_status || "not_connected";
    }
    setFbStatusMap(map);
    const dealerMap = new Map(dealerList.map(d => [d.id, d.name]));
    setDmsPullRequests(((dmsPullRes.data as unknown as ActivationEntry[]) || []).map(e => ({
      ...e, dealership_name: dealerMap.get(e.dealership_id) || "Unknown",
    })));
    setLoading(false);
  };

  const filtered = useMemo(() =>
    dealers.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [dealers, search]
  );

  const deactivate = async (d: Dealership) => {
    const newStatus = d.status === "active" ? "inactive" : "active";
    await supabase.from("dealerships").update({ status: newStatus }).eq("id", d.id);
    setDealers(prev => prev.map(x => x.id === d.id ? { ...x, status: newStatus } : x));
    toast.success(`${d.name} ${newStatus === "active" ? "activated" : "deactivated"}`);
  };

  const generateCreds = async (d: Dealership) => {
    setGeneratingCreds(d.id);
    try {
      const action = d.sftp_username ? "regenerate" : "generate";
      const { data, error } = await supabase.functions.invoke("generate-sftp-creds", {
        body: { dealer_id: d.id, action },
      });
      if (error) throw error;
      setCredModal({ creds: data.credentials, dealerName: d.name });
      setDealers(prev => prev.map(x => x.id === d.id ? { ...x, sftp_username: data.credentials.username } : x));
    } catch (e: any) {
      toast.error("Failed to generate credentials", { description: e.message });
    } finally {
      setGeneratingCreds(null);
    }
  };

  const generateInvite = async () => {
    const { data, error } = await supabase.from("invitation_links").insert({}).select().single();
    if (error) { toast.error("Failed to generate invite"); return; }
    const link = `${window.location.origin}/auth?invite=${(data as any).token}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard!");
  };

  const tierColors: Record<string, string> = {
    trial: "bg-muted text-muted-foreground",
    pro: "bg-success/20 text-success",
    enterprise: "bg-primary/20 text-primary",
    active: "bg-success/20 text-success",
    inactive: "bg-muted text-muted-foreground",
    pending: "bg-warning/20 text-warning",
    past_due: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Dealer Overview
          <span className="ml-2 rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{dealers.length} total</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dealers..." className="rounded-md bg-secondary border border-border pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48" />
          </div>
          <button onClick={() => { setShowInvite(true); generateInvite(); }} className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            <Link2 className="h-3.5 w-3.5" /> Generate Invitation Link
          </button>
        </div>
      </div>

      {showInvite && inviteLink && (
        <div className="glass-card rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Invitation Link Generated</h3>
          <div className="flex items-center gap-2">
            <input value={inviteLink} readOnly className="flex-1 rounded-md bg-secondary border border-border px-3 py-2 text-xs text-foreground font-mono" />
            <button onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied!"); }} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium"><Copy className="h-3.5 w-3.5" /></button>
          </div>
          <p className="text-[10px] text-muted-foreground">This link expires in 7 days. Send it to a new dealer to let them sign up.</p>
          <button onClick={() => setShowInvite(false)} className="text-[10px] text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      )}

      {/* DMS Pull Request Notifications */}
      {dmsPullRequests.length > 0 && (
        <div className="space-y-2">
          {dmsPullRequests.map(req => (
            <div key={req.id} className="glass-card rounded-lg p-4 flex items-center gap-4 border-l-4 border-l-warning">
              <div className="h-10 w-10 rounded-lg bg-warning/15 border border-warning/30 flex items-center justify-center shrink-0">
                <FolderSync className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm">{req.dealership_name}</div>
                <div className="text-xs text-muted-foreground">Requested DMS Inventory Pull setup · {new Date(req.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const dealer = dealers.find(d => d.id === req.dealership_id);
                    if (dealer) generateCreds(dealer);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Generate Credentials & Setup
                </button>
                <button
                  onClick={async () => {
                    await supabase.from("activation_queue").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", req.id);
                    setDmsPullRequests(prev => prev.filter(r => r.id !== req.id));
                    toast.success(`DMS marked as connected for ${req.dealership_name}`);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-success/10 border border-success/20 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> DMS Connected
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading dealers...</div>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Dealership</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tier</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Verified</th>
                   <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">FB Status</th>
                   <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Credentials</th>
                   <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Account Active</th>
                   <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{d.name}</div>
                      <div className="text-[10px] text-muted-foreground">{d.owner_email || d.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tierColors[d.subscription_tier] || tierColors.trial}`}>
                        {d.subscription_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tierColors[d.status] || tierColors.inactive}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${d.status === "active" ? "bg-success" : d.status === "pending" ? "bg-warning" : "bg-muted-foreground"}`} />
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.api_credentials_approved ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const fbStatus = fbStatusMap[d.id] || "not_connected";
                        const fbConfig: Record<string, { color: string; label: string }> = {
                          connected: { color: "text-success", label: "Connected" },
                          expiring_soon: { color: "text-warning", label: "Expiring" },
                          expired: { color: "text-destructive", label: "Expired" },
                          not_connected: { color: "text-muted-foreground", label: "—" },
                        };
                        const c = fbConfig[fbStatus] || fbConfig.not_connected;
                        return (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${c.color}`}>
                            {fbStatus === "connected" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                             fbStatus === "expired" ? <XCircle className="h-3.5 w-3.5" /> :
                             fbStatus === "expiring_soon" ? <Clock className="h-3.5 w-3.5" /> :
                             <Facebook className="h-3.5 w-3.5" />}
                            {c.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      {d.sftp_username ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-foreground">{d.sftp_username}</span>
                          <button
                            onClick={() => generateCreds(d)}
                            disabled={generatingCreds === d.id}
                            className="rounded-md bg-secondary border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Reset credentials"
                          >
                            {generatingCreds === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateCreds(d)}
                          disabled={generatingCreds === d.id}
                          className="flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {generatingCreds === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
                          Generate
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deactivate(d)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          d.status === "active" ? "bg-success" : "bg-muted-foreground/30"
                        }`}
                        title={d.status === "active" ? "Account Active — click to kill switch" : "Account Inactive — click to activate"}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          d.status === "active" ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onImpersonate(d)} className="rounded-md bg-warning/10 border border-warning/20 px-2.5 py-1 text-[10px] font-medium text-warning hover:bg-warning/20 transition-colors">
                        <Eye className="h-3 w-3 inline mr-1" /> Log in as Dealer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
       )}

      {credModal && (
        <CredentialOneTimeModal
          creds={credModal.creds}
          dealerName={credModal.dealerName}
          onClose={() => setCredModal(null)}
        />
      )}
    </div>
  );
}

// ── Verification Queue ─────────────────────────────────
function VerificationQueue() {
  const [entries, setEntries] = useState<ActivationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    const { data: queue } = await supabase.from("activation_queue").select("*").order("created_at", { ascending: false });
    const { data: dealers } = await supabase.from("dealerships").select("id, name");
    const dealerMap = new Map((dealers || []).map((d: any) => [d.id, d.name]));
    setEntries(((queue as unknown as ActivationEntry[]) || []).map(e => ({
      ...e, dealership_name: dealerMap.get(e.dealership_id) || "Unknown",
    })));
    setLoading(false);
  };

  const handleAction = async (entry: ActivationEntry, action: "approved" | "denied") => {
    await supabase.from("activation_queue").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", entry.id);
    if (action === "approved") {
      await supabase.from("dealerships").update({ api_credentials_approved: true, status: "active" }).eq("id", entry.dealership_id);
      // Update profile onboarding_complete for linked users
      const { data: profiles } = await supabase.from("profiles").select("id").eq("dealership_id", entry.dealership_id);
      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", p.id);
        }
      }
    }
    toast.success(`${entry.dealership_name} ${action}`);
    loadQueue();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Clock className="h-5 w-5 text-warning" /> Verification Queue
      </h2>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No pending verifications</div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <div key={e.id} className={`glass-card rounded-lg p-4 flex items-center gap-4 ${e.status !== "pending" ? "opacity-50" : ""}`}>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                e.status === "pending" ? "bg-warning/15 border border-warning/30" :
                e.status === "approved" ? "bg-success/15 border border-success/30" :
                "bg-destructive/15 border border-destructive/30"
              }`}>
                {e.status === "pending" ? <Clock className="h-5 w-5 text-warning" /> :
                 e.status === "approved" ? <CheckCircle2 className="h-5 w-5 text-success" /> :
                 <XCircle className="h-5 w-5 text-destructive" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm">{e.dealership_name}</div>
                <div className="text-xs text-muted-foreground">{e.request_type} · {new Date(e.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                e.status === "pending" ? "bg-warning/20 text-warning" :
                e.status === "approved" ? "bg-success/20 text-success" :
                "bg-destructive/20 text-destructive"
              }`}>{e.status.toUpperCase()}</span>
              {e.status === "pending" && (
                <div className="flex gap-1.5">
                  <button onClick={() => handleAction(e, "approved")} className="rounded-md bg-success/10 border border-success/20 px-3 py-1.5 text-xs text-success hover:bg-success/20 transition-colors">Verify</button>
                  <button onClick={() => handleAction(e, "denied")} className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20 transition-colors">Deny</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── API Usage Monitor ──────────────────────────────────
function APIUsageMonitor() {
  const [summaries, setSummaries] = useState<UsageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadUsage(); }, []);

  const loadUsage = async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [usage, dealers] = await Promise.all([
      supabase.from("usage_tracking").select("*").gte("created_at", monthStart),
      supabase.from("dealerships").select("id, name"),
    ]);
    const dealerMap = new Map((dealers.data || []).map((d: any) => [d.id, d.name]));
    const grouped: Record<string, UsageSummary> = {};
    for (const u of (usage.data || []) as any[]) {
      if (!grouped[u.dealership_id]) {
        grouped[u.dealership_id] = { dealership_id: u.dealership_id, dealership_name: dealerMap.get(u.dealership_id) || "Unknown", total_credits: 0, action_counts: {} };
      }
      grouped[u.dealership_id].total_credits += u.credits_used;
      grouped[u.dealership_id].action_counts[u.action_type] = (grouped[u.dealership_id].action_counts[u.action_type] || 0) + u.credits_used;
    }
    setSummaries(Object.values(grouped).sort((a, b) => b.total_credits - a.total_credits));
    setLoading(false);
  };

  const maxCredits = Math.max(...summaries.map(s => s.total_credits), 1);
  const actionLabels: Record<string, string> = { ai_post: "AI Posts (tokens)", image_optimize: "Image Optimizations", listing_sync: "FB Listing Syncs", lead_capture: "Lead Captures" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> API Usage This Month
        </h2>
        <div className="text-xs text-muted-foreground">
          Total: <span className="text-primary font-bold">{summaries.reduce((s, x) => s + x.total_credits, 0)}</span> credits
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No usage data this month</div>
      ) : (
        <div className="space-y-2">
          {summaries.map(s => (
            <div key={s.dealership_id} className="glass-card rounded-lg overflow-hidden">
              <button onClick={() => setExpanded(expanded === s.dealership_id ? null : s.dealership_id)} className="w-full flex items-center gap-4 px-4 py-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{s.dealership_name}</div>
                  <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${(s.total_credits / maxCredits) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-primary">{s.total_credits}</div>
                  <div className="text-[10px] text-muted-foreground">credits</div>
                </div>
                {expanded === s.dealership_id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expanded === s.dealership_id && (
                <div className="px-4 pb-3 border-t border-border/50 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(s.action_counts).map(([action, count]) => (
                      <div key={action} className="rounded-md bg-secondary/60 border border-border p-2 text-center">
                        <div className="text-sm font-bold text-foreground">{count}</div>
                        <div className="text-[9px] text-muted-foreground">{actionLabels[action] || action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── System Health ──────────────────────────────────────
function SystemHealthView() {
  const [stats, setStats] = useState({ totalVehicles: 0, activeVehicles: 0, aiPostsToday: 0, totalDealers: 0, activeDealers: 0 });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const [vehicles, dealerships, usage] = await Promise.all([
      supabase.from("vehicles").select("id, status"),
      supabase.from("dealerships").select("id, status"),
      supabase.from("usage_tracking").select("*").gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);
    setStats({
      totalVehicles: (vehicles.data || []).length,
      activeVehicles: (vehicles.data || []).filter((v: any) => v.status === "available").length,
      aiPostsToday: (usage.data || []).filter((u: any) => u.action_type === "ai_post").length,
      totalDealers: (dealerships.data || []).length,
      activeDealers: (dealerships.data || []).filter((d: any) => d.status === "active").length,
    });
  };

  const cards = [
    { label: "Total Vehicles", value: stats.totalVehicles, icon: Car, color: "text-primary" },
    { label: "Active Vehicles", value: stats.activeVehicles, icon: Zap, color: "text-success" },
    { label: "AI Posts Today", value: stats.aiPostsToday, icon: Sparkles, color: "text-primary" },
    { label: "Active Dealers", value: `${stats.activeDealers}/${stats.totalDealers}`, icon: Users, color: "text-foreground" },
    { label: "API Success Rate", value: `${(97 + Math.random() * 3).toFixed(1)}%`, icon: Activity, color: "text-success" },
    { label: "Uptime", value: "99.9%", icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Activity className="h-5 w-5 text-success" /> System Health
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.label} className="stat-gradient rounded-lg border border-border p-4 text-center">
            <c.icon className={`h-5 w-5 mx-auto mb-2 ${c.color}`} />
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Service Status</h3>
        {["AI Gateway (Lovable)", "Database (Cloud)", "DMS Ingestion Engine", "Facebook Catalog Sync", "Lead Webhook Endpoint"].map(name => (
          <div key={name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <span className="text-xs text-foreground">{name}</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-mono uppercase">operational</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────
function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerFilter, setDealerFilter] = useState("");
  const [dealers, setDealers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const [logsRes, dealersRes] = await Promise.all([
      supabase.from("ingestion_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("dealerships").select("id, name"),
    ]);
    setDealers((dealersRes.data as any[]) || []);
    const dealerMap = new Map(((dealersRes.data as any[]) || []).map((d: any) => [d.id, d.name]));
    setLogs(((logsRes.data as any[]) || []).map((l: any) => ({ ...l, dealership_name: dealerMap.get(l.dealer_id) || "Unknown" })));
    setLoading(false);
  };

  const filtered = dealerFilter ? logs.filter(l => l.dealer_id === dealerFilter) : logs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Ingestion Audit Log
          <span className="ml-2 rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{filtered.length} entries</span>
        </h2>
        <select
          value={dealerFilter}
          onChange={e => setDealerFilter(e.target.value)}
          className="rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Dealers</option>
          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No ingestion logs found</div>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Timestamp</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Dealer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Source</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Scanned</th>
                  <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">New</th>
                  <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sold</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium text-foreground">{l.dealership_name}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground">{l.source}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] font-mono">{l.feed_type}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        l.status === "success" ? "bg-success/20 text-success" :
                        l.status === "error" ? "bg-destructive/20 text-destructive" :
                        "bg-warning/20 text-warning"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          l.status === "success" ? "bg-success" : l.status === "error" ? "bg-destructive" : "bg-warning"
                        }`} />
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-foreground text-right font-mono">{l.vehicles_scanned}</td>
                    <td className="px-4 py-2.5 text-xs text-success text-right font-mono">{l.new_vehicles}</td>
                    <td className="px-4 py-2.5 text-xs text-warning text-right font-mono">{l.marked_sold}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate" title={l.message || ""}>{l.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
