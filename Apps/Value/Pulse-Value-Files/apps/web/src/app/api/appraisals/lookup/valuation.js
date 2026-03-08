import { calculateSimilarityWeightedPrice } from "./similarityWeighting";

/**
 * Calculate multi-source valuation with confidence scoring
 *
 * Data sources used:
 * 1. Similarity-weighted comparables (active inventory)
 * 2. MarketCheck predicted price (their ML model)
 * 3. Recent/sold inventory median
 * 4. Raw comparable median (fallback)
 *
 * The final price is a weighted blend based on data availability
 * and confidence in each source.
 */
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
  recentListings,
}) {
  const subjectTrim = decodeData?.trim;
  const subjectYear = decodeData?.year;
  const subjectMsrp = decodeData?.msrp || null;

  // =====================================================
  // SOURCE 1: Similarity-weighted price from comparables
  // =====================================================
  const similarityResult = calculateSimilarityWeightedPrice({
    comparables,
    subjectMileage: mileage,
    subjectTrim,
  });

  const similarityPrice = similarityResult.price;
  const similarityConfidence =
    similarityResult.method === "similarity_weighted"
      ? Math.min(1.0, similarityResult.comparablesUsed / 20) *
        Math.min(1.0, similarityResult.topWeight / 0.7)
      : 0;

  // ======================================================
  // SOURCE 2: MarketCheck ML predicted price
  // ======================================================
  const mcPrice = marketCheckPrice || 0;
  const mcConfidence = mcPrice > 0 ? 0.85 : 0; // High confidence if available

  // ======================================================
  // SOURCE 3: Recent/sold inventory median
  // ======================================================
  let recentMedian = 0;
  let recentConfidence = 0;

  if (recentListings && recentListings.length >= 3) {
    const recentPrices = recentListings
      .map((l) => l.price)
      .filter((p) => p && p > 0)
      .sort((a, b) => a - b);

    if (recentPrices.length >= 3) {
      recentMedian = recentPrices[Math.floor(recentPrices.length / 2)];
      recentConfidence = Math.min(0.9, recentPrices.length / 15);
    }
  }

  // ======================================================
  // SOURCE 4: Raw comparable median (fallback)
  // ======================================================
  let comparableMedian = 0;
  let comparableConfidence = 0;

  if (comparables && comparables.length >= 3) {
    const compPrices = comparables
      .map((c) => c.price)
      .filter((p) => p && p > 0)
      .sort((a, b) => a - b);

    if (compPrices.length >= 3) {
      comparableMedian = compPrices[Math.floor(compPrices.length / 2)];
      comparableConfidence = Math.min(0.7, compPrices.length / 30);
    }
  }

  // ======================================================
  // BLEND: Weighted average of available sources
  // ======================================================
  let totalWeight = 0;
  let blendedPrice = 0;
  const sourcesUsed = [];

  // Priority weights for each source
  const SOURCE_WEIGHTS = {
    similarity: 0.40,   // Highest: accounts for vehicle-specific similarity
    marketcheck: 0.30,  // High: ML model trained on millions of transactions
    recent: 0.20,       // Medium: actual sold prices nearby
    comparable: 0.10,   // Low: raw median without adjustments
  };

  if (similarityPrice > 0 && similarityConfidence > 0) {
    const w = SOURCE_WEIGHTS.similarity * similarityConfidence;
    blendedPrice += similarityPrice * w;
    totalWeight += w;
    sourcesUsed.push({ source: "similarity_weighted", price: similarityPrice, confidence: similarityConfidence });
  }

  if (mcPrice > 0 && mcConfidence > 0) {
    const w = SOURCE_WEIGHTS.marketcheck * mcConfidence;
    blendedPrice += mcPrice * w;
    totalWeight += w;
    sourcesUsed.push({ source: "marketcheck_predicted", price: mcPrice, confidence: mcConfidence });
  }

  if (recentMedian > 0 && recentConfidence > 0) {
    const w = SOURCE_WEIGHTS.recent * recentConfidence;
    blendedPrice += recentMedian * w;
    totalWeight += w;
    sourcesUsed.push({ source: "recent_sold_median", price: recentMedian, confidence: recentConfidence });
  }

  if (comparableMedian > 0 && comparableConfidence > 0) {
    const w = SOURCE_WEIGHTS.comparable * comparableConfidence;
    blendedPrice += comparableMedian * w;
    totalWeight += w;
    sourcesUsed.push({ source: "comparable_median", price: comparableMedian, confidence: comparableConfidence });
  }

  // Final blended retail price
  let retailPrice = totalWeight > 0 ? Math.round(blendedPrice / totalWeight) : 0;

  // Fallback: if no sources available, use market stats
  if (retailPrice === 0 && marketStats?.mean) {
    retailPrice = Math.round(marketStats.mean);
    sourcesUsed.push({ source: "market_stats_mean", price: retailPrice, confidence: 0.3 });
  }

  // Overall confidence = weighted average of source confidences
  const overallConfidence =
    totalWeight > 0
      ? sourcesUsed.reduce((sum, s) => sum + s.confidence, 0) / sourcesUsed.length
      : 0;

  // ======================================================
  // CONDITION ADJUSTMENTS
  // Apply tiered pricing based on vehicle condition
  // ======================================================
  const conditionMultipliers = {
    excellent: 1.05,  // Above market: like-new condition
    good: 1.00,       // At market: normal used condition
    fair: 0.88,       // Below market: needs some work
    poor: 0.75,       // Well below market: needs significant work
  };

  const conditionKey = (condition || "good").toLowerCase();
  const conditionMultiplier = conditionMultipliers[conditionKey] || 1.0;

  const conditionAdjustedPrice = Math.round(retailPrice * conditionMultiplier);

  // ======================================================
  // MILEAGE ADJUSTMENT
  // Adjust for above/below average mileage
  // ======================================================
  let mileageAdjustedPrice = conditionAdjustedPrice;
  let mileageAdjustment = 0;

  if (mileage && subjectYear) {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - subjectYear;
    const averageAnnualMileage = 12000;
    const expectedMileage = vehicleAge * averageAnnualMileage;

    const mileageDiff = mileage - expectedMileage;
    const dollarsPerMile = 0.06; // ~$0.06 per mile above/below average

    mileageAdjustment = -Math.round(mileageDiff * dollarsPerMile);

    // Cap adjustment at ±15% of retail price to avoid extreme swings
    const maxAdjustment = Math.round(conditionAdjustedPrice * 0.15);
    mileageAdjustment = Math.max(
      -maxAdjustment,
      Math.min(maxAdjustment, mileageAdjustment),
    );

    mileageAdjustedPrice = conditionAdjustedPrice + mileageAdjustment;
  }

  // ======================================================
  // DEALER PRICING TIERS
  // Calculate trade-in, wholesale, and retail from final price
  // ======================================================
  const finalRetailBase = mileageAdjustedPrice;

  // These margins reflect real dealer economics:
  // - Trade-in: what dealer pays customer (lowest)
  // - Wholesale/MMR: what dealer pays at auction
  // - Retail: what customer pays at dealership (highest)
  const tradeInPrice = Math.round(finalRetailBase * 0.82);   // ~18% below retail
  const wholesalePrice = Math.round(finalRetailBase * 0.88); // ~12% below retail
  const retailListPrice = Math.round(finalRetailBase * 1.08); // ~8% above base (typical dealer markup)

  // ======================================================
  // PRICE RANGE (confidence interval)
  // ======================================================
  const rangeSpread = overallConfidence > 0.7 ? 0.08 : 0.12;
  const priceLow = Math.round(finalRetailBase * (1 - rangeSpread));
  const priceHigh = Math.round(finalRetailBase * (1 + rangeSpread));

  console.log(`[Valuation] Sources: ${sourcesUsed.map(s => s.source).join(", ")}`);
  console.log(`[Valuation] Blended retail: $${retailPrice.toLocaleString()} → After adjustments: $${finalRetailBase.toLocaleString()}`);
  console.log(`[Valuation] Condition: ${conditionKey} (${conditionMultiplier}x), Mileage adj: $${mileageAdjustment.toLocaleString()}`);
  console.log(`[Valuation] Tiers — Trade: $${tradeInPrice.toLocaleString()}, Wholesale: $${wholesalePrice.toLocaleString()}, Retail: $${finalRetailBase.toLocaleString()}, List: $${retailListPrice.toLocaleString()}`);
  console.log(`[Valuation] Range: $${priceLow.toLocaleString()} – $${priceHigh.toLocaleString()} (confidence: ${(overallConfidence * 100).toFixed(0)}%)`);

  return {
    // Core prices
    retailPrice: finalRetailBase,
    tradeInPrice,
    wholesalePrice,
    retailListPrice,

    // Price range
    priceLow,
    priceHigh,

    // Adjustments
    conditionMultiplier,
    mileageAdjustment,

    // Data quality
    confidence: overallConfidence,
    sourcesUsed,
    comparablesCount: comparables?.length || 0,
  };
}
