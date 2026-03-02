import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return Response.json({
        tier: "free",
        status: "none",
        appraisalsUsed: 0,
        appraisalsLimit: 3,
      });
    }

    // Get user subscription info
    const [user] = await sql`
      SELECT subscription_status, subscription_tier, stripe_id, last_check_subscription_status_at
      FROM auth_users 
      WHERE id = ${session.user.id}
    `;

    let {
      subscription_status,
      subscription_tier,
      stripe_id,
      last_check_subscription_status_at,
    } = user || {};

    // Check Stripe if we have a stripe_id and status is stale
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isStale =
      last_check_subscription_status_at &&
      new Date(last_check_subscription_status_at) < thirtyDaysAgo;

    if (stripe_id && (!subscription_status || isStale)) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.retrieve(stripe_id, {
          expand: ["subscriptions"],
        });

        const activeSub = customer?.subscriptions?.data?.[0];
        if (activeSub) {
          subscription_status = activeSub.status;

          // Determine tier from subscription
          const amount = activeSub.items.data[0].price.unit_amount;
          if (amount === 3900) subscription_tier = "starter";
          else if (amount === 9900) subscription_tier = "buyer";

          // Update database
          await sql`
            UPDATE auth_users 
            SET subscription_status = ${subscription_status},
                subscription_tier = ${subscription_tier},
                last_check_subscription_status_at = NOW()
            WHERE id = ${session.user.id}
          `;
        }
      } catch (error) {
        console.error("Error fetching from Stripe:", error);
      }
    }

    // Get usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [usage] = await sql`
      SELECT appraisal_count 
      FROM appraisal_usage 
      WHERE user_id = ${session.user.id} AND month_year = ${currentMonth}
    `;

    const appraisalsUsed = usage?.appraisal_count || 0;

    // Determine limits
    const tier = subscription_tier || "free";
    let appraisalsLimit;
    if (tier === "free")
      appraisalsLimit = 3; // Total, not per month
    else if (tier === "starter") appraisalsLimit = 10;
    else if (tier === "buyer") appraisalsLimit = -1; // Unlimited

    // For free tier, check total usage across all time
    let totalUsed = appraisalsUsed;
    if (tier === "free") {
      const [total] = await sql`
        SELECT SUM(appraisal_count) as total 
        FROM appraisal_usage 
        WHERE user_id = ${session.user.id}
      `;
      totalUsed = parseInt(total?.total) || 0;
    }

    return Response.json({
      tier,
      status: subscription_status || "none",
      appraisalsUsed: tier === "free" ? totalUsed : appraisalsUsed,
      appraisalsLimit,
      canCreateAppraisal:
        tier === "buyer" ||
        (tier === "free" ? totalUsed < 3 : appraisalsUsed < appraisalsLimit),
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
