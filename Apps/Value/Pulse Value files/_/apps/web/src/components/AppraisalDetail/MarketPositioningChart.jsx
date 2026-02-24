import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function MarketPositioningChart({ scatterData, currentVehicle }) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg mb-4">Market Positioning</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            dataKey="x"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
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
          />
          <Scatter
            name="Comparables"
            data={scatterData}
            fill="#f43f5e"
            opacity={0.6}
          />
          <Scatter name="Your Vehicle" data={[currentVehicle]} fill="#06b6d4">
            <Cell fill="#06b6d4" />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-2 italic">
        <span className="text-[#06b6d4]">●</span> Your vehicle compared to{" "}
        <span className="text-[#f43f5e]">●</span> market comparables
      </p>
    </div>
  );
}
