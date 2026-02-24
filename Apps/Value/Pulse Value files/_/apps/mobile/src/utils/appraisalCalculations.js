export function calculateMarketMetrics(vehicle) {
  const daysOfSupply = vehicle.market_days_supply || 28;
  const marketHealth =
    daysOfSupply < 30 ? "High" : daysOfSupply < 60 ? "Medium" : "Low";
  const velocity =
    daysOfSupply < 30 ? "Fast" : daysOfSupply < 60 ? "Moderate" : "Slow";

  return {
    daysOfSupply,
    marketHealth,
    velocity,
  };
}

export function getPulseValue(vehicle) {
  return vehicle.estimated_price || vehicle.price || 0;
}

export function getConfidence(vehicle) {
  return vehicle.confidence_score || 87;
}
