import { useState } from "react";
import useUser from "@/utils/useUser";
import Header from "@/components/pulse/Header";
import Footer from "@/components/pulse/Footer";

export default function PricingPage() {
  const { data: user, loading: userLoading } = useUser();
  const [loadingTier, setLoadingTier] = useState(null);

  const handleCheckout = async (tier) => {
    if (!user) {
      window.location.href = "/account/signup";
      return;
    }

    setLoadingTier(tier);
    try {
      const response = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          redirectURL: window.location.origin + "/dashboard",
        }),
      });

      if (!response.ok) throw new Error("Checkout failed");

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Could not start checkout. Please try again.");
      setLoadingTier(null);
    }
  };

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      appraisals: "3 appraisals",
      description: "Perfect for trying out the platform",
      features: [
        "3 total appraisals",
        "Real-time market data",
        "Professional reports",
        "Email delivery",
      ],
      cta: "Get Started",
      tier: "free",
      highlight: false,
    },
    {
      name: "Starter",
      price: "$39",
      period: "per month",
      appraisals: "10 appraisals/month",
      description: "Great for individual dealers",
      features: [
        "10 appraisals per month",
        "Real-time market data",
        "Professional reports",
        "Email delivery",
        "Priority support",
      ],
      cta: "Subscribe",
      tier: "starter",
      highlight: true,
    },
    {
      name: "Buyer",
      price: "$99",
      period: "per month",
      appraisals: "Unlimited appraisals",
      description: "For dealerships and power users",
      features: [
        "Unlimited appraisals",
        "Real-time market data",
        "Professional reports",
        "Email delivery",
        "Priority support",
        "API access (coming soon)",
      ],
      cta: "Subscribe",
      tier: "buyer",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border transition-all ${
                tier.highlight
                  ? "bg-gradient-to-br from-[#1A1F2E] to-[#0F1419] border-[#00D9FF] scale-105 shadow-[0_0_50px_rgba(0,217,255,0.3)]"
                  : "bg-[#1A1F2E] border-slate-700 hover:border-slate-600"
              }`}
            >
              {tier.highlight && (
                <div className="text-center mb-4">
                  <span className="bg-[#00D9FF] text-[#0F1419] px-4 py-1 rounded-full text-xs font-bold uppercase">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {tier.description}
                </p>
                <div className="mb-2">
                  <span className="text-5xl font-black text-white">
                    {tier.price}
                  </span>
                  <span className="text-slate-400 ml-2">/{tier.period}</span>
                </div>
                <div className="text-[#00D9FF] font-semibold">
                  {tier.appraisals}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[#00D9FF] mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  tier.tier === "free"
                    ? (window.location.href = "/account/signup")
                    : handleCheckout(tier.tier)
                }
                disabled={loadingTier === tier.tier}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  tier.highlight
                    ? "bg-[#00D9FF] text-[#0F1419] hover:bg-[#00C3E6] shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                } disabled:opacity-50`}
              >
                {loadingTier === tier.tier
                  ? "Processing..."
                  : userLoading
                    ? "Loading..."
                    : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-slate-400">
                Yes! You can change your plan at any time. Changes take effect
                immediately.
              </p>
            </div>
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">
                What happens if I go over my monthly limit?
              </h3>
              <p className="text-slate-400">
                On the Starter plan, you'll need to upgrade to continue. On the
                Free plan, you can upgrade to Starter or Buyer to get more
                appraisals.
              </p>
            </div>
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-400">
                Absolutely. Cancel anytime from your dashboard. No questions
                asked.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
