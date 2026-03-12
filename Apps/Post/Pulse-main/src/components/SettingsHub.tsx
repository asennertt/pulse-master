import { useState, useEffect } from "react";
import { DMSIntegrationWizard } from "@/components/DMSIntegrationWizard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Settings, Building2, Sparkles, Users, Save, Upload,
  Phone, Globe, MapPin, Palette, Trash2,
  Brain, Eye, Shield, Mail, CheckCircle2,
  Plus, Loader2, Database, Link2, Copy, BarChart3,
  Sun, Moon, Monitor,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/Contexts/ThemeContext";
import { useAuth } from "@/Contexts/AuthContext";

// ── Types ──────────────────────────────────────────────
type SettingsTab = "profile" | "dms" | "ai" | "users" | "appearance";

interface DealerSettings {
  id: string;
  dealership_name: string;
  dba: string;
  primary_phone: string;
  address: string;
  website_url: string;
  logo_url: string;
  brand_color: string;
  global_system_prompt: string;
  auto_blur_plates: boolean;
}

interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  created_at: string;
}

const defaultSettings: DealerSettings = {
  id: "",
  dealership_name: "",
  dba: "",
  primary_phone: "",
  address: "",
  website_url: "",
  logo_url: "",
  brand_color: "#1e90ff",
  global_system_prompt: "",
  auto_blur_plates: false,
};

