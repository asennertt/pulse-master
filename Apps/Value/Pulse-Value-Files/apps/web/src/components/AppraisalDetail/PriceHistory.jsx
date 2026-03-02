import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function PriceHistory({ priceHistory }) {
  if (!priceHistory || priceHistory.length === 0) return null;

  const formattedData = priceHistory.map((entry) => ({
    date:
      typeof entry.date === "string"
        ? entry.date.substring(0, 7)
        : entry.date,
    price: entry.price || entry.value,
    label: entry.label || entry.event || null,
  }));

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg mb-2">Price History</h3>
      <p className="text-slate-400 text-sm mb-4">Historical market price trend</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">{label}</p>
                    <p className="text-[#06b6d4] font-bold">
                      ${payload[0].value?.toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
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
    </div>
  );
}
