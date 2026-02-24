import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, RefreshCw, MousePointer, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Vehicle } from "@/data/vehicles";

interface Performance {
  id: string;
  vehicle_id: string;
  post_date: string;
  click_count: number;
  days_live: number;
  renewed_at: string | null;
}

interface PerformanceTabProps {
  vehicle: Vehicle;
}

export function PerformanceTab({ vehicle }: PerformanceTabProps) {
  const [perf, setPerf] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerf();
  }, [vehicle.id]);

  const loadPerf = async () => {
    const { data } = await supabase
      .from("vehicle_performance")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .maybeSingle();
    setPerf(data as unknown as Performance | null);
    setLoading(false);
  };

  const initPerf = async () => {
    // Simulate initial performance data
    const clickCount = Math.floor(Math.random() * 150) + 10;
    const postDate = new Date(Date.now() - vehicle.days_on_lot * 86400000).toISOString();
    const { data, error } = await supabase
      .from("vehicle_performance")
      .insert({
        vehicle_id: vehicle.id,
        post_date: postDate,
        click_count: clickCount,
        days_live: vehicle.days_on_lot,
        last_click_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) { toast.error("Failed to init performance"); return; }
    setPerf(data as unknown as Performance);
    toast.success("Performance tracking started");
  };

  const handleRenew = async () => {
    if (!perf) return;
    const { error } = await supabase
      .from("vehicle_performance")
      .update({ renewed_at: new Date().toISOString(), days_live: 0 })
      .eq("id", perf.id);
    if (error) { toast.error("Failed to renew"); return; }
    setPerf(p => p ? { ...p, renewed_at: new Date().toISOString(), days_live: 0 } : null);
    toast.success("Listing renewed! Clock reset to 0 days.");
  };

  if (loading) return <div className="text-xs text-muted-foreground py-2">Loading...</div>;

  if (!perf) {
    return (
      <button
        onClick={initPerf}
        className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
      >
        <BarChart3 className="h-3 w-3" /> Start Tracking
      </button>
    );
  }

  const daysLive = perf.days_live || Math.floor((Date.now() - new Date(perf.post_date).getTime()) / 86400000);
  const needsRenew = daysLive >= 7;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-md bg-secondary/60 border border-border p-2 text-center">
          <Calendar className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
          <div className="text-xs font-bold text-foreground">{new Date(perf.post_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          <div className="text-[9px] text-muted-foreground">Posted</div>
        </div>
        <div className="rounded-md bg-secondary/60 border border-border p-2 text-center">
          <MousePointer className="h-3 w-3 mx-auto mb-0.5 text-primary" />
          <div className="text-xs font-bold text-primary">{perf.click_count}</div>
          <div className="text-[9px] text-muted-foreground">Clicks</div>
        </div>
        <div className={`rounded-md border p-2 text-center ${needsRenew ? "bg-warning/10 border-warning/30" : "bg-secondary/60 border-border"}`}>
          <Clock className="h-3 w-3 mx-auto mb-0.5" style={{ color: needsRenew ? "hsl(var(--warning))" : undefined }} />
          <div className={`text-xs font-bold ${needsRenew ? "text-warning" : "text-foreground"}`}>{daysLive}d</div>
          <div className="text-[9px] text-muted-foreground">Live</div>
        </div>
      </div>
      {needsRenew && (
        <button
          onClick={handleRenew}
          className="w-full rounded-md bg-warning/10 border border-warning/30 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="h-3 w-3" /> Renew Listing (Cold after 7d)
        </button>
      )}
    </div>
  );
}
