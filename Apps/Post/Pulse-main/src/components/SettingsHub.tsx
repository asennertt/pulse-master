import { useState, useEffect } from "react";
import { DMSIntegrationWizard } from "@/components/DMSIntegrationWizard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Settings, Building2, Zap, Sparkles, Users, Save, Upload,
  Phone, Globe, MapPin, Palette, Clock, DollarSign, Trash2,
  Brain, Eye, Shield, Mail, Facebook, CheckCircle2, XCircle,
  Plus, Loader2, Database, Link2, Copy, BarChart3,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

type SettingsTab = "profile" | "dms" | "automation" | "ai" | "users";

interface DealerSettings {
  id: string;
  dealership_name: string;
  dba: string;
  primary_phone: string;
  address: string;
  website_url: string;
  logo_url: string;
  brand_color: string;
  auto_post_new_inventory: boolean;
  auto_renew_listings: boolean;
  auto_renew_days: number;
  price_markup: number;
  delete_on_sold: boolean;
  global_system_prompt: string;
  auto_blur_plates: boolean;
}

interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  facebook_account: string | null;
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
  auto_post_new_inventory: false,
  auto_renew_listings: false,
  auto_renew_days: 7,
  price_markup: 0,
  delete_on_sold: true,
  global_system_prompt: "",
  auto_blur_plates: false,
};

