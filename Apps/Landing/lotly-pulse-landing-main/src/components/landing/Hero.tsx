import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, BarChart3 } from "lucide-react";
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
  { value: "<5s", label: "Avg. Speed" },
  { value: "Live", label: "Data Streaming" }
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

      {/* Grid bg */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)"
        }} />

      {/* Blue glow */}
      <div
        className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[960px] h-[560px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--primary) / 0.3) 0%, transparent 70%)"
        }} />

      <div ref={ref} className="reveal relative z-[2] text-center max-w-[720px] mx-auto">
        <img
          src={pulseHeroLogo}
          alt="Pulse by Lotly Automotive Solutions"
          className="mx-auto mb-10 w-[clamp(320px,50vw,520px)] drop-shadow-[0_4px_24px_hsl(var(--primary)/0.18)]" />

        <Badge variant="outline" className="mb-8 py-1.5 px-4 text-xs font-medium gap-2 bg-background/80 backdrop-blur-sm">
          <span className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
            <Plus className="w-3 h-3 text-accent-foreground" />
          </span>
          Trusted by 200+ independent dealers
        </Badge>

        <h1 className="text-[clamp(40px,5.5vw,68px)] font-bold leading-[1.08] tracking-[-0.035em] text-foreground mb-5">
          Give your dealership
          <br />
          <span className="inline-flex items-center justify-center gap-[0.15em]">
            a{" "}
            <span className="pulse-logo-wrap">
              <img
                src={pulseInlineLogo}
                alt="Pulse"
                className="inline-block h-[0.85em] pulse-logo-animate"
                style={{ verticalAlign: '-0.08em', marginLeft: '0.05em' }} />

              <svg
                className="ecg-trace-svg"
                viewBox="0 0 400 100"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  className="ecg-trace-glow"
                  d="M-10,52 L38,52 L44,48 Q48,44 52,52 L58,52 L62,22 L67,78 L72,36 L77,52 Q80,56 84,52 L400,52"
                  stroke="hsl(211 100% 62% / 0.3)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round" />
                <path
                  className="ecg-trace-line"
                  d="M-10,52 L38,52 L44,48 Q48,44 52,52 L58,52 L62,22 L67,78 L72,36 L77,52 Q80,56 84,52 L400,52"
                  stroke="hsl(211 100% 70%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-[560px] mx-auto mb-9">
          Post your entire lot to Facebook Marketplace with AI descriptions and smart image sorting — and appraise vehicles instantly with live market data and VIN-powered valuations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 flex-wrap">
          {/* Main Action Terminals */}
          <Button 
            size="lg" 
            className="shadow-lg text-[15px] gap-2 min-w-[200px] font-bold italic"
            onClick={() => navigate("/auth?mode=post")}
          >
            <Zap className="w-4 h-4 fill-current text-yellow-400" />
            POST TERMINAL
          </Button>
          
          <Button 
            size="lg" 
            variant="secondary"
            className="shadow-lg text-[15px] gap-2 min-w-[200px] font-bold italic border border-primary/20"
            onClick={() => navigate("/auth?mode=value")}
          >
            <BarChart3 className="w-4 h-4 text-primary" />
            VALUE TERMINAL
          </Button>

          <Button variant="outline" size="lg" className="text-[15px]" asChild>
            <a href="#products">See features</a>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 mb-4 flex-wrap opacity-90">
          {postStats.map((s) =>
            <div key={s.label} className="text-center">
              <div className="text-xl font-bold text-foreground tracking-tight">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 mb-8 flex-wrap opacity-90">
          {valueStats.map((s) =>
            <div key={s.label} className="text-center">
              <div className="text-xl font-bold text-foreground tracking-tight">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;