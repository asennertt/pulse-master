"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";

export default function ValuationEngine() {
  // Generate scatter data points for local comps
  const scatterData = [];
  for (let i = 0; i < 60; i++) {
    let miles = Math.floor(Math.random() * 60000) + 2000;
    let basePrice = 58000;
    let price = basePrice - 0.28 * miles + (Math.random() * 6000 - 3000);
    scatterData.push({ x: miles, y: Math.round(price) });
  }

  // Regression line data
  const regressionData = [
    { x: 0, y: 58000 },
    { x: 65000, y: 39800 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg">
          <p className="text-[#06b6d4] font-semibold text-sm">
            {payload[0].name === "Local Comps"
              ? "Comp Vehicle"
              : "Pulse Regression"}
          </p>
          <p className="text-slate-300 text-xs">
            Mileage: {payload[0].value.toLocaleString()} mi
          </p>
          <p className="text-slate-300 text-xs">
            Price: ${payload[1]?.value?.toLocaleString() || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="market-data">
      <div className="mb-8">
        <h3 className="text-[#06b6d4] font-bold uppercase tracking-wider mb-2">
          Core Algorithm
        </h3>
        <h2 className="text-3xl font-bold text-white mb-4">
          Analyzing the Price Cloud
        </h2>
        <p className="text-slate-400 max-w-3xl">
          Pulse Appraising doesn't just average the market; we model it. Using
          thousands of data points from Marketcheck's historical and active
          listings, we build a multi-dimensional pricing model that accounts for
          mileage, condition, and local competition.
        </p>
      </div>

      <div className="bg-[#1E293B] p-6 rounded-2xl shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h4 className="text-white font-bold text-lg">
            Market Regression: 2022 BMW X5 xDrive40i
          </h4>
          <span className="bg-slate-900 text-[#06b6d4] px-3 py-1 rounded-full text-xs font-mono border border-slate-700 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            DATA: /search/history
          </span>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="x"
                name="Mileage"
                stroke="#64748b"
                tick={{ fill: "#94a3b8" }}
                label={{
                  value: "Mileage",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#64748b",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Price"
                stroke="#64748b"
                tick={{ fill: "#94a3b8" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{
                  value: "Price ($)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#64748b",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Local Comps"
                data={scatterData}
                fill="#f43f5e"
                fillOpacity={0.6}
              />
              <Scatter
                name="Pulse Regression Line"
                data={regressionData}
                fill="#06b6d4"
                line={{ stroke: "#06b6d4", strokeWidth: 3 }}
                shape={() => null}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-4 bg-slate-900 rounded-lg text-sm text-slate-400 italic">
          Note: The regression line represents the fair market pulse. Points in
          the <span className="text-[#f43f5e]">red zone</span> are overpriced
          relative to mileage, while{" "}
          <span className="text-[#10b981]">green zone</span> represents optimal
          acquisition targets.
        </div>
      </div>
    </section>
  );
}
