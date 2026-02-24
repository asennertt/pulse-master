import type { VehicleStatus } from "@/data/vehicles";
import { CircleDot, Clock, CheckCircle2, LayoutGrid } from "lucide-react";
import { Car } from "lucide-react";

interface StatusFilterProps {
  activeFilter: VehicleStatus | "All";
  onFilterChange: (filter: VehicleStatus | "All") => void;
  counts: Record<VehicleStatus | "All", number>;
}

const filters: { key: VehicleStatus | "All"; label: string; icon: React.ElementType }[] = [
  { key: "All", label: "All Vehicles", icon: LayoutGrid },
  { key: "available", label: "Active", icon: CircleDot },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "sold", label: "History", icon: CheckCircle2 },
];

export function StatusFilter({ activeFilter, onFilterChange, counts }: StatusFilterProps) {
  return (
    <div className="glass rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <Car className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm text-foreground">Inventory</span>
      </div>
      {filters.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
            }`}
          >
            <span className="flex items-center gap-2">
              <f.icon className="h-4 w-4" />
              {f.label}
            </span>
            <span className={`font-mono text-xs ${isActive ? "text-primary" : "text-muted-foreground/60"}`}>
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
