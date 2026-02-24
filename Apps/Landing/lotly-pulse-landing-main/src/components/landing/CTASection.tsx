import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
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
    <section id="cta" ref={ref} className="py-[72px] px-[clamp(24px,5%,80px)] bg-background">
      <div
        className="max-w-[1120px] mx-auto rounded-2xl py-[72px] px-16 text-center relative overflow-hidden reveal bg-card border border-border">

        {/* Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[380px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, hsl(var(--primary) / 0.22) 0%, transparent 70%)"
          }} />


        <div className="relative z-[2]">
          <h2 className="text-[clamp(28px,3.2vw,44px)] font-bold tracking-tight text-foreground leading-[1.1] mb-3">
            Give your lot a pulse.
          </h2>
          <p className="text-[17px] mb-[34px] max-w-[420px] mx-auto leading-relaxed text-muted-foreground">
            Join 200+ dealers who save 10+ hours a week and actually enjoy posting cars.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="shadow-lg text-[15px] gap-1.5" asChild>
              



            </Button>
            <Button variant="outline" size="lg" className="text-[15px]" asChild>
              <a href="#">Book a demo</a>
            </Button>
          </div>
        </div>
      </div>
    </section>);

};

export default CTASection;