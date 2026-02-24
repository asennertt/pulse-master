/**
 * Similarity-Weighted Pricing
 *
 * Instead of treating every comparable equally (like median does),
 * this scores each comparable on how similar it is to the subject vehicle.
 * More similar comparables have more influence on the final price.
 *
 * Weighting factors:
 *   - Mileage proximity (40%) — closest mileage = most relevant
 *   - Trim match (25%) — same trim is much more relevant
 *   - Geographic distance (15%) — closer dealers reflect local market
 *   - Listing recency (10%) — recent listings reflect current market
 *   - Days on market (10%) — cars that sold quickly = better price signal
 */

const WEIGHTS = {
  mileage: 0.35,
  trim: 0.25,
  distance: 0.15,
  recency: 0.1,
  dom: 0.1,
  dealerType: 0.05,
};

/**
 * Score how similar a comparable's mileage is to the subject.
 * Uses a Gaussian-like decay: score drops off as mileage difference grows.
 * Within ~5k miles = very high score, beyond 30k = near zero.
 */
function scoreMileage(compMiles, subjectMileage) {
  if (!compMiles || !subjectMileage) return 0.5; // neutral if missing
  const diff = Math.abs(compMiles - subjectMileage);
  // Gaussian decay with sigma = 15000 miles
  return Math.exp(-Math.pow(diff, 2) / (2 * Math.pow(15000, 2)));
}

/**
 * Score trim match. Exact match = 1.0, partial match = 0.6, no match = 0.2.
 * We don't go to zero because a different trim of the same model is still useful data.
 */
function scoreTrim(compTrim, subjectTrim) {
  if (!subjectTrim || !compTrim) return 0.5; // neutral if missing

  const compLower = compTrim.toLowerCase().trim();
  const subjectLower = subjectTrim.toLowerCase().trim();

  // Exact match
  if (compLower === subjectLower) return 1.0;

  // Partial match (one contains the other, e.g. "SE" in "SE AWD")
  if (compLower.includes(subjectLower) || subjectLower.includes(compLower))
    return 0.7;

  // No match — still somewhat useful as same make/model
  return 0.2;
}

/**
 * Score geographic distance. Closer = better local market signal.
 * Within 25 miles = perfect, decays out to ~200 miles.
 */
function scoreDistance(distance) {
  if (distance == null || distance <= 0) return 0.5; // neutral if missing
  if (distance <= 25) return 1.0;
  // Linear decay from 25 to 200 miles
  return Math.max(0.1, 1.0 - (distance - 25) / 175);
}

/**
 * Score listing recency. More recent = more relevant to current market.
 * Within 7 days = perfect, decays over 90 days.
 */
function scoreRecency(listingDate) {
  if (!listingDate) return 0.5; // neutral if missing

  const now = new Date();
  const listed = new Date(listingDate);
  const daysSinceListed = Math.max(0, (now - listed) / (1000 * 60 * 60 * 24));

  if (daysSinceListed <= 7) return 1.0;
  // Decay over 90 days
  return Math.max(0.1, 1.0 - (daysSinceListed - 7) / 83);
}

/**
 * Score days on market. Lower DOM = car priced right = better price signal.
 * Very high DOM might mean overpriced listing.
 */
function scoreDom(dom) {
  if (dom == null || dom <= 0) return 0.5; // neutral if missing
  if (dom <= 15) return 1.0; // Sold fast = strong signal
  if (dom <= 30) return 0.85;
  if (dom <= 60) return 0.6;
  // High DOM = weaker signal (possibly overpriced)
  return Math.max(0.2, 0.6 - (dom - 60) / 200);
}

/**
 * Score dealer type. Franchise dealers tend to have more accurate pricing.
 * CPO listings from franchise dealers are the gold standard.
 */
function scoreDealerType(dealerType, isCertified) {
  if (!dealerType) return 0.5; // neutral if missing

  const dealerLower = dealerType.toLowerCase();

  // Certified pre-owned from franchise dealer = highest quality signal
  if (isCertified && dealerLower.includes("franchise")) {
    return 1.0;
  }

  // Regular franchise dealer
  if (dealerLower.includes("franchise")) {
    return 0.85;
  }

  // Independent dealer
  if (dealerLower.includes("independent")) {
    return 0.6;
  }

  // Private seller (tend to price lower)
  if (dealerLower.includes("private")) {
    return 0.4;
  }

  // Unknown
  return 0.5;
}

