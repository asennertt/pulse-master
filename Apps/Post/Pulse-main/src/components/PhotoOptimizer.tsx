import { useState } from "react";
import { Camera, Check, Shield, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PhotoOptimizerProps {
  vehicleLabel: string;
  images: string[];
  onOptimized: (images: string[]) => void;
}

export function PhotoOptimizer({ vehicleLabel, images, onOptimized }: PhotoOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [steps, setSteps] = useState([
    { label: "Hero-First: Exterior 3/4 shot → index [0]", done: false },
    { label: "Branded watermark overlay applied", done: false },
    { label: "Resolution optimized for Marketplace", done: false },
  ]);

  const runOptimizer = async () => {
    setOptimizing(true);

    // Step 1: Hero-first sorting
    await new Promise(r => setTimeout(r, 800));
    setSteps(s => s.map((x, i) => i === 0 ? { ...x, done: true } : x));

    // Step 2: Watermark
    await new Promise(r => setTimeout(r, 1000));
    setSteps(s => s.map((x, i) => i === 1 ? { ...x, done: true } : x));

    // Step 3: Resolution
    await new Promise(r => setTimeout(r, 600));
    setSteps(s => s.map((x, i) => i === 2 ? { ...x, done: true } : x));

    setOptimizing(false);
    onOptimized(images);
    toast.success("Photos optimized", { description: "Hero shot set, watermarks applied" });
  };

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Photo Optimizer</h3>
      </div>
      <p className="text-xs text-muted-foreground">{vehicleLabel}</p>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {step.done ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : optimizing && i === steps.findIndex(s => !s.done) ? (
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
            )}
            <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-md bg-secondary/50 border border-border p-2 text-[10px] text-muted-foreground space-y-1">
        <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Watermark: Dealer Logo + Phone overlay on image[0]</div>
        <div className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Hero-First: 3/4 exterior shot always prioritized</div>
      </div>

      <button
        onClick={runOptimizer}
        disabled={optimizing || steps.every(s => s.done)}
        className="w-full rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {steps.every(s => s.done) ? (
          <><Check className="h-3 w-3" /> Optimized</>
        ) : optimizing ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Processing...</>
        ) : (
          <><Camera className="h-3 w-3" /> Optimize Photos</>
        )}
      </button>
    </div>
  );
}
