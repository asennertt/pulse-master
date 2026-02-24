import { Wifi } from "lucide-react";
import type { Vehicle } from "@/data/vehicles";

interface DashboardStatsProps {
  vehicles: Vehicle[];
}

export function DashboardStats({ vehicles }: DashboardStatsProps) {
  const syncedToFacebook = vehicles.filter(v => v.synced_to_facebook).length;

  return (
    <div className="flex">
      <div className="stat-gradient rounded-lg border border-border p-4 flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 border border-primary/20">
          <Wifi className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Posted to Marketplace</p>
          <p className="text-2xl font-bold text-primary glow-text">{syncedToFacebook}</p>
        </div>
      </div>
    </div>
  );
}
