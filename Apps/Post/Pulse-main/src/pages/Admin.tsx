import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Shield, ArrowLeft, Users, BarChart3, Settings, Car,
  Loader2, Search, CheckCircle2, XCircle, Trash2,
  Plus, Phone, Mail,
} from "lucide-react";
import { StaffPostingAnalytics } from "@/components/StaffPostingAnalytics";

// ── Types ──────────────────────────────────────────────
interface StaffMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  dealership_id: string;
}

// ── Admin PIN Guard ────────────────────────────────────
const ADMIN_PIN = "autopilot2026";

function AdminPinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("admin_unlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Dealer Admin</h1>
        </div>
        <p className="text-xs text-muted-foreground text-center">Enter admin passphrase to continue</p>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false); }}
          placeholder="Admin passphrase"
          autoFocus
          className={`w-full rounded-lg bg-secondary border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${error ? "border-destructive ring-destructive/50" : "border-border"}`}
        />
        {error && <p className="text-xs text-destructive text-center">Invalid passphrase</p>}
        <button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
          Unlock Dashboard
        </button>
      </form>
    </div>
  );
}

// ── Tab types ──────────────────────────────────────────
type AdminTab = "analytics" | "staff" | "inventory";

// ── Main Admin Page ────────────────────────────────────
export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("admin_unlocked") === "true");

  if (!unlocked) return <AdminPinGate onUnlock={() => setUnlocked(true)} />;
  return <AdminContent />;
}

function AdminContent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tab, setTab] = useState<AdminTab>("analytics");

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: "analytics", label: "Posting Analytics", icon: BarChart3 },
    { key: "staff", label: "Staff Management", icon: Users },
    { key: "inventory", label: "Inventory Overview", icon: Car },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 border border-primary/30">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Dealer Admin</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                {profile?.full_name || "Dashboard"}
              </p>
            </div>
          </div>
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
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {tab === "analytics" && <StaffPostingAnalytics />}
        {tab === "staff" && <StaffManagement />}
        {tab === "inventory" && <InventoryOverview />}
      </div>
    </div>
  );
}

// ── Staff Management Tab ───────────────────────────────
function StaffManagement() {
  const { profile } = useAuth();
  const dealerId = profile?.dealership_id;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "salesperson" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dealerId) loadStaff();
  }, [dealerId]);

  const loadStaff = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("dealership_id", dealerId)
      .order("created_at", { ascending: false });
    setStaff((data as unknown as StaffMember[]) || []);
    setLoading(false);
  };

  const filtered = useMemo(() =>
    staff.filter(s => {
      const q = search.toLowerCase();
      return (s.full_name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
    }),
    [staff, search]
  );

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("staff_invitations").insert({
        dealership_id: dealerId,
        full_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
      });
      if (error) throw error;
      toast.success(`Invitation sent to ${form.name}`);
      setForm({ name: "", email: "", phone: "", role: "salesperson" });
      setShowAdd(false);
      loadStaff();
    } catch (e: any) {
      toast.error("Failed to invite staff", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: StaffMember) => {
    const newStatus = !s.is_active;
    await supabase.from("profiles").update({ is_active: newStatus }).eq("id", s.id);
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, is_active: newStatus } : x));
    toast.success(`${s.full_name} ${newStatus ? "activated" : "deactivated"}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Staff Management
          <span className="ml-2 rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{staff.length} members</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="rounded-md bg-secondary border border-border pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
            />
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Invite Staff
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-card rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Invite New Staff Member</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name *" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone (optional)" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="salesperson">Salesperson</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Sending..." : "Send Invitation"}
            </button>
            <button onClick={() => setShowAdd(false)} className="rounded-md bg-secondary border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading staff...</div>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{s.full_name || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" /> {s.email}
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {s.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] font-medium text-foreground">
                        {s.role || "staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${s.is_active !== false ? "text-success" : "text-muted-foreground"}`}>
                        {s.is_active !== false ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {s.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          s.is_active !== false ? "bg-success" : "bg-muted-foreground/30"
                        }`}
                        title={s.is_active !== false ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          s.is_active !== false ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      {search ? "No staff matching your search" : "No staff members yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inventory Overview Tab ─────────────────────────────
function InventoryOverview() {
  const { profile } = useAuth();
  const dealerId = profile?.dealership_id;
  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dealerId) loadStats();
  }, [dealerId]);

  const loadStats = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("id, status")
      .eq("dealership_id", dealerId);

    const vehicles = (data || []) as any[];
    setStats({
      total: vehicles.length,
      available: vehicles.filter(v => v.status === "available").length,
      sold: vehicles.filter(v => v.status === "sold").length,
      pending: vehicles.filter(v => v.status === "pending" || v.status === "processing").length,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total Vehicles", value: stats.total, icon: Car, color: "text-foreground" },
    { label: "Available", value: stats.available, icon: CheckCircle2, color: "text-success" },
    { label: "Sold", value: stats.sold, icon: XCircle, color: "text-warning" },
    { label: "Processing", value: stats.pending, icon: Loader2, color: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" /> Inventory Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="stat-gradient rounded-lg border border-border p-4 text-center">
            <c.icon className={`h-5 w-5 mx-auto mb-2 ${c.color}`} />
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground">
          View and manage your full inventory from the main dashboard.
        </p>
      </div>
    </div>
  );
}
