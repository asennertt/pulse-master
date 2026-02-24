import { Badge } from "@/components/ui/badge";
import type { VehicleStatus } from "@/data/vehicles";

const statusConfig: Record<VehicleStatus, { className: string; label: string }> = {
  available: { className: "bg-success/15 text-success border-success/30 hover:bg-success/20", label: "Active" },
  pending: { className: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20", label: "Pending" },
  sold: { className: "bg-muted text-muted-foreground border-border hover:bg-muted", label: "Sold" },
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
        status === "available" ? "bg-success animate-pulse-glow" :
        status === "pending" ? "bg-warning" : "bg-muted-foreground"
      }`} />
      {config.label}
    </Badge>
  );
}
