export default function Roadmap() {
  const phases = [
    {
      quarter: "Q1",
      title: "Data Foundation",
      description:
        "Establish direct pipelines to Marketcheck Search and Specs APIs. Build the core vehicle database architecture and identity resolution for VIN tracking.",
      color: "#06b6d4",
      dotClass: "bg-[#06b6d4]",
      glowClass: "shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    },
    {
      quarter: "Q2",
      title: "The Pulse Engine",
      description:
        "Develop regression modeling for automated valuations. Integrate /stats to dynamically adjust values based on real-time inventory velocity.",
      color: "#f43f5e",
      dotClass: "bg-[#f43f5e]",
      glowClass: "",
    },
    {
      quarter: "Q3",
      title: "User Ecosystem",
      description:
        'Launch Mobile App for on-lot appraisals. Introduce Dealer Dashboards for inventory monitoring and "Instant Buy" lead generation.',
      color: "#10b981",
      dotClass: "bg-[#10b981]",
      glowClass: "",
    },
  ];

  return (
    <section id="roadmap" className="max-w-4xl mx-auto">
      <h3 className="text-center text-[#06b6d4] font-bold uppercase tracking-wider mb-2">
        Platform Launch
      </h3>
      <h2 className="text-center text-3xl font-bold text-white mb-12">
        Building Pulse Appraising
      </h2>

      <div className="space-y-12">
        {phases.map((phase, index) => (
          <div key={phase.quarter} className="flex gap-6 items-start">
            <div className="flex-none w-24 text-right pt-1">
              <span className={`font-bold`} style={{ color: phase.color }}>
                {phase.quarter}
              </span>
            </div>

            <div className="flex-none relative h-full">
              <div
                className={`w-4 h-4 rounded-full ${phase.dotClass} ${phase.glowClass} z-10`}
              ></div>
              {index < phases.length - 1 && (
                <div className="absolute top-4 left-2 w-0.5 h-full bg-slate-700"></div>
              )}
            </div>

            <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-700 flex-1">
              <h4 className="text-white font-bold mb-2">{phase.title}</h4>
              <p className="text-sm text-slate-400">{phase.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
