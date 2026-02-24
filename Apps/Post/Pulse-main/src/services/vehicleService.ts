import { supabase } from "@/integrations/supabase/client";
import type { Vehicle, VehicleStatus } from "@/data/vehicles";
import { mockDMSFeed } from "@/data/vehicles";

// Fetch all vehicles from DB
export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as Vehicle[]) || [];
}

// Update vehicle status
export async function updateVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
  const updates: Record<string, unknown> = { status };
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

// Update facebook sync status
export async function updateFacebookSync(id: string, synced: boolean, postId?: string): Promise<void> {
  const { error } = await supabase
    .from("vehicles")
    .update({
      synced_to_facebook: synced,
      facebook_post_id: postId || null,
    })
    .eq("id", id);
  if (error) throw error;
}

// Sync inventory from mock DMS feed
export async function syncInventoryFromDMS(): Promise<{ added: number; markedSold: number }> {
  // Get current DB vehicles
  const { data: dbVehicles, error } = await supabase
    .from("vehicles")
    .select("*");
  if (error) throw error;

  const currentVehicles = (dbVehicles as unknown as Vehicle[]) || [];
  const dbVinSet = new Set(currentVehicles.map(v => v.vin));
  const dmsVinSet = new Set(mockDMSFeed.map(v => v.vin));

  let added = 0;
  let markedSold = 0;

  // Add new vehicles from DMS that aren't in DB
  for (const dmsVehicle of mockDMSFeed) {
    if (!dbVinSet.has(dmsVehicle.vin)) {
      const { error: insertError } = await supabase
        .from("vehicles")
        .insert({
          vin: dmsVehicle.vin,
          make: dmsVehicle.make,
          model: dmsVehicle.model,
          year: dmsVehicle.year,
          trim: dmsVehicle.trim,
          mileage: dmsVehicle.mileage,
          price: dmsVehicle.price,
          exterior_color: dmsVehicle.exterior_color,
          status: dmsVehicle.status,
          images: dmsVehicle.images,
        });
      if (!insertError) added++;
    }
  }

  // Mark vehicles as sold if they're in DB but not in DMS feed (and not already sold)
  for (const dbVehicle of currentVehicles) {
    if (!dmsVinSet.has(dbVehicle.vin) && dbVehicle.status !== "sold") {
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ status: "sold", synced_to_facebook: false, facebook_post_id: null })
        .eq("id", dbVehicle.id);
      if (!updateError) markedSold++;
    }
  }

  return { added, markedSold };
}
