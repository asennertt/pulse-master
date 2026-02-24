import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Phone, Mail, Facebook, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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

export function StaffDashboard() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", facebook_account: "", role: "salesperson" });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: true });
    if (error) { toast.error("Failed to load staff"); return; }
    setStaff((data as unknown as Staff[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("staff").insert({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      facebook_account: form.facebook_account.trim() || null,
      role: form.role,
    });
    if (error) { toast.error("Failed to add staff member"); return; }
    toast.success(`${form.name} added to team`);
    setForm({ name: "", email: "", phone: "", facebook_account: "", role: "salesperson" });
    setShowAdd(false);
    loadStaff();
  };

  const toggleActive = async (s: Staff) => {
    const { error } = await supabase.from("staff").update({ active: !s.active }).eq("id", s.id);
    if (error) { toast.error("Failed to update"); return; }
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Team Management
        </h2>
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
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name *" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.facebook_account} onChange={e => setForm(f => ({ ...f, facebook_account: e.target.value }))} placeholder="Facebook Account" className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className={`glass-card rounded-lg p-4 space-y-3 ${!s.active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.role}</span>
                </div>
                <button onClick={() => toggleActive(s)} className="p-1">
                  {s.active ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                </button>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {s.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {s.email}</div>}
                {s.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {s.phone}</div>}
                {s.facebook_account && <div className="flex items-center gap-1.5"><Facebook className="h-3 w-3" /> {s.facebook_account}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
