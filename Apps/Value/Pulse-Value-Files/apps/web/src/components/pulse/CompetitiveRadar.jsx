import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export default function CompetitiveRadar({ data, title }) {
  const defaultData = [
    { subject: "Speed", A: 95, B: 60 },
    { subject: "Accuracy", A: 92, B: 70 },
    { subject: "Coverage", A: 88, B: 65 },
    { subject: "Insights", A: 90, B: 55 },
    { subject: "Integration", A: 85, B: 75 },
    { subject: "Value", A: 93, B: 60 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="bg-[#1E293B] rounded-2xl p-8 border border-slate-700">
      <h3 className="text-white font-bold text-xl mb-6 text-center">
        {title || "Pulse vs Traditional Methods"}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <Radar
            name="Pulse"
            dataKey="A"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.2}
          />
          <Radar
            name="Traditional"
            dataKey="B"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.1}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
          <span className="text-slate-400 text-sm">Pulse</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
          <span className="text-slate-400 text-sm">Traditional</span>
        </div>
      </div>
    </div>
  );
}
