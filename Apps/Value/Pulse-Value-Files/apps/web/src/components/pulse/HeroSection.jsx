import { useEffect, useRef, useState } from "react";
import { ArrowRight, TrendingUp, Zap, Shield } from "lucide-react";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { label: "Faster Appraisals", value: "10x", icon: Zap },
    { label: "Accuracy Rate", value: "94%", icon: Shield },
    { label: "Profit Increase", value: "+23%", icon: TrendingUp },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div
        className={`relative max-w-7xl mx-auto px-6 text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#06b6d4] px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
          <div className="w-2 h-2 bg-[#06b6d4] rounded-full animate-pulse" />
          AI-Powered Vehicle Appraisals
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
          Know the True Value
          <span className="block bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent">
            Before You Buy
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Pulse delivers real-time market intelligence, AI-powered valuations,
          and actionable insights to help dealerships make smarter acquisition
          decisions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="#get-started"
            className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#how-it-works"
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all"
          >
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className="w-6 h-6 text-[#06b6d4]" />
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-20 flex justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-600 animate-bounce">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
