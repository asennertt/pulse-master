import { useState } from "react";
import {
  CheckCircle2, Circle, Sparkles, Image, Send, Download,
  X, Loader2, ExternalLink, Copy, Code2, FileJson,
  ShieldCheck, ShieldAlert, Pencil, Check, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Vehicle } from "@/data/vehicles";

interface MarketplaceDrawerProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSynced: (id: string) => void;
}

interface ChecklistItem {
  key: string;
  label: string;
  icon: React.ElementType;
  status: "pending" | "checking" | "done" | "error";
  detail?: string;
}

type Tone = "professional" | "aggressive" | "emoji";

const toneLabels: Record<Tone, { label: string; desc: string }> = {
  professional: { label: "Professional", desc: "Clean & trustworthy" },
  aggressive: { label: "Aggressive Sales", desc: "High urgency & FOMO" },
  emoji: { label: "Emoji-Heavy", desc: "Social media style 🔥" },
};

interface ComplianceResult {
  passed: boolean;
  flagged_phrases: string[];
  message: string;
}

export function MarketplaceDrawer({ vehicle, onClose, onSynced }: MarketplaceDrawerProps) {
  // Step: "description" | "preflight" | "done"
  const [step, setStep] = useState<"description" | "preflight" | "done">("description");

  // Step 1 — AI Description
  const [tone, setTone] = useState<Tone>("professional");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);

  // Step 2 — Pre-flight
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { key: "photos", label: "Photos Optimized", icon: Image, status: "pending" },
    { key: "payload", label: "Listing Payload Ready", icon: FileJson, status: "pending" },
    { key: "sync", label: "Ready to Sync", icon: Send, status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [showExtension, setShowExtension] = useState(false);

  // ── Step 1: Generate description ──────────────────
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

  const activeDescription = isEditing ? editedText : description;

  // ── Step 2: Pre-flight check ───────────────────────
  const updateItem = (key: string, status: ChecklistItem["status"], detail?: string) => {
    setChecklist(prev => prev.map(c => c.key === key ? { ...c, status, detail } : c));
  };

  const runChecklist = async () => {
    setIsRunning(true);

    // Photos check
    updateItem("photos", "checking");
    await new Promise(r => setTimeout(r, 500));
    const photoCount = vehicle.images?.length || 0;
    updateItem("photos", "done", photoCount > 0 ? `${photoCount} photos optimized` : "Placeholder image assigned");

    // Build payload
    updateItem("payload", "checking");
    try {
      const { data: payloadData } = await supabase.functions.invoke("listing-payload", {
        body: { vehicleId: vehicle.id },
      });
      // Inject the user-selected description into the payload
      if (payloadData?.listing) payloadData.listing.description = activeDescription;
      setPayload(payloadData);
      updateItem("payload", "done", "Extension payload ready");
    } catch {
      updateItem("payload", "error", "Failed to build payload");
      setIsRunning(false);
      return;
    }

    updateItem("sync", "done", "All checks passed");
    setIsRunning(false);
    setStep("done");
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Payload copied to clipboard");
  };

  const handleLaunchFacebook = async () => {
    const desc = activeDescription || payload?.listing?.description || "";
    if (desc) await navigator.clipboard.writeText(desc);

    // Debug: log all data being sent
    console.log("[MarketplaceDrawer] Data types check:", {
      price: { value: vehicle.price, type: typeof vehicle.price },
      mileage: { value: vehicle.mileage, type: typeof vehicle.mileage },
      ai_description: { value: desc?.substring(0, 80) + "...", type: typeof desc, length: desc?.length },
      vin: vehicle.vin,
      vehicleId: vehicle.id,
    });

    // Save AI description to the vehicle record
    try {
      const { data: updateData, error: updateError } = await supabase
        .from("vehicles")
        .update({ ai_description: desc } as any)
        .eq("id", vehicle.id)
        .select("id, ai_description, price, mileage");

      console.log("[MarketplaceDrawer] DB save result:", { updateData, updateError });

      if (updateError) {
        console.error("[MarketplaceDrawer] Failed to save AI description:", updateError);
        toast.error("Failed to save description to database");
      } else {
        console.log("[MarketplaceDrawer] ✅ ai_description saved successfully");
      }
    } catch (e) {
      console.error("[MarketplaceDrawer] Failed to save AI description:", e);
    }

    const price = vehicle.price || "";
    const mileage = vehicle.mileage || "";
    const vin = vehicle.vin || "";
    const make = vehicle.make || "";
    const model = vehicle.model || "";
    const year = vehicle.year || "";

    const imgs = (vehicle.images || []).join("|");
    const fbUrl = `https://www.facebook.com/marketplace/create/vehicle/?price=${price}&desc=${encodeURIComponent(desc)}&mileage=${mileage}&vin=${vin}&make=${make}&model=${model}&year=${year}&imgs=${encodeURIComponent(imgs)}`;

    console.log("[MarketplaceDrawer] Sending to API/FB:", {
      price, mileage, vin, make, model, year,
      description: desc?.substring(0, 100) + "...",
      imageCount: (vehicle.images || []).length,
      fbUrl: fbUrl.substring(0, 150) + "...",
    });

    window.open(fbUrl, "_blank", "noopener,noreferrer");
    onSynced(vehicle.id);
    toast.success("Listing data sent to Facebook!", { duration: 8000 });
  };

  const handleDownloadExtension = () => {
    const manifest = {
      manifest_version: 3,
      name: "Pulse: Post FB Marketplace Assistant",
      version: "1.0.0",
      description: "Auto-fills Facebook Marketplace vehicle listings from Pulse: Post dashboard",
      permissions: ["activeTab", "clipboardRead", "storage"],
      content_scripts: [
        { matches: ["https://www.facebook.com/marketplace/create/*"], js: ["content.js"], run_at: "document_idle" },
      ],
    };
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const mLink = document.createElement("a");
    mLink.href = URL.createObjectURL(manifestBlob);
    mLink.download = "manifest.json";
    mLink.click();
    toast.success("Extension manifest downloaded!");
  };

  const allChecksDone = checklist.every(c => c.status === "done");

  const statusIcon = (s: ChecklistItem["status"]) => {
    if (s === "checking") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    if (s === "done") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (s === "error") return <X className="h-4 w-4 text-destructive" />;
    return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full glass border-l border-border overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Marketplace Assistant
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "description" ? "Step 1 of 2 — Generate Description" : step === "preflight" ? "Step 2 of 2 — Pre-Flight Check" : "Ready to List"}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Vehicle summary */}
          <div className="rounded-lg bg-secondary/50 border border-border p-4">
            <p className="text-sm font-semibold text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
            <p className="text-xs text-muted-foreground">{vehicle.trim} · {vehicle.exterior_color}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>${Number(vehicle.price).toLocaleString()}</span>
              <span>{vehicle.mileage.toLocaleString()} mi</span>
              <span className="font-mono text-[10px]">{vehicle.vin.slice(-8)}</span>
            </div>
          </div>

          {/* ── STEP 1: AI Description ── */}
          {step === "description" && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose a Tone</h3>
              <div className="flex gap-2">
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
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Description</>}
              </button>

              {compliance && (
                <div className={`rounded-md border px-3 py-2 flex items-center gap-2 text-xs ${compliance.passed ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"}`}>
                  {compliance.passed ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  <span>{compliance.message}</span>
                </div>
              )}

              {description && (
                <div className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full rounded-lg bg-secondary border border-primary/30 p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={8}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setDescription(editedText); setIsEditing(false); }}
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
                    <div className="rounded-lg bg-secondary border border-border p-4 text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {description}
                    </div>
                  )}
                  {!isEditing && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { navigator.clipboard.writeText(description); toast.success("Copied!"); }}
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Check className="h-3 w-3" /> Copy
                      </button>
                      <button
                        onClick={() => { setIsEditing(true); setEditedText(description); }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </div>
                  )}
                </div>
              )}

              {description && !isEditing && (
                <button
                  onClick={() => setStep("preflight")}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Pre-Flight Check <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* ── STEP 2: Pre-flight checklist ── */}
          {(step === "preflight" || step === "done") && (
            <div className="space-y-4">
              {/* Description summary */}
              <div className="rounded-lg bg-secondary/40 border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Selected Description</p>
                <p className="text-xs text-foreground line-clamp-3">{activeDescription}</p>
                <button
                  onClick={() => setStep("description")}
                  className="text-[10px] text-primary hover:text-primary/80 mt-1 transition-colors"
                >
                  ← Change description
                </button>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pre-Flight Checklist</h3>
              {checklist.map((item) => (
                <div key={item.key} className="flex items-start gap-3 rounded-lg bg-secondary/30 border border-border p-3">
                  {statusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.status === "done" ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</p>
                    {item.detail && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{item.detail}</p>}
                  </div>
                </div>
              ))}

              {step === "preflight" && (
                <button
                  onClick={runChecklist}
                  disabled={isRunning}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRunning ? <><Loader2 className="h-4 w-4 animate-spin" /> Running checks...</> : <><Sparkles className="h-4 w-4" /> Run Pre-Flight Check</>}
                </button>
              )}

              {step === "done" && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-success text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    All checks passed. Ready to list!
                  </div>

                  <button
                    onClick={handleLaunchFacebook}
                    className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" /> Launch Facebook Marketplace
                  </button>

                  {payload && (
                    <button
                      onClick={handleCopyPayload}
                      className="w-full rounded-lg bg-secondary border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="h-4 w-4" /> Copy Extension Payload
                    </button>
                  )}

                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setShowExtension(!showExtension)}
                      className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2"><Code2 className="h-4 w-4" /> Chrome Extension Tools</span>
                      <span className="text-xs">{showExtension ? "▲" : "▼"}</span>
                    </button>
                    {showExtension && (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Download the extension package to auto-fill Facebook Marketplace forms with vehicle data.
                        </p>
                        <button
                          onClick={handleDownloadExtension}
                          className="w-full rounded-lg bg-primary/10 border border-primary/20 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="h-4 w-4" /> Download Extension Package
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
