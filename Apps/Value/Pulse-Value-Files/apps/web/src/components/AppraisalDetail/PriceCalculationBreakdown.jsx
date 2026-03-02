import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export function PriceCalculationBreakdown({
  adjustmentSteps,
  pulseValue,
  confidence,
  pricePosition,
}) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-[#06b6d4]" />
        <div>
          <h3 className="text-white font-bold text-lg">Price Calculation</h3>
          <p className="text-slate-400 text-sm">How we arrived at Pulse Value</p>
        </div>
      </div>

      <div className="space-y-3">
        {adjustmentSteps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-2 border-b border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              {step.delta > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : step.delta < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <DollarSign className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm text-slate-300">{step.label}</span>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-semibold ${
                  step.delta > 0
                    ? "text-emerald-400"
                    : step.delta < 0
                      ? "text-red-400"
                      : "text-white"
                }`}
              >
                {step.delta > 0 ? "+" : ""}
                {step.delta !== 0
                  ? `$${Math.abs(step.delta).toLocaleString()}`
                  : `$${step.value.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-600">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">Pulse Value</span>
          <span className="text-[#06b6d4] font-bold text-2xl">
            ${pulseValue?.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-slate-400 text-sm">Confidence</span>
          <span className="text-slate-300 text-sm">{confidence}%</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-slate-400 text-sm">Market Position</span>
          <span className="text-slate-300 text-sm">{pricePosition}</span>
        </div>
      </div>
    </div>
  );
}
