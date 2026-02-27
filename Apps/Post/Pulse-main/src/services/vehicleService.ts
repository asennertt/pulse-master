import { supabase } from "@/integrations/supabase/client";
import type { Vehicle, VehicleStatus } from "@/data/vehicles";

// 1. Fetch vehicles for a SPECIFIC dealer
// P11 fix: dealerId is now required; filter is always applied
export async function fetchVehicles(dealerId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("pulse_vehicles")
    .select("*")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Vehicle[]) || [];
}

// 2. Update vehicle status
// P (vehicleService) fix: removed client-side updated_at to avoid clock drift.
export async function updateVehicleStatus(dealerId: string, id: string, status: VehicleStatus): Promise<void> {
  const updates: Record<string, any> = { status };
  if (status === "sold") {
    updates.synced_to_facebook = false;
    updates.facebook_post_id = null;
  }
  const { error } = await supabase
    .from("pulse_vehicles")
    .update(updates)
    .eq("dealer_id", dealerId)
    .eq("id", id);
  if (error) throw error;
}

// 3. Toggle Facebook sync status for a vehicle
// P (updateFacebookSync) fix: dealerId is now a required first parameter and scopes the update
export async function updateFacebookSync(dealerId: string, id: string, synced: boolean): Promise<void> {
  const { error } = await supabase
    .from("pulse_vehicles")
    .update({ synced_to_facebook: synced })
    .eq("dealer_id", dealerId)
    .eq("id", id);
  if (error) throw error;
}

// 4. Trigger the REAL DMS Sync Edge Function
// P12 fix: dealerId is now required and included in the request body
export async function syncInventoryFromDMS(dealerId: string, feedType: string = "XML"): Promise<{ new_vehicles: number; marked_sold: number }> {
  const { data, error } = await supabase.functions.invoke("dms-ingest", {
    body: { source: "Manual Sync", dealer_id: dealerId, feedType }
  });
  if (error) throw error;
  return {
    new_vehicles: data.new_vehicles || 0,
    marked_sold: data.marked_sold || 0
  };
}
