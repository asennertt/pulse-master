import { auth } from "@/auth";
import { validateVinRequest } from "./validation";
import {
  getMarketCheckApiKey,
  getUserZipCode,
  getMarketSearchRadius,
} from "./apiKeyService";
import { getMockVehicleData, getMockVehicleDataWithMessage } from "./mockData";
import {
  fetchNeoVinDecode,
  fetchInventorySearch,
  fetchVinHistory,
  fetchMarketDaysSupply,
  fetchMarketCheckPredictedPrice,
  fetchRecentInventory,
} from "./marketCheckApi";
import { analyzeMarketData } from "./marketAnalysis";
import { calculateEnhancedValuation } from "./valuation";
import { buildVehicleData } from "./vehicleDataBuilder";

// VIN lookup using MarketCheck API - 6 API calls for comprehensive data
export async function POST(request) {
  try {
    const session = await auth();
    const body = await request.json();

    // Validate request
    const validation = validateVinRequest(body);
    if (!validation.valid) {
      return Response.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const { vin, mileage, condition } = validation.data;

    // Get MarketCheck API key
    const marketCheckApiKey = await getMarketCheckApiKey();

    if (!marketCheckApiKey) {
      // Return mock data if API key not configured
      console.log("[Lookup] No API key found - returning mock data");
      return Response.json(getMockVehicleData(vin, mileage, condition));
    }

    // Get user's ZIP code for market data
    const userZip = await getUserZipCode(session?.user?.id);

    // Get market search radius from settings
    const searchRadius = await getMarketSearchRadius();

    console.log(
      `[Lookup] Starting 6 MarketCheck API calls for VIN: ${vin}, Condition: ${condition}, ZIP: ${userZip || "N/A"}, Radius: ${searchRadius} miles`,
    );

    // API CALL 1: NeoVIN Enhanced Decode
    const decodeResult = await fetchNeoVinDecode(vin, marketCheckApiKey);

    if (!decodeResult.success) {
      // If VIN not found (422) or other API error, return mock data instead of failing
      if (decodeResult.status === 422 || decodeResult.status === 404) {
        console.log(
          "[Lookup] VIN not found in MarketCheck - returning mock data",
        );
        return Response.json(
          getMockVehicleDataWithMessage(vin, mileage, condition),
        );
      }

      throw new Error(
        `NeoVIN Decode failed: ${decodeResult.status} ${decodeResult.error}`,
      );
    }

    const decodeData = decodeResult.data;

    // API CALLS 2-6: Run in parallel for efficiency
    const [
      inventoryResult,
      historyResult,
      mdsResult,
      predictedPriceResult,
      recentInventoryResult,
    ] = await Promise.all([
      fetchInventorySearch(
        decodeData,
        marketCheckApiKey,
        userZip,
        searchRadius,
      ), // API CALL 2
      fetchVinHistory(vin, marketCheckApiKey), // API CALL 3
      fetchMarketDaysSupply(decodeData, marketCheckApiKey), // API CALL 4
      fetchMarketCheckPredictedPrice(vin, marketCheckApiKey), // API CALL 5 (NEW)
      fetchRecentInventory(
        decodeData,
        marketCheckApiKey,
        userZip,
        searchRadius,
      ), // API CALL 6 (NEW)
    ]);

    const comparables = inventoryResult.comparables;
    const marketStats = inventoryResult.marketStats;
    const priceHistory = historyResult.priceHistory;
    const mdsData = mdsResult.mdsData;
    const marketCheckPrice = predictedPriceResult.predictedPrice;
    const recentListings = recentInventoryResult.recentListings;

    // Enhanced market analysis
    const marketAnalysis = analyzeMarketData({
      comparables,
      marketStats,
      priceHistory,
      mdsData,
      recentListings,
    });

    // Calculate enhanced valuation with multi-tier pricing
    const valuation = calculateEnhancedValuation({
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
    });

    console.log(
      `[Lookup] Final retail valuation: $${valuation.retailPrice.toLocaleString()}`,
    );

    // Build comprehensive vehicle data object
    const vehicleData = buildVehicleData({
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
    });

    return Response.json(vehicleData);
  } catch (error) {
    console.error("Error looking up VIN:", error);
    return Response.json(
      {
        error: "Failed to lookup VIN",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
