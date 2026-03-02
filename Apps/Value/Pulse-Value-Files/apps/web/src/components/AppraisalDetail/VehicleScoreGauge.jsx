import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function VehicleScoreGauge({ vehicle }) {
  const score = vehicle.vehicle_score || 0;
  const marketPosition = vehicle.market_position || "average";
  const marketCondition = vehicle.market_condition || "normal";

  // Calculate the gauge fill percentage
  const percentage = Math.min(Math.max(score, 0), 100);

  // Determine score category and color
  let scoreCategory = "Average";
  let scoreColor = "#f59e0b";
  let scoreBg = "from-[#f59e0b]/20 to-[#f59e0b]/5";
  let scoreBorder = "border-[#f59e0b]/50";

  if (score >= 75) {
    scoreCategory = "Excellent";
    scoreColor = "#10b981";
    scoreBg = "from-[#10b981]/20 to-[#10b981]/5";
    scoreBorder = "border-[#10b981]/50";
  } else if (score >= 60) {
    scoreCategory = "Good";
    scoreColor = "#06b6d4";
    scoreBg = "from-[#06b6d4]/20 to-[#06b6d4]/5";
    scoreBorder = "border-[#06b6d4]/50";
  } else if (score < 45) {
    scoreCategory = "Below Average";
    scoreColor = "#ef4444";
    scoreBg = "from-[#ef4444]/20 to-[#ef4444]/5";
    scoreBorder = "border-[#ef4444]/50";
  }

  // Market condition indicator
  const getMarketIcon = () => {
    if (marketCondition === "hot") return TrendingUp;
    if (marketCondition === "slow") return TrendingDown;
    return Minus;
  };

  const MarketIcon = getMarketIcon();

  const getMarketColor = () => {
    if (marketCondition === "hot") return "#10b981";
    if (marketCondition === "slow") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-[#06b6d4]" />
          Vehicle Score & Market Position
        </h3>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Circular Gauge */}
        <div className="relative flex-shrink-0">
          <svg width="180" height="180" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="#0B1120"
              strokeWidth="20"
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke={scoreColor}
              strokeWidth="20"
              strokeDasharray={`${(percentage / 100) * 440} 440`}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 10px ${scoreColor})`,
              }}
            />
          </svg>
          {/* Score display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-white">{score}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              out of 100
            </p>
          </div>
        </div>

        {/* Score Details */}
        <div className="flex-1">
          <div
            className={`bg-gradient-to-br ${scoreBg} rounded-lg p-4 border ${scoreBorder} mb-4`}
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Score Category
            </p>
            <p className="text-2xl font-bold" style={{ color: scoreColor }}>
              {scoreCategory}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Market Position:{" "}
              <span className="text-white capitalize">{marketPosition}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B1120] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MarketIcon
                  className="w-4 h-4"
                  style={{ color: getMarketColor() }}
                />
                <p className="text-xs text-slate-400">Market</p>
              </div>
              <p
                className="text-lg font-bold capitalize"
                style={{ color: getMarketColor() }}
              >
                {marketCondition}
              </p>
            </div>

            <div className="bg-[#0B1120] rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Confidence</p>
              <p className="text-lg font-bold text-[#06b6d4]">
                {vehicle.confidence_score || 0}%
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Score Factors
            </p>
            <div className="space-y-1">
              <ScoreFactor
                label="Market Condition"
                value={
                  marketCondition === "hot"
                    ? 15
                    : marketCondition === "slow"
                      ? -10
                      : 0
                }
                max={15}
              />
              <ScoreFactor
                label="Vehicle Condition"
                value={
                  vehicle.condition === "excellent"
                    ? 20
                    : vehicle.condition === "good"
                      ? 10
                      : vehicle.condition === "fair"
                        ? -5
                        : -15
                }
                max={20}
              />
              <ScoreFactor
                label="Mileage Position"
                value={Math.min(
                  20,
                  Math.max(-15, 20 - (score >= 70 ? 0 : score >= 60 ? 10 : 15)),
                )}
                max={20}
              />
              <ScoreFactor
                label="Price Trend"
                value={
                  vehicle.price_trend_90d?.direction === "up"
                    ? 15
                    : vehicle.price_trend_90d?.direction === "down"
                      ? -10
                      : 0
                }
                max={15}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreFactor({ label, value, max }) {
  const percentage = (Math.abs(value) / max) * 100;
  const isPositive = value >= 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span
          className={`text-xs font-semibold ${isPositive ? "text-[#10b981]" : "text-[#ef4444]"}`}
        >
          {isPositive ? "+" : ""}
          {value}
        </span>
      </div>
      <div className="h-1 bg-[#0B1120] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isPositive ? "bg-[#10b981]" : "bg-[#ef4444]"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
