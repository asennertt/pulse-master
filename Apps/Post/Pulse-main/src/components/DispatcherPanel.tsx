import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, ExternalLink, Clipboard, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Vehicle } from "@/data/vehicles";

type Step = { label: string; status: "pending" | "running" | "done" | "error" };

interface DispatcherPanelProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSynced: (id: string) => void;
}

export function DispatcherPanel({ vehicle, onClose, onSynced }: DispatcherPanelProps) {
  const [steps, setSteps] = useState<Step[]>([
    { label: "Generating AI listing copy", status: "pending" },
    { label: "Building Facebook AIA catalog payload", status: "pending" },
    { label: "Formatting clipboard content", status: "pending" },
    { label: "Copying to clipboard", status: "pending" },
    { label: "Opening Facebook Marketplace", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [fbUrl, setFbUrl] = useState("");

  const advanceStep = async (idx: number, duration: number) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: "running" } : s));
    await new Promise(r => setTimeout(r, duration));
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: "done" } : s));
  };

  const runWorkflow = async () => {
    setIsRunning(true);

    try {
      // Step 1: Generate AI copy
      await advanceStep(0, 500);
      const { data: postData } = await supabase.functions.invoke("generate-post", {
        body: { vehicle, tone: "professional" },
      });
      const aiCopy = postData?.description || `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""} - ${vehicle.mileage.toLocaleString()} miles - $${Number(vehicle.price).toLocaleString()}`;
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: "done" } : s));

      // Step 2: Build AIA payload
      await advanceStep(1, 800);
      await supabase.functions.invoke("fb-catalog-sync", {
        body: { vehicleId: vehicle.id },
      });

      // Step 3: Format clipboard content
      await advanceStep(2, 600);
      const clipboardContent = [
        aiCopy,
        "",
        "─────────────────────",
        `📋 ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`,
        `📏 Mileage: ${vehicle.mileage.toLocaleString()} mi`,
        `🎨 Color: ${vehicle.exterior_color || "N/A"}`,
        `💰 Price: $${Number(vehicle.price).toLocaleString()}`,
        `🔖 VIN: ${vehicle.vin}`,
        "─────────────────────",
      ].join("\n");
      setGeneratedCopy(clipboardContent);

      // Step 4: Copy to clipboard
      await advanceStep(3, 400);
      await navigator.clipboard.writeText(clipboardContent);

      // Step 5: Open Facebook Marketplace with URL parameters for Pulse extension
      setSteps(prev => prev.map((s, i) => i === 4 ? { ...s, status: "running" } : s));
      const price = vehicle.price || "";
      const desc = encodeURIComponent(aiCopy || "");
      const mileage = vehicle.mileage || "";
      const vin = vehicle.vin || "";
      const make = vehicle.make || "";
      const model = vehicle.model || "";
      const year = vehicle.year || "";

      const fbUrl = `https://www.facebook.com/marketplace/create/vehicle/?price=${price}&desc=${desc}&mileage=${mileage}&vin=${vin}&make=${make}&model=${model}&year=${year}`;

      console.log("SENDING TO FB:", fbUrl);
      setFbUrl(fbUrl);
      window.open(fbUrl, '_blank', 'noopener,noreferrer');

      await new Promise(r => setTimeout(r, 600));
      setSteps(prev => prev.map((s, i) => i === 4 ? { ...s, status: "done" } : s));

      setIsDone(true);
      onSynced(vehicle.id);

      toast.success("Ready to post!", {
        description: "AI description copied. Paste it into Facebook Marketplace now.",
        duration: 8000,
      });
    } catch (e: any) {
      toast.error("Dispatch failed", { description: e.message });
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s));
    } finally {
      setIsRunning(false);
    }
  };

  const handleRecopy = async () => {
    await navigator.clipboard.writeText(generatedCopy);
    toast.success("Copied again!");
  };

  const stepIcon = (status: Step["status"]) => {
    if (status === "running") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    if (status === "done") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-md mx-4 p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Post to Marketplace</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        <div className="rounded-lg bg-secondary/50 border border-border p-3 mb-5">
          <p className="text-sm font-medium text-foreground">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${Number(vehicle.price).toLocaleString()} · {vehicle.mileage.toLocaleString()} mi
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-5">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {stepIcon(step.status)}
              <span className={`text-sm ${
                step.status === "done" ? "text-foreground" :
                step.status === "running" ? "text-primary" :
                "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {!isDone && (
          <button
            onClick={runWorkflow}
            disabled={isRunning}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Dispatching...</>
            ) : (
              <><Send className="h-4 w-4" /> Start Dispatch</>
            )}
          </button>
        )}

        {isDone && (
          <div className="space-y-3">
            <div className="rounded-lg bg-success/10 border border-success/20 p-3">
              <div className="flex items-center gap-2 text-success text-sm font-medium mb-2">
                <Clipboard className="h-4 w-4" />
                AI description copied to clipboard!
              </div>
              <ol className="text-xs text-success/80 space-y-1 list-decimal list-inside">
                <li>Switch to the Facebook Marketplace tab that just opened</li>
                <li>Paste your AI-generated description (Ctrl+V / ⌘+V)</li>
                <li>Upload the downloaded vehicle photos</li>
                <li>Set the price and hit Publish!</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRecopy}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-secondary border border-border py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3 w-3" /> Copy Again
              </button>
              <button
                onClick={() => {
                  console.log("SENDING TO FB:", fbUrl);
                  window.open(fbUrl, '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> Open Facebook
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
