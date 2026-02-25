import { supabase } from "@/integrations/supabase/client";
import type { Vehicle, VehicleStatus } from "@/data/vehicles";

// 1. Fetch vehicles for a SPECIFIC dealer
export async function fetchVehicles(dealerId?: string): Promise<Vehicle[]> {
  let query = supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (dealerId) {
    query = query.eq("dealer_id", dealerId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as unknown as Vehicle[]) || [];
}

// 2. Update vehicle status (Neon Direct via Supabase Client)
export async function updateVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
  const updates: Record<string, any> = { 
    status,
    updated_at: new Date().toISOString() 
  };
  
  if (status === "sold") {
    updates.synced_to_facebook = false;
    updates.facebook_post_id = null;
  }

  const { error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id);
    
  if (error) throw error;
}

// 3. Trigger the REAL DMS Sync Edge Function
export async function syncInventoryFromDMS(): Promise<{ new_vehicles: number; marked_sold: number }> {
  // Instead of mock logic, we trigger the Edge Function we built for Neon
  const { data, error } = await supabase.functions.invoke("dms-ingest", {
    body: { source: "Manual Sync", feedType: "CSV" }
  });

  if (error) throw error;
  return {
    new_vehicles: data.new_vehicles || 0,
    marked_sold: data.marked_sold || 0
  };
}