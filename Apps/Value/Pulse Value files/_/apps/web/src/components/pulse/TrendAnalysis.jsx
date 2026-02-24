"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TrendAnalysis() {
  const data = [
    { month: "Jan", luxurySUV: 120, ev: 40 },
    { month: "Feb", luxurySUV: 115, ev: 48 },
    { month: "Mar", luxurySUV: 108, ev: 55 },
    { month: "Apr", luxurySUV: 95, ev: 68 },
    { month: "May", luxurySUV: 88, ev: 85 },
    { month: "Jun", luxurySUV: 82, ev: 98 },
  ];

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-[#06b6d4] font-bold uppercase tracking-wider mb-2">
            Market Dynamics
          </h3>
          <h2 className="text-3xl font-bold text-white mb-4">
            Supply & Demand Pulse
          </h2>
          <p className="text-slate-400 mb-6">
            An appraisal is only as good as the market's willingness to buy.
            Pulse Appraising monitors seasonal and economic shifts in inventory
            levels.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-lg border-l-4 border-[#10b981]">
              <h5 className="text-white text-sm font-bold">Bullish Trend</h5>
              <p className="text-xs text-slate-400">
                Inventory levels dropping. Offer aggressively to capture market
                share.
              </p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg border-l-4 border-[#f43f5e]">
              <h5 className="text-white text-sm font-bold">Bearish Trend</h5>
              <p className="text-xs text-slate-400">
                Rising Days on Market. Increase risk discount on trade-in
                offers.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#1E293B] p-6 rounded-2xl shadow-xl border border-slate-700">
          <h4 className="text-white font-bold text-lg mb-4">
            Market Liquidity Index (Active Listings)
          </h4>
          <div className="h-[350px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8" }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8" }}
                  label={{
                    value: "Units Available",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#06b6d4" }}
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
                <Line
                  type="monotone"
                  dataKey="luxurySUV"
                  name="Luxury SUV Inventory"
                  stroke="#06b6d4"
                  strokeWidth={4}
                  dot={{ fill: "#06b6d4", r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="ev"
                  name="EV Inventory"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ fill: "#f43f5e", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
