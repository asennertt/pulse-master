import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, Globe } from "lucide-react";
import pulseHeroLogo from "@/assets/pulse-hero-logo.png";
import lotlyAutoLogo from "@/assets/lotly-auto-logo.png";

const nodes = [
{ label: "Your DMS", sub: "Existing dealer system", icon: Database, center: false },
{ label: "Pulse Platform", sub: "Central hub", icon: Zap, center: true },
{ label: "Third-Party APIs", sub: "Market data & listings", icon: Globe, center: false }];


const Integration = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.1 }
    );
    ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="integration"
      ref={ref}
      className="relative overflow-hidden py-20 px-[clamp(24px,5%,80px)] bg-card">

      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--primary) / 0.18) 0%, transparent 70%)"
        }} />


      <div className="max-w-[1120px] mx-auto relative z-[2] grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-20 items-center">
        <div className="reveal text-center lg:text-left mx-auto lg:mx-0">
          <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-widest font-semibold text-primary">
            Integration
          </Badge>
          <h2 className="text-[clamp(28px,3.2vw,42px)] font-bold tracking-tight leading-[1.1] text-foreground mb-4">
            Connects to everything you already use
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-7 max-w-[480px] mx-auto lg:mx-0">
            Pulse integrates directly into your existing Lotly Auto account — a seamless connection that lets you post inventory to marketplace and appraise cars directly in Lotly Auto. Use it as a standalone product or sync directly with Lotly Auto for a fully connected experience.
          </p>
          <div className="flex items-center gap-6 mb-7 p-4 rounded-xl bg-secondary/50 border border-border w-fit mx-auto lg:mx-0">
            <img src={pulseHeroLogo} alt="Pulse by Lotly Automotive" className="h-14 object-contain" />
            <span className="text-muted-foreground font-medium text-lg">+</span>
            <img src={lotlyAutoLogo} alt="Lotly Auto" className="h-10 object-contain" />
          </div>
          <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
            <Button asChild>
              
            </Button>
            <Button variant="outline" asChild>
              
            </Button>
          </div>
        </div>
        <div className="hidden lg:flex flex-col gap-3 reveal">
          {nodes.map((node, i) =>
          <div key={node.label}>
              <Card className={`transition-colors ${node.center ? "border-primary/35 bg-primary/10" : "bg-secondary/50"}`}>
                <CardContent className="flex items-center gap-3.5 p-4 px-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${node.center ? "bg-primary" : "bg-secondary"}`}>
                    <node.icon className={`w-[18px] h-[18px] ${node.center ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{node.label}</div>
                    <div className="text-xs text-muted-foreground">{node.sub}</div>
                  </div>
                </CardContent>
              </Card>
              {i < nodes.length - 1 &&
            <div className="flex items-center px-5 gap-1 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <div className="flex-1 h-px bg-border" />
                </div>
            }
            </div>
          )}
        </div>
      </div>
    </section>);

};

export default Integration;