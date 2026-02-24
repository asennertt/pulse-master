import { useState } from "react";
import { Car, Wifi, Clock, Gauge, Sparkles, Camera, Store, TrendingDown, DollarSign } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { StaffAssignSelect } from "@/components/StaffAssignSelect";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import type { Vehicle } from "@/data/vehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  userPostedAt?: string | null;
  onMarkSold: (id: string) => void;
  onGeneratePost: (vehicle: Vehicle) => void;
  onDispatch: (vehicle: Vehicle) => void;
  onImageSort: (vehicle: Vehicle) => void;
  onListMarketplace: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, userPostedAt, onMarkSold, onGeneratePost, onDispatch, onImageSort, onListMarketplace }: VehicleCardProps) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [assignedName, setAssignedName] = useState<string | null>(null);
  const daysColor = vehicle.days_on_lot > 30 ? "text-destructive" : vehicle.days_on_lot > 14 ? "text-warning" : "text-success";

  // Check if price dropped in the last 7 days
  const hasPriceDrop = vehicle.last_price_change
    ? (Date.now() - new Date(vehicle.last_price_change).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="glass-card rounded-lg overflow-hidden animate-slide-in group">
      <div className="h-40 bg-secondary relative flex items-center justify-center overflow-hidden">
        {vehicle.images && vehicle.images.length > 0 && vehicle.images[0] ? (
          <img src={vehicle.images[0]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Car className="h-12 w-12 text-muted-foreground/30" />
        )}
        <div className="absolute top-2 right-2">
          {userPostedAt && (
            <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-mono">
              <Wifi className="h-3 w-3" /> LIVE
            </span>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <StatusBadge status={vehicle.status} />
        </div>
        {vehicle.exterior_color && (
          <div className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-foreground font-mono">
            {vehicle.exterior_color}
          </div>
        )}
        {hasPriceDrop && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] text-white font-bold animate-pulse">
            <TrendingDown className="h-3 w-3" /> PRICE DROP
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs text-muted-foreground">{vehicle.trim}</p>
        </div>

        <p className="text-lg font-bold text-primary glow-text">
          ${Number(vehicle.price).toLocaleString()}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3 w-3" />
            <span>{vehicle.mileage.toLocaleString()} mi</span>
          </div>
          <div className={`flex items-center gap-1.5 ${daysColor}`}>
            <Clock className="h-3 w-3" />
            <span>{vehicle.days_on_lot}d on lot</span>
          </div>
        </div>

        {/* Staff Assignment */}
        <StaffAssignSelect
          vehicleId={vehicle.id}
          currentStaffId={(vehicle as any).assigned_staff_id || null}
          onAssign={(id, name) => setAssignedName(name)}
        />

        <p className="font-mono text-[10px] text-muted-foreground/60 truncate">
          VIN: {vehicle.vin}
        </p>

        {vehicle.status !== "sold" ? (
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onGeneratePost(vehicle)}
                className="flex items-center justify-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="h-3 w-3" /> AI Post
              </button>
              <button
                onClick={() => onImageSort(vehicle)}
                className="flex items-center justify-center gap-1 rounded-md bg-secondary border border-border px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Camera className="h-3 w-3" /> Images
              </button>
            </div>
            <button
              onClick={() => onListMarketplace(vehicle)}
              className="w-full rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <Store className="h-3 w-3" /> List on Marketplace
            </button>

            {/* Price History Button */}
            <button
              onClick={() => setShowPriceHistory(true)}
              className={`w-full rounded-md border px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                hasPriceDrop
                  ? "bg-success/10 border-success/20 text-success hover:bg-success/20"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="h-3 w-3" /> Price Trends
              {hasPriceDrop && <TrendingDown className="h-3 w-3" />}
            </button>

            <button
              onClick={() => onMarkSold(vehicle.id)}
              className="w-full rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              Mark as Sold
            </button>
          </div>
        ) : (
          <div className="pt-1">
            <div className="rounded-md bg-muted border border-border px-3 py-2 text-xs text-muted-foreground text-center">
              Listing Removed
            </div>
          </div>
        )}
      </div>

      {/* Price History Modal */}
      {showPriceHistory && (
        <PriceHistoryChart vehicle={vehicle} onClose={() => setShowPriceHistory(false)} />
      )}
    </div>
  );
}
