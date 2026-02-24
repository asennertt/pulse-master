import { AlertTriangle } from "lucide-react";

export function buildAdjustmentSteps(calculation, vehicle) {
  // Use new valuation_breakdown structure if available
  const breakdown = vehicle.valuation_breakdown || calculation;

  const basePrice =
    breakdown.basePrice ||
    calculation.basePrice ||
    vehicle.estimated_price ||
    45000;
  const mileageAdjustment =
    breakdown.mileageAdjustment || calculation.mileageAdjustment || 0;
  const conditionMultiplier =
    breakdown.conditionMultiplier || calculation.conditionMultiplier || 1.0;
  const mdsAdjustment =
    breakdown.mdsAdjustment || calculation.mdsAdjustment || 0;
  const recallDeduction = calculation.recallDeduction || 0;

  // Get average market mileage from breakdown, or from vehicle miles_volatility
  const avgMarketMileage =
    breakdown.avgMarketMileage ||
    calculation.avgMarketMileage ||
    vehicle.miles_volatility?.median ||
    0;
  const perMileRate = breakdown.perMileRate || calculation.perMileRate || 0.12;

  const basePriceMethod = breakdown.basePriceMethod || "median";
  const compCount = vehicle.comparables?.length || 0;

  let basePriceDescription = "Market price from comparable listings";
  if (basePriceMethod === "similarity_weighted" && compCount > 0) {
    basePriceDescription = `Similarity-weighted avg of ${compCount} comparables (by mileage, trim, distance, recency)`;
  } else if (compCount > 0) {
    basePriceDescription = `Median of ${compCount} comparable listings`;
  }

  const adjustmentSteps = [
    {
      name: "Base Market Price",
      value: basePrice,
      description: basePriceDescription,
      type: "base",
      color: "#06b6d4",
    },
  ];

  const userMileage = vehicle.miles || vehicle.mileage || 0;

  // Show mileage adjustment if there's an adjustment value OR if we have market mileage data to compare
  if (mileageAdjustment !== 0 || (avgMarketMileage > 0 && userMileage > 0)) {
    const mileageDiff =
      avgMarketMileage > 0 ? avgMarketMileage - userMileage : 0;
    const actualAdjustment =
      mileageAdjustment !== 0 ? mileageAdjustment : mileageDiff * perMileRate;

    adjustmentSteps.push({
      name: "Mileage Adjustment",
      value: actualAdjustment,
      description:
        avgMarketMileage > 0
          ? mileageDiff > 0
            ? `${Math.abs(mileageDiff).toLocaleString()} mi below market avg (${Math.round(avgMarketMileage).toLocaleString()} mi) × $${perMileRate.toFixed(2)}/mi`
            : `${Math.abs(mileageDiff).toLocaleString()} mi above market avg (${Math.round(avgMarketMileage).toLocaleString()} mi) × $${perMileRate.toFixed(2)}/mi`
          : `Mileage: ${userMileage.toLocaleString()} mi`,
      type: "adjustment",
      color:
        actualAdjustment > 0
          ? "#10b981"
          : actualAdjustment < 0
            ? "#ef4444"
            : "#94a3b8",
    });
  }

  if (conditionMultiplier !== 1.0) {
    const priceBeforeCondition = basePrice + mileageAdjustment;
    const conditionAdjustment =
      priceBeforeCondition * (conditionMultiplier - 1);
    const conditionName =
      (vehicle.condition || calculation.condition || "good")
        .charAt(0)
        .toUpperCase() +
      (vehicle.condition || calculation.condition || "good").slice(1);
    const percentChange = ((conditionMultiplier - 1) * 100).toFixed(0);

    adjustmentSteps.push({
      name: "Condition Adjustment",
      value: conditionAdjustment,
      description: `${conditionName} condition (${percentChange > 0 ? "+" : ""}${percentChange}%)`,
      type: "adjustment",
      color: conditionAdjustment > 0 ? "#10b981" : "#ef4444",
    });
  }

  if (mdsAdjustment !== 0) {
    const mds =
      vehicle.market_days_supply || calculation.marketDaysSupply || 45;
    const percentChange = ((mdsAdjustment / basePrice) * 100).toFixed(1);

    adjustmentSteps.push({
      name: "Market Velocity",
      value: mdsAdjustment,
      description: `${mds} days supply (${percentChange > 0 ? "+" : ""}${percentChange}% demand adjustment)`,
      type: "adjustment",
      color: mdsAdjustment > 0 ? "#10b981" : "#ef4444",
    });
  }

  if (recallDeduction < 0) {
    const recallCount = calculation.openRecalls || 1;

    adjustmentSteps.push({
      name: "Open Recalls",
      value: recallDeduction,
      description: `${recallCount} unresolved recall${recallCount > 1 ? "s" : ""}`,
      type: "adjustment",
      color: "#ef4444",
      icon: AlertTriangle,
    });
  }

  return adjustmentSteps;
}

export function calculatePulseValue(adjustmentSteps) {
  return adjustmentSteps.reduce((sum, adj) => sum + adj.value, 0);
}

