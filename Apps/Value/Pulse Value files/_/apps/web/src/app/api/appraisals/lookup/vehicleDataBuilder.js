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
  recentListings = [],
}) {
  return {
    // Basic Info
    vin: vin,
    year: decodeData.year,
    make: decodeData.make,
    model: decodeData.model,
    trim: decodeData.trim || decodeData.style,
    body_type: decodeData.body_type || decodeData.body_style,
    exterior_color: decodeData.exterior_color,
    interior_color: decodeData.interior_color,
    drivetrain: decodeData.drivetrain || decodeData.drive_type,
    transmission: decodeData.transmission,
    condition: condition,
    mileage: mileage,
    miles: mileage,

    // Detailed Specs from NeoVIN
    engine: decodeData.engine || decodeData.engine_description,
    fuel_type: decodeData.fuel_type,
    mpg_city: decodeData.mpg_city || decodeData.city_mpg,
    mpg_highway: decodeData.mpg_highway || decodeData.highway_mpg,
    mpg_combined: decodeData.mpg_combined || decodeData.combined_mpg,
    horsepower: decodeData.horsepower,
    torque: decodeData.torque,
    displacement: decodeData.displacement || decodeData.engine_displacement,
    cylinders: decodeData.cylinders || decodeData.engine_cylinders,
    doors: decodeData.doors,
    seats: decodeData.seats || decodeData.seating,
    msrp: decodeData.msrp || decodeData.base_msrp,

    // Enhanced specifications
    dimensions: {
      wheelbase: decodeData.wheelbase,
      length: decodeData.length || decodeData.overall_length,
      width: decodeData.width || decodeData.overall_width,
      height: decodeData.height || decodeData.overall_height,
      curb_weight: decodeData.curb_weight || decodeData.weight,
      cargo_volume: decodeData.cargo_volume || decodeData.cargo_capacity,
      passenger_volume: decodeData.passenger_volume,
      ground_clearance: decodeData.ground_clearance,
      towing_capacity: decodeData.towing_capacity || decodeData.max_towing,
    },

    safety_ratings: {
      nhtsa_overall: decodeData.nhtsa_overall_rating,
      nhtsa_frontal: decodeData.nhtsa_frontal_crash,
      nhtsa_side: decodeData.nhtsa_side_crash,
      nhtsa_rollover: decodeData.nhtsa_rollover,
      iihs_overall: decodeData.iihs_overall_rating,
      iihs_moderate_overlap: decodeData.iihs_moderate_overlap_front,
      iihs_side: decodeData.iihs_side_impact,
      iihs_roofs_strength: decodeData.iihs_roof_strength,
    },

    fuel_capacity: decodeData.fuel_capacity || decodeData.fuel_tank_capacity,

    warranty: {
      basic_years: decodeData.basic_warranty_years,
      basic_miles: decodeData.basic_warranty_miles,
      powertrain_years: decodeData.powertrain_warranty_years,
      powertrain_miles: decodeData.powertrain_warranty_miles,
      corrosion_years: decodeData.corrosion_warranty_years,
      corrosion_miles: decodeData.corrosion_warranty_miles,
    },

    country_of_origin:
      decodeData.country_of_origin || decodeData.manufactured_in,

    options: decodeData.installed_options || decodeData.options || [],
    features: decodeData.features || [],
    standard_equipment: decodeData.standard_equipment || [],

    // Enhanced Market Data with photos and detailed comparable info
    comparables: comparables.slice(0, 30).map((comp) => ({
      id: comp.id,
      vin: comp.vin,
      price: comp.price,
      miles: comp.miles,
      year: comp.build?.year || comp.year,
      trim: comp.build?.trim || comp.trim,
      exterior_color: comp.exterior_color,
      dealer_name: comp.dealer?.name || comp.dealer_name,
      dealer_city: comp.dealer?.city || comp.dealer_city,
      dealer_state: comp.dealer?.state || comp.dealer_state,
      dealer_type: comp.dealer?.type || comp.dealer_type,
      distance: comp.distance,
      listing_date: comp.listing_date || comp.created_at,
      dom: comp.dom || comp.days_on_market,
      inventory_type: comp.inventory_type || comp.type,
      photo_url: comp.media?.photo_links?.[0] || comp.photo_url,
      certified: comp.certified || comp.is_certified || false,
      listing_status: comp.listing_status || comp.status,
    })),

    // Recent/sold listings (actual transaction prices)
    recent_sold_listings: recentListings.slice(0, 20).map((comp) => ({
      id: comp.id,
      vin: comp.vin,
      price: comp.price,
      miles: comp.miles,
      year: comp.build?.year || comp.year,
      trim: comp.build?.trim || comp.trim,
      exterior_color: comp.exterior_color,
      dealer_name: comp.dealer?.name || comp.dealer_name,
      dealer_city: comp.dealer?.city || comp.dealer_city,
      dealer_state: comp.dealer?.state || comp.dealer_state,
      distance: comp.distance,
      listing_date: comp.listing_date || comp.created_at,
      delisted_date: comp.delisted_date || comp.sold_date,
      dom: comp.dom || comp.days_on_market,
      photo_url: comp.media?.photo_links?.[0] || comp.photo_url,
    })),

    price_history: priceHistory.slice(0, 20).map((hist) => ({
      date: hist.listing_date || hist.date,
      price: hist.price,
      miles: hist.miles,
      dealer_name: hist.dealer?.name || hist.dealer_name,
      listing_status: hist.listing_status || hist.status,
    })),

    // Enhanced Market Analysis
    market_days_supply: mdsData?.mds || null,
    market_stats: marketStats,

    marketcheck_predicted_price: marketCheckPrice || null,
    marketcheck_validation: valuation.breakdown.marketCheckValidation || null,

    dom_stats: marketAnalysis.domStats,
    price_volatility: marketAnalysis.priceVolatility,
    miles_volatility: marketAnalysis.milesVolatility,
    price_trend_90d: marketAnalysis.priceTrend,
    sales_velocity: marketAnalysis.salesVelocity,
    market_condition: marketAnalysis.marketCondition,
    inventory_breakdown: marketAnalysis.inventoryBreakdown,

    // Multi-Tier Pricing
    wholesale_price: valuation.wholesalePrice,
    trade_in_price: valuation.tradeInPrice,
    retail_price: valuation.retailPrice,
    quick_sale_price: valuation.quickSalePrice,
    market_average: valuation.marketAverage,

    // Estimated days to sell at different price points
    days_to_turn_estimate: valuation.daysToTurnEstimate,

    // Enhanced Confidence & Scoring
    confidence_score: valuation.confidenceScore,
    confidence_factors: valuation.confidenceFactors,
    vehicle_score: valuation.vehicleScore,
    market_position: valuation.marketPosition,

    // Legacy field for backwards compatibility
    estimated_price: valuation.retailPrice,
    valuation_breakdown: valuation.breakdown,

    source: "marketcheck",
    api_calls: 6,
    timestamp: new Date().toISOString(),
  };
}
