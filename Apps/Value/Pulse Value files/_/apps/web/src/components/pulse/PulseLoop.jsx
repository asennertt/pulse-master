export default function PulseLoop() {
  const steps = [
    {
      number: 1,
      title: "Decode & Spec",
      description:
        "VIN input triggers full trim identification via Marketcheck Specs API.",
      endpoint: "GET /vin/specs",
      color: "bg-[#06b6d4]/20 text-[#06b6d4]",
      borderColor: "hover:border-[#06b6d4]",
    },
    {
      number: 2,
      title: "Comp Matching",
      description:
        "Fetch local active and sold comparable units within a custom radius.",
      endpoint: "GET /search?active=true",
      color: "bg-[#06b6d4]/20 text-[#06b6d4]",
      borderColor: "hover:border-[#06b6d4]",
    },
    {
      number: 3,
      title: "Velocity Calc",
      description:
        "Apply weighting based on current Days on Market and price trends.",
      endpoint: "GET /stats/mds",
      color: "bg-[#06b6d4]/20 text-[#06b6d4]",
      borderColor: "hover:border-[#06b6d4]",
    },
    {
      number: 4,
      title: "Pulse Value",
      description:
        "Final certified appraisal generated with confidence interval score.",
      endpoint: "$51,200",
      color: "bg-[#06b6d4] text-white",
      borderColor: "",
      isFinal: true,
    },
  ];

  return (
    <section id="algorithm">
      <h3 className="text-center text-[#06b6d4] font-bold uppercase tracking-wider mb-2">
        Technical Workflow
      </h3>
      <h2 className="text-center text-3xl font-bold text-white mb-12">
        The "Pulse" Appraisal Engine
      </h2>

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`bg-[#1E293B] border border-slate-700 rounded-xl p-6 ${step.borderColor} transition-all duration-300 flex flex-col items-center text-center ${
                step.isFinal ? "bg-white" : ""
              }`}
            >
              <div
                className={`w-12 h-12 ${step.color} flex items-center justify-center rounded-full font-bold text-xl mb-4`}
              >
                {step.number}
              </div>
              <h4
                className={`${step.isFinal ? "text-slate-900" : "text-white"} font-bold mb-2`}
              >
                {step.title}
              </h4>
              <p
                className={`text-xs ${step.isFinal ? "text-slate-600" : "text-slate-400"} mb-4`}
              >
                {step.description}
              </p>
              <div
                className={`mt-auto w-full ${
                  step.isFinal
                    ? "bg-[#06b6d4]/10 py-2 font-bold text-[#06b6d4]"
                    : "bg-slate-900 py-1 text-[10px] font-mono text-[#06b6d4]"
                } rounded`}
              >
                {step.endpoint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
