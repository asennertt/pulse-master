import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Clock, ExternalLink } from "lucide-react";

interface RenewalVehicle {
  vehicle_id: string;
  posted_at: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  images: string[] | null;
}

export function RenewalsBanner() {
  const [vehicles, setVehicles] = useState<RenewalVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRenewals();
  }, []);

  const loadRenewals = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get current user's postings older than 7 days, joined with vehicle data
    const { data: postings } = await supabase
      .from("user_vehicle_postings")
      .select("vehicle_id, posted_at")
      .lt("posted_at", sevenDaysAgo)
      .order("posted_at", { ascending: true })
      .limit(20);

    if (!postings || postings.length === 0) {
      setLoading(false);
      return;
    }

    // Get vehicle details for those postings (only available ones)
    const vehicleIds = (postings as unknown as { vehicle_id: string; posted_at: string }[]).map(p => p.vehicle_id);
    const { data: vehicleData } = await supabase
      .from("vehicles")
      .select("id, vin, year, make, model, images, status")
      .in("id", vehicleIds)
      .eq("status", "available");

    if (!vehicleData) {
      setLoading(false);
      return;
    }

    const vehicleMap = new Map((vehicleData as any[]).map(v => [v.id, v]));
    const result: RenewalVehicle[] = [];
    for (const p of postings as unknown as { vehicle_id: string; posted_at: string }[]) {
      const v = vehicleMap.get(p.vehicle_id);
      if (v) {
        result.push({
          vehicle_id: p.vehicle_id,
          posted_at: p.posted_at,
          vin: v.vin,
          year: v.year,
          make: v.make,
          model: v.model,
          images: v.images,
        });
      }
    }
    setVehicles(result);
    setLoading(false);
  };

  const daysAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) return null;
  if (vehicles.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-warning/15 border border-warning/30 flex items-center justify-center">
          <RefreshCw className="h-4 w-4 text-warning" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Your Listings Due for Renewal</h3>
          <p className="text-[10px] text-muted-foreground">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} you posted over 7 days ago</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {vehicles.map(v => (
          <div key={v.vehicle_id} className="glass-card rounded-lg p-4 space-y-3 border-l-4 border-l-warning">
            <div className="flex items-start gap-3">
              {v.images && v.images[0] ? (
                <img
                  src={v.images[0]}
                  alt={`${v.year} ${v.make} ${v.model}`}
                  className="h-12 w-16 rounded-md object-cover border border-border shrink-0"
                />
              ) : (
                <div className="h-12 w-16 rounded-md bg-secondary border border-border shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {v.year} {v.make} {v.model}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">{v.vin}</div>
                <div className="flex items-center gap-1 mt-1 text-warning text-[10px] font-medium">
                  <Clock className="h-3 w-3" />
                  Posted {daysAgo(v.posted_at)} days ago
                </div>
              </div>
            </div>
            <a
              href={`https://www.facebook.com/marketplace/you/selling?vin=${encodeURIComponent(v.vin)}&action=renew`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full rounded-md bg-primary text-primary-foreground py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Renew on Marketplace
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
