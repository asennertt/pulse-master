import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

export function MultiTierPricing({ vehicle }) {
  // Use real data from vehicle if available, otherwise calculate from pulse value
  const basePrice =
    vehicle.estimated_price || vehicle.price || vehicle.pulse_value || 0;

  // Check if we have real tier data from the API
  const tiers = vehicle.pricing_tiers ||
    vehicle.multi_tier_pricing || [
      {
        label: "Retail Ready",
        description: "Fully reconditioned, detail, safety inspection",
        price: Math.round(basePrice * 1.08),
        color: "cyan",
        delta: "+8%",
        trend: "up",
        tooltip: "Maximum retail value after full reconditioning",
      },
      {
        label: "Pulse Value",
        description: "AI-powered fair market valuation",
        price: basePrice,
        color: "blue",
        delta: "Market",
        trend: "neutral",
        tooltip: "Pulse AI's recommended purchase price",
      },
      {
        label: "Quick Sale",
        description: "Priced to move within 7 days",
        price: Math.round(basePrice * 0.94),
        color: "emerald",
        delta: "-6%",
        trend: "down",
        tooltip: "Aggressive pricing to sell within 7 days",
      },
      {
        label: "Wholesale",
        description: "Auction / trade network value",
        price: Math.round(basePrice * 0.87),
        color: "amber",
        delta: "-13%",
        trend: "down",
        tooltip: "Estimated wholesale / auction value",
      },
    ];

  const getTierColors = (color) => {
    const map = {
      cyan: {
        bg: "from-cyan-500/15 to-cyan-500/5",
        border: "border-cyan-500/40",
        text: "text-cyan-400",
        badge: "bg-cyan-500/20 text-cyan-300",
        shadow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      },
      blue: {
        bg: "from-blue-500/15 to-blue-500/5",
        border: "border-blue-500/40",
        text: "text-blue-400",
        badge: "bg-blue-500/20 text-blue-300",
        shadow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      },
      emerald: {
        bg: "from-emerald-500/15 to-emerald-500/5",
        border: "border-emerald-500/40",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300",
        shadow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      },
      amber: {
        bg: "from-amber-500/15 to-amber-500/5",
        border: "border-amber-500/40",
        text: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-300",
        shadow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      },
    };
    return map[color] || map.blue;
  };

  if (!basePrice) return null;

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">Multi-Tier Pricing</h3>
          <p className="text-slate-400 text-sm mt-1">
            Market-adjusted valuations for every scenario
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Info className="w-3 h-3" />
          <span>AI-powered</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier, idx) => {
          const colors = getTierColors(tier.color);
          const TrendIcon =
            tier.trend === "up"
              ? TrendingUp
              : tier.trend === "down"
                ? TrendingDown
                : Minus;

          return (
            <div
              key={idx}
              className={`relative bg-gradient-to-br ${colors.bg} rounded-xl p-5 border ${colors.border} ${colors.shadow} hover:scale-105 transition-transform cursor-default`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider leading-tight">
                  {tier.label}
                </span>
                <div className={`${colors.badge} text-xs px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap`}>
                  <TrendIcon className="w-2.5 h-2.5" />
                  {tier.delta}
                </div>
              </div>

              <p className={`text-2xl font-bold ${colors.text} mb-1`}>
                ${tier.price.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 leading-tight">
                {tier.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
