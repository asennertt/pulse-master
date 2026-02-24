"use client";
import { motion } from "motion/react";
import { Zap, Target, Clock, FileText } from "lucide-react";

export default function WhySection() {
  const features = [
    {
      icon: Zap,
      title: "Live Market Data",
      desc: "Prices based on what cars are selling for RIGHT NOW, not last month's dusty book.",
      color: "from-[#00D9FF] to-cyan-400",
      bgColor: "from-[#00D9FF]/10 to-cyan-500/10",
      delay: 0,
    },
    {
      icon: Target,
      title: "Laser-Focused Accuracy",
      desc: "We factor in every detail - mileage, trim, options, condition. No guesswork.",
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-400/10 to-emerald-500/10",
      delay: 0.2,
    },
    {
      icon: Clock,
      title: "Instant Results",
      desc: "Seconds, not hours. Time is money, and we respect both.",
      color: "from-orange-400 to-amber-500",
      bgColor: "from-orange-400/10 to-amber-500/10",
      delay: 0.4,
    },
    {
      icon: FileText,
      title: "Pro Reports",
      desc: "Impress customers with sleek, detailed reports they can trust.",
      color: "from-purple-400 to-violet-500",
      bgColor: "from-purple-400/10 to-violet-500/10",
      delay: 0.6,
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden font-space-grotesk">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(#00D9FF 1px, transparent 1px), linear-gradient(90deg, #00D9FF 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">
              Why Choose Us
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-white mb-6"
          >
            Stop{" "}
            <span className="relative inline-block">
              <span className="text-red-500 line-through decoration-4">
                Guessing
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-red-500 origin-left"
              />
            </span>
            <br />
            Start{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-purple-400 to-pink-500">
              Knowing
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Outdated pricing doesn't just cost you time—
            <span className="text-white font-bold"> it costs you deals</span>.
          </motion.p>
        </div>

        {/* Feature cards - Bento grid style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                {/* Card background with gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Main card */}
                <div className="relative bg-gradient-to-br from-[#1A1F2E] to-[#0F1419] p-8 rounded-3xl border border-slate-700 group-hover:border-slate-600 transition-all backdrop-blur-sm">
                  {/* Icon with animated glow */}
                  <div className="relative mb-6 inline-block">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity`}
                    />
                    <div
                      className={`relative w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center`}
                    >
                      <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-3xl font-black text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>

                  {/* Animated corner accent */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: feature.delay + 0.3 }}
                    className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF] to-purple-500 rounded-full blur-2xl opacity-50" />
            <button
              onClick={() => (window.location.href = "/appraise")}
              className="relative px-12 py-6 bg-gradient-to-r from-[#00D9FF] to-purple-500 text-white font-black text-xl rounded-full hover:scale-105 transition-transform shadow-2xl"
            >
              Try It Free - No Signup
            </button>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    </section>
  );
}
