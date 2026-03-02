import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

export function MarketPositioningChart({ scatterData, currentVehicle }) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg mb-4">Market Positioning</h3>
      <p className="text-slate-400 text-sm mb-4">Price vs. Mileage vs. Market</p>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="x"
            name="Miles"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            dataKey="y"
            name="Price"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <ZAxis dataKey="z" range={[50, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                    <p className="text-white text-sm">
                      {payload[0]?.value?.toLocaleString()} mi
                    </p>
                    <p className="text-[#06b6d4] text-sm font-bold">
                      ${payload[1]?.value?.toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Market" data={scatterData} fill="#64748b" opacity={0.6} />
          <Scatter
            name="This Vehicle"
            data={[currentVehicle]}
            fill="#06b6d4"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
