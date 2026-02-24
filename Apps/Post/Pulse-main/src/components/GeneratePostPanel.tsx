import { useState } from "react";
import { Vehicle } from "@/data/vehicles";
import { Sparkles, Copy, Check, Loader2, Pencil, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Tone = "professional" | "aggressive" | "emoji";

interface GeneratePostPanelProps {
  vehicle: Vehicle;
  onClose: () => void;
}

interface ComplianceResult {
  passed: boolean;
  flagged_phrases: string[];
  message: string;
}

const toneLabels: Record<Tone, { label: string; desc: string }> = {
  professional: { label: "Professional", desc: "Clean & trustworthy" },
  aggressive: { label: "Aggressive Sales", desc: "High urgency & FOMO" },
  emoji: { label: "Emoji-Heavy", desc: "Social media style 🔥" },
};

export function GeneratePostPanel({ vehicle, onClose }: GeneratePostPanelProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDescription("");
    setIsEditing(false);
    setCompliance(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { vehicle, tone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDescription(data.description);
      setEditedText(data.description);
      if (data.compliance) setCompliance(data.compliance);
    } catch (e: any) {
      toast.error("Generation failed", { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedText : description);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    setDescription(editedText);
    setIsEditing(false);
    toast.success("Post updated");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-lg mx-4 p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">AI Post Generator</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        <div className="rounded-lg bg-secondary/50 border border-border p-3 mb-4">
          <p className="text-sm font-medium text-foreground">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {vehicle.mileage.toLocaleString()} mi · {vehicle.exterior_color || "N/A"} · VIN: {vehicle.vin.slice(-6)}
          </p>
        </div>

        {/* Tone toggles */}
        <div className="flex gap-2 mb-4">
          {(Object.keys(toneLabels) as Tone[]).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
                tone === t
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-medium">{toneLabels[t].label}</div>
              <div className="text-[10px] opacity-70">{toneLabels[t].desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Post</>
          )}
        </button>

        {/* Compliance Badge */}
        {compliance && (
          <div className={`mt-3 rounded-md border px-3 py-2 flex items-center gap-2 text-xs ${compliance.passed ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"}`}>
            {compliance.passed ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            <span>{compliance.message}</span>
          </div>
        )}

        {description && (
          <div className="mt-4 space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full rounded-lg bg-secondary border border-primary/30 p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={10}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 rounded-md bg-primary text-primary-foreground py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditedText(description); }}
                    className="rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-secondary border border-border p-4 text-sm text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                {description}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
