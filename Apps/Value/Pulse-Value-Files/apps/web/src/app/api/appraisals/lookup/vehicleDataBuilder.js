export function buildVehicleData({
  vin,
  mileage,
  condition,
  decodeData,
  comparables,
  priceHistory,
  mdsData,
  marketStats,
  marketAnalysis,
  valuation,
  marketCheckPrice,
  recentListings,
}) {
  return {
    // Basic vehicle info
    vin,
    year: decodeData.year,
    make: decodeData.make,
    model: decodeData.model,
    trim: decodeData.trim,
    body_type: decodeData.body_type,
    exterior_color: decodeData.exterior_color,
    interior_color: decodeData.interior_color,
    drivetrain: decodeData.drivetrain || decodeData.drive_type,
    transmission: decodeData.transmission,
    engine: decodeData.engine,
    fuel_type: decodeData.fuel_type,
    doors: decodeData.doors,
    highway_mpg: decodeData.highway_miles_per_gallon,
    city_mpg: decodeData.city_miles_per_gallon,
    mileage,
    miles: mileage,
    condition,

    // Pricing tiers
    estimated_price: valuation.retailPrice,
    retail_price: valuation.retailPrice,
    trade_in_price: valuation.tradeInPrice,
    wholesale_price: valuation.wholesalePrice,
    retail_list_price: valuation.retailListPrice,

    // Price range
    price_low: valuation.priceLow,
    price_high: valuation.priceHigh,

    // Valuation metadata
    confidence: valuation.confidence,
    condition_multiplier: valuation.conditionMultiplier,
    mileage_adjustment: valuation.mileageAdjustment,
    valuation_sources: valuation.sourcesUsed,
    comparables_count: valuation.comparablesCount,

    // MarketCheck predicted price (for reference)
    marketcheck_predicted_price: marketCheckPrice || null,

    // Market data
    market_stats: marketStats
      ? {
          mean: marketStats.mean,
          median: marketStats.median,
          price_25p: marketStats.price_25p,
          price_75p: marketStats.price_75p,
          count: marketStats.count,
        }
      : null,

    // Market analysis
    market_analysis: {
      dom_stats: marketAnalysis.domStats,
      price_volatility: marketAnalysis.priceVolatility,
      miles_volatility: marketAnalysis.milesVolatility,
      price_trend: marketAnalysis.priceTrend,
      sales_velocity: marketAnalysis.salesVelocity,
      market_condition: marketAnalysis.marketCondition,
      inventory_breakdown: marketAnalysis.inventoryBreakdown,
    },

    // Market days supply
    mds: mdsData?.mds || null,
    mds_data: mdsData || null,

    // Comparable listings (top 10)
    comparables: comparables.slice(0, 10).map((comp) => ({
      id: comp.id,
      vin: comp.vin,
      year: comp.build?.year || comp.year,
      make: comp.build?.make || comp.make,
      model: comp.build?.model || comp.model,
      trim: comp.build?.trim || comp.trim,
      miles: comp.miles,
      price: comp.price,
      dom: comp.dom || comp.days_on_market,
      dealer_name: comp.dealer?.name,
      city: comp.dealer?.city,
      state: comp.dealer?.state,
      distance: comp.distance,
      vdp_url: comp.vdp_url,
      inventory_type: comp.inventory_type,
    })),

    // Recent/sold listings (top 5)
    recent_listings: (recentListings || []).slice(0, 5).map((listing) => ({
      id: listing.id,
      vin: listing.vin,
      year: listing.build?.year || listing.year,
      make: listing.build?.make || listing.make,
      model: listing.build?.model || listing.model,
      trim: listing.build?.trim || listing.trim,
      miles: listing.miles,
      price: listing.price,
      dealer_name: listing.dealer?.name,
      city: listing.dealer?.city,
      state: listing.dealer?.state,
    })),

    // Price history
    price_history: priceHistory.slice(0, 20).map((h) => ({
      price: h.price,
      date: h.date || h.listing_date,
      miles: h.miles,
      source: h.source,
    })),

    source: "marketcheck",
  };
}
