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
    basePriceDescription = `Similarity-weighted average from ${compCount} local comps`;
  } else if (basePriceMethod === "median" && compCount > 0) {
    basePriceDescription = `Median price from ${compCount} comparable listings`;
  } else if (basePriceMethod === "estimated") {
    basePriceDescription = "Estimated market price (limited local data)";
  }

  const steps = [
    {
      label: "Base Market Price",
      description: basePriceDescription,
      value: basePrice,
      isBase: true,
    },
  ];

  // Mileage adjustment
  if (mileageAdjustment !== 0) {
    const vehicleMileage = vehicle.miles || 0;
    const mileageDiff = vehicleMileage - avgMarketMileage;
    const direction = mileageDiff > 0 ? "above" : "below";
    steps.push({
      label: "Mileage Adjustment",
      description: `${Math.abs(Math.round(mileageDiff)).toLocaleString()} mi ${direction} market avg (${avgMarketMileage.toLocaleString()} mi) @ $${perMileRate}/mi`,
      value: mileageAdjustment,
      isDeduction: mileageAdjustment < 0,
    });
  }

  // Condition multiplier
  if (conditionMultiplier !== 1.0) {
    const conditionLabel = vehicle.condition || "Good";
    const conditionEffect = (conditionMultiplier - 1) * basePrice;
    steps.push({
      label: `Condition: ${conditionLabel}`,
      description: `${((conditionMultiplier - 1) * 100).toFixed(0)}% adjustment for reported condition`,
      value: Math.round(conditionEffect),
      isDeduction: conditionEffect < 0,
    });
  }

  // MDS (Market Days Supply) adjustment
  if (mdsAdjustment !== 0) {
    const mdsValue = vehicle.mds || vehicle.market_days_supply;
    let mdsDescription = "Market velocity adjustment";
    if (mdsValue) {
      if (mdsValue < 30) {
        mdsDescription = `Hot market (${Math.round(mdsValue)} day supply) — premium applied`;
      } else if (mdsValue > 60) {
        mdsDescription = `Slow market (${Math.round(mdsValue)} day supply) — discount applied`;
      } else {
        mdsDescription = `Normal market (${Math.round(mdsValue)} day supply)`;
      }
    }
    steps.push({
      label: "Market Velocity (MDS)",
      description: mdsDescription,
      value: mdsAdjustment,
      isDeduction: mdsAdjustment < 0,
    });
  }

  // Recall deduction
  if (recallDeduction && recallDeduction !== 0) {
    steps.push({
      label: "Open Safety Recalls",
      description: "Deduction for unresolved NHTSA safety recalls",
      value: -Math.abs(recallDeduction),
      isDeduction: true,
      icon: AlertTriangle,
    });
  }

  return steps;
}

export function calculateDealNumbers(appraisalValue, targetProfit, reconditioningCost) {
  const maxBid = appraisalValue - targetProfit - reconditioningCost;
  return {
    maxBid,
    targetProfit,
    reconditioningCost,
    appraisalValue,
  };
}

export function getConfidenceColor(score) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export function getConfidenceBgColor(score) {
  if (score >= 80) return "bg-green-400";
  if (score >= 60) return "bg-yellow-400";
  return "bg-red-400";
}

export function getConfidenceLabel(score) {
  if (score >= 80) return "High Confidence";
  if (score >= 60) return "Moderate Confidence";
  return "Low Confidence";
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getConditionOptions() {
  return [
    { value: "Excellent", label: "Excellent", multiplier: 1.05 },
    { value: "Good", label: "Good", multiplier: 1.0 },
    { value: "Fair", label: "Fair", multiplier: 0.92 },
    { value: "Poor", label: "Poor", multiplier: 0.82 },
  ];
}

export function groupComparablesByPrice(comparables) {
  if (!comparables || comparables.length === 0) return [];
  
  const sorted = [...comparables].sort((a, b) => (a.price || 0) - (b.price || 0));
  const min = sorted[0].price || 0;
  const max = sorted[sorted.length - 1].price || 0;
  const range = max - min;
  const bucketSize = range / 5 || 5000;
  
  const buckets = {};
  sorted.forEach(comp => {
    const bucketIndex = Math.floor((comp.price - min) / bucketSize);
    const bucketKey = min + bucketIndex * bucketSize;
    if (!buckets[bucketKey]) buckets[bucketKey] = [];
    buckets[bucketKey].push(comp);
  });
  
  return Object.entries(buckets).map(([price, comps]) => ({
    priceRange: `$${Math.round(Number(price) / 1000)}k-$${Math.round((Number(price) + bucketSize) / 1000)}k`,
    count: comps.length,
    avgMileage: Math.round(comps.reduce((sum, c) => sum + (c.miles || 0), 0) / comps.length),
  }));
}
