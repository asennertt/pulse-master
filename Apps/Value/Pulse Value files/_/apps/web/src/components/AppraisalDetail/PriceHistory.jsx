import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export function PriceHistory({ priceHistory }) {
  if (!priceHistory || priceHistory.length === 0) {
    return null;
  }

  // Transform price history data for the chart
  const chartData = priceHistory
    .map((hist) => ({
      date: new Date(hist.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: hist.price,
      fullDate: hist.date,
    }))
    .reverse(); // Show oldest to newest

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#06b6d4]" />
        <h3 className="text-white font-bold text-lg">Price History</h3>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#e2e8f0",
            }}
            formatter={(value) => [`$${value.toLocaleString()}`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: "#06b6d4", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {priceHistory.slice(0, 3).map((hist, idx) => (
          <div key={idx} className="bg-[#0B1120] rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">
              {new Date(hist.date).toLocaleDateString()}
            </p>
            <p className="text-lg font-bold text-white mb-1">
              ${hist.price?.toLocaleString() || "N/A"}
            </p>
            {hist.miles && (
              <p className="text-xs text-slate-500">
                {hist.miles.toLocaleString()} mi
              </p>
            )}
            {hist.dealer_name && (
              <p className="text-xs text-slate-500 truncate">
                {hist.dealer_name}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-3 italic">
        Historical pricing data from {priceHistory.length} listing
        {priceHistory.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
