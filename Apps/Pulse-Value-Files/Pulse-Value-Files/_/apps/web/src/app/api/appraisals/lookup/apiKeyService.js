import sql from "@/app/api/utils/sql";

export async function getMarketCheckApiKey() {
  let marketCheckApiKey = process.env.MARKETCHECK_API_KEY;

  const settingsResult = await sql`
    SELECT marketcheck_api_key FROM company_settings LIMIT 1
  `;

  if (settingsResult.length > 0 && settingsResult[0].marketcheck_api_key) {
    marketCheckApiKey = settingsResult[0].marketcheck_api_key;
    console.log("[Lookup] Using MarketCheck API key from database");
  } else if (marketCheckApiKey) {
    console.log("[Lookup] Using MarketCheck API key from environment variable");
  }

  return marketCheckApiKey;
}

export async function getUserZipCode(userId) {
  if (!userId) {
    return null;
  }

  const userResult = await sql`
    SELECT zip_code FROM auth_users WHERE id = ${userId}
  `;

  if (userResult.length > 0 && userResult[0].zip_code) {
    return userResult[0].zip_code;
  }

  return null;
}

export async function getMarketSearchRadius() {
  const settingsResult = await sql`
    SELECT market_search_radius FROM company_settings LIMIT 1
  `;

  if (settingsResult.length > 0 && settingsResult[0].market_search_radius) {
    const radius = settingsResult[0].market_search_radius;
    // MarketCheck API has a maximum radius of 100 miles
    const cappedRadius = Math.min(radius, 100);

    if (radius > 100) {
      console.log(
        `[Lookup] Search radius from settings (${radius} miles) exceeds MarketCheck limit. Capping at 100 miles.`,
      );
    } else {
      console.log(
        `[Lookup] Using search radius from settings: ${cappedRadius} miles`,
      );
    }

    return cappedRadius;
  }

  console.log("[Lookup] Using default search radius: 100 miles");
  return 100; // Default 100 miles
}
