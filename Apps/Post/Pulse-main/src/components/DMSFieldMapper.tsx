import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Plus, Trash2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface FieldMapping {
  id: string;
  dms_source: string;
  dms_field: string;
  app_field: string;
  transform: string | null;
  active: boolean;
}

const APP_FIELDS = [
  { value: "vin", label: "VIN" },
  { value: "make", label: "Make" },
  { value: "model", label: "Model" },
  { value: "year", label: "Year" },
  { value: "trim", label: "Trim" },
  { value: "price", label: "Price" },
  { value: "mileage", label: "Mileage" },
  { value: "exterior_color", label: "Exterior Color" },
  { value: "images", label: "Images" },
  { value: "days_on_lot", label: "Days on Lot" },
  { value: "status", label: "Status" },
];

const TRANSFORMS = [
  { value: "", label: "None" },
  { value: "parseInt", label: "Parse Integer" },
  { value: "parseFloat", label: "Parse Decimal" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "splitPipe", label: "Split by | (images)" },
  { value: "splitComma", label: "Split by , (images)" },
];

export function DMSFieldMapper() {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDmsField, setNewDmsField] = useState("");
  const [newAppField, setNewAppField] = useState("vin");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMappings(); }, []);

  const loadMappings = async () => {
    const { data, error } = await supabase
      .from("dms_field_mappings")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) { toast.error("Failed to load mappings"); return; }
    setMappings((data as unknown as FieldMapping[]) || []);
    setLoading(false);
  };

  const addMapping = async () => {
    if (!newDmsField.trim()) { toast.error("DMS field name required"); return; }
    const { error } = await supabase.from("dms_field_mappings").insert({
      dms_field: newDmsField.trim(),
      app_field: newAppField,
    });
    if (error) {
      toast.error("Failed to add mapping", { description: error.message });
      return;
    }
    toast.success(`Mapped "${newDmsField}" → "${newAppField}"`);
    setNewDmsField("");
    loadMappings();
  };

  const updateMapping = async (id: string, field: string, value: any) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const m of mappings) {
      await supabase.from("dms_field_mappings")
        .update({ app_field: m.app_field, transform: m.transform, active: m.active })
        .eq("id", m.id);
    }
    setSaving(false);
    toast.success("All mappings saved");
  };

  const deleteMapping = async (id: string) => {
    await supabase.from("dms_field_mappings").delete().eq("id", id);
    setMappings(prev => prev.filter(m => m.id !== id));
    toast.success("Mapping removed");
  };

  if (loading) return <div className="text-sm text-muted-foreground py-4">Loading field mappings...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">DMS → App Field Mapper</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Map your DMS export columns to Pulse: Post database fields</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {/* Existing mappings */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_auto_auto] gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2">
          <span>DMS Field</span>
          <span></span>
          <span>App Field</span>
          <span>Transform</span>
          <span>Active</span>
          <span></span>
        </div>
        {mappings.map(m => (
          <div key={m.id} className={`grid grid-cols-[1fr_auto_1fr_auto_auto_auto] gap-2 items-center rounded-md bg-secondary/50 border border-border px-2 py-1.5 ${!m.active ? "opacity-40" : ""}`}>
            <span className="text-xs font-mono text-foreground truncate">{m.dms_field}</span>
            <ArrowRight className="h-3 w-3 text-primary" />
            <select
              value={m.app_field}
              onChange={e => updateMapping(m.id, "app_field", e.target.value)}
              className="rounded bg-secondary border border-border px-1.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {APP_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select
              value={m.transform || ""}
              onChange={e => updateMapping(m.id, "transform", e.target.value || null)}
              className="rounded bg-secondary border border-border px-1.5 py-1 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-24"
            >
              {TRANSFORMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={() => updateMapping(m.id, "active", !m.active)} className="p-0.5">
              <div className={`h-3 w-6 rounded-full transition-colors ${m.active ? "bg-success" : "bg-muted"} relative`}>
                <div className={`absolute top-0.5 h-2 w-2 rounded-full bg-foreground transition-transform ${m.active ? "left-3.5" : "left-0.5"}`} />
              </div>
            </button>
            <button onClick={() => deleteMapping(m.id)} className="text-destructive/50 hover:text-destructive transition-colors p-0.5">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new mapping */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          value={newDmsField}
          onChange={e => setNewDmsField(e.target.value)}
          placeholder="DMS Column Name (e.g. Sticker_Price)"
          className="flex-1 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <select
          value={newAppField}
          onChange={e => setNewAppField(e.target.value)}
          className="rounded-md bg-secondary border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {APP_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button
          onClick={addMapping}
          className="flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    </div>
  );
}
