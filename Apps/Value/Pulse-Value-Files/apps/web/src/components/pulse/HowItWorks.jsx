export default function HowItWorks({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How Pulse Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From VIN scan to actionable decision in under 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#06b6d4]/50 to-[#8b5cf6]/50" />

          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Step number */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] rounded-2xl mb-6 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <span className="text-2xl font-bold text-white">
                  {index + 1}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 bg-[#1E293B] border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-[#06b6d4]" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
