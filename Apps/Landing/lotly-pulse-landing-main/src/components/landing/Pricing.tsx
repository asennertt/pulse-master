import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import pulsePostLogo from "@/assets/pulse-post-logo.png";
import pulseValueLogo from "@/assets/pulse-value-logo.png";

type Plan = {
  featured: boolean;
  pill: string;
  title: string;
  desc: string;
  price: string;
  per: string;
  includes: string;
  features: string[];
  cta: string;
  note: string;
};

const valuePlans: Plan[] = [
  {
    featured: false, pill: "Free", title: "Free",
    desc: "Perfect for trying out the platform.",
    price: "0", per: "/forever", includes: "3 total appraisals",
    features: ["3 total appraisals", "Real-time market data", "Professional reports", "Email delivery"],
    cta: "Get Started", note: "No credit card required",
  },
  {
    featured: false, pill: "Starter", title: "Starter",
    desc: "Great for individual dealers.",
    price: "39", per: "/mo", includes: "10 appraisals per month",
    features: ["10 appraisals/month", "Real-time market data", "Professional reports", "Email delivery", "Priority support"],
    cta: "Subscribe", note: "Cancel anytime",
  },
  {
    featured: true, pill: "Most Popular", title: "Buyer",
    desc: "For dealerships and power users.",
    price: "99", per: "/mo", includes: "Unlimited appraisals",
    features: ["Unlimited appraisals", "Real-time market data", "Professional reports", "Email delivery", "Priority support"],
    cta: "Subscribe", note: "Most popular choice",
  },
];

const postPlans: Plan[] = [
  {
    featured: false, pill: "Starter", title: "Starter",
    desc: "Perfect for the independent lot.",
    price: "49", per: "/mo", includes: "Up to 30 posts per month",
    features: ["Up to 30 Posts/mo", "AI Description Generator", "Smart Image Sorter", "DMS Sync", "Staff Invites (up to 3)", "Email Support"],
    cta: "Start Starter Trial", note: "7-day free trial included",
  },
  {
    featured: true, pill: "Most Popular", title: "Unlimited",
    desc: "For high-volume dealerships.",
    price: "99", per: "/mo", includes: "Unlimited posts, unlimited staff",
    features: ["Unlimited Posts", "Everything in Starter", "Unlimited Staff Invites", "Role-Based Access Control", "Admin Performance Dashboard", "Priority Support"],
    cta: "Go Unlimited", note: "Most popular choice",
  },
];

const bundleFeatures = [
  "Unlimited Posts", "Unlimited Appraisals", "AI Description Generator", "Real-time Market Data",
  "Smart Image Sorter & Sold Alerts", "Professional Appraisal Reports", "Unlimited Staff & Role Access",
  "Admin Performance Dashboard", "DMS Sync", "Priority Support",
];

const PlanCard = ({ plan }: { plan: Plan }) => (
  <Card className={`transition-all hover:-translate-y-0.5 ${plan.featured ? "border-primary shadow-lg" : "hover:shadow-lg"}`}>
    <CardContent className="p-8">
      <Badge variant={plan.featured ? "default" : "secondary"} className="mb-5 text-[11px] uppercase tracking-widest font-bold">
        {plan.pill}
      </Badge>

      <h3 className="text-lg font-bold tracking-tight mb-1 text-foreground">{plan.title}</h3>
      <p className="text-sm text-muted-foreground mb-6 min-h-[42px]">{plan.desc}</p>

      <div className="flex items-baseline gap-0.5 mb-1">
        <span className="text-xl font-bold text-muted-foreground">$</span>
        <span className="text-5xl font-bold tracking-tight leading-none text-foreground">{plan.price}</span>
        <span className="text-sm text-muted-foreground">{plan.per}</span>
      </div>
      <p className="text-[13px] text-muted-foreground mb-5">{plan.includes}</p>

      <Separator className="mb-6" />

      <ul className="flex flex-col gap-2.5 mb-7">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/70 leading-snug">
            <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-accent-foreground" />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <Button variant={plan.featured ? "default" : "outline"} className="w-full" size="lg" asChild>
        <Link to={`/auth?plan=${encodeURIComponent(plan.title)}`}>{plan.cta}</Link>
      </Button>
      <p className="text-xs text-center mt-2.5 text-muted-foreground">{plan.note}</p>
    </CardContent>
  </Card>
);

const Pricing = () => {
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
    <section id="pricing" ref={ref} className="py-24 px-[clamp(24px,5%,80px)] bg-card">
      <div className="max-w-[1120px] mx-auto">
        <div className="mb-10 text-center reveal">
          <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-widest font-semibold text-primary">
            Pricing
          </Badge>
          <h2 className="text-[clamp(28px,3.2vw,42px)] font-bold tracking-tight leading-[1.1] mb-3.5 text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[540px] mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <Tabs defaultValue="value" className="reveal">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12">
            <TabsTrigger value="value">Pulse Value</TabsTrigger>
            <TabsTrigger value="post">Pulse Post</TabsTrigger>
            <TabsTrigger value="bundle" className="relative">
              Bundle & Save
              <span className="absolute -top-2.5 -right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Save
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="value">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {valuePlans.map((plan) => <PlanCard key={plan.title + plan.price} plan={plan} />)}
            </div>
          </TabsContent>

          <TabsContent value="post">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[840px] mx-auto">
              {postPlans.map((plan) => <PlanCard key={plan.title + plan.price} plan={plan} />)}
            </div>
          </TabsContent>

          <TabsContent value="bundle">
            <div className="max-w-[640px] mx-auto">
              <Card className="border-primary shadow-lg">
                <CardContent className="p-12 text-center">
                  <Badge className="mb-6 text-[11px] uppercase tracking-widest font-bold bg-green-500/20 text-green-400 border-green-500/30">
                    Best Value
                  </Badge>

                  <div className="flex items-center justify-center gap-4 mb-4">
                    <img src={pulsePostLogo} alt="Pulse Post" className="h-12 brightness-0 invert opacity-70" />
                    <span className="text-foreground/30 text-2xl font-light">+</span>
                    <img src={pulseValueLogo} alt="Pulse Value" className="h-12 brightness-0 invert opacity-70" />
                  </div>

                  <h3 className="text-[22px] font-bold tracking-tight mb-1 text-foreground">Pulse Bundle</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get both Pulse Post & Pulse Value at a discounted rate.
                  </p>

                  <div className="flex items-baseline justify-center gap-0.5 mb-1">
                    <span className="text-xl font-bold text-foreground">$</span>
                    <span className="text-6xl font-bold tracking-tight leading-none text-foreground">139</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-[13px] text-green-400 font-semibold mb-6">Save $59/mo vs. buying separately</p>

                  <Separator className="mb-6" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-left max-w-[440px] mx-auto mb-8">
                    {bundleFeatures.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-sm text-foreground/60 leading-snug py-1">
                        <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-accent-foreground" />
                        </span>
                        {f}
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="w-full max-w-[320px] shadow-lg" asChild>
                    <Link to="/auth?plan=Bundle">Get the Bundle</Link>
                  </Button>
                  <p className="text-xs mt-2.5 text-muted-foreground">7-day free trial included</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Need enterprise pricing or custom features?{" "}
          <a href="#" className="text-primary font-medium hover:underline">Contact sales</a>
        </p>
      </div>
    </section>
  );
};

export default Pricing;
