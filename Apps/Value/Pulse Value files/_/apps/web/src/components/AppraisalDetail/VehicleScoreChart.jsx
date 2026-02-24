import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Info } from "lucide-react";

export function VehicleScoreChart({ radarData }) {
  // Transform radar data for bar chart
  const barData = radarData.map((item) => ({
    name: item.subject,
    score: item.A,
  }));

  // Color function based on score
  const getBarColor = (score) => {
    if (score >= 85) return "#10b981"; // Green - Excellent
    if (score >= 70) return "#06b6d4"; // Cyan - Good
    if (score >= 55) return "#f59e0b"; // Orange - Fair
    return "#ef4444"; // Red - Needs Attention
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Vehicle Score Analysis</h3>
        <div className="group relative">
          <Info className="w-5 h-5 text-slate-400 cursor-help" />
          <div className="hidden group-hover:block absolute right-0 top-6 bg-slate-900 border border-slate-700 rounded-lg p-4 w-72 z-10 shadow-xl">
            <p className="text-xs text-slate-300 mb-2">
              <span className="font-semibold text-[#06b6d4]">
                Real-Time Scoring:
              </span>
            </p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Market Demand: Based on days supply</li>
              <li>• Condition: User-selected rating</li>
              <li>• Mileage: Compared to age average</li>
              <li>• Trim Value: Price vs market median</li>
              <li>• Features: Options & equipment count</li>
              <li>• Data Quality: Comparables confidence</li>
            </ul>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={barData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            horizontal={false}
            vertical={true}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            ticks={[0, 25, 50, 75, 100]}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 500 }}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#06b6d4", fontWeight: "bold" }}
            formatter={(value) => [`${value}/100`, "Score"]}
          />
          <Bar
            dataKey="score"
            radius={[0, 6, 6, 0]}
            label={{
              position: "right",
              fill: "#e2e8f0",
              fontSize: 14,
              fontWeight: "bold",
              formatter: (value) => `${value}`,
            }}
          >
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Score Summary */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-[#0B1120] rounded-lg p-3">
            <p className="text-2xl font-bold text-[#10b981]">
              {barData.filter((d) => d.score >= 85).length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Excellent</p>
          </div>
          <div className="bg-[#0B1120] rounded-lg p-3">
            <p className="text-2xl font-bold text-[#06b6d4]">
              {barData.filter((d) => d.score >= 70 && d.score < 85).length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Good</p>
          </div>
          <div className="bg-[#0B1120] rounded-lg p-3">
            <p className="text-2xl font-bold text-[#f59e0b]">
              {barData.filter((d) => d.score >= 55 && d.score < 70).length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Fair</p>
          </div>
          <div className="bg-[#0B1120] rounded-lg p-3">
            <p className="text-2xl font-bold text-white">
              {Math.round(
                barData.reduce((sum, d) => sum + d.score, 0) / barData.length,
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">Average</p>
          </div>
        </div>
      </div>

      {/* Score Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
          <span className="text-slate-400">Excellent (85+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
          <span className="text-slate-400">Good (70+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
          <span className="text-slate-400">Fair (55+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
          <span className="text-slate-400">Poor (&lt;55)</span>
        </div>
      </div>
    </div>
  );
}