export function calculateMarketHealth(daysOfSupply) {
  return {
    supply: daysOfSupply < 30 ? "Low" : daysOfSupply < 60 ? "Moderate" : "High",
    demand: daysOfSupply < 30 ? "High" : daysOfSupply < 60 ? "Moderate" : "Low",
    velocity:
      daysOfSupply < 30 ? "Fast" : daysOfSupply < 60 ? "Average" : "Slow",
  };
}

export function generateScatterData(vehicle) {
  // Use real comparable data if available
  if (vehicle.comparables && vehicle.comparables.length > 0) {
    return vehicle.comparables
      .filter((comp) => comp.price > 0 && comp.miles > 0)
      .slice(0, 40)
      .map((comp) => ({
        x: comp.miles,
        y: comp.price,
        z: 100,
      }));
  }

  // Fallback to mock data
  const basePrice = vehicle.estimated_price || vehicle.price || 45000;
  const baseMiles = vehicle.miles || vehicle.mileage || 30000;
  const data = [];
  for (let i = 0; i < 40; i++) {
    const mileageVariation = (Math.random() - 0.5) * 40000;
    const priceVariation = (Math.random() - 0.5) * 15000;
    data.push({
      x: Math.max(5000, baseMiles + mileageVariation),
      y: Math.max(20000, basePrice + priceVariation),
      z: 100,
    });
  }
  return data;
}

export function generateRadarData(vehicle) {
  // Calculate real scores based on vehicle data

  // Market Demand Score (based on Market Days Supply)
  let marketDemandScore = 50;
  if (vehicle.market_days_supply) {
    const mds = vehicle.market_days_supply;
    if (mds < 30)
      marketDemandScore = 95; // Hot market
    else if (mds < 45) marketDemandScore = 85;
    else if (mds < 60) marketDemandScore = 70;
    else if (mds < 90) marketDemandScore = 55;
    else marketDemandScore = 40; // Cold market
  }

  // Condition Score
  const conditionScores = {
    excellent: 95,
    good: 80,
    fair: 60,
    poor: 35,
  };
  const conditionScore =
    conditionScores[vehicle.condition?.toLowerCase()] || 75;

  // Mileage Score (compared to age)
  let mileageScore = 75;
  const vehicleMiles = vehicle.miles || vehicle.mileage || 0;
  if (vehicleMiles && vehicle.year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - vehicle.year;
    const expectedMileage = age * 12000; // 12k miles/year average
    const mileageDiff = vehicleMiles - expectedMileage;

    if (mileageDiff < -15000)
      mileageScore = 95; // Well below average
    else if (mileageDiff < -5000) mileageScore = 85;
    else if (mileageDiff < 5000)
      mileageScore = 75; // Average
    else if (mileageDiff < 15000) mileageScore = 60;
    else if (mileageDiff < 30000) mileageScore = 45;
    else mileageScore = 30; // Well above average
  }

  // Trim Value Score (based on MSRP vs market median)
  let trimValueScore = 70;
  const msrpValue =
    typeof vehicle.msrp === "object" ? vehicle.msrp?.base : vehicle.msrp;
  if (msrpValue && vehicle.comparables?.length > 0) {
    const comparablePrices = vehicle.comparables
      .filter((c) => c.price > 0)
      .map((c) => c.price)
      .sort((a, b) => a - b);

    if (comparablePrices.length > 0) {
      const medianPrice =
        comparablePrices[Math.floor(comparablePrices.length / 2)];
      const priceRatio = vehicle.estimated_price / medianPrice;

      if (priceRatio > 1.15) trimValueScore = 90;
      else if (priceRatio > 1.05) trimValueScore = 80;
      else if (priceRatio > 0.95) trimValueScore = 70;
      else if (priceRatio > 0.85) trimValueScore = 60;
      else trimValueScore = 50;
    }
  }

  // Features Score (based on options and features count)
  let featuresScore = 60;
  const totalFeatures =
    (vehicle.features?.length || 0) + (vehicle.options?.length || 0);
  if (totalFeatures > 20) featuresScore = 90;
  else if (totalFeatures > 15) featuresScore = 80;
  else if (totalFeatures > 10) featuresScore = 70;
  else if (totalFeatures > 5) featuresScore = 60;
  else featuresScore = 50;

  // Data Quality Score (based on comparables and confidence)
  let dataQualityScore = 50;
  if (vehicle.confidence_score) {
    dataQualityScore = vehicle.confidence_score;
  } else if (vehicle.comparables?.length) {
    const count = vehicle.comparables.length;
    if (count >= 25) dataQualityScore = 90;
    else if (count >= 15) dataQualityScore = 80;
    else if (count >= 10) dataQualityScore = 70;
    else if (count >= 5) dataQualityScore = 60;
    else dataQualityScore = 50;
  }

  return [
    { subject: "Market Demand", A: marketDemandScore, fullMark: 100 },
    { subject: "Condition", A: conditionScore, fullMark: 100 },
    { subject: "Mileage", A: mileageScore, fullMark: 100 },
    { subject: "Trim Value", A: trimValueScore, fullMark: 100 },
    { subject: "Features", A: featuresScore, fullMark: 100 },
    { subject: "Data Quality", A: dataQualityScore, fullMark: 100 },
  ];
}
