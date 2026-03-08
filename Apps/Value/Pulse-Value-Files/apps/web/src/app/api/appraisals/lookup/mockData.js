export function getMockVehicleData(vin, mileage, condition) {
  return {
    vin: vin,
    year: 2020,
    make: "Toyota",
    model: "Camry",
    trim: "LE",
    body_type: "Sedan",
    exterior_color: "Silver",
    interior_color: "Black",
    drivetrain: "FWD",
    transmission: "Automatic",
    mileage: mileage,
    miles: mileage,
    estimated_price: 22500,
    condition: condition,
    source: "mock",
  };
}

export function getMockVehicleDataWithMessage(vin, mileage, condition) {
  return {
    ...getMockVehicleData(vin, mileage, condition),
    message:
      "VIN not found in MarketCheck database. Showing sample data. Please try a different VIN or contact support.",
  };
}
