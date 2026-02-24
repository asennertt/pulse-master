import { Camera, X, Info } from "lucide-react";
import type { Vehicle } from "@/data/vehicles";

interface SmartImageSorterProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function SmartImageSorter({ vehicle, onClose }: SmartImageSorterProps) {
  const images = vehicle.images || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-2xl mx-4 p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Vehicle Photos</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Extension note */}
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Photo order and selection can be managed in the <span className="font-medium text-foreground">Pulse Extension</span> during posting.
          </p>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {images.map((src, idx) => (
              <div
                key={idx}
                className={`relative rounded-lg border overflow-hidden ${
                  idx === 0 ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <img
                  src={src}
                  alt={`Photo ${idx + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                />
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    HERO
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Camera className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No photos available from DMS</p>
          </div>
        )}
      </div>
    </div>
  );
}
