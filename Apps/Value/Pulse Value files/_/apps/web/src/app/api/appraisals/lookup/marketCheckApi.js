export async function fetchNeoVinDecode(vin, apiKey) {
  const decodeUrl = `https://api.marketcheck.com/v2/decode/car/neovin/${vin}/specs?api_key=${apiKey}`;
  console.log("[Lookup] Calling NeoVIN Decode:", decodeUrl);

  const decodeResponse = await fetch(decodeUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!decodeResponse.ok) {
    const errorText = await decodeResponse.text();
    console.error(
      "[Lookup] NeoVIN Decode error:",
      decodeResponse.status,
      errorText,
    );

    return {
      success: false,
      status: decodeResponse.status,
      error: errorText,
    };
  }

  const decodeData = await decodeResponse.json();
  console.log(
    "[Lookup] NeoVIN Decode complete - Make:",
    decodeData.make,
    "Model:",
    decodeData.model,
  );

  return {
    success: true,
    data: decodeData,
  };
}

export async function fetchInventorySearch(
  decodeData,
  apiKey,
  userZip,
  radius = 100,
) {
  const inventoryParams = new URLSearchParams({
    api_key: apiKey,
    year: decodeData.year,
    make: decodeData.make,
    model: decodeData.model,
    rows: "100",
    stats: "price,miles,dom",
  });

  // DO NOT add trim filtering - it's too restrictive and causes 0 results
  // Let the similarity weighting handle trim differences instead

  if (userZip) {
    inventoryParams.append("zip", userZip);
    inventoryParams.append("radius", radius.toString());
  }

  const inventoryUrl = `https://api.marketcheck.com/v2/search/car/active?${inventoryParams.toString()}`;
  console.log(`[Lookup] 🔍 Inventory Search (radius: ${radius} miles)`);
  console.log(
    `[Lookup] Searching: ${decodeData.year} ${decodeData.make} ${decodeData.model} within ${userZip ? radius + "mi of " + userZip : "nationwide"}`,
  );

  const inventoryResponse = await fetch(inventoryUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!inventoryResponse.ok) {
    const errorText = await inventoryResponse.text();
    console.error(
      "[Lookup] ❌ Inventory Search failed:",
      inventoryResponse.status,
      errorText,
    );
    console.error("[Lookup] Failed URL:", inventoryUrl);
    return {
      success: false,
      comparables: [],
      marketStats: null,
    };
  }

  const inventoryData = await inventoryResponse.json();
  const comparables = inventoryData.listings || [];
  const marketStats = inventoryData.stats || null;

  console.log(
    `[Lookup] ✅ Inventory Search complete - ${comparables.length} comparables found`,
  );

  if (comparables.length === 0) {
    console.warn(
      `[Lookup] ⚠️ No comparables found for ${decodeData.year} ${decodeData.make} ${decodeData.model}`,
    );
  }

  return {
    success: true,
    comparables,
    marketStats,
  };
}

// NEW: Fetch MarketCheck's own predicted price for validation
export async function fetchMarketCheckPredictedPrice(vin, apiKey) {
  const priceUrl = `https://api.marketcheck.com/v2/predict/car/us/used/premium?api_key=${apiKey}&vin=${vin}`;
  console.log("[Lookup] Calling MarketCheck Predicted Price");

  const priceResponse = await fetch(priceUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!priceResponse.ok) {
    console.log(
      "[Lookup] MarketCheck Predicted Price not available for this VIN",
    );
    return {
      success: false,
      predictedPrice: null,
      comparables: [],
    };
  }

  const priceData = await priceResponse.json();

  console.log(
    `[Lookup] MarketCheck Predicted Price complete - Predicted: $${priceData.predicted_price || "N/A"}`,
  );

  return {
    success: true,
    predictedPrice: priceData.predicted_price || null,
    msrp: priceData.msrp || null,
    comparables: priceData.comparables || [],
  };
}

// NEW: Fetch recent/sold inventory for actual transaction prices
export async function fetchRecentInventory(
  decodeData,
  apiKey,
  userZip,
  radius = 100,
) {
  const recentParams = new URLSearchParams({
    api_key: apiKey,
    year: decodeData.year,
    make: decodeData.make,
    model: decodeData.model,
    rows: "50",
  });

  // DO NOT add trim filtering - same reason as above

  if (userZip) {
    recentParams.append("zip", userZip);
    recentParams.append("radius", radius.toString());
  }

  const recentUrl = `https://api.marketcheck.com/v2/search/car/dealer/recent?${recentParams.toString()}`;
  console.log(
    `[Lookup] Calling Recent Inventory Search (sold/delisted) (radius: ${radius} miles)`,
  );

  const recentResponse = await fetch(recentUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!recentResponse.ok) {
    console.log("[Lookup] Recent Inventory Search not available");
    return {
      success: false,
      recentListings: [],
    };
  }

  const recentData = await recentResponse.json();
  const recentListings = recentData.listings || [];

  console.log(
    `[Lookup] Recent Inventory Search complete - ${recentListings.length} recent/sold listings found`,
  );

  return {
    success: true,
    recentListings,
  };
}

export async function fetchVinHistory(vin, apiKey) {
  const historyUrl = `https://api.marketcheck.com/v2/history/car/${vin}?api_key=${apiKey}`;
  console.log("[Lookup] Calling VIN History");

  const historyResponse = await fetch(historyUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!historyResponse.ok) {
    console.log("[Lookup] VIN History not available for this VIN");
    return {
      success: false,
      priceHistory: [],
    };
  }

  const historyData = await historyResponse.json();
  const priceHistory = historyData.history || [];

  console.log(
    `[Lookup] VIN History complete - ${priceHistory.length} historical records found`,
  );

  return {
    success: true,
    priceHistory,
  };
}

export async function fetchMarketDaysSupply(decodeData, apiKey) {
  if (!decodeData.year || !decodeData.make || !decodeData.model) {
    return {
      success: false,
      mdsData: null,
    };
  }

  const mdsParams = new URLSearchParams({
    api_key: apiKey,
    year: decodeData.year,
    make: decodeData.make,
    model: decodeData.model,
    car_type: "used",
  });

  const mdsUrl = `https://api.marketcheck.com/v2/mds/car?${mdsParams.toString()}`;
  console.log("[Lookup] Calling Market Days Supply");

  const mdsResponse = await fetch(mdsUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!mdsResponse.ok) {
    console.log("[Lookup] MDS not available for this vehicle");
    return {
      success: false,
      mdsData: null,
    };
  }

  const mdsData = await mdsResponse.json();
  console.log(
    `[Lookup] Market Days Supply complete - MDS: ${mdsData?.mds || "N/A"} days`,
  );

  return {
    success: true,
    mdsData,
  };
}
