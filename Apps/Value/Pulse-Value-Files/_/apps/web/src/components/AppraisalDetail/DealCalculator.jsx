import { Calculator } from "lucide-react";

export function DealCalculator({
  targetProfit,
  setTargetProfit,
  reconditioningCost,
  setReconditioningCost,
  pulseValue,
  targetPurchasePrice,
}) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-[#06b6d4]" />
        <h3 className="text-white font-bold text-lg">Deal Calculator</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Target Profit Margin ($)
          </label>
          <input
            type="number"
            value={targetProfit}
            onChange={(e) => setTargetProfit(Number(e.target.value))}
            className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Reconditioning Cost ($)
          </label>
          <input
            type="number"
            value={reconditioningCost}
            onChange={(e) => setReconditioningCost(Number(e.target.value))}
            className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
          />
        </div>
        <div className="bg-[#0B1120] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Retail Target (75th %ile)</span>
            <span className="text-white font-semibold">
              ${pulseValue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Profit</span>
            <span className="text-[#10b981] font-semibold">
              ${targetProfit.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Reconditioning</span>
            <span className="text-[#f59e0b] font-semibold">
              ${reconditioningCost.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Max Acquisition Cost</span>
              <span className="text-2xl font-bold text-[#06b6d4]">
                ${targetPurchasePrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-[#06b6d4]/10 border border-[#06b6d4]/50 rounded-lg p-4">
          <p className="text-sm text-[#06b6d4]">
            <span className="font-bold">💡 Recommendation:</span> Offer up to{" "}
            <span className="font-bold text-lg">
              ${targetPurchasePrice.toLocaleString()}
            </span>{" "}
            to achieve ${targetProfit.toLocaleString()} profit after $
            {reconditioningCost.toLocaleString()} reconditioning
          </p>
        </div>
        <div className="text-xs text-slate-500 text-center">
          Using 75th percentile market data for retail pricing
        </div>
      </div>
    </div>
  );
}
