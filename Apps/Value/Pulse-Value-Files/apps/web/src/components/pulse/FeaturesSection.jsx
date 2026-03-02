export default function FeaturesSection({ features }) {
  if (!features || features.length === 0) return null;

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Need to
            <span className="block bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              Win at Acquisitions
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Pulse combines real-time market data, AI-powered analysis, and
            dealer-specific insights into one powerful platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#1E293B] rounded-2xl p-8 border border-slate-700 hover:border-[#06b6d4]/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-[#06b6d4]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#06b6d4]/30 transition-all">
                <feature.icon className="w-6 h-6 text-[#06b6d4]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
