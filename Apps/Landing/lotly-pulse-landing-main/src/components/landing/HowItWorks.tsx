import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, BarChart3, CheckCircle2, Search, Zap, FileText } from "lucide-react";

const postSteps = [
  {
    num: "01",
    icon: LogIn,
    title: "Connect your DMS",
    desc: "We help you set up your DMS inventory feed. Then we pull your inventory automatically.",
  },
  {
    num: "02",
    icon: BarChart3,
    title: "AI does the rest",
    desc: "Descriptions written, images sorted, staff invited — ready to post in seconds.",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "Post & track",
    desc: "One-click post to Marketplace through our Google extension.",
  },
];

const valueSteps = [
  {
    num: "01",
    icon: Search,
    title: "Enter VIN or plate",
    desc: "Type in a VIN, mileage and condition. We do the rest.",
  },
  {
    num: "02",
    icon: Zap,
    title: "Get instant valuation",
    desc: "Our engine analyzes live market data from thousands of listings to give you an accurate value in seconds.",
  },
  {
    num: "03",
    icon: FileText,
    title: "Share or export",
    desc: "Download a professional appraisal report or share it directly with your customer.",
  },
];

const HowItWorks = () => {
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
    <section id="howitworks" ref={ref} className="py-24 px-[clamp(24px,5%,80px)] bg-background">
      <div className="max-w-[1120px] mx-auto">
        <div className="mb-14 reveal">
          <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-widest font-semibold text-primary">
            How It Works
          </Badge>
          <h2 className="text-[clamp(28px,3.2vw,42px)] font-bold tracking-tight leading-[1.1] mb-3.5 text-foreground">
            Up and running in minutes
          </h2>
        <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[500px]">
            Simple steps to transform your dealership operations.
          </p>
        </div>

        <div className="mb-6 reveal">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold">
            Pulse Post
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal mb-14">
          {postSteps.map((step) => (
            <Card key={step.num} className="transition-all hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="p-8">
                <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-widest mb-4 block">
                  {step.num}
                </span>
                <div className="w-11 h-11 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2 text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-6 reveal">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold">
            Pulse Value
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
          {valueSteps.map((step) => (
            <Card key={step.num} className="transition-all hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="p-8">
                <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-widest mb-4 block">
                  {step.num}
                </span>
                <div className="w-11 h-11 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2 text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
