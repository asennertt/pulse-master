import { DollarSign, Zap, TrendingUp, Clock, Users } from "lucide-react";

export function MultiTierPricing({ vehicle }) {
  // Helper function to safely extract value from potentially object fields
  const safeValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.name || value.code || value.base || null;
    }
    return value;
  };

  const tiers = [
    {
      name: "Wholesale",
      price: vehicle.wholesale_price,
      description: "Auction floor price",
      icon: Users,
      color: "#ef4444",
      bgGradient: "from-[#ef4444]/20 to-[#ef4444]/5",
      borderColor: "border-[#ef4444]/50",
      days: safeValue(vehicle.days_to_turn_estimate?.wholesale),
      tooltip:
        "Typical auction or wholesale buyer price. Fastest liquidation option.",
    },
    {
      name: "Trade-In",
      price: vehicle.trade_in_price,
      description: "Customer trade value",
      icon: TrendingUp,
      color: "#f59e0b",
      bgGradient: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      borderColor: "border-[#f59e0b]/50",
      days: safeValue(vehicle.days_to_turn_estimate?.trade_in),
      tooltip:
        "Value to offer a customer trading in this vehicle. Competitive pricing.",
    },
    {
      name: "Quick Sale",
      price: vehicle.quick_sale_price,
      description: "15-day turn strategy",
      icon: Zap,
      color: "#8b5cf6",
      bgGradient: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      borderColor: "border-[#8b5cf6]/50",
      days: safeValue(vehicle.days_to_turn_estimate?.quick_sale),
      tooltip:
        "Priced to move quickly. Ideal for fast inventory turn and cash flow.",
    },
    {
      name: "Retail",
      price: vehicle.retail_price,
      description: "Full lot pricing",
      icon: DollarSign,
      color: "#10b981",
      bgGradient: "from-[#10b981]/20 to-[#10b981]/5",
      borderColor: "border-[#10b981]/50",
      days: safeValue(vehicle.days_to_turn_estimate?.retail),
      tooltip:
        "Premium retail pricing. Maximum profit potential with average market time.",
    },
  ];

  const marketAverage = vehicle.market_average || vehicle.estimated_price;
  const marketCondition = safeValue(vehicle.market_condition) || "normal";
  const quickSaleDays = safeValue(vehicle.days_to_turn_estimate?.quick_sale);

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#06b6d4]" />
          Multi-Tier Pricing Strategy
        </h3>
        {marketAverage && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Market Average</p>
            <p className="text-lg font-bold text-slate-300">
              ${marketAverage.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`bg-gradient-to-br ${tier.bgGradient} rounded-lg p-4 border ${tier.borderColor} group relative`}
          >
            {/* Tooltip */}
            <div className="hidden group-hover:block absolute left-0 -top-20 bg-slate-900 border border-slate-700 rounded-lg p-3 w-64 z-10 shadow-xl">
              <p className="text-xs text-slate-300">{tier.tooltip}</p>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <tier.icon className="w-4 h-4" style={{ color: tier.color }} />
              <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                {tier.name}
              </span>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              ${tier.price ? tier.price.toLocaleString() : "N/A"}
            </p>

            <p className="text-xs text-slate-400 mb-2">{tier.description}</p>

            {tier.days && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>~{tier.days} days to turn</span>
              </div>
            )}

            {/* Price difference from retail */}
            {tier.name !== "Retail" && vehicle.retail_price && tier.price && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500">
                  {Math.round(
                    ((vehicle.retail_price - tier.price) /
                      vehicle.retail_price) *
                      100,
                  )}
                  % below retail
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pricing Insights */}
      <div className="bg-[#0B1120] rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-3">
          Pricing Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Retail to Wholesale Spread
            </p>
            <p className="text-lg font-bold text-[#06b6d4]">
              $
              {vehicle.retail_price && vehicle.wholesale_price
                ? (
                    vehicle.retail_price - vehicle.wholesale_price
                  ).toLocaleString()
                : "N/A"}
            </p>
            <p className="text-xs text-slate-500">
              {vehicle.retail_price && vehicle.wholesale_price
                ? `${Math.round(((vehicle.retail_price - vehicle.wholesale_price) / vehicle.retail_price) * 100)}% margin potential`
                : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Recommended Strategy</p>
            <p className="text-sm font-bold text-white">
              {marketCondition === "hot"
                ? "Retail Pricing"
                : marketCondition === "slow"
                  ? "Quick Sale Pricing"
                  : "Trade-In to Retail"}
            </p>
            <p className="text-xs text-slate-500">
              Based on {marketCondition} market
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Optimal Turn Time</p>
            <p className="text-lg font-bold text-[#10b981]">
              {quickSaleDays || "N/A"}
              {quickSaleDays && " days"}
            </p>
            <p className="text-xs text-slate-500">At quick sale price</p>
          </div>
        </div>
      </div>
    </div>
  );
}
