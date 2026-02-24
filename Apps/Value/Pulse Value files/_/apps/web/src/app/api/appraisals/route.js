import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET all appraisals
export async function GET(request) {
  try {
    const session = await auth();

    // If user is logged in, show only their appraisals
    if (session?.user?.id) {
      const appraisals = await sql`
        SELECT * FROM appraisals 
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC
      `;
      return Response.json(appraisals);
    }

    // Otherwise show all (for backwards compatibility)
    const appraisals = await sql`
      SELECT * FROM appraisals 
      ORDER BY created_at DESC
    `;

    return Response.json(appraisals);
  } catch (error) {
    console.error("Error fetching appraisals:", error);
    return Response.json(
      { error: "Failed to fetch appraisals" },
      { status: 500 },
    );
  }
}

// POST create new appraisal
export async function POST(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Get current month for usage tracking
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // TEMPORARILY DISABLED FOR TESTING - Subscription tier limits commented out
    /*
    // Check subscription status and usage
    const [user] = await sql`
      SELECT subscription_tier FROM auth_users WHERE id = ${userId}
    `;
    const tier = user?.subscription_tier || "free";

    const [usage] = await sql`
      SELECT appraisal_count FROM appraisal_usage 
      WHERE user_id = ${userId} AND month_year = ${currentMonth}
    `;

    let appraisalsUsed = usage?.appraisal_count || 0;

    // For free tier, check total usage across all time
    if (tier === "free") {
      const [total] = await sql`
        SELECT SUM(appraisal_count) as total 
        FROM appraisal_usage 
        WHERE user_id = ${userId}
      `;
      appraisalsUsed = parseInt(total?.total) || 0;

      if (appraisalsUsed >= 3) {
        return Response.json(
          {
            error: "Free tier limit reached. Please upgrade to continue.",
            upgrade: true,
          },
          { status: 403 },
        );
      }
    } else if (tier === "starter") {
      if (appraisalsUsed >= 10) {
        return Response.json(
          {
            error:
              "Monthly limit reached. Please upgrade to Buyer plan for unlimited appraisals.",
            upgrade: true,
          },
          { status: 403 },
        );
      }
    }
    */

    const { vin, vehicleData } = await request.json();

    if (!vin) {
      return Response.json({ error: "VIN is required" }, { status: 400 });
    }

    // Create appraisal with user_id
    const result = await sql`
      INSERT INTO appraisals (vin, vehicle_data, user_id, created_at, updated_at)
      VALUES (${vin}, ${JSON.stringify(vehicleData)}, ${userId}, NOW(), NOW())
      RETURNING *
    `;

    // Increment usage counter
    await sql`
      INSERT INTO appraisal_usage (user_id, month_year, appraisal_count, created_at, updated_at)
      VALUES (${userId}, ${currentMonth}, 1, NOW(), NOW())
      ON CONFLICT (user_id, month_year) 
      DO UPDATE SET appraisal_count = appraisal_usage.appraisal_count + 1, updated_at = NOW()
    `;

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating appraisal:", error);
    return Response.json(
      { error: "Failed to create appraisal" },
      { status: 500 },
    );
  }
}
