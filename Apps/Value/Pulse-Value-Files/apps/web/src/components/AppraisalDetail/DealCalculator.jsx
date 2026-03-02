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
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-[#06b6d4]" />
        <div>
          <h3 className="text-white font-bold text-lg">Deal Calculator</h3>
          <p className="text-slate-400 text-sm">Plan your acquisition strategy</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Target Profit</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              value={targetProfit}
              onChange={(e) => setTargetProfit(Number(e.target.value))}
              className="w-full bg-[#0B1120] text-white pl-8 pr-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Reconditioning Cost</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              value={reconditioningCost}
              onChange={(e) => setReconditioningCost(Number(e.target.value))}
              className="w-full bg-[#0B1120] text-white pl-8 pr-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400">Pulse Value</span>
            <span className="text-white font-semibold">${pulseValue?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-400">- Target Profit</span>
            <span className="text-red-400">-${targetProfit?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-slate-400">- Reconditioning</span>
            <span className="text-red-400">-${reconditioningCost?.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-600 pt-3 flex justify-between">
            <span className="text-white font-bold">Target Purchase Price</span>
            <span className="text-[#06b6d4] font-bold text-xl">
              ${targetPurchasePrice?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
