import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

interface SoldAlert {
  id: string;
  vin: string;
  vehicle_label: string;
  staff_id: string | null;
  acknowledged: boolean;
  created_at: string;
}

export function SoldAlertsBanner() {
  const [alerts, setAlerts] = useState<SoldAlert[]>([]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    const { data } = await supabase
      .from("sold_alerts")
      .select("*")
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(5);
    setAlerts((data as unknown as SoldAlert[]) || []);
  };

  const dismiss = async (id: string) => {
    await supabase.from("sold_alerts").update({ acknowledged: true }).eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map(alert => (
        <div key={alert.id} className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 flex items-center gap-3 animate-slide-in">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">
              SOLD — Remove Listing Immediately
            </p>
            <p className="text-xs text-destructive/80 truncate">
              {alert.vehicle_label} · VIN: {alert.vin}
            </p>
            <p className="text-[10px] text-destructive/60 mt-0.5">
              Take down to maintain your Facebook Response Rate
            </p>
          </div>
          <a
            href="https://www.facebook.com/marketplace/you/selling"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1 rounded-md bg-destructive/20 border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/30 transition-colors"
          >
            <ExternalLink className="h-3 w-3" /> Active Listings
          </a>
          <button onClick={() => dismiss(alert.id)} className="shrink-0 text-destructive/50 hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
