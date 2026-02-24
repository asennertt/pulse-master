import { calculateSimilarityWeightedPrice } from "./similarityWeighting";

/**
 * Calculate age-based depreciation multiplier using a realistic curve.
 * Cars depreciate more in early years, less in later years.
 */
function getDepreciationMultiplier(age) {
  if (age <= 0) return 1.0;
  if (age === 1) return 0.8; // -20% first year
  if (age === 2) return 0.7; // -30% by year 2
  if (age === 3) return 0.62; // -38% by year 3
  if (age === 4) return 0.56; // -44% by year 4
  if (age === 5) return 0.51; // -49% by year 5

  // After 5 years, depreciation slows: ~4% per year
  return Math.max(0.15, 0.51 - (age - 5) * 0.04);
}

export function calculateEnhancedValuation({
  decodeData,
  comparables,
  priceHistory,
  mdsData,
  marketStats,
  marketAnalysis,
  condition,
  mileage,
  marketCheckPrice,
  recentListings = [],
}) {
  const breakdown = {
    basePrice: 0,
    basePriceMethod: "unknown",
    mileageAdjustment: 0,
    avgMarketMileage: 0,
    perMileRate: 0.12,
    conditionMultiplier: 1.0,
    mdsAdjustment: 0,
    domAdjustment: 0,
    priceTrendAdjustment: 0,
    volatilityAdjustment: 0,
    certifiedPremium: 0,
    marketCheckValidation: null,
    negotiationDiscount: 0,
    finalPrice: 0,
  };

  // Condition multipliers
  const conditionMultipliers = {
    excellent: 1.15,
    good: 1.0,
    fair: 0.85,
    poor: 0.7,
  };

  breakdown.conditionMultiplier = conditionMultipliers[condition] || 1.0;

  // STEP 1: Calculate base price using SIMILARITY-WEIGHTED AVERAGE
  // Combine active listings with recent/sold listings for better data
  const allComparables = [...comparables];

  // Add recent/sold listings if available (they represent actual transaction prices)
  if (recentListings && recentListings.length > 0) {
    console.log(
      `[Valuation] Including ${recentListings.length} recent/sold listings for more accurate pricing`,
    );
    allComparables.push(...recentListings);
  }

  if (allComparables && allComparables.length >= 3) {
    const weightedResult = calculateSimilarityWeightedPrice({
      comparables: allComparables,
      subjectMileage: mileage,
      subjectTrim: decodeData.trim || decodeData.style || "",
    });

    if (weightedResult.price > 0) {
      breakdown.basePrice = weightedResult.price;
      breakdown.basePriceMethod = "similarity_weighted";
      console.log(
        `[Valuation] Using similarity-weighted price: $${breakdown.basePrice.toFixed(0)} (${weightedResult.comparablesUsed} comps, top weight: ${weightedResult.topWeight.toFixed(3)})`,
      );
    }
  }

  // Fallback to median if weighted didn't produce a result
  if (breakdown.basePrice === 0 && marketAnalysis.priceVolatility.median > 0) {
    breakdown.basePrice = marketAnalysis.priceVolatility.median;
    breakdown.basePriceMethod = "median";
    console.log(
      "[Valuation] Fallback to market median price:",
      breakdown.basePrice,
    );
  } else if (breakdown.basePrice === 0 && marketStats?.price?.avg) {
    breakdown.basePrice = marketStats.price.avg;
    breakdown.basePriceMethod = "market_avg";
    console.log(
      "[Valuation] Fallback to market average price:",
      breakdown.basePrice,
    );
  } else if (
    breakdown.basePrice === 0 &&
    allComparables &&
    allComparables.length > 0
  ) {
    // Filter out outliers and calculate trimmed median
    const prices = allComparables
      .filter((c) => c.price && c.price > 0)
      .map((c) => c.price)
      .sort((a, b) => a - b);

    if (prices.length > 0) {
      const trimCount = Math.floor(prices.length * 0.1);
      const trimmedPrices = prices.slice(trimCount, prices.length - trimCount);

      const medianIndex = Math.floor(trimmedPrices.length / 2);
      breakdown.basePrice =
        trimmedPrices.length % 2 === 0
          ? (trimmedPrices[medianIndex - 1] + trimmedPrices[medianIndex]) / 2
          : trimmedPrices[medianIndex];
      breakdown.basePriceMethod = "trimmed_median";

      console.log(
        "[Valuation] Fallback to trimmed median price:",
        breakdown.basePrice,
      );
    }
  }

  // Fallback to MSRP-based depreciation using realistic curve
  if (breakdown.basePrice === 0 && decodeData.msrp) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - decodeData.year;
    const depreciationMultiplier = getDepreciationMultiplier(age);

    breakdown.basePrice = decodeData.msrp * depreciationMultiplier;
    breakdown.basePriceMethod = "msrp_depreciation_curve";
    console.log(
      `[Valuation] Using MSRP-based depreciation curve (age: ${age}, multiplier: ${depreciationMultiplier.toFixed(2)}): $${breakdown.basePrice.toFixed(0)}`,
    );
  }

  // Final fallback estimate
  if (breakdown.basePrice === 0) {
    breakdown.basePrice = 25000;
    breakdown.basePriceMethod = "fallback";
    console.log("[Valuation] Using fallback base price");
  }

  // STEP 1.5: Validate against MarketCheck's predicted price
  if (marketCheckPrice && marketCheckPrice > 0) {
    const priceDifference = breakdown.basePrice - marketCheckPrice;
    const percentDifference = (priceDifference / marketCheckPrice) * 100;

    breakdown.marketCheckValidation = {
      marketCheckPrice,
      ourPrice: breakdown.basePrice,
      difference: priceDifference,
      percentDifference,
    };

    console.log(
      `[Valuation] MarketCheck validation - Their price: $${marketCheckPrice.toFixed(0)}, Our price: $${breakdown.basePrice.toFixed(0)}, Diff: ${percentDifference.toFixed(1)}%`,
    );

    // If our price differs by more than 15%, blend the two prices
    if (Math.abs(percentDifference) > 15) {
      const blendedPrice = breakdown.basePrice * 0.6 + marketCheckPrice * 0.4;
      console.log(
        `[Valuation] Large difference detected - blending prices. New base: $${blendedPrice.toFixed(0)}`,
      );
      breakdown.basePrice = blendedPrice;
      breakdown.basePriceMethod = "blended_with_marketcheck";
    }
  }

  // STEP 2: Enhanced mileage adjustment using age-based depreciation
  if (mileage && marketAnalysis.milesVolatility.median > 0) {
    const avgMileage = marketAnalysis.milesVolatility.median;
    const mileageDiff = mileage - avgMileage;

    // Adjust per-mile rate based on vehicle age - newer cars lose more value per mile
    const currentYear = new Date().getFullYear();
    const age = currentYear - decodeData.year;
    let perMileRate = 0.12; // base rate

    if (age <= 2) {
      perMileRate = 0.15; // newer cars depreciate faster per mile
    } else if (age <= 5) {
      perMileRate = 0.12;
    } else if (age <= 10) {
      perMileRate = 0.08;
    } else {
      perMileRate = 0.05; // older cars depreciate slower per mile
    }

    breakdown.mileageAdjustment = mileageDiff * -perMileRate;
    breakdown.avgMarketMileage = avgMileage;
    breakdown.perMileRate = perMileRate;
  } else if (mileage && marketStats?.miles?.avg) {
    const avgMileage = marketStats.miles.avg;
    const mileageDiff = mileage - avgMileage;
    const perMileRate = 0.1;

    breakdown.mileageAdjustment = mileageDiff * -perMileRate;
    breakdown.avgMarketMileage = avgMileage;
    breakdown.perMileRate = perMileRate;
  }

  // STEP 3: Market Days Supply adjustment (enhanced)
  if (mdsData?.mds) {
    const mds = mdsData.mds;

    if (mds < 30) {
      breakdown.mdsAdjustment = breakdown.basePrice * 0.07; // +7% hot market
    } else if (mds < 60) {
      breakdown.mdsAdjustment = 0; // neutral
    } else if (mds < 90) {
      breakdown.mdsAdjustment = breakdown.basePrice * -0.04; // -4%
    } else {
      breakdown.mdsAdjustment = breakdown.basePrice * -0.09; // -9% very high supply
    }
  }

  // STEP 4: Days on Market velocity adjustment
  const avgDOM = marketAnalysis.domStats.avg;
  if (avgDOM > 0) {
    if (avgDOM < 30) {
      breakdown.domAdjustment = breakdown.basePrice * 0.05; // +5% fast selling
    } else if (avgDOM > 60) {
      breakdown.domAdjustment = breakdown.basePrice * -0.04; // -4% slow selling
    }
  }

  // STEP 5: Price trend adjustment
  const trendPercentage = marketAnalysis.priceTrend.percentage;
  if (Math.abs(trendPercentage) > 3) {
    // Apply 50% of the trend to be conservative
    breakdown.priceTrendAdjustment =
      breakdown.basePrice * (trendPercentage / 100) * 0.5;
  }

  // STEP 6: Volatility-based adjustment
  if (marketAnalysis.priceVolatility.stddev > 0) {
    const coefficientOfVariation =
      marketAnalysis.priceVolatility.stddev / breakdown.basePrice;

    // High volatility = less certainty = slight discount
    if (coefficientOfVariation > 0.15) {
      breakdown.volatilityAdjustment = breakdown.basePrice * -0.02; // -2% for high volatility
    }
  }

  // STEP 7: Certified pre-owned premium
  const certifiedPercentage =
    comparables.length > 0
      ? marketAnalysis.inventoryBreakdown.certified / comparables.length
      : 0;

  if (certifiedPercentage > 0.2 && condition === "excellent") {
    breakdown.certifiedPremium = breakdown.basePrice * 0.1; // +10% CPO potential
  }

  // STEP 8: Apply negotiation discount
  // Active listings are asking prices, not transaction prices
  // Most cars sell for 3-7% below asking, depending on DOM
  let negotiationRate = 0.05; // default 5% below asking

  if (avgDOM > 0) {
    if (avgDOM < 20) {
      negotiationRate = 0.03; // hot market, less negotiation room
    } else if (avgDOM > 60) {
      negotiationRate = 0.07; // slow market, more negotiation room
    }
  }

  breakdown.negotiationDiscount = breakdown.basePrice * -negotiationRate;

  // STEP 9: Apply condition multiplier and calculate retail price
  const adjustedPrice =
    breakdown.basePrice +
    breakdown.mileageAdjustment +
    breakdown.mdsAdjustment +
    breakdown.domAdjustment +
    breakdown.priceTrendAdjustment +
    breakdown.volatilityAdjustment +
    breakdown.certifiedPremium +
    breakdown.negotiationDiscount;

  const retailPrice = Math.round(adjustedPrice * breakdown.conditionMultiplier);
  breakdown.finalPrice = retailPrice;

  // STEP 10: Calculate multi-tier pricing
  const wholesalePrice = Math.round(retailPrice * 0.75); // Wholesale = 75% of retail
  const tradeInPrice = Math.round(retailPrice * 0.85); // Trade-in = 85% of retail
  const quickSalePrice = Math.round(retailPrice * 0.92); // Quick sale = 92% of retail
  const marketAverage = Math.round(breakdown.basePrice); // Market average before adjustments

  // STEP 11: Calculate days to turn estimates
  const baseDOM = avgDOM > 0 ? avgDOM : 30;
  const daysToTurnEstimate = {
    wholesale: Math.round(baseDOM * 0.3), // Wholesale moves fast (30% of normal DOM)
    trade_in: Math.round(baseDOM * 0.5), // Trade-in price (50% of normal DOM)
    quick_sale: Math.round(baseDOM * 0.6), // Quick sale (60% of normal DOM)
    retail: Math.round(baseDOM), // Retail = average DOM
    above_market: Math.round(baseDOM * 1.5), // Above market takes longer
  };

  // STEP 12: Calculate confidence score with detailed factors
  const confidenceFactors = [];
  let confidenceScore = 50;

  if (comparables.length >= 20) {
    confidenceScore += 20;
    confidenceFactors.push(
      `Strong comparable data (${comparables.length} listings)`,
    );
  } else if (comparables.length >= 10) {
    confidenceScore += 15;
    confidenceFactors.push(
      `Good comparable data (${comparables.length} listings)`,
    );
  } else if (comparables.length >= 5) {
    confidenceScore += 10;
    confidenceFactors.push(
      `Moderate comparable data (${comparables.length} listings)`,
    );
  } else {
    confidenceFactors.push(
      `⚠ Limited comparable data (${comparables.length} listings)`,
    );
  }

  // Price volatility factor
  if (marketAnalysis.priceVolatility.stddev > 0) {
    const cv = marketAnalysis.priceVolatility.stddev / breakdown.basePrice;
    if (cv < 0.1) {
      confidenceScore += 15;
      confidenceFactors.push("Low price volatility (stable market)");
    } else if (cv < 0.2) {
      confidenceScore += 10;
      confidenceFactors.push("Moderate price volatility");
    } else {
      confidenceFactors.push("⚠ High price volatility (unstable pricing)");
    }
  }

  // Price history availability
  if (priceHistory.length > 5) {
    confidenceScore += 10;
    confidenceFactors.push("Historical price data available");
  }

  // Market days supply data
  if (mdsData?.mds) {
    confidenceScore += 10;
    confidenceFactors.push("Market supply data available");
  }

  // Recent sales data
  if (marketAnalysis.salesVelocity > 0) {
    confidenceScore += 5;
    confidenceFactors.push("Sales velocity data available");
  }

  confidenceScore = Math.min(confidenceScore, 95);

  // STEP 13: Calculate vehicle score (0-100)
  let vehicleScore = 50;

  // Market position component (30 points)
  if (marketAnalysis.marketCondition === "hot") {
    vehicleScore += 15;
  } else if (marketAnalysis.marketCondition === "slow") {
    vehicleScore -= 10;
  }

  // Condition component (20 points)
  if (condition === "excellent") {
    vehicleScore += 20;
  } else if (condition === "good") {
    vehicleScore += 10;
  } else if (condition === "fair") {
    vehicleScore -= 5;
  } else {
    vehicleScore -= 15;
  }

  // Mileage component (20 points)
  if (mileage && marketAnalysis.milesVolatility.median > 0) {
    const mileageRatio = mileage / marketAnalysis.milesVolatility.median;
    if (mileageRatio < 0.8) {
      vehicleScore += 20; // Low mileage
    } else if (mileageRatio < 1.0) {
      vehicleScore += 10; // Below average
    } else if (mileageRatio < 1.2) {
      vehicleScore -= 5; // Above average
    } else {
      vehicleScore -= 15; // High mileage
    }
  }

  // Price trend component (15 points)
  if (marketAnalysis.priceTrend.direction === "up") {
    vehicleScore += 15;
  } else if (marketAnalysis.priceTrend.direction === "down") {
    vehicleScore -= 10;
  }

  // DOM component (15 points)
  if (avgDOM > 0 && avgDOM < 30) {
    vehicleScore += 15; // Fast selling
  } else if (avgDOM > 60) {
    vehicleScore -= 10; // Slow selling
  }

  vehicleScore = Math.max(0, Math.min(100, vehicleScore));

  // STEP 14: Determine market position
  let marketPosition = "average";
  if (vehicleScore >= 75) {
    marketPosition = "strong";
  } else if (vehicleScore >= 60) {
    marketPosition = "above average";
  } else if (vehicleScore < 45) {
    marketPosition = "weak";
  } else if (vehicleScore < 55) {
    marketPosition = "below average";
  }

  return {
    // Multi-tier pricing
    wholesalePrice,
    tradeInPrice,
    retailPrice,
    quickSalePrice,
    marketAverage,

    // Days to turn
    daysToTurnEstimate,

    // Scoring & confidence
    confidenceScore,
    confidenceFactors,
    vehicleScore,
    marketPosition,

    // Detailed breakdown
    breakdown,
  };
}
