// Vehicle types matching the database schema
export type VehicleStatus = "available" | "pending" | "sold";

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  mileage: number;
  price: number;
  exterior_color: string | null;
  status: VehicleStatus;
  images: string[];
  facebook_post_id: string | null;
  synced_to_facebook: boolean;
  days_on_lot: number;
  leads: number;
  last_price_change: string | null;
  created_at: string;
  updated_at: string;
}

// Maps DB status to display labels
export const statusDisplayMap: Record<VehicleStatus, string> = {
  available: "Active",
  pending: "Pending",
  sold: "Sold",
};

// Mock DMS data for sync simulation (some overlap with DB, some new)
export const mockDMSFeed: Omit<Vehicle, "id" | "facebook_post_id" | "synced_to_facebook" | "days_on_lot" | "leads" | "created_at" | "updated_at" | "last_price_change">[] = [
  { vin: "1HGCG5655WA039523", make: "Honda", model: "Accord", year: 2024, trim: "Sport 2.0T", mileage: 1280, price: 34990, exterior_color: "Platinum White", status: "available", images: [] },
  { vin: "5YJSA1E26MF123456", make: "Tesla", model: "Model 3", year: 2023, trim: "Long Range AWD", mileage: 8500, price: 38500, exterior_color: "Midnight Silver", status: "available", images: [] },
  { vin: "WBAPH5C55BA123789", make: "BMW", model: "330i", year: 2024, trim: "xDrive M Sport", mileage: 560, price: 46750, exterior_color: "Alpine White", status: "pending", images: [] },
  { vin: "1G1YY22G965109876", make: "Chevrolet", model: "Corvette", year: 2022, trim: "Stingray 3LT", mileage: 11200, price: 62900, exterior_color: "Torch Red", status: "available", images: [] },
  { vin: "2T1BURHE5JC098765", make: "Toyota", model: "Camry", year: 2024, trim: "XSE Hybrid", mileage: 320, price: 33200, exterior_color: "Ice Cap", status: "available", images: [] },
  { vin: "WAUFFAFL3EN012345", make: "Audi", model: "A4", year: 2023, trim: "Premium Plus 45", mileage: 6700, price: 41300, exterior_color: "Daytona Gray", status: "available", images: [] },
  { vin: "WP0AA2A97KS678901", make: "Porsche", model: "911", year: 2024, trim: "Carrera S", mileage: 890, price: 129500, exterior_color: "GT Silver", status: "available", images: [] },
  // NEW vehicles not in DB yet — sync should add these
  { vin: "WVWZZZ3CZWE123456", make: "Volkswagen", model: "Golf R", year: 2025, trim: "DSG", mileage: 12, price: 46890, exterior_color: "Lapiz Blue", status: "available", images: [] },
  { vin: "JTDKN3DU5A0123456", make: "Lexus", model: "IS 500", year: 2024, trim: "F Sport Performance", mileage: 3200, price: 58700, exterior_color: "Ultrasonic Blue", status: "available", images: [] },
  // NOTE: Nissan Altima (JN1TANT31Z0000345) and Hyundai Elantra (KMHD84LF2LU567890) are MISSING from DMS — sync should mark as sold
];
