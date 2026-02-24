import { TrendingUp, ArrowUp, ArrowDown, Info } from "lucide-react";

export function PriceCalculationBreakdown({
  adjustmentSteps,
  pulseValue,
  confidence,
  pricePosition,
}) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#06b6d4]" />
          Price Calculation Breakdown
        </h3>
        <div className="group relative">
          <Info className="w-5 h-5 text-slate-400 cursor-help" />
          <div className="hidden group-hover:block absolute right-0 top-6 bg-slate-900 border border-slate-700 rounded-lg p-4 w-80 z-10 shadow-xl">
            <p className="text-xs text-slate-300 mb-2">
              <span className="font-semibold text-[#06b6d4]">
                Pulse Value Algorithm:
              </span>
            </p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Base: Market median from comparables</li>
              <li>• Mileage: $0.10-$0.18/mi vs. avg</li>
              <li>• Condition: Poor (-22%) to Excellent (+8%)</li>
              <li>• MDS: Market velocity adjustment</li>
              <li>• Recalls: Deduction for open recalls</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {adjustmentSteps.map((adj, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between p-3 bg-[#0B1120] rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {adj.icon && (
                  <adj.icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: adj.color }}
                  />
                )}
                {!adj.icon && adj.type === "adjustment" && adj.value > 0 && (
                  <ArrowUp className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                )}
                {!adj.icon && adj.type === "adjustment" && adj.value < 0 && (
                  <ArrowDown className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className={
                      adj.type === "base"
                        ? "text-white font-semibold"
                        : "text-slate-300"
                    }
                  >
                    {adj.name}
                  </span>
                  {adj.description && (
                    <p className="text-xs text-slate-500 truncate">
                      {adj.description}
                    </p>
                  )}
                </div>
              </div>
              <span
                className="font-semibold ml-3 flex-shrink-0"
                style={{
                  color:
                    adj.type === "base"
                      ? "#06b6d4"
                      : adj.value >= 0
                        ? "#10b981"
                        : "#ef4444",
                }}
              >
                {adj.type === "base" ? "" : adj.value >= 0 ? "+" : ""}$
                {Math.abs(adj.value).toLocaleString()}
              </span>
            </div>
            {idx < adjustmentSteps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        <div className="border-t border-slate-700 pt-4 mt-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#06b6d4]/20 to-[#06b6d4]/5 rounded-lg border border-[#06b6d4]/50">
            <div>
              <span className="text-white font-bold text-lg">
                Final Pulse Value
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {confidence}% confidence • {pricePosition}
              </p>
            </div>
            <span className="text-3xl font-bold text-[#06b6d4]">
              ${pulseValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
