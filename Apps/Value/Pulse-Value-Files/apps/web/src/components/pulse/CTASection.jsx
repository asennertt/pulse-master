import { useState } from "react";
import { ArrowRight, Check, Zap, Shield, TrendingUp } from "lucide-react";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section
      id="get-started"
      className="py-32 px-6 relative overflow-hidden bg-[#0B1120]"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#06b6d4]/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8b5cf6]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10b981]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#06b6d4] px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          Ready to Transform Your Appraisals?
        </div>

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Start Making
          <span className="block bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
            Smarter Deals
          </span>
          Today
        </h2>

        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join forward-thinking dealers who use Pulse to buy smarter, price
          faster, and profit more on every vehicle.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Zap,
              title: "Instant Analysis",
              description: "Get appraisal results in under 30 seconds",
            },
            {
              icon: Shield,
              title: "Risk Protection",
              description: "Avoid costly mistakes with market intelligence",
            },
            {
              icon: TrendingUp,
              title: "Profit Optimization",
              description: "Maximize margins on every vehicle you buy",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-[#06b6d4]/20 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#06b6d4]" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Form */}
        {!submitted ? (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-[#06b6d4] focus:bg-white/15 transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Get Started <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            <p className="text-slate-500 text-sm mt-3">
              No credit card required · Free 30-day trial · Cancel anytime
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#10b981]/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#10b981]" />
                </div>
                <h3 className="text-white font-semibold text-lg">You're in!</h3>
              </div>
              <p className="text-slate-400 text-sm">
                We'll be in touch at <strong className="text-white">{email}</strong> with
                your access details.
              </p>
            </div>
          </div>
        )}

        {/* Trust signals */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-slate-500 text-sm mb-6">Trusted by leading dealerships</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["Lotly Auto", "Premier Motors", "AutoMax", "CarPro Group"].map(
              (dealer) => (
                <div
                  key={dealer}
                  className="text-slate-600 font-semibold text-sm tracking-wide"
                >
                  {dealer}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
