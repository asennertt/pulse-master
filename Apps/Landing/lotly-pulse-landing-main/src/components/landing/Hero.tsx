import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, BarChart3, Lock } from "lucide-react";
import pulseHeroLogo from "@/assets/pulse-hero-logo.png";
import pulseInlineLogo from "@/assets/pulse-inline-logo.png";

const postStats = [
  { value: "12,400+", label: "Cars Posted" },
  { value: "60s", label: "Avg Post Time" },
  { value: "3.2×", label: "More Leads" }
];

const valueStats = [
  { value: "14,750+", label: "Appraisals Done" },
  { value: "98%", label: "Accuracy" },
  { value: "<5s", label: "Avg. Speed" }
];

const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (el) {
      const observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting && el.classList.add("in"),
        { threshold: 0.1 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <section
      className="relative overflow-hidden pt-36 pb-24 px-[clamp(24px,5%,80px)]"
      style={{
        background: "linear-gradient(180deg, hsl(211 75% 30% / 0.9) 0%, hsl(211 75% 20% / 0.5) 35%, hsl(var(--background)) 70%)"
      }}>
      
      <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)"
        }} />

      <div ref={ref} className="reveal relative z-[2] text-center max-w-[720px] mx-auto font-sans">
        <img src={pulseHeroLogo} alt="Pulse" className="mx-auto mb-10 w-[clamp(320px,50vw,520px)] drop-shadow-xl" />

        <Badge variant="outline" className="mb-8 py-1.5 px-4 text-xs font-medium gap-2 bg-background/80 backdrop-blur-sm">
          <Plus className="w-3 h-3 text-primary" /> Trusted by 200+ independent dealers
        </Badge>

        <h1 className="text-[clamp(40px,5.5vw,68px)] font-bold leading-[1.08] tracking-tight text-foreground mb-5 italic uppercase">
          Give your dealership <br /> a <img src={pulseInlineLogo} alt="Pulse" className="inline-block h-[0.85em]" style={{ verticalAlign: '-0.08em' }} />
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-[560px] mx-auto mb-12">
          Choose your terminal below to begin posting to Marketplace or appraising inventory with live market data.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button size="lg" className="w-full sm:w-auto min-w-[220px] h-14 text-base font-bold italic gap-2 shadow-xl" onClick={() => navigate("/auth?mode=post")}>
            <Zap className="w-5 h-5 fill-current text-yellow-400" /> POST TERMINAL
          </Button>
          <Button size="lg" variant="secondary" className="w-full sm:w-auto min-w-[220px] h-14 text-base font-bold italic gap-2 shadow-xl border border-primary/20" onClick={() => navigate("/auth?mode=value")}>
            <BarChart3 className="w-5 h-5 text-primary" /> VALUE TERMINAL
          </Button>
        </div>

        <div className="flex items-center justify-center gap-x-12 gap-y-6 mb-8 flex-wrap opacity-80 pt-8 border-t border-border/50">
          {[...postStats, ...valueStats].map((s) => (
            <div key={s.label} className="text-center min-w-[100px]">
              <div className="text-xl font-bold text-foreground tracking-tight">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;