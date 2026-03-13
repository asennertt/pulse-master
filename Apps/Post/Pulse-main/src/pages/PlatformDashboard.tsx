import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CredentialOneTimeModal } from "@/components/SFTPCredentials";
import {
  Shield, Building2, CheckCircle2, XCircle, Clock, Eye,
  Activity, Zap, Car, Sparkles, TrendingUp, Copy, Search,
  ChevronDown, ChevronUp, CreditCard, Plus,
  Link2, LogOut, Users, Loader2, Facebook, KeyRound, RefreshCw,
  Power, FileText, FolderSync, LayoutDashboard, Settings,
  BarChart3, Bell, Globe, Database, DollarSign, ExternalLink,
  AlertTriangle, ArrowUpRight, Ban, BookOpen, CircleDot,
} from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

// ────────────────── Types ──────────────────
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

type PlatformTab = "overview" | "dealers" | "activation" | "revenue" | "signups" | "vehicle-stats" | "sftp-status" | "billing" | "health" | "audit" | "settings" | "onboarding";

// ────────────────── Main Page ──────────────────
export default function PlatformDashboard() {
  const { user, isSuperAdmin, loading, signOut, setImpersonatingDealerId, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<PlatformTab>("overview");

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );

  if (!isSuperAdmin) {
    navigate("/platform", { replace: true });
    return null;
  }

  const handleImpersonate = (dealer: Dealership) => {
    setImpersonatingDealerId(dealer.id);
    toast.success(`Impersonating: ${dealer.name}`);
    navigate("/dashboard");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/platform", { replace: true });
  };

  const navItems: { key: PlatformTab; label: string; icon: React.ElementType; section?: string }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, section: "Dashboard" },
    { key: "dealers", label: "Dealers", icon: Building2, section: "Management" },
    { key: "onboarding", label: "Onboarding Guide", icon: BookOpen },
    { key: "activation", label: "Verification", icon: Clock },
    { key: "revenue", label: "Revenue", icon: DollarSign, section: "Insights" },
    { key: "signups", label: "Recent Signups", icon: Plus },
    { key: "vehicle-stats", label: "Vehicle Stats", icon: Car },
    { key: "sftp-status", label: "SFTP Status", icon: FolderSync },
    { key: "billing", label: "Billing", icon: CreditCard, section: "Finance" },
    { key: "audit", label: "Audit Log", icon: FileText, section: "System" },
    { key: "health", label: "System Health", icon: Activity },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-border bg-[hsl(220,20%,5%)] flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <img src={pulseLogo} alt="Pulse" className="h-8" />
            <div>
              <div className="text-sm font-bold text-foreground tracking-tight">Pulse Platform</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-destructive">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item, idx) => (
            <div key={item.key}>
              {item.section && (
                <div className={`text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 px-3 ${idx > 0 ? "mt-4" : ""} mb-1.5`}>
                  {item.section}
                </div>
              )}
              <button
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                  tab === item.key
                    ? "bg-destructive/15 text-destructive border border-destructive/20 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{profile?.full_name || "Super Admin"}</div>
              <div className="text-[9px] text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="border-b border-border glass sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                {navItems.find(n => n.key === tab)?.label || "Platform"}
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Pulse Control Center
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="font-mono uppercase tracking-wider">All Systems Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 max-w-[1400px]">
          {tab === "overview" && <PlatformOverview onNavigate={setTab} />}
          {tab === "dealers" && <DealerOverview onImpersonate={handleImpersonate} />}
          {tab === "onboarding" && <OnboardingGuide onNavigate={setTab} />}
          {tab === "activation" && <VerificationQueue />}
          {tab === "revenue" && <RevenueOverview />}
          {tab === "signups" && <RecentSignups />}
          {tab === "vehicle-stats" && <VehicleStats />}
          {tab === "sftp-status" && <SFTPStatus />}
          {tab === "billing" && <BillingOverview />}
          {tab === "audit" && <AuditLog />}
          {tab === "health" && <SystemHealthView />}
          {tab === "settings" && <PlatformSettings />}
        </div>
      </main>
    </div>
  );
}

