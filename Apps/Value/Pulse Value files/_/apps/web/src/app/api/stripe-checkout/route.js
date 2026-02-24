import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

const getTierPrice = (tier) => {
  switch (tier) {
    case "starter":
      return {
        currency: "usd",
        product_data: { name: "Pulse Appraising - Starter Plan" },
        recurring: { interval: "month" },
        unit_amount: 3900, // $39.00
      };
    case "buyer":
      return {
        currency: "usd",
        product_data: { name: "Pulse Appraising - Buyer Plan" },
        recurring: { interval: "month" },
        unit_amount: 9900, // $99.00
      };
    default:
      return null;
  }
};

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, redirectURL } = await request.json();

    if (!tier || tier === "free") {
      return Response.json({ error: "Invalid tier" }, { status: 400 });
    }

    const priceData = getTierPrice(tier);
    if (!priceData) {
      return Response.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Get or create Stripe customer
    const [user] =
      await sql`SELECT stripe_id FROM auth_users WHERE id = ${session.user.id}`;
    let stripeCustomerId = user?.stripe_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id },
      });
      stripeCustomerId = customer.id;

      await sql`UPDATE auth_users SET stripe_id = ${stripeCustomerId} WHERE id = ${session.user.id}`;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${redirectURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: redirectURL,
      metadata: {
        userId: session.user.id,
        tier: tier,
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