export function SettingsHub() {
  const { activeDealerId } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [settings, setSettings] = useState<DealerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeDealerId) loadSettings();
  }, [activeDealerId]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("dealer_settings")
      .select("*")
      .eq("dealership_id", activeDealerId)
      .limit(1)
      .maybeSingle();
    if (data) setSettings(data as unknown as DealerSettings);
    setLoading(false);
  };

  const saveSettings = async (partial?: Partial<DealerSettings>) => {
    setSaving(true);
    const toSave = partial ? { ...settings, ...partial } : settings;
    const payload = {
      dealership_id: activeDealerId,
      dealership_name: toSave.dealership_name,
      dba: toSave.dba,
      primary_phone: toSave.primary_phone,
      address: toSave.address,
      website_url: toSave.website_url,
      logo_url: toSave.logo_url,
      brand_color: toSave.brand_color,
      global_system_prompt: toSave.global_system_prompt,
      auto_blur_plates: toSave.auto_blur_plates,
    };

    let error;
    if (settings.id) {
      // Existing row — update
      ({ error } = await supabase
        .from("dealer_settings")
        .update(payload)
        .eq("id", settings.id));
    } else {
      // No row yet — insert
      const { data: newRow, error: insertErr } = await supabase
        .from("dealer_settings")
        .insert(payload)
        .select()
        .single();
      error = insertErr;
      if (newRow) setSettings(prev => ({ ...prev, ...newRow } as DealerSettings));
    }
    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      if (partial) setSettings(prev => ({ ...prev, ...partial }));
      toast.success("Settings saved");
    }
  };

  const updateField = <K extends keyof DealerSettings>(key: K, value: DealerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Dealership Profile", icon: Building2 },
    { key: "dms", label: "DMS Integration", icon: Database },
    { key: "ai", label: "AI Customization", icon: Sparkles },
    { key: "users", label: "User Management", icon: Users },
    { key: "appearance", label: "Appearance", icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> Settings & Configuration
        </h2>
        {tab !== "users" && tab !== "dms" && tab !== "appearance" && (
          <button
            onClick={() => saveSettings()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center rounded-lg bg-secondary border border-border p-0.5 w-fit">
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

      {tab === "profile" && <DealershipProfile settings={settings} updateField={updateField} />}
      {tab === "dms" && <DMSIntegrationWizard />}
      {tab === "ai" && <AICustomization settings={settings} updateField={updateField} />}
      {tab === "users" && <UserManagement />}
      {tab === "appearance" && <AppearanceSettings />}
    </div>
  );
}

// ── Shared input style ────────────────────────────────
const inputCls = "w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

// ── Logo Uploader (Cloudinary) ──────────────────────
function LogoUploader({ logoUrl, onUploaded }: { logoUrl: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(logoUrl || null);
  const fileRef = useState<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "PulsePost");
      formData.append("folder", "pulse-logos");

      const res = await fetch("https://api.cloudinary.com/v1_1/dbfhx3and/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.secure_url;
      setPreview(url);
      onUploaded(url);
      toast.success("Logo uploaded successfully");
    } catch (err: any) {
      toast.error("Logo upload failed", { description: err.message });
      setPreview(logoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploaded("");
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dealership Logo</label>
      <div className="flex items-center gap-3">
        {preview ? (
          <div className="h-16 w-16 rounded-lg border border-border overflow-hidden bg-secondary flex items-center justify-center relative group">
            <img src={preview} alt="Logo" className="h-full w-full object-contain" />
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/50">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <label className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer w-fit">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : preview ? "Change Logo" : "Upload Logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {preview && (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Remove logo
            </button>
          )}
          <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG, or WebP. Displayed in the inventory header.</p>
        </div>
      </div>
    </div>
  );
}

// ── 1. Dealership Profile ──────────────────────────────
function DealershipProfile({
  settings,
  updateField,
}: {
  settings: DealerSettings;
  updateField: <K extends keyof DealerSettings>(k: K, v: DealerSettings[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dealership Name</label>
            <input
              value={settings.dealership_name}
              onChange={e => updateField("dealership_name", e.target.value)}
              placeholder="Sunshine Motors"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">DBA (Doing Business As)</label>
            <input
              value={settings.dba}
              onChange={e => updateField("dba", e.target.value)}
              placeholder="Sunshine Auto Group"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> Primary Phone</label>
            <input
              value={settings.primary_phone}
              onChange={e => updateField("primary_phone", e.target.value)}
              placeholder="(555) 123-4567"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Globe className="h-3 w-3" /> Website URL</label>
            <input
              value={settings.website_url}
              onChange={e => updateField("website_url", e.target.value)}
              placeholder="https://sunshinemotors.com"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</label>
            <input
              value={settings.address}
              onChange={e => updateField("address", e.target.value)}
              placeholder="1234 Auto Blvd, Dallas, TX 75201"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Branding
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LogoUploader logoUrl={settings.logo_url} onUploaded={(url) => updateField("logo_url", url)} />
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brand_color}
                onChange={e => updateField("brand_color", e.target.value)}
                className="h-10 w-14 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <input
                value={settings.brand_color}
                onChange={e => updateField("brand_color", e.target.value)}
                placeholder="#1e90ff"
                className={inputCls}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Applied to AI image overlays and branded content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. AI Customization ────────────────────────────────
function AICustomization({
  settings,
  updateField,
}: {
  settings: DealerSettings;
  updateField: <K extends keyof DealerSettings>(k: K, v: DealerSettings[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Global System Prompt Additions
        </h3>
        <div className="space-y-2">
          <textarea
            value={settings.global_system_prompt}
            onChange={e => updateField("global_system_prompt", e.target.value)}
            rows={6}
            placeholder={"Examples:\n• Always mention our 10-year warranty\n• Never mention financing options\n• Include our tagline: 'Drive Happy'\n• Focus on safety features for family vehicles"}
            className="w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-y min-h-[120px]"
          />
          <p className="text-[10px] text-muted-foreground">
            These instructions are appended to every AI-generated post. Use them to enforce brand voice, compliance rules, or promotional messaging.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" /> Image Processing
        </h3>
        <div className="flex items-center justify-between rounded-md bg-secondary/60 border border-border p-4">
          <div>
            <div className="text-sm font-medium text-foreground">Auto-Blur License Plates</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Automatically detect and blur license plates in vehicle photos before posting. Protects customer privacy.
            </div>
          </div>
          <Switch
            checked={settings.auto_blur_plates}
            onCheckedChange={v => updateField("auto_blur_plates", v)}
          />
        </div>
      </div>
    </div>
  );
}

// ── 4. User Management ─────────────────────────────────
function UserManagement() {
  const { activeDealerId } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "salesperson" });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [postingStats, setPostingStats] = useState<Record<string, number>>({});

  useEffect(() => { if (activeDealerId) { loadStaff(); loadPostingStats(); } }, [activeDealerId]);

  const loadStaff = async () => {
    const { data } = await supabase.from("staff").select("*").eq("dealer_id", activeDealerId).order("created_at", { ascending: true });
    setStaff((data as unknown as Staff[]) || []);
    setLoading(false);
  };

  const loadPostingStats = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("posted_by_staff_id")
      .eq("dealer_id", activeDealerId)
      .eq("synced_to_facebook", true)
      .not("posted_by_staff_id", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((v: any) => {
        counts[v.posted_by_staff_id] = (counts[v.posted_by_staff_id] || 0) + 1;
      });
      setPostingStats(counts);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("staff").insert({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
      dealer_id: activeDealerId,
    });
    if (error) { toast.error("Failed to add staff member"); return; }
    toast.success(`${form.name} added to team`);
    setForm({ name: "", email: "", phone: "", role: "salesperson" });
    setShowAdd(false);
    loadStaff();
  };

  const toggleActive = async (s: Staff) => {
    await supabase.from("staff").update({ active: !s.active }).eq("id", s.id);
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x));
  };

  const updateRole = async (s: Staff, newRole: string) => {
    await supabase.from("staff").update({ role: newRole }).eq("id", s.id);
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, role: newRole } : x));
    toast.success(`${s.name} updated to ${newRole}`);
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invite");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const link = `${window.location.origin}/auth?invite=${data.token}`;
      setInviteLink(link);
      toast.success("Invite link generated!");
    } catch (e: any) {
      toast.error("Failed to generate invite", { description: e.message });
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Invite Staff Section ── */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" /> Invite Staff to Join
        </h3>
        <p className="text-xs text-muted-foreground">
          Generate a shareable link to invite staff members. They'll create their own account and be automatically linked to your dealership.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateInvite}
            disabled={generatingInvite}
            className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generatingInvite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Generate Invite Link
          </button>
        </div>
        {inviteLink && (
          <div className="flex items-center gap-2 rounded-md bg-secondary border border-border p-3">
            <input
              value={inviteLink}
              readOnly
              className="flex-1 bg-transparent text-xs text-foreground font-mono focus:outline-none truncate"
            />
            <button
              onClick={copyInviteLink}
              className="shrink-0 flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
        )}
      </div>

      {/* ── Posting Stats Section ── */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Staff Posting Activity
        </h3>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
        ) : staff.length === 0 ? (
          <p className="text-xs text-muted-foreground">No staff members yet.</p>
        ) : (
          <div className="space-y-2">
            {staff.map(s => {
              const count = postingStats[s.id] || 0;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-secondary/60 border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${s.active ? "bg-success" : "bg-muted-foreground"}`} />
                    <div>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">{count}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">posted</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Staff Accounts Table ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Staff Accounts
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Staff
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name *" className={inputCls} />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className={inputCls} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="salesperson">Salesperson</option>
              <option value="manager">Manager</option>
            </select>
            <button onClick={handleAdd} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">Add</button>
            <button onClick={() => setShowAdd(false)} className="rounded-md bg-secondary border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading team...</div>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="text-center px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Posts</th>
                  <th className="text-center px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${!s.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{s.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.role}
                        onChange={e => updateRole(s, e.target.value)}
                        className={`rounded-md px-2 py-1 text-xs font-medium border ${
                          s.role === "admin"
                            ? "bg-destructive/10 border-destructive/20 text-destructive"
                            : s.role === "manager"
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-secondary border-border text-muted-foreground"
                        } focus:outline-none focus:ring-1 focus:ring-primary`}
                      >
                        <option value="salesperson">Salesperson</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {s.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</div>}
                        {s.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</div>}
                        {!s.email && !s.phone && <span className="text-muted-foreground/50">—</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-primary">{postingStats[s.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(s)}>
                        {s.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/30 px-2 py-0.5 text-[10px] font-medium text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Disabled
                          </span>
                        )}
                      </button>
                    </td>
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

// ── 5. Appearance Settings ─────────────────────────────────
function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const options: { key: "dark" | "light"; label: string; description: string; icon: React.ElementType; preview: { bg: string; card: string; text: string; accent: string } }[] = [
    {
      key: "dark",
      label: "Dark",
      description: "Default dark theme. Easy on the eyes, especially at night.",
      icon: Moon,
      preview: { bg: "bg-[hsl(220,20%,7%)]", card: "bg-[hsl(220,18%,10%)]", text: "text-[hsl(210,20%,92%)]", accent: "bg-[hsl(205,100%,55%)]" },
    },
    {
      key: "light",
      label: "Light",
      description: "Clean light theme. Better visibility in bright environments.",
      icon: Sun,
      preview: { bg: "bg-[hsl(220,20%,97%)]", card: "bg-white", text: "text-[hsl(220,20%,12%)]", accent: "bg-[hsl(205,100%,45%)]" },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Theme
        </h3>
        <p className="text-xs text-muted-foreground">
          Choose how Pulse Post looks for you. This is saved to your browser.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map(opt => {
            const active = theme === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`group relative rounded-xl border-2 p-1 transition-all duration-200 ${
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                {/* Mini preview */}
                <div className={`rounded-lg ${opt.preview.bg} p-3 space-y-2`}>
                  {/* Fake top bar */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${opt.preview.accent}`} />
                    <div className={`h-1.5 w-12 rounded-full ${opt.preview.card}`} />
                    <div className="flex-1" />
                    <div className={`h-1.5 w-6 rounded-full ${opt.preview.card}`} />
                  </div>
                  {/* Fake content cards */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className={`${opt.preview.card} rounded h-8 border border-black/5`} />
                    <div className={`${opt.preview.card} rounded h-8 border border-black/5`} />
                    <div className={`${opt.preview.card} rounded h-8 border border-black/5`} />
                  </div>
                  <div className="flex gap-1.5">
                    <div className={`${opt.preview.accent} rounded h-5 w-16`} />
                    <div className={`${opt.preview.card} rounded h-5 flex-1 border border-black/5`} />
                  </div>
                </div>

                {/* Label */}
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <opt.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{opt.description}</div>
                  </div>
                  {active && (
                    <div className="ml-auto">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