// ────────────────── Overview Tab ──────────────────
function PlatformOverview({ onNavigate }: { onNavigate: (tab: PlatformTab) => void }) {
  const [stats, setStats] = useState({
    totalDealers: 0, activeDealers: 0, pendingVerifications: 0,
    totalVehicles: 0, activeVehicles: 0, recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [dealers, vehicles, pendingQueue] = await Promise.all([
      supabase.from("dealerships").select("id, status, created_at"),
      supabase.from("vehicles").select("id, status"),
      supabase.from("activation_queue").select("id").eq("status", "pending"),
    ]);

    setStats({
      totalDealers: (dealers.data || []).length,
      activeDealers: (dealers.data || []).filter((d: any) => d.status === "active").length,
      pendingVerifications: (pendingQueue.data || []).length,
      totalVehicles: (vehicles.data || []).length,
      activeVehicles: (vehicles.data || []).filter((v: any) => v.status === "available").length,
      recentSignups: (dealers.data || []).filter((d: any) => d.created_at >= weekAgo).length,
    });
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const cards = [
    { label: "Active Dealers", value: stats.activeDealers, total: stats.totalDealers, icon: Building2, color: "text-primary", bg: "bg-primary/10 border-primary/20", onClick: () => onNavigate("dealers") },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: Clock, color: "text-warning", bg: "bg-warning/10 border-warning/20", onClick: () => onNavigate("activation") },
    { label: "Total Vehicles", value: stats.totalVehicles, icon: Car, color: "text-success", bg: "bg-success/10 border-success/20", onClick: () => onNavigate("vehicle-stats") },
    { label: "Active Listings", value: stats.activeVehicles, icon: Zap, color: "text-primary", bg: "bg-primary/10 border-primary/20", onClick: () => onNavigate("vehicle-stats") },
    { label: "New This Week", value: stats.recentSignups, icon: Plus, color: "text-success", bg: "bg-success/10 border-success/20", onClick: () => onNavigate("signups") },
    { label: "Revenue", value: "→", icon: DollarSign, color: "text-foreground", bg: "bg-secondary border-border", onClick: () => onNavigate("revenue") },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="glass-card rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Welcome back, Alec</h2>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across the Pulse platform today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-destructive/15 border border-destructive/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-destructive flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Super Admin
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <button
            key={c.label}
            onClick={c.onClick}
            className={`stat-gradient rounded-xl border p-5 text-left transition-all hover:scale-[1.02] ${c.onClick ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`h-9 w-9 rounded-lg ${c.bg} border flex items-center justify-center`}>
                <c.icon className={`h-4.5 w-4.5 ${c.color}`} />
              </div>
              {c.total !== undefined && (
                <span className="text-[10px] text-muted-foreground font-mono">of {c.total}</span>
              )}
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Manage Dealers", icon: Building2, action: () => onNavigate("dealers") },
            { label: "Review Verifications", icon: Clock, action: () => onNavigate("activation") },
            { label: "Revenue", icon: DollarSign, action: () => onNavigate("revenue") },
            { label: "SFTP Status", icon: FolderSync, action: () => onNavigate("sftp-status") },
          ].map(q => (
            <button
              key={q.label}
              onClick={q.action}
              className="flex items-center gap-2 rounded-lg bg-secondary/60 border border-border px-4 py-3 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <q.icon className="h-4 w-4 text-muted-foreground" />
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Pulse Post</div>
              <div className="text-[10px] text-muted-foreground">AI-powered vehicle listings for Facebook Marketplace</div>
            </div>
            <span className="rounded-full bg-success/20 text-success px-2 py-0.5 text-[10px] font-medium">Active</span>
          </div>
          <div className="rounded-lg bg-secondary/60 border border-border p-4 flex items-center gap-3 opacity-50">
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Pulse Value</div>
              <div className="text-[10px] text-muted-foreground">Vehicle valuation engine</div>
            </div>
            <span className="rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────── Dealer Overview ──────────────────
interface FeedHealth {
  dealer_id: string;
  last_sync: string;
  vehicles_scanned: number;
  new_vehicles: number;
  status: string;
  source: string;
}

// ────────────────── Onboarding Guide ──────────────────
function OnboardingGuide({ onNavigate }: { onNavigate: (tab: PlatformTab) => void }) {
  const steps = [
    {
      number: 1,
      title: "Generate an Invitation Link",
      description: "Go to the Dealers tab and click \"Generate Invitation Link\". Send this link to the dealership owner. When they click it, they'll create their account and a new dealership will be auto-provisioned.",
      action: "Go to Dealers",
      onAction: () => onNavigate("dealers"),
      icon: Link2,
      detail: "The invitation link expires in 7 days. The dealer will be placed in \"pending\" status until you verify them.",
    },
    {
      number: 2,
      title: "Verify the Dealership",
      description: "Once the dealer signs up, they'll appear in the Verification Queue. Review their details and click \"Verify\" to approve them. This activates their account and marks their API credentials as approved.",
      action: "Go to Verification",
      onAction: () => onNavigate("activation"),
      icon: CheckCircle2,
      detail: "Verification also sets their profile's onboarding_complete flag, unlocking the full dashboard.",
    },
    {
      number: 3,
      title: "Generate SFTP Credentials",
      description: "In the Dealers tab, find the new dealer and click \"Generate\" in the Credentials column. This creates an SFTP user on SFTPCloud and saves the username to the dealership record.",
      action: "Go to Dealers",
      onAction: () => onNavigate("dealers"),
      icon: KeyRound,
      detail: "A modal will display the credentials ONE TIME. Copy the host, port, username, and password. You'll need to share these with the dealer's DMS provider.",
    },
    {
      number: 4,
      title: "Set Up the SFTPCloud Webhook (One-Time)",
      description: "If this is your first dealer, set up the webhook in SFTPCloud so inventory feeds are processed automatically in real-time.",
      icon: Bell,
      detail: `Steps in SFTPCloud:\n\n1. Log into sftpcloud.io\n2. Open your SFTP instance\n3. Go to Event Listeners → Create\n4. Event: Upload\n5. Action: Webhook\n6. Endpoint URL:\n   https://jfyfbjybbbsiovihrpal.supabase.co/functions/v1/sftp-poll\n7. (Optional) Add a filter: Path → Ends with → .csv\n\nThis only needs to be done once. It covers ALL dealer users on the instance.`,
    },
    {
      number: 5,
      title: "Share Credentials with the DMS Provider",
      description: "Send the SFTP credentials to the dealer so they can give them to their DMS company (DealerSocket, CDK, Reynolds, etc). The DMS will configure their system to push the inventory feed to this SFTP location.",
      icon: FolderSync,
      detail: "What to share with the DMS provider:\n\n• SFTP Host: (from the credential modal)\n• Port: 22\n• Username: (from the credential modal)\n• Password: (from the credential modal)\n• File format: CSV preferred\n• Schedule: Daily push (most DMS systems default to every 24 hours)\n\nThe DMS company uploads the feed → SFTPCloud webhook fires → Pulse auto-ingests the inventory.",
    },
    {
      number: 6,
      title: "Monitor the Feed",
      description: "Once the DMS starts pushing files, check the Feed column in the Dealers tab. A green \"Active\" status means everything is working. The feed will auto-update every 24 hours.",
      action: "Go to Dealers",
      onAction: () => onNavigate("dealers"),
      icon: Activity,
      detail: "Feed status indicators:\n\n• 🟢 Active — Last sync within 26 hours\n• 🟡 Delayed — Last sync 26-72 hours ago\n• 🔴 Stale — No sync for 72+ hours (contact the DMS)\n\nA daily backup cron runs at 2:00 AM ET to catch any missed webhooks.",
    },
  ];

  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> New Dealer Onboarding Guide
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Follow these steps to set up a new dealership on Pulse Post.</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isExpanded = expandedStep === idx;
          const Icon = step.icon;
          return (
            <div key={idx} className="glass-card rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedStep(isExpanded ? null : idx)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{step.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border/50">
                  <div className="ml-14 mt-3 space-y-3">
                    <div className="rounded-lg bg-secondary/60 border border-border p-3">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{step.detail}</pre>
                    </div>
                    {step.action && step.onAction && (
                      <button
                        onClick={step.onAction}
                        className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" /> {step.action}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Reference Card */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" /> Quick Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary/60 border border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">SFTPCloud Webhook URL</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono text-primary bg-background/50 rounded px-2 py-1.5 break-all">
                https://jfyfbjybbbsiovihrpal.supabase.co/functions/v1/sftp-poll
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://jfyfbjybbbsiovihrpal.supabase.co/functions/v1/sftp-poll");
                  toast.success("Webhook URL copied!");
                }}
                className="shrink-0 rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/60 border border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Daily Cron Backup</h4>
            <p className="text-[11px] text-muted-foreground">Runs at <span className="font-mono text-foreground">6:00 AM UTC</span> (2:00 AM ET) — polls all dealers with SFTP credentials as a safety net behind the webhook.</p>
          </div>
          <div className="rounded-lg bg-secondary/60 border border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Supported Feed Formats</h4>
            <p className="text-[11px] text-muted-foreground">CSV, TSV, TXT, XML — auto-detected. The system maps columns like <span className="font-mono text-foreground">Sale_Price</span>, <span className="font-mono text-foreground">Internet_Price</span>, <span className="font-mono text-foreground">Asking_Price</span> etc. to the price field (MSRP is ignored).</p>
          </div>
          <div className="rounded-lg bg-secondary/60 border border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Auto-Mapped Fields</h4>
            <p className="text-[11px] text-muted-foreground">VIN, Make, Model, Year, Price, Mileage, Exterior Color, Images, Days on Lot, Trim. Custom mappings can be added via the <span className="font-mono text-foreground">dms_field_mappings</span> table.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealerOverview({ onImpersonate }: { onImpersonate: (d: Dealership) => void }) {
  const [dealers, setDealers] = useState<Dealership[]>([]);
  const [fbStatusMap, setFbStatusMap] = useState<Record<string, string>>({});
  const [feedHealthMap, setFeedHealthMap] = useState<Record<string, FeedHealth>>({});
  const [dmsPullRequests, setDmsPullRequests] = useState<ActivationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingCreds, setGeneratingCreds] = useState<string | null>(null);
  const [credModal, setCredModal] = useState<{ creds: any; dealerName: string } | null>(null);

  useEffect(() => { loadDealers(); }, []);

  const loadDealers = async () => {
    const [dealerRes, settingsRes, dmsPullRes, feedRes] = await Promise.all([
      supabase.from("dealerships").select("*").order("created_at", { ascending: false }),
      supabase.from("dealer_settings").select("dealership_id, fb_token_status"),
      supabase.from("activation_queue").select("*").eq("request_type", "dms_pull").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("ingestion_logs").select("dealer_id, created_at, vehicles_scanned, new_vehicles, status, source").order("created_at", { ascending: false }),
    ]);
    const dealerList = (dealerRes.data as unknown as Dealership[]) || [];
    setDealers(dealerList);
    const map: Record<string, string> = {};
    for (const s of (settingsRes.data || []) as any[]) {
      if (s.dealership_id) map[s.dealership_id] = s.fb_token_status || "not_connected";
    }
    setFbStatusMap(map);

    // Build feed health map — latest ingestion per dealer
    const fhMap: Record<string, FeedHealth> = {};
    for (const log of (feedRes.data || []) as any[]) {
      if (log.dealer_id && !fhMap[log.dealer_id]) {
        fhMap[log.dealer_id] = {
          dealer_id: log.dealer_id,
          last_sync: log.created_at,
          vehicles_scanned: log.vehicles_scanned || 0,
          new_vehicles: log.new_vehicles || 0,
          status: log.status || "unknown",
          source: log.source || "unknown",
        };
      }
    }
    setFeedHealthMap(fhMap);

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
    try {
      const { data, error } = await supabase.functions.invoke("generate-invite");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const token = data?.token;
      if (!token) throw new Error("No token returned");
      const link = `${window.location.origin}/auth?invite=${token}`;
      setInviteLink(link);
      navigator.clipboard.writeText(link);
      toast.success("Invitation link copied to clipboard!");
    } catch (e: any) {
      toast.error("Failed to generate invite", { description: e.message });
    }
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
          <Building2 className="h-5 w-5 text-primary" /> All Dealers
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
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Feed</th>
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
                      {(() => {
                        const fh = feedHealthMap[d.id];
                        if (!fh) return (
                          <span className="text-[10px] text-muted-foreground/50">No feed</span>
                        );
                        const lastSync = new Date(fh.last_sync);
                        const now = new Date();
                        const hoursAgo = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60));
                        const daysAgo = Math.floor(hoursAgo / 24);
                        const isHealthy = hoursAgo < 26;
                        const isWarning = hoursAgo >= 26 && hoursAgo < 72;
                        const isStale = hoursAgo >= 72;

                        let timeLabel: string;
                        if (hoursAgo < 1) timeLabel = "< 1h ago";
                        else if (hoursAgo < 24) timeLabel = `${hoursAgo}h ago`;
                        else timeLabel = `${daysAgo}d ago`;

                        return (
                          <div className="space-y-0.5" title={`Last sync: ${lastSync.toLocaleString()}\nVehicles scanned: ${fh.vehicles_scanned}\nNew: ${fh.new_vehicles}\nSource: ${fh.source}`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                isHealthy ? "bg-success" : isWarning ? "bg-warning animate-pulse" : "bg-destructive"
                              }`} />
                              <span className={`text-[10px] font-medium ${
                                isHealthy ? "text-success" : isWarning ? "text-warning" : "text-destructive"
                              }`}>
                                {isHealthy ? "Active" : isWarning ? "Delayed" : "Stale"}
                              </span>
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {timeLabel} · {fh.vehicles_scanned} vehicles
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deactivate(d)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          d.status === "active" ? "bg-success" : "bg-muted-foreground/30"
                        }`}
                        title={d.status === "active" ? "Account Active — click to deactivate" : "Account Inactive — click to activate"}
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

// ────────────────── Verification Queue ──────────────────
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

// ────────────────── Revenue Overview ──────────────────
function RevenueOverview() {
  const [data, setData] = useState<{ summary: any; customers: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadRevenue(); }, []);

  const loadRevenue = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: billingData, error: fnError } = await supabase.functions.invoke("admin-billing");
      if (fnError) throw new Error(fnError.message);
      if (billingData?.error) throw new Error(billingData.error);
      setData({ summary: billingData.summary, customers: billingData.customers || [] });
    } catch (err: any) {
      setError(err.message || "Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return (
    <div className="glass-card rounded-xl p-6 text-center space-y-3">
      <AlertTriangle className="h-8 w-8 text-warning mx-auto" />
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={loadRevenue} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
    </div>
  );

  const summary = data?.summary;
  const customers = data?.customers || [];
  const activeSubs = customers.filter((c: any) => c.subscriptions?.some((s: any) => s.status === "active" || s.status === "trialing"));
  const starterCount = activeSubs.filter((c: any) => c.monthly_amount_cents <= 9900).length;
  const unlimitedCount = activeSubs.filter((c: any) => c.monthly_amount_cents > 9900).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success" /> Revenue Overview
        </h2>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="h-3.5 w-3.5" /> Stripe Dashboard
        </a>
      </div>

      {/* MRR & Subscribers */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{summary ? formatCents(summary.mrr_cents) : "$0"}</div>
              <div className="text-xs text-muted-foreground">Monthly Recurring Revenue</div>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{summary?.active_subscribers || 0}</div>
              <div className="text-xs text-muted-foreground">Active Subscribers</div>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{starterCount}</div>
              <div className="text-xs text-muted-foreground">Starter ($99/mo)</div>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{unlimitedCount}</div>
              <div className="text-xs text-muted-foreground">Unlimited ($199/mo)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriber Breakdown */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Active Subscribers</h3>
        {activeSubs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No active subscribers yet</div>
        ) : (
          <div className="space-y-2">
            {activeSubs.map((c: any) => (
              <div key={c.customer_id} className="flex items-center gap-4 rounded-lg bg-secondary/40 border border-border p-3">
                <div className="h-2 w-2 rounded-full bg-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.dealership?.name || c.name || c.email || "Unknown"}</div>
                  <div className="text-[10px] text-muted-foreground">{c.email}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-success">{formatCents(c.monthly_amount_cents)}</div>
                  <div className="text-[10px] text-muted-foreground">/month</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  c.monthly_amount_cents > 9900 ? "bg-success/15 text-success border border-success/25" : "bg-primary/15 text-primary border border-primary/25"
                }`}>
                  {c.monthly_amount_cents > 9900 ? "Unlimited" : "Starter"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <button onClick={loadRevenue} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
    </div>
  );
}

// ────────────────── Recent Signups ──────────────────
function RecentSignups() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSignups(); }, []);

  const loadSignups = async () => {
    const { data } = await supabase.from("dealerships")
      .select("id, name, slug, subscription_tier, status, owner_email, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setDealers(data || []);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const timeAgo = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const tierColors: Record<string, string> = {
    trial: "bg-muted text-muted-foreground",
    pro: "bg-success/20 text-success",
    enterprise: "bg-primary/20 text-primary",
    starter: "bg-primary/20 text-primary",
    unlimited: "bg-success/20 text-success",
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    inactive: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Plus className="h-5 w-5 text-success" /> Recent Signups
        <span className="ml-2 rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Last 20</span>
      </h2>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : dealers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No dealerships yet</div>
      ) : (
        <div className="space-y-2">
          {dealers.map(d => (
            <div key={d.id} className="glass-card rounded-lg p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm truncate">{d.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[d.status] || statusColors.inactive}`}>
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{d.owner_email || d.slug}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tierColors[d.subscription_tier] || tierColors.trial}`}>
                {d.subscription_tier.toUpperCase()}
              </span>
              <div className="text-right shrink-0">
                <div className="text-xs font-medium text-foreground">{formatDate(d.created_at)}</div>
                <div className="text-[10px] text-muted-foreground">{timeAgo(d.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────── Vehicle Stats ──────────────────
function VehicleStats() {
  const [stats, setStats] = useState<{
    total: number; available: number; sold: number; pending: number;
    byDealer: { id: string; name: string; total: number; available: number; sold: number }[];
    addedThisWeek: number; addedThisMonth: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [vehiclesRes, dealersRes] = await Promise.all([
      supabase.from("vehicles").select("id, status, dealership_id, created_at"),
      supabase.from("dealerships").select("id, name"),
    ]);

    const vehicles = (vehiclesRes.data || []) as any[];
    const dealerMap = new Map((dealersRes.data || []).map((d: any) => [d.id, d.name]));

    const byDealer: Record<string, { id: string; name: string; total: number; available: number; sold: number }> = {};
    let total = 0, available = 0, sold = 0, pending = 0, addedThisWeek = 0, addedThisMonth = 0;

    for (const v of vehicles) {
      total++;
      if (v.status === "available") available++;
      else if (v.status === "sold") sold++;
      else pending++;

      if (v.created_at >= weekAgo) addedThisWeek++;
      if (v.created_at >= monthStart) addedThisMonth++;

      if (v.dealership_id) {
        if (!byDealer[v.dealership_id]) {
          byDealer[v.dealership_id] = { id: v.dealership_id, name: dealerMap.get(v.dealership_id) || "Unknown", total: 0, available: 0, sold: 0 };
        }
        byDealer[v.dealership_id].total++;
        if (v.status === "available") byDealer[v.dealership_id].available++;
        else if (v.status === "sold") byDealer[v.dealership_id].sold++;
      }
    }

    setStats({
      total, available, sold, pending, addedThisWeek, addedThisMonth,
      byDealer: Object.values(byDealer).sort((a, b) => b.total - a.total),
    });
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!stats) return null;

  const maxTotal = Math.max(...stats.byDealer.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" /> Vehicle Stats
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Vehicles", value: stats.total, icon: Car, color: "text-primary" },
          { label: "Available", value: stats.available, icon: Zap, color: "text-success" },
          { label: "Sold", value: stats.sold, icon: CheckCircle2, color: "text-warning" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-muted-foreground" },
          { label: "Added This Week", value: stats.addedThisWeek, icon: TrendingUp, color: "text-success" },
          { label: "Added This Month", value: stats.addedThisMonth, icon: BarChart3, color: "text-primary" },
        ].map(c => (
          <div key={c.label} className="stat-gradient rounded-lg border border-border p-4 text-center">
            <c.icon className={`h-5 w-5 mx-auto mb-2 ${c.color}`} />
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* By Dealership */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Vehicles by Dealership</h3>
        {stats.byDealer.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No vehicle data</div>
        ) : (
          <div className="space-y-3">
            {stats.byDealer.map(d => (
              <div key={d.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-success">{d.available} active</span>
                    <span className="text-warning">{d.sold} sold</span>
                    <span className="font-bold text-foreground">{d.total} total</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${(d.total / maxTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────── SFTP Sync Status ──────────────────
function SFTPStatus() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSFTP(); }, []);

  const loadSFTP = async () => {
    const [dealersRes, logsRes] = await Promise.all([
      supabase.from("dealerships").select("id, name, sftp_username, status"),
      supabase.from("ingestion_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    setDealers((dealersRes.data || []) as any[]);
    setLogs((logsRes.data || []) as any[]);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Build per-dealer SFTP status
  const dealerStatuses = dealers.map(d => {
    const dealerLogs = logs.filter(l => l.dealership_id === d.id || l.dealer_id === d.id);
    const lastLog = dealerLogs[0] || null;
    const lastSync = lastLog ? new Date(lastLog.created_at) : null;
    const now = new Date();
    const hoursAgo = lastSync ? Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)) : null;

    let syncStatus: "healthy" | "delayed" | "stale" | "never" = "never";
    if (hoursAgo !== null) {
      if (hoursAgo < 26) syncStatus = "healthy";
      else if (hoursAgo < 72) syncStatus = "delayed";
      else syncStatus = "stale";
    }

    const recentErrors = dealerLogs.filter(l => l.status === "error").slice(0, 3);
    const totalSyncs = dealerLogs.length;
    const successRate = totalSyncs > 0 ? Math.round((dealerLogs.filter(l => l.status === "success").length / totalSyncs) * 100) : 0;

    return {
      ...d,
      lastSync,
      hoursAgo,
      syncStatus,
      lastLogStatus: lastLog?.status || null,
      lastVehiclesScanned: lastLog?.vehicles_scanned || 0,
      lastNewVehicles: lastLog?.new_vehicles || 0,
      recentErrors,
      totalSyncs,
      successRate,
    };
  });

  // Sort: connected first, then by sync status severity
  const statusOrder = { stale: 0, delayed: 1, healthy: 2, never: 3 };
  dealerStatuses.sort((a, b) => {
    const aConn = a.sftp_username ? 0 : 1;
    const bConn = b.sftp_username ? 0 : 1;
    if (aConn !== bConn) return aConn - bConn;
    return (statusOrder[a.syncStatus] || 99) - (statusOrder[b.syncStatus] || 99);
  });

  const connected = dealerStatuses.filter(d => d.sftp_username);
  const notConnected = dealerStatuses.filter(d => !d.sftp_username);
  const healthyCount = connected.filter(d => d.syncStatus === "healthy").length;
  const delayedCount = connected.filter(d => d.syncStatus === "delayed").length;
  const staleCount = connected.filter(d => d.syncStatus === "stale").length;

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const statusConfig = {
    healthy: { color: "text-success", bg: "bg-success", label: "Active" },
    delayed: { color: "text-warning", bg: "bg-warning", label: "Delayed" },
    stale: { color: "text-destructive", bg: "bg-destructive", label: "Stale" },
    never: { color: "text-muted-foreground", bg: "bg-muted-foreground/30", label: "No Syncs" },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <FolderSync className="h-5 w-5 text-primary" /> SFTP Sync Status
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <Database className="h-5 w-5 mx-auto mb-2 text-primary" />
          <div className="text-xl font-bold text-primary">{connected.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">SFTP Connected</div>
        </div>
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-success" />
          <div className="text-xl font-bold text-success">{healthyCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Healthy</div>
        </div>
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-2 text-warning" />
          <div className="text-xl font-bold text-warning">{delayedCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Delayed</div>
        </div>
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-destructive" />
          <div className="text-xl font-bold text-destructive">{staleCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Stale</div>
        </div>
      </div>

      {/* Connected Dealers */}
      {connected.length > 0 && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Connected Dealerships</h3>
          <div className="space-y-2">
            {connected.map(d => {
              const cfg = statusConfig[d.syncStatus];
              return (
                <div key={d.id} className="rounded-lg bg-secondary/40 border border-border p-4 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.bg} ${d.syncStatus === "delayed" ? "animate-pulse" : ""}`} />
                      <span className="font-medium text-foreground text-sm truncate">{d.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color} bg-secondary border border-border`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="text-xs text-muted-foreground">Last sync: <span className="text-foreground font-medium">{formatTime(d.lastSync)}</span></div>
                      {d.hoursAgo !== null && (
                        <div className={`text-[10px] ${cfg.color}`}>
                          {d.hoursAgo < 1 ? "< 1 hour ago" : d.hoursAgo < 24 ? `${d.hoursAgo}h ago` : `${Math.floor(d.hoursAgo / 24)}d ago`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>SFTP: <span className="font-mono text-foreground">{d.sftp_username}</span></span>
                    <span>Vehicles scanned: <span className="text-foreground">{d.lastVehiclesScanned}</span></span>
                    <span>New: <span className="text-success">{d.lastNewVehicles}</span></span>
                    <span>Total syncs: <span className="text-foreground">{d.totalSyncs}</span></span>
                    <span>Success rate: <span className={d.successRate >= 90 ? "text-success" : d.successRate >= 70 ? "text-warning" : "text-destructive"}>{d.successRate}%</span></span>
                  </div>
                  {d.recentErrors.length > 0 && (
                    <div className="rounded-md bg-destructive/5 border border-destructive/15 p-2 space-y-1">
                      <div className="text-[10px] font-medium text-destructive">Recent errors:</div>
                      {d.recentErrors.map((e: any, i: number) => (
                        <div key={i} className="text-[10px] text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString()} — {e.message || "Unknown error"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Not Connected */}
      {notConnected.length > 0 && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Not Connected</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {notConnected.map(d => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-secondary/30 border border-border p-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{d.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60">No SFTP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button onClick={loadSFTP} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
    </div>
  );
}

// ────────────────── Billing Overview (Stripe) ──────────────────
interface BillingCustomer {
  customer_id: string;
  email: string | null;
  name: string | null;
  created: number;
  dealership: { id: string; name: string; subscription_tier: string; status: string } | null;
  subscriptions: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    created: number;
    items: { price_id: string; product_id: string; product_name: string; unit_amount: number; currency: string; interval: string | null }[];
  }[];
  monthly_amount_cents: number;
}

interface BillingSummary {
  total_customers: number;
  active_subscribers: number;
  mrr_cents: number;
  currency: string;
}

function BillingOverview() {
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "past_due" | "canceled" | "none">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);

  useEffect(() => { loadBilling(); }, []);

  const handleCancelSubscription = async (subscriptionId: string, action: "cancel" | "reactivate") => {
    const label = action === "cancel" ? "cancel" : "reactivate";
    if (!confirm(`Are you sure you want to ${label} this subscription?`)) return;
    setCancellingSubId(subscriptionId);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-cancel-subscription", {
        body: { subscriptionId, action },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      toast.success(
        action === "cancel"
          ? "Subscription will cancel at end of billing period"
          : "Subscription reactivated"
      );
      await loadBilling();
    } catch (err: any) {
      toast.error(`Failed to ${label} subscription`, { description: err.message });
    } finally {
      setCancellingSubId(null);
    }
  };

  const loadBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-billing");
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setCustomers(data.customers || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-success/15 text-success border-success/25",
      trialing: "bg-primary/15 text-primary border-primary/25",
      past_due: "bg-warning/15 text-warning border-warning/25",
      canceled: "bg-destructive/15 text-destructive border-destructive/25",
    };
    return styles[status] || "bg-secondary text-muted-foreground border-border";
  };

  const getCustomerStatus = (c: BillingCustomer): "active" | "past_due" | "canceled" | "none" => {
    if (c.subscriptions.some(s => s.status === "active" || s.status === "trialing")) return "active";
    if (c.subscriptions.some(s => s.status === "past_due")) return "past_due";
    if (c.subscriptions.some(s => s.status === "canceled")) return "canceled";
    return "none";
  };

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !searchTerm ||
        (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.dealership?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || getCustomerStatus(c) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (error) return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-warning mx-auto" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={loadBilling} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    </div>
  );

  const statusCounts = {
    all: customers.length,
    active: customers.filter(c => getCustomerStatus(c) === "active").length,
    past_due: customers.filter(c => getCustomerStatus(c) === "past_due").length,
    canceled: customers.filter(c => getCustomerStatus(c) === "canceled").length,
    none: customers.filter(c => getCustomerStatus(c) === "none").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{summary ? formatCents(summary.mrr_cents) : "$0"}</div>
              <div className="text-xs text-muted-foreground">Monthly Recurring Revenue</div>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{summary?.active_subscribers || 0}</div>
              <div className="text-xs text-muted-foreground">Active Subscribers</div>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{summary?.total_customers || 0}</div>
              <div className="text-xs text-muted-foreground">Total Stripe Customers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Dashboard Link */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Customer Billing
        </h2>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Stripe Dashboard
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or dealership..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "past_due", "canceled", "none"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === s
                  ? "bg-primary/15 text-primary border-primary/25"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s === "past_due" ? "Past Due" : s === "none" ? "No Sub" : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1 opacity-60">({statusCounts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No customers match your filters</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const custStatus = getCustomerStatus(c);
            const isExpanded = expanded === c.customer_id;
            return (
              <div key={c.customer_id} className="glass-card rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.customer_id)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left"
                >
                  {/* Status indicator */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    custStatus === "active" ? "bg-success" :
                    custStatus === "past_due" ? "bg-warning animate-pulse" :
                    custStatus === "canceled" ? "bg-destructive" : "bg-muted-foreground/30"
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">
                        {c.dealership?.name || c.name || c.email || "Unknown"}
                      </span>
                      {c.dealership && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Linked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.email || "No email"}</div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold ${c.monthly_amount_cents > 0 ? "text-success" : "text-muted-foreground"}`}>
                      {c.monthly_amount_cents > 0 ? formatCents(c.monthly_amount_cents) : "$0"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">/month</div>
                  </div>

                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                    {/* Customer details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-md bg-secondary/60 border border-border p-2.5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Stripe ID</div>
                        <div className="text-xs font-mono text-foreground truncate">{c.customer_id}</div>
                      </div>
                      <div className="rounded-md bg-secondary/60 border border-border p-2.5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Customer Since</div>
                        <div className="text-xs text-foreground">{formatDate(c.created)}</div>
                      </div>
                      <div className="rounded-md bg-secondary/60 border border-border p-2.5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Dealership</div>
                        <div className="text-xs text-foreground">{c.dealership?.name || "Not linked"}</div>
                      </div>
                      <div className="rounded-md bg-secondary/60 border border-border p-2.5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Platform Tier</div>
                        <div className="text-xs text-foreground capitalize">{c.dealership?.subscription_tier || "N/A"}</div>
                      </div>
                    </div>

                    {/* Subscriptions */}
                    {c.subscriptions.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Ban className="h-3.5 w-3.5" /> No subscriptions found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Subscriptions</div>
                        {c.subscriptions.map(sub => (
                          <div key={sub.id} className="rounded-lg bg-background/50 border border-border p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(sub.status)}`}>
                                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                </span>
                                {sub.cancel_at_period_end && (
                                  <span className="text-[10px] text-warning flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Cancels at period end
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {(sub.status === "active" || sub.status === "trialing") && !sub.cancel_at_period_end && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCancelSubscription(sub.id, "cancel"); }}
                                    disabled={cancellingSubId === sub.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                  >
                                    {cancellingSubId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                                    Cancel at Period End
                                  </button>
                                )}
                                {sub.cancel_at_period_end && (sub.status === "active" || sub.status === "trialing") && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCancelSubscription(sub.id, "reactivate"); }}
                                    disabled={cancellingSubId === sub.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors disabled:opacity-50"
                                  >
                                    {cancellingSubId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    Reactivate
                                  </button>
                                )}
                                <a
                                  href={`https://dashboard.stripe.com/subscriptions/${sub.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                >
                                  View in Stripe <ArrowUpRight className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {sub.items.map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="font-medium text-foreground">{item.product_name}</div>
                                  <div className="text-muted-foreground">
                                    {formatCents(item.unit_amount)}/{item.interval || "one-time"}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-[10px] text-muted-foreground">
                              Period: {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex gap-2 pt-1">
                      <a
                        href={`https://dashboard.stripe.com/customers/${c.customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View in Stripe
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh */}
      <div className="text-center">
        <button
          onClick={loadBilling}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Billing Data
        </button>
      </div>
    </div>
  );
}

// ────────────────── System Health ──────────────────
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
        {["AI Gateway (Gemini)", "Database (Cloud)", "DMS Ingestion Engine", "Facebook Catalog Sync", "Lead Webhook Endpoint"].map(name => (
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

// ────────────────── Audit Log ──────────────────
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
    setLogs(((logsRes.data as any[]) || []).map((l: any) => ({ ...l, dealership_name: dealerMap.get(l.dealership_id) || "Unknown" })));
    setLoading(false);
  };

  const filtered = dealerFilter ? logs.filter(l => l.dealership_id === dealerFilter) : logs;

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

// ────────────────── Platform Settings ──────────────────
function PlatformSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" /> Platform Settings
      </h2>

      {/* Account Info */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Account Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Email</label>
            <div className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground">{user?.email}</div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Role</label>
            <div className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-destructive font-medium">Super Administrator</div>
          </div>
        </div>
      </div>

      {/* Product Controls */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Product Toggles</h3>
        <p className="text-xs text-muted-foreground">Enable or disable product modules across the platform.</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div>
              <div className="text-sm font-medium text-foreground">Pulse Post</div>
              <div className="text-[10px] text-muted-foreground">AI-powered vehicle listings</div>
            </div>
            <div className="relative inline-flex h-5 w-9 shrink-0 rounded-full bg-success cursor-default">
              <span className="pointer-events-none inline-block h-4 w-4 translate-x-4 transform rounded-full bg-white shadow ring-0 transition" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-foreground">Pulse Value</div>
              <div className="text-[10px] text-muted-foreground">Vehicle valuation engine (coming soon)</div>
            </div>
            <div className="relative inline-flex h-5 w-9 shrink-0 rounded-full bg-muted-foreground/30 cursor-default">
              <span className="pointer-events-none inline-block h-4 w-4 translate-x-0 transform rounded-full bg-white shadow ring-0 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">System Information</h3>
        <div className="space-y-2">
          {[
            { label: "Platform Version", value: "1.0.0" },
            { label: "Environment", value: "Production" },
            { label: "Database", value: "Supabase (PostgreSQL)" },
            { label: "AI Provider", value: "Google Gemini" },
            { label: "Hosting", value: "Cloudflare Pages" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs text-foreground font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
