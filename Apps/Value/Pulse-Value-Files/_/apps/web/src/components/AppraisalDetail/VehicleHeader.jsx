import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Activity,
  Calendar,
} from "lucide-react";
import { AppraiserTargetPrice } from "./AppraiserTargetPrice";

export function VehicleHeader({
  vehicle,
  vin,
  pulseValue,
  confidence,
  priceTrend,
  targetPurchasePrice,
  targetProfit,
  daysOfSupply,
  marketHealth,
}) {
  // Use real MDS data if available
  const actualDaysSupply = vehicle.market_days_supply || daysOfSupply;
  const actualMarketHealth = vehicle.market_days_supply
    ? calculateMarketHealthFromMDS(vehicle.market_days_supply)
    : marketHealth;

  // Handle both 'miles' and 'mileage' field names
  const mileage = vehicle.miles || vehicle.mileage || 0;

  return (
    <div className="bg-[#1E293B] rounded-xl p-8 mb-8 border border-slate-700">
      {/* Vehicle Title - full width on top */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="text-slate-400 mb-3 text-lg">
          {typeof vehicle.trim === "object"
            ? vehicle.trim?.name || vehicle.trim?.code || "N/A"
            : vehicle.trim}
        </p>
        <p className="text-sm text-slate-500 font-mono tracking-wide">
          VIN: {vin}
        </p>
      </div>

      {/* Price Cards - full width row below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#06b6d4]/20 to-[#06b6d4]/5 rounded-xl p-6 border border-[#06b6d4]/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#06b6d4] rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-400 uppercase tracking-wider">
              Pulse Value
            </span>
          </div>
          <p className="text-4xl md:text-5xl font-bold text-white mb-2">
            ${pulseValue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-[#10b981]/20 text-[#10b981] px-3 py-1 rounded-full text-xs font-semibold">
              {confidence}% Confidence
            </div>
            {priceTrend === "up" && (
              <TrendingUp className="w-4 h-4 text-[#10b981]" />
            )}
            {priceTrend === "down" && (
              <TrendingDown className="w-4 h-4 text-[#ef4444]" />
            )}
          </div>
        </div>

        <AppraiserTargetPrice vehicle={vehicle} pulseValue={pulseValue} />

        <div className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 rounded-xl p-6 border border-[#10b981]/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-400 uppercase tracking-wider">
              Max Buy Price
            </span>
          </div>
          <p className="text-4xl md:text-5xl font-bold text-white mb-2">
            ${targetPurchasePrice.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-[#f59e0b]/20 text-[#f59e0b] px-3 py-1 rounded-full text-xs font-semibold">
              ${targetProfit.toLocaleString()} Profit Target
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1120] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-4 h-4 text-[#06b6d4]" />
            <span className="text-xs text-slate-400">Mileage</span>
          </div>
          <p className="text-xl font-bold text-white">
            {mileage.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#0B1120] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#06b6d4]" />
            <span className="text-xs text-slate-400">Days Supply</span>
          </div>
          <p className="text-xl font-bold text-white">
            {actualDaysSupply || "N/A"}
            {vehicle.market_days_supply && (
              <span className="text-xs text-slate-400 ml-1">real</span>
            )}
          </p>
        </div>
        <div className="bg-[#0B1120] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs text-slate-400">Market</span>
          </div>
          <p className="text-xl font-bold text-[#10b981]">
            {actualMarketHealth.demand}
          </p>
        </div>
        <div className="bg-[#0B1120] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#06b6d4]" />
            <span className="text-xs text-slate-400">Velocity</span>
          </div>
          <p className="text-xl font-bold text-white">
            {actualMarketHealth.velocity}
          </p>
        </div>
      </div>
    </div>
  );
}

function calculateMarketHealthFromMDS(mds) {
  return {
    supply: mds < 30 ? "Low" : mds < 60 ? "Moderate" : "High",
    demand: mds < 30 ? "High" : mds < 60 ? "Moderate" : "Low",
    velocity: mds < 30 ? "Fast" : mds < 60 ? "Average" : "Slow",
  };
}
