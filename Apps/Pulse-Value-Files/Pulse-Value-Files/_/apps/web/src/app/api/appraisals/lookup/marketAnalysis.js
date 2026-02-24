export function analyzeMarketData({
  comparables,
  marketStats,
  priceHistory,
  mdsData,
}) {
  const analysis = {
    domStats: { avg: 0, min: 0, max: 0, median: 0 },
    priceVolatility: { stddev: 0, min: 0, max: 0, median: 0 },
    milesVolatility: { stddev: 0, min: 0, max: 0, median: 0 },
    priceTrend: { direction: "stable", percentage: 0, trendline: [] },
    salesVelocity: 0,
    marketCondition: "normal",
    inventoryBreakdown: { certified: 0, used: 0, new: 0 },
  };

  // Analyze DOM (Days on Market) statistics
  if (comparables && comparables.length > 0) {
    const domValues = comparables
      .map((c) => c.dom || c.days_on_market)
      .filter((d) => d != null && d > 0)
      .sort((a, b) => a - b);

    if (domValues.length > 0) {
      analysis.domStats.avg =
        domValues.reduce((sum, d) => sum + d, 0) / domValues.length;
      analysis.domStats.min = domValues[0];
      analysis.domStats.max = domValues[domValues.length - 1];
      analysis.domStats.median = domValues[Math.floor(domValues.length / 2)];
    }

    // Analyze price volatility
    const prices = comparables
      .map((c) => c.price)
      .filter((p) => p != null && p > 0)
      .sort((a, b) => a - b);

    if (prices.length > 0) {
      const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const variance =
        prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
        prices.length;
      analysis.priceVolatility.stddev = Math.sqrt(variance);
      analysis.priceVolatility.min = prices[0];
      analysis.priceVolatility.max = prices[prices.length - 1];
      analysis.priceVolatility.median = prices[Math.floor(prices.length / 2)];
    }

    // Analyze mileage volatility
    const miles = comparables
      .map((c) => c.miles)
      .filter((m) => m != null && m > 0)
      .sort((a, b) => a - b);

    if (miles.length > 0) {
      const mean = miles.reduce((sum, m) => sum + m, 0) / miles.length;
      const variance =
        miles.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / miles.length;
      analysis.milesVolatility.stddev = Math.sqrt(variance);
      analysis.milesVolatility.min = miles[0];
      analysis.milesVolatility.max = miles[miles.length - 1];
      analysis.milesVolatility.median = miles[Math.floor(miles.length / 2)];
    }

    // Inventory breakdown
    comparables.forEach((comp) => {
      const type = (comp.inventory_type || comp.type || "").toLowerCase();
      if (type.includes("certified") || comp.certified) {
        analysis.inventoryBreakdown.certified++;
      } else if (type.includes("new")) {
        analysis.inventoryBreakdown.new++;
      } else {
        analysis.inventoryBreakdown.used++;
      }
    });
  }

  // Analyze price trend from history
  if (priceHistory && priceHistory.length >= 3) {
    // Sort by date (oldest first)
    const sorted = [...priceHistory].sort((a, b) => {
      const dateA = new Date(a.date || a.listing_date);
      const dateB = new Date(b.date || b.listing_date);
      return dateA - dateB;
    });

    // Calculate 90-day trend
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const recent = sorted.filter((h) => {
      const date = new Date(h.date || h.listing_date);
      return date >= ninetyDaysAgo;
    });

    if (recent.length >= 2) {
      const oldestPrice = recent[0].price;
      const newestPrice = recent[recent.length - 1].price;

      if (oldestPrice && newestPrice) {
        const percentChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
        analysis.priceTrend.percentage = percentChange;

        if (percentChange > 3) {
          analysis.priceTrend.direction = "up";
        } else if (percentChange < -3) {
          analysis.priceTrend.direction = "down";
        } else {
          analysis.priceTrend.direction = "stable";
        }

        analysis.priceTrend.trendline = recent.map((h) => ({
          date: h.date || h.listing_date,
          price: h.price,
        }));
      }
    }
  }

  // Calculate sales velocity
  if (mdsData?.mds && mdsData?.inventory_count && mdsData?.sales_count) {
    // Sales velocity = vehicles sold per month
    if (mdsData.sales_count > 0) {
      analysis.salesVelocity = mdsData.sales_count / (mdsData.mds / 30);
    }
  }

  // Determine market condition
  const avgDOM = analysis.domStats.avg;
  const mds = mdsData?.mds || 0;
  const priceTrend = analysis.priceTrend.direction;

  // Hot market: Low DOM, low supply, prices rising
  if (
    (avgDOM > 0 && avgDOM < 30) ||
    (mds > 0 && mds < 30) ||
    priceTrend === "up"
  ) {
    analysis.marketCondition = "hot";
  }
  // Slow market: High DOM, high supply, prices falling
  else if (avgDOM > 60 || mds > 90 || priceTrend === "down") {
    analysis.marketCondition = "slow";
  }
  // Normal market
  else {
    analysis.marketCondition = "normal";
  }

  return analysis;
}