/**
 * Calculate the overall similarity score for a comparable.
 * Returns a value between 0 and 1.
 */
function calculateSimilarityScore(comp, subjectMileage, subjectTrim) {
  const mileageScore = scoreMileage(comp.miles, subjectMileage);
  const trimScore = scoreTrim(comp.build?.trim || comp.trim, subjectTrim);
  const distanceScore = scoreDistance(comp.distance);
  const recencyScore = scoreRecency(comp.listing_date || comp.created_at);
  const domScore = scoreDom(comp.dom || comp.days_on_market);
  const dealerTypeScore = scoreDealerType(
    comp.dealer_type || comp.seller?.type,
    comp.is_certified || comp.certified,
  );

  const totalScore =
    mileageScore * WEIGHTS.mileage +
    trimScore * WEIGHTS.trim +
    distanceScore * WEIGHTS.distance +
    recencyScore * WEIGHTS.recency +
    domScore * WEIGHTS.dom +
    dealerTypeScore * WEIGHTS.dealerType;

  return {
    total: totalScore,
    factors: {
      mileageScore,
      trimScore,
      distanceScore,
      recencyScore,
      domScore,
      dealerTypeScore,
    },
  };
}

/**
 * Calculate a similarity-weighted average price from comparables.
 *
 * Also applies outlier filtering: comparables whose price is more than
 * 2 standard deviations from the mean are excluded before weighting.
 */
export function calculateSimilarityWeightedPrice({
  comparables,
  subjectMileage,
  subjectTrim,
}) {
  if (!comparables || comparables.length < 3) {
    return {
      price: 0,
      comparablesUsed: 0,
      topWeight: 0,
      method: "insufficient_data",
    };
  }

  // Filter to only comparables with valid prices
  const validComps = comparables.filter((c) => c.price && c.price > 0);

  if (validComps.length < 3) {
    return {
      price: 0,
      comparablesUsed: 0,
      topWeight: 0,
      method: "insufficient_valid_prices",
    };
  }

  // Step 1: Remove price outliers (beyond 2 standard deviations)
  const prices = validComps.map((c) => c.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance =
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stddev = Math.sqrt(variance);

  const filteredComps =
    stddev > 0
      ? validComps.filter((c) => Math.abs(c.price - mean) <= 2 * stddev)
      : validComps;

  const outliersRemoved = validComps.length - filteredComps.length;
  if (outliersRemoved > 0) {
    console.log(
      `[Similarity] Removed ${outliersRemoved} price outliers (mean: $${mean.toFixed(0)}, stddev: $${stddev.toFixed(0)})`,
    );
  }

  if (filteredComps.length < 2) {
    return {
      price: 0,
      comparablesUsed: 0,
      topWeight: 0,
      method: "all_outliers",
    };
  }

  // Step 2: Score each comparable
  const scoredComps = filteredComps.map((comp) => {
    const similarity = calculateSimilarityScore(
      comp,
      subjectMileage,
      subjectTrim,
    );
    return {
      price: comp.price,
      weight: similarity.total,
      factors: similarity.factors,
    };
  });

  // Step 3: Calculate weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  let topWeight = 0;

  for (const comp of scoredComps) {
    // Square the weight to amplify the difference between good and poor matches
    const amplifiedWeight = Math.pow(comp.weight, 2);

    weightedSum += amplifiedWeight * comp.price;
    totalWeight += amplifiedWeight;

    if (comp.weight > topWeight) {
      topWeight = comp.weight;
    }
  }

  if (totalWeight === 0) {
    return {
      price: 0,
      comparablesUsed: 0,
      topWeight: 0,
      method: "zero_weights",
    };
  }

  const weightedAvgPrice = weightedSum / totalWeight;

  return {
    price: weightedAvgPrice,
    comparablesUsed: scoredComps.length,
    outliersRemoved,
    topWeight,
    method: "similarity_weighted",
  };
}
