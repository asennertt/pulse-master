import { useState } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

export function AppraiserTargetPrice({ vehicle, pulseValue }) {
  const [targetPrice, setTargetPrice] = useState("");

  const targetPriceNum = parseFloat(targetPrice) || 0;
  const priceDiff = targetPriceNum - pulseValue;
  const priceDiffPercent = pulseValue
    ? ((priceDiff / pulseValue) * 100).toFixed(1)
    : 0;

  // Get market context
  const avgComparable =
    vehicle.comparables && vehicle.comparables.length > 0
      ? vehicle.comparables.reduce((sum, c) => sum + (c.price || 0), 0) /
        vehicle.comparables.length
      : pulseValue;

  const lowComparable =
    vehicle.comparables && vehicle.comparables.length > 0
      ? Math.min(...vehicle.comparables.map((c) => c.price || Infinity))
      : pulseValue * 0.9;

  const highComparable =
    vehicle.comparables && vehicle.comparables.length > 0
      ? Math.max(...vehicle.comparables.map((c) => c.price || 0))
      : pulseValue * 1.1;

  // Determine price positioning
  let priceAnalysis = {
    status: "neutral",
    title: "Enter Your Target Sale Price",
    message: "We'll analyze if it's positioned well in the market",
    icon: Info,
    color: "slate",
  };

  if (targetPriceNum > 0) {
    if (targetPriceNum < lowComparable) {
      priceAnalysis = {
        status: "below",
        title: "Below Market Range",
        message: `Your target is ${Math.abs(priceDiffPercent)}% below Pulse Value and below all comparables. This is a strong deal for the buyer but you may be leaving money on the table.`,
        icon: AlertCircle,
        color: "amber",
      };
    } else if (targetPriceNum <= avgComparable) {
      priceAnalysis = {
        status: "good",
        title: "Competitive Pricing",
        message: `Your target is ${priceDiffPercent >= 0 ? priceDiffPercent : Math.abs(priceDiffPercent)}% ${priceDiffPercent >= 0 ? "above" : "below"} Pulse Value and in the lower-to-mid market range. This should sell quickly.`,
        icon: CheckCircle,
        color: "emerald",
      };
    } else if (targetPriceNum <= highComparable) {
      priceAnalysis = {
        status: "fair",
        title: "Above Average Market",
        message: `Your target is ${priceDiffPercent}% above Pulse Value and in the upper market range. This may take longer to sell but maximizes profit.`,
        icon: TrendingUp,
        color: "blue",
      };
    } else {
      priceAnalysis = {
        status: "high",
        title: "Above Market Range",
        message: `Your target is ${priceDiffPercent}% above Pulse Value and exceeds all comparables. This may be difficult to sell unless the vehicle has unique features.`,
        icon: AlertCircle,
        color: "red",
      };
    }
  }

  const IconComponent = priceAnalysis.icon;

  const colorClasses = {
    slate: {
      bg: "from-slate-600/20 to-slate-600/5",
      border: "border-slate-600/50",
      shadow: "shadow-[0_0_30px_rgba(100,116,139,0.3)]",
      text: "text-slate-400",
      badge: "bg-slate-600/20 text-slate-400",
    },
    emerald: {
      bg: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/50",
      shadow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
      text: "text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-400",
    },
    blue: {
      bg: "from-blue-500/20 to-blue-500/5",
      border: "border-blue-500/50",
      shadow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
      text: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-400",
    },
    amber: {
      bg: "from-amber-500/20 to-amber-500/5",
      border: "border-amber-500/50",
      shadow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
      text: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-400",
    },
    red: {
      bg: "from-red-500/20 to-red-500/5",
      border: "border-red-500/50",
      shadow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
      text: "text-red-400",
      badge: "bg-red-500/20 text-red-400",
    },
  };

  const colors = colorClasses[priceAnalysis.color];

  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} rounded-xl p-6 border ${colors.border} ${colors.shadow}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className={`w-5 h-5 ${colors.text}`} />
        <span className="text-sm text-slate-400 uppercase tracking-wider">
          Your Target Sale Price
        </span>
      </div>

      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400 font-bold">
          $
        </span>
        <input
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="Enter price"
          className="w-full bg-[#0B1120] text-white text-3xl font-bold pl-10 pr-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none transition-all"
        />
      </div>

      {targetPriceNum > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`${colors.badge} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}
            >
              <IconComponent className="w-3 h-3" />
              {priceAnalysis.title}
            </div>
            {priceDiff !== 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {priceDiff > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {Math.abs(priceDiff).toLocaleString()} (
                  {Math.abs(priceDiffPercent)}%)
                </span>
              </div>
            )}
          </div>

          <p className={`text-sm ${colors.text} leading-relaxed mb-3`}>
            {priceAnalysis.message}
          </p>

          {/* Market Range Indicator */}
          <div className="bg-[#0B1120] rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Market Low</span>
              <span>Avg</span>
              <span>Market High</span>
            </div>
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500"
                style={{ width: "100%" }}
              />
              {/* Your price marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#06b6d4] rounded-full shadow-lg"
                style={{
                  left: `${Math.min(Math.max(((targetPriceNum - lowComparable) / (highComparable - lowComparable)) * 100, 0), 100)}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-emerald-400">
                ${lowComparable.toLocaleString()}
              </span>
              <span className="text-blue-400">
                ${Math.round(avgComparable).toLocaleString()}
              </span>
              <span className="text-red-400">
                ${highComparable.toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
