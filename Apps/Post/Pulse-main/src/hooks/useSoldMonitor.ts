import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mockDMSFeed } from "@/data/vehicles";
import { toast } from "sonner";

interface SoldMonitorProps {
  enabled: boolean;
  intervalMs?: number;
}

export function useSoldMonitor({ enabled, intervalMs = 60000 }: SoldMonitorProps) {
  const lastChecked = useRef<Set<string>>(new Set());
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if (enabled && "Notification" in window) {
      Notification.requestPermission().then(p => {
        notificationPermission.current = p;
      });
    }
  }, [enabled]);

  const checkForSoldVehicles = useCallback(async () => {
    try {
      const { data: dbVehicles, error } = await supabase
        .from("vehicles")
        .select("id, vin, year, make, model, status, synced_to_facebook");

      if (error || !dbVehicles) return;

      const dmsVinSet = new Set(mockDMSFeed.map(v => v.vin));
      const vehicles = dbVehicles as unknown as Array<{
        id: string; vin: string; year: number; make: string; model: string;
        status: string; synced_to_facebook: boolean;
      }>;

      for (const vehicle of vehicles) {
        // Vehicle in DB but missing from DMS feed, and not already sold, and not already notified
        if (
          !dmsVinSet.has(vehicle.vin) &&
          vehicle.status !== "sold" &&
          !lastChecked.current.has(vehicle.vin)
        ) {
          lastChecked.current.add(vehicle.vin);

          const title = `VIN ${vehicle.vin.slice(-6)} has sold`;
          const body = `${vehicle.year} ${vehicle.make} ${vehicle.model} is no longer in DMS feed. Delete the Facebook listing?`;

          // Browser notification
          if (notificationPermission.current === "granted") {
            const notification = new Notification(title, {
              body,
              icon: "/favicon.ico",
              tag: vehicle.vin,
            });
            notification.onclick = () => {
              window.open("https://www.facebook.com/marketplace/you/selling", "_blank");
              notification.close();
            };
          }

          // In-app toast as backup
          toast.warning(title, {
            description: body,
            duration: 10000,
            action: {
              label: "Open Facebook",
              onClick: () => window.open("https://www.facebook.com/marketplace/you/selling", "_blank"),
            },
          });
        }
      }
    } catch (e) {
      console.error("Sold monitor check failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial check after a delay
    const initialTimeout = setTimeout(checkForSoldVehicles, 5000);

    // Periodic checks
    const interval = setInterval(checkForSoldVehicles, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, intervalMs, checkForSoldVehicles]);
}
