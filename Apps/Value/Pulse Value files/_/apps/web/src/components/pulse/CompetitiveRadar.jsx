"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function CompetitiveRadar() {
  const data = [
    { subject: "Market Speed", pulse: 98, generic: 35 },
    { subject: "Data Freshness", pulse: 99, generic: 20 },
    { subject: "Trim Granularity", pulse: 92, generic: 45 },
    { subject: "Local Accuracy", pulse: 95, generic: 30 },
    { subject: "History Depth", pulse: 88, generic: 60 },
    { subject: "Price Precision", pulse: 96, generic: 40 },
  ];

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="text-[#06b6d4] font-bold uppercase tracking-wider mb-2">
            Competitive Edge
          </h3>
          <h2 className="text-3xl font-bold text-white mb-4">
            The Pulse Advantage
          </h2>
          <p className="text-slate-400 mb-6">
            By integrating deep into the Marketcheck ecosystem, we provide a
            level of transparency that traditional appraisers cannot match. Our
            appraisals aren't just "the number"—they are a data-backed argument.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="bg-[#06b6d4]/10 p-1 rounded mr-3">
                <span className="text-[#06b6d4] text-xl">⚡</span>
              </div>
              <div>
                <strong className="text-white">Real-Time Refresh:</strong>
                <span className="text-slate-400">
                  {" "}
                  Appraisals update dynamically as the local supply/demand curve
                  shifts.
                </span>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-[#06b6d4]/10 p-1 rounded mr-3">
                <span className="text-[#06b6d4] text-xl">📍</span>
              </div>
              <div>
                <strong className="text-white">Hyper-Local Context:</strong>
                <span className="text-slate-400">
                  {" "}
                  Prices are weighted based on the specific market dynamics
                  within a 50-mile radius.
                </span>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-[#06b6d4]/10 p-1 rounded mr-3">
                <span className="text-[#06b6d4] text-xl">📜</span>
              </div>
              <div>
                <strong className="text-white">History-Aware:</strong>
                <span className="text-slate-400">
                  {" "}
                  Automatic integration of{" "}
                  <code className="text-[#06b6d4]">/history</code> to detect red
                  flags like previous auction cycles or title issues.
                </span>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-[#1E293B] p-6 rounded-2xl shadow-xl border border-slate-700">
          <h4 className="text-white font-bold text-center mb-4">
            Capability Comparison
          </h4>
          <div className="h-[350px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8" }}
                />
                <Radar
                  name="Pulse Appraising"
                  dataKey="pulse"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Generic Book Values"
                  dataKey="generic"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.1}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
