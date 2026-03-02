import { useState } from "react";
import useUser from "@/utils/useUser";
import useSubscription from "@/utils/useSubscription";

export default function PricingPage() {
  const { user } = useUser();
  const { subscription, loading: subLoading } = useSubscription();
  const [loadingTier, setLoadingTier] = useState(null);

  const handleUpgrade = async (tier) => {
    if (!user) {
      window.location.href = "/account/signin?callbackUrl=/pricing";
      return;
    }

    setLoadingTier(tier);
    try {
      const response = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          redirectURL: window.location.origin + "/pricing",
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
    } finally {
      setLoadingTier(null);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "",
      tier: "free",
      features: [
        "3 total appraisals",
        "Basic VIN decoding",
        "Market value estimates",
        "PDF export",
      ],
      cta: "Current Plan",
      highlight: false,
    },
    {
      name: "Starter",
      price: "$39",
      period: "/month",
      tier: "starter",
      features: [
        "10 appraisals/month",
        "Full VIN decoding",
        "Real-time market data",
        "PDF export",
        "Share appraisals",
        "Priority support",
      ],
      cta: "Upgrade to Starter",
      highlight: false,
    },
    {
      name: "Buyer",
      price: "$99",
      period: "/month",
      tier: "buyer",
      features: [
        "Unlimited appraisals",
        "Full VIN decoding",
        "Real-time market data",
        "PDF export",
        "Share appraisals",
        "Advanced analytics",
        "Priority support",
        "Custom branding",
      ],
      cta: "Upgrade to Buyer",
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      <header className="bg-[#0F1419] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <div className="w-10 h-10 relative">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path
                  d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                  stroke="#00D9FF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))" }}
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">
              <span style={{ color: "#00D9FF" }}>PULSE</span> APPRAISING
            </h1>
          </div>
        </div>
      </header>

      <div className="pt-16 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple Pricing
            </h1>
            <p className="text-xl text-slate-400">
              Choose the plan that fits your workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.tier === plan.tier;
              const isHigherTier =
                (subscription?.tier === "starter" && plan.tier === "free") ||
                (subscription?.tier === "buyer" &&
                  (plan.tier === "free" || plan.tier === "starter"));

              return (
                <div
                  key={plan.tier}
                  className={`bg-[#1A1F2E] rounded-xl p-6 border ${
                    plan.highlight
                      ? "border-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.2)]"
                      : "border-slate-700"
                  }`}
                >
                  {plan.highlight && (
                    <div className="text-center mb-4">
                      <span className="bg-[#00D9FF] text-[#0F1419] text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h2>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <span className="text-[#00D9FF]">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      !isCurrentPlan && !isHigherTier && handleUpgrade(plan.tier)
                    }
                    disabled={
                      isCurrentPlan ||
                      isHigherTier ||
                      loadingTier === plan.tier ||
                      plan.tier === "free"
                    }
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? "bg-slate-700 text-slate-400 cursor-default"
                        : plan.highlight
                        ? "bg-[#00D9FF] text-[#0F1419] hover:bg-[#00C3E6] shadow-[0_0_15px_rgba(0,217,255,0.4)]"
                        : "border border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF]/10"
                    }`}
                  >
                    {loadingTier === plan.tier
                      ? "Loading..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : isHigherTier
                      ? "Downgrade"
                      : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
