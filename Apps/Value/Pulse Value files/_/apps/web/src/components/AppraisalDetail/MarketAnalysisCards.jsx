import {
  TrendingUp,
  Clock,
  Activity,
  BarChart3,
  Percent,
  Package,
} from "lucide-react";

export function MarketAnalysisCards({ vehicle }) {
  const domStats = vehicle.dom_stats || {};
  const priceVolatility = vehicle.price_volatility || {};
  const milesVolatility = vehicle.miles_volatility || {};
  const priceTrend = vehicle.price_trend_90d || {};
  const inventoryBreakdown = vehicle.inventory_breakdown || {};

  // Handle both 'miles' and 'mileage' field names
  const vehicleMileage = vehicle.miles || vehicle.mileage || 0;

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-[#06b6d4]" />
        Market Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Days on Market Stats */}
        <AnalysisCard
          title="Days on Market"
          icon={Clock}
          color="#06b6d4"
          stats={[
            {
              label: "Average",
              value: domStats.avg ? `${Math.round(domStats.avg)} days` : "N/A",
            },
            {
              label: "Median",
              value: domStats.median
                ? `${Math.round(domStats.median)} days`
                : "N/A",
            },
            {
              label: "Range",
              value:
                domStats.min && domStats.max
                  ? `${domStats.min}-${domStats.max} days`
                  : "N/A",
            },
          ]}
          insight={
            domStats.avg < 30
              ? "Fast-moving market"
              : domStats.avg > 60
                ? "Slow market - price accordingly"
                : "Average market velocity"
          }
        />

        {/* Price Volatility */}
        <AnalysisCard
          title="Price Distribution"
          icon={Activity}
          color="#8b5cf6"
          stats={[
            {
              label: "Median",
              value: priceVolatility.median
                ? `$${priceVolatility.median.toLocaleString()}`
                : "N/A",
            },
            {
              label: "Range",
              value:
                priceVolatility.min && priceVolatility.max
                  ? `$${priceVolatility.min.toLocaleString()} - $${priceVolatility.max.toLocaleString()}`
                  : "N/A",
            },
            {
              label: "Std Dev",
              value: priceVolatility.stddev
                ? `$${Math.round(priceVolatility.stddev).toLocaleString()}`
                : "N/A",
            },
          ]}
          insight={
            priceVolatility.stddev && priceVolatility.median
              ? priceVolatility.stddev / priceVolatility.median < 0.1
                ? "Very stable pricing"
                : priceVolatility.stddev / priceVolatility.median < 0.2
                  ? "Moderate variation"
                  : "High price variance"
              : "Analyzing..."
          }
        />

        {/* 90-Day Price Trend */}
        <AnalysisCard
          title="90-Day Price Trend"
          icon={TrendingUp}
          color={
            priceTrend.direction === "up"
              ? "#10b981"
              : priceTrend.direction === "down"
                ? "#ef4444"
                : "#f59e0b"
          }
          stats={[
            {
              label: "Direction",
              value: priceTrend.direction
                ? priceTrend.direction.charAt(0).toUpperCase() +
                  priceTrend.direction.slice(1)
                : "Stable",
            },
            {
              label: "Change",
              value: priceTrend.percentage
                ? `${priceTrend.percentage > 0 ? "+" : ""}${priceTrend.percentage.toFixed(1)}%`
                : "0%",
            },
            { label: "Data Points", value: priceTrend.trendline?.length || 0 },
          ]}
          insight={
            priceTrend.direction === "up"
              ? "Prices are rising"
              : priceTrend.direction === "down"
                ? "Prices are falling"
                : "Stable market pricing"
          }
        />

        {/* Mileage Distribution */}
        <AnalysisCard
          title="Mileage Distribution"
          icon={Activity}
          color="#f59e0b"
          stats={[
            {
              label: "Median",
              value: milesVolatility.median
                ? `${milesVolatility.median.toLocaleString()} mi`
                : "N/A",
            },
            {
              label: "Range",
              value:
                milesVolatility.min && milesVolatility.max
                  ? `${milesVolatility.min.toLocaleString()} - ${milesVolatility.max.toLocaleString()} mi`
                  : "N/A",
            },
            {
              label: "This Vehicle",
              value: vehicleMileage
                ? `${vehicleMileage.toLocaleString()} mi`
                : "N/A",
            },
          ]}
          insight={
            vehicleMileage && milesVolatility.median
              ? vehicleMileage < milesVolatility.median * 0.8
                ? "Low mileage advantage"
                : vehicleMileage > milesVolatility.median * 1.2
                  ? "Higher than average miles"
                  : "Average mileage"
              : "Analyzing..."
          }
        />

        {/* Sales Velocity */}
        <AnalysisCard
          title="Sales Velocity"
          icon={Percent}
          color="#10b981"
          stats={[
            {
              label: "Market Supply",
              value: vehicle.market_days_supply
                ? `${Math.round(vehicle.market_days_supply)} days`
                : "N/A",
            },
            {
              label: "Velocity",
              value: vehicle.sales_velocity
                ? `${vehicle.sales_velocity.toFixed(1)}/mo`
                : "N/A",
            },
            {
              label: "Condition",
              value: vehicle.market_condition
                ? vehicle.market_condition.charAt(0).toUpperCase() +
                  vehicle.market_condition.slice(1)
                : "Normal",
            },
          ]}
          insight={
            vehicle.market_condition === "hot"
              ? "High demand market"
              : vehicle.market_condition === "slow"
                ? "Lower demand - adjust pricing"
                : "Balanced supply & demand"
          }
        />

        {/* Inventory Breakdown */}
        <AnalysisCard
          title="Inventory Mix"
          icon={Package}
          color="#06b6d4"
          stats={[
            { label: "Certified", value: inventoryBreakdown.certified || 0 },
            { label: "Used", value: inventoryBreakdown.used || 0 },
            { label: "New", value: inventoryBreakdown.new || 0 },
          ]}
          insight={
            inventoryBreakdown.certified > 0
              ? `${Math.round((inventoryBreakdown.certified / (inventoryBreakdown.certified + inventoryBreakdown.used + inventoryBreakdown.new)) * 100)}% certified listings`
              : "Standard used inventory"
          }
        />
      </div>

      {/* Market Insights Summary */}
      {vehicle.market_condition && (
        <div className="mt-6 bg-[#0B1120] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">
            Market Insights
          </h4>
          <p className="text-sm text-slate-300">{getMarketInsight(vehicle)}</p>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ title, icon: Icon, color, stats, insight }) {
  return (
    <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>

      <div className="space-y-2 mb-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs text-slate-400">{stat.label}</span>
            <span className="text-sm font-semibold text-slate-200">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-400 italic">{insight}</p>
      </div>
    </div>
  );
}

function getMarketInsight(vehicle) {
  const insights = [];

  if (vehicle.market_condition === "hot") {
    insights.push("The market is currently hot with high demand.");
  } else if (vehicle.market_condition === "slow") {
    insights.push("Market demand is currently slow.");
  }

  if (vehicle.price_trend_90d?.direction === "up") {
    insights.push("Prices have been trending upward over the past 90 days.");
  } else if (vehicle.price_trend_90d?.direction === "down") {
    insights.push("Prices are declining - consider competitive pricing.");
  }

  if (vehicle.dom_stats?.avg && vehicle.dom_stats.avg < 30) {
    insights.push("Vehicles in this category are selling quickly.");
  } else if (vehicle.dom_stats?.avg && vehicle.dom_stats.avg > 60) {
    insights.push("Extended time on market is common for this segment.");
  }

  if (insights.length === 0) {
    return "Market conditions are stable with normal supply and demand dynamics.";
  }

  return insights.join(" ");
}
