import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BarChart2,
  DollarSign,
  Zap,
  AlertTriangle,
} from "lucide-react";

export function MarketAnalysisCards({ vehicle }) {
  const daysOfSupply = vehicle.market_days_supply || 28;
  const demandScore = vehicle.demand_score || null;
  const priceToMarket =
    vehicle.price_to_market || vehicle.market_deviation_percentage || null;
  const avgMarketPrice = vehicle.avg_market_price || null;
  const marketTrend = vehicle.market_trend || vehicle.calculation?.trend || "stable";
  const daysListed = vehicle.days_listed || null;
  const listingCount = vehicle.listing_count || vehicle.total_listings || null;
  const velocity = vehicle.velocity_score || vehicle.turn_rate || null;

  const cards = [];

  // Days of Supply Card
  cards.push({
    title: "Days of Supply",
    value: `${daysOfSupply} days`,
    icon: Clock,
    description:
      daysOfSupply < 30
        ? "Fast-moving market"
        : daysOfSupply < 60
          ? "Balanced supply"
          : "Slow-moving market",
    color:
      daysOfSupply < 30
        ? "emerald"
        : daysOfSupply < 60
          ? "blue"
          : "amber",
    trend: daysOfSupply < 30 ? "up" : daysOfSupply < 60 ? "neutral" : "down",
  });

  // Market Trend Card
  cards.push({
    title: "Market Trend",
    value:
      marketTrend === "up"
        ? "Rising"
        : marketTrend === "down"
          ? "Declining"
          : "Stable",
    icon: marketTrend === "up" ? TrendingUp : marketTrend === "down" ? TrendingDown : Activity,
    description:
      marketTrend === "up"
        ? "Prices trending upward"
        : marketTrend === "down"
          ? "Prices trending downward"
          : "Market price stable",
    color:
      marketTrend === "up"
        ? "emerald"
        : marketTrend === "down"
          ? "red"
          : "blue",
    trend: marketTrend,
  });

  // Demand Score (if available)
  if (demandScore !== null) {
    cards.push({
      title: "Demand Score",
      value: `${demandScore}/100`,
      icon: Zap,
      description:
        demandScore >= 75
          ? "High buyer demand"
          : demandScore >= 50
            ? "Moderate demand"
            : "Low demand",
      color: demandScore >= 75 ? "emerald" : demandScore >= 50 ? "blue" : "amber",
      trend: demandScore >= 75 ? "up" : "neutral",
    });
  }

  // Price to Market (if available)
  if (priceToMarket !== null) {
    const ptmNum = parseFloat(priceToMarket);
    cards.push({
      title: "Price to Market",
      value: `${ptmNum > 0 ? "+" : ""}${ptmNum.toFixed(1)}%`,
      icon: BarChart2,
      description:
        ptmNum < -5
          ? "Priced below market"
          : ptmNum > 5
            ? "Priced above market"
            : "At market value",
      color: ptmNum < -5 ? "amber" : ptmNum > 5 ? "red" : "emerald",
      trend: ptmNum > 0 ? "up" : "down",
    });
  }

  // Avg Market Price (if available)
  if (avgMarketPrice !== null) {
    cards.push({
      title: "Avg Market Price",
      value: `$${Math.round(avgMarketPrice).toLocaleString()}`,
      icon: DollarSign,
      description: "Average comparable listing",
      color: "blue",
      trend: "neutral",
    });
  }

  // Listing Count (if available)
  if (listingCount !== null) {
    cards.push({
      title: "Listings Found",
      value: listingCount.toString(),
      icon: BarChart2,
      description:
        listingCount >= 20
          ? "Strong market data"
          : listingCount >= 10
            ? "Good market data"
            : "Limited comparables",
      color:
        listingCount >= 20
          ? "emerald"
          : listingCount >= 10
            ? "blue"
            : "amber",
      trend: "neutral",
    });
  }

  // Velocity (if available)
  if (velocity !== null) {
    cards.push({
      title: "Turn Rate",
      value: `${velocity}x`,
      icon: Activity,
      description: velocity >= 3 ? "Fast turn rate" : velocity >= 1.5 ? "Normal turn rate" : "Slow turn rate",
      color: velocity >= 3 ? "emerald" : velocity >= 1.5 ? "blue" : "amber",
      trend: velocity >= 3 ? "up" : "neutral",
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-[#06b6d4]" />
        Market Intelligence
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <MarketCard key={idx} card={card} />
        ))}
      </div>
    </div>
  );
}

function MarketCard({ card }) {
  const colorMap = {
    emerald: {
      bg: "from-emerald-500/10 to-transparent",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: "text-emerald-400",
    },
    blue: {
      bg: "from-blue-500/10 to-transparent",
      border: "border-blue-500/30",
      text: "text-blue-400",
      icon: "text-blue-400",
    },
    amber: {
      bg: "from-amber-500/10 to-transparent",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: "text-amber-400",
    },
    red: {
      bg: "from-red-500/10 to-transparent",
      border: "border-red-500/30",
      text: "text-red-400",
      icon: "text-red-400",
    },
  };

  const colors = colorMap[card.color] || colorMap.blue;
  const IconComponent = card.icon;

  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} rounded-xl p-4 border ${colors.border}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className={`w-4 h-4 ${colors.icon}`} />
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          {card.title}
        </span>
      </div>
      <p className={`text-2xl font-bold ${colors.text} mb-1`}>{card.value}</p>
      <p className="text-xs text-slate-500">{card.description}</p>
    </div>
  );
}