export function SettingsHub() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [settings, setSettings] = useState<DealerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDealerId, setActiveDealerId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.rpc("get_my_dealership_id");
      if (error || !data) {
        toast.error("Failed to resolve dealership");
        setLoading(false);
        return;
      }
      setActiveDealerId(data as string);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeDealerId) loadSettings();
  }, [activeDealerId]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("dealer_settings")
      .select("*")
      .eq("dealer_id", activeDealerId)
      .limit(1)
      .single();
    if (error) {
      toast.error("Failed to load settings");
    } else if (data) {
      setSettings(data as unknown as DealerSettings);
    }
    setLoading(false);
  };

  const saveSettings = async (partial?: Partial<DealerSettings>) => {
    setSaving(true);
    const toSave = partial ? { ...settings, ...partial } : settings;
    const { error } = await supabase
      .from("dealer_settings")
      .upsert(
        {
          dealer_id: activeDealerId,
          dealership_name: toSave.dealership_name,
          dba: toSave.dba,
          primary_phone: toSave.primary_phone,
          address: toSave.address,
          website_url: toSave.website_url,
          logo_url: toSave.logo_url,
          brand_color: toSave.brand_color,
          auto_post_new_inventory: toSave.auto_post_new_inventory,
          auto_renew_listings: toSave.auto_renew_listings,
          auto_renew_days: toSave.auto_renew_days,
          price_markup: toSave.price_markup,
          delete_on_sold: toSave.delete_on_sold,
          global_system_prompt: toSave.global_system_prompt,
          auto_blur_plates: toSave.auto_blur_plates,
        },
        { onConflict: "dealer_id" }
      );
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
    { key: "automation", label: "Automation Rules", icon: Zap },
    { key: "ai", label: "AI Customization", icon: Sparkles },
    { key: "users", label: "User Management", icon: Users },
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
        {tab !== "users" && tab !== "dms" && (
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
      {tab === "automation" && <AutomationRules settings={settings} updateField={updateField} />}
      {tab === "ai" && <AICustomization settings={settings} updateField={updateField} />}
      {tab === "users" && <UserManagement />}
    </div>
  );
}

const inputCls = "w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

function DealershipProfile({
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
          <Building2 className="h-4 w-4 text-primary" /> Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dealership Name</label>
            <input value={settings.dealership_name} onChange={e => updateField("dealership_name", e.target.value)} placeholder="Sunshine Motors" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">DBA (Doing Business As)</label>
            <input value={settings.dba} onChange={e => updateField("dba", e.target.value)} placeholder="Sunshine Auto Group" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> Primary Phone</label>
            <input value={settings.primary_phone} onChange={e => updateField("primary_phone", e.target.value)} placeholder="(555) 123-4567" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Globe className="h-3 w-3" /> Website URL</label>
            <input value={settings.website_url} onChange={e => updateField("website_url", e.target.value)} placeholder="https://sunshinemotors.com" className={inputCls} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</label>
            <input value={settings.address} onChange={e => updateField("address", e.target.value)} placeholder="1234 Auto Blvd, Dallas, TX 75201" className={inputCls} />
          </div>
        </div>
      </div>
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Branding
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dealership Logo</label>
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <div className="h-16 w-16 rounded-lg border border-border overflow-hidden bg-secondary flex items-center justify-center">
                  <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <input value={settings.logo_url} onChange={e => updateField("logo_url", e.target.value)} placeholder="https://example.com/logo.png" className={inputCls} />
                <p className="text-[10px] text-muted-foreground mt-1">Enter a URL to your logo image. Used on AI-generated overlays.</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={settings.brand_color} onChange={e => updateField("brand_color", e.target.value)} className="h-10 w-14 rounded-md border border-border cursor-pointer bg-transparent" />
              <input value={settings.brand_color} onChange={e => updateField("brand_color", e.target.value)} placeholder="#1e90ff" className={inputCls} />
            </div>
            <p className="text-[10px] text-muted-foreground">Applied to AI image overlays and branded content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutomationRules({
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
          <Clock className="h-4 w-4 text-primary" /> Posting Schedule
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md bg-secondary/60 border border-border p-4">
            <div>
              <div className="text-sm font-medium text-foreground">Auto-Post New Inventory</div>
              <div className="text-xs text-muted-foreground mt-0.5">Automatically create a Marketplace listing when new vehicles arrive from the DMS feed.</div>
            </div>
            <Switch checked={settings.auto_post_new_inventory} onCheckedChange={v => updateField("auto_post_new_inventory", v)} />
          </div>
          <div className="flex items-center justify-between rounded-md bg-secondary/60 border border-border p-4">
            <div>
              <div className="text-sm font-medium text-foreground">Auto-Renew Listings</div>
              <div className="text-xs text-muted-foreground mt-0.5">Automatically renew active listings every <strong>{settings.auto_renew_days}</strong> days to keep them fresh.</div>
              {settings.auto_renew_listings && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-[10px] text-muted-foreground uppercase">Renewal interval (days):</label>
                  <input type="number" min={1} max={30} value={settings.auto_renew_days} onChange={e => updateField("auto_renew_days", parseInt(e.target.value) || 7)} className="w-16 rounded-md bg-background border border-border px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              )}
            </div>
            <Switch checked={settings.auto_renew_listings} onCheckedChange={v => updateField("auto_renew_listings", v)} />
          </div>
        </div>
      </div>
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-success" /> Pricing Rules
        </h3>
        <div className="rounded-md bg-secondary/60 border border-border p-4 space-y-2">
          <div className="text-sm font-medium text-foreground">Add Markup / Pack to DMS Price</div>
          <div className="text-xs text-muted-foreground">This amount is automatically added to the DMS feed price before listing. Set to 0 for no markup.</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-success">$</span>
            <input type="number" min={0} step={50} value={settings.price_markup} onChange={e => updateField("price_markup", parseFloat(e.target.value) || 0)} className="w-32 rounded-md bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" /> Smart Delete
        </h3>
        <div className="flex items-center justify-between rounded-md bg-secondary/60 border border-border p-4">
          <div>
            <div className="text-sm font-medium text-foreground">Delete on Sold</div>
            <div className="text-xs text-muted-foreground mt-0.5">Instantly remove a Marketplace listing once the vehicle disappears from the DMS feed (marked as sold).</div>
          </div>
          <Switch checked={settings.delete_on_sold} onCheckedChange={v => updateField("delete_on_sold", v)} />
        </div>
      </div>
    </div>
  );
}

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
          <textarea value={settings.global_system_prompt} onChange={e => updateField("global_system_prompt", e.target.value)} rows={6} placeholder={"Examples:\n• Always mention our 10-year warranty\n• Never mention financing options\n• Include our tagline: 'Drive Happy'\n• Focus on safety features for family vehicles"} className="w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-y min-h-[120px]" />
          <p className="text-[10px] text-muted-foreground">These instructions are appended to every AI-generated post. Use them to enforce brand voice, compliance rules, or promotional messaging.</p>
        </div>
      </div>
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" /> Image Processing
        </h3>
        <div className="flex items-center justify-between rounded-md bg-secondary/60 border border-border p-4">
          <div>
            <div className="text-sm font-medium text-foreground">Auto-Blur License Plates</div>
            <div className="text-xs text-muted-foreground mt-0.5">Automatically detect and blur license plates in vehicle photos before posting. Protects customer privacy.</div>
          </div>
          <Switch checked={settings.auto_blur_plates} onCheckedChange={v => updateField("auto_blur_plates", v)} />
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", facebook_account: "", role: "salesperson" });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [postingStats, setPostingStats] = useState<Record<string, number>>({});

  useEffect(() => { loadStaff(); loadPostingStats(); }, []);

  const loadStaff = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: true });
    setStaff((data as unknown as Staff[]) || []);
    setLoading(false);
  };

  const loadPostingStats = async () => {
    const { data } = await supabase.from("pulse_vehicles").select("posted_by_staff_id").eq("synced_to_facebook", true).not("posted_by_staff_id", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((v: any) => { counts[v.posted_by_staff_id] = (counts[v.posted_by_staff_id] || 0) + 1; });
      setPostingStats(counts);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("staff").insert({ name: form.name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null, facebook_account: form.facebook_account.trim() || null, role: form.role });
    if (error) { toast.error("Failed to add staff member"); return; }
    toast.success(`${form.name} added to team`);
    setForm({ name: "", email: "", phone: "", facebook_account: "", role: "salesperson" });
    setShowAdd(false);
    loadStaff();
  };

  const toggleActive = async (s: Staff) => {
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x));
    const { error } = await supabase.from("staff").update({ active: !s.active }).eq("id", s.id);
    if (error) {
      setStaff(prev => prev.map(x => x.id === s.id ? { ...x, active: s.active } : x));
      toast.error("Failed to update staff status");
    }
  };

  const updateRole = async (s: Staff, newRole: string) => {
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, role: newRole } : x));
    const { error } = await supabase.from("staff").update({ role: newRole }).eq("id", s.id);
    if (error) {
      setStaff(prev => prev.map(x => x.id === s.id ? { ...x, role: s.role } : x));
      toast.error(`Failed to update role for ${s.name}`);
    } else {
      toast.success(`${s.name} updated to ${newRole}`);
    }
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
    if (inviteLink) { navigator.clipboard.writeText(inviteLink); toast.success("Invite link copied to clipboard!"); }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Invite Staff to Join</h3>
        <p className="text-xs text-muted-foreground">Generate a shareable link to invite staff members. They'll create their own account and be automatically linked to your dealership.</p>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateInvite} disabled={generatingInvite} className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {generatingInvite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Generate Invite Link
          </button>
        </div>
        {inviteLink && (
          <div className="flex items-center gap-2 rounded-md bg-secondary border border-border p-3">
            <input value={inviteLink} readOnly className="flex-1 bg-transparent text-xs text-foreground font-mono focus:outline-none truncate" />
            <button onClick={copyInviteLink} className="shrink-0 flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors">
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
        )}
      </div>
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Staff Posting Activity</h3>
        {loading ? <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div> : staff.length === 0 ? <p className="text-xs text-muted-foreground">No staff members yet.</p> : (
          <div className="space-y-2">
            {staff.map(s => {
              const count = postingStats[s.id] || 0;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-secondary/60 border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${s.active ? "bg-success" : "bg-muted-foreground"}`} />
                    <div><span className="text-sm font-medium text-foreground">{s.name}</span><span className="text-xs text-muted-foreground ml-2">{s.role}</span></div>
                  </div>
                  <div className="text-right"><span className="text-lg font-bold text-primary">{count}</span><span className="text-[10px] text-muted-foreground ml-1">posted</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Staff Accounts</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Staff
        </button>
      </div>
      {showAdd && (
        <div className="glass-card rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name *" className={inputCls} />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className={inputCls} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={inputCls} />
            <input value={form.facebook_account} onChange={e => setForm(f => ({ ...f, facebook_account: e.target.value }))} placeholder="Facebook Account" className={inputCls} />
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
      {loading ? <div className="text-center py-8 text-muted-foreground text-sm">Loading team...</div> : (
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">FB Account</th>
                  <th className="text-center px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Posts</th>
                  <th className="text-center px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${!s.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3"><div className="font-medium text-foreground">{s.name}</div></td>
                    <td className="px-4 py-3">
                      <select value={s.role} onChange={e => updateRole(s, e.target.value)} className="rounded bg-secondary border border-border px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="salesperson">Salesperson</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground">
                        {s.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</div>}
                        {s.phone && <div>{s.phone}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.facebook_account ? <div className="flex items-center gap-1 text-xs text-muted-foreground"><Facebook className="h-3 w-3" />{s.facebook_account}</div> : <span className="text-xs text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-primary">{postingStats[s.id] || 0}</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(s)} className="inline-flex items-center gap-1">
                        {s.active ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-[10px] text-muted-foreground">{s.active ? "Active" : "Inactive"}</span>
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
