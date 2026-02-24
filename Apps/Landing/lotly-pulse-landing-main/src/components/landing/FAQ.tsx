import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How long does setup take?",
    a: "Most dealers are posting within 30 minutes. Connect your DMS or upload a CSV, and Pulse handles the rest.",
  },
  {
    q: "Does Pulse replace my existing DMS?",
    a: "No — Pulse sits on top of your existing systems. We integrate with your DMS so you don't have to change your workflow.",
  },
  {
    q: "What DMS platforms do you support?",
    a: "We support DealerTrack, RouteOne, CDK, Reynolds & Reynolds, and most major DMS platforms. You can also upload a CSV.",
  },
  {
    q: "Why Facebook Marketplace?",
    a: "78% of used car buyers start on Facebook. It's free to list, buyers message you directly, and the algorithm favors fresh posts — which Pulse auto-renews.",
  },
  {
    q: "What happens when a car sells?",
    a: "Pulse Post notifies you that the car is no longer in your inventory and asks you to delete it from Facebook. No more ghost leads or angry buyers showing up for sold cars.",
  },
  {
    q: "Can I invite my team?",
    a: "Yes. Invite staff with one link. Admins see everything — staff only see what they need. Role-based access keeps things clean.",
  },
];

const FAQ = () => {
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
    <section id="faq" ref={ref} className="py-24 px-[clamp(24px,5%,80px)] bg-background">
      <div className="max-w-[720px] mx-auto">
        <div className="mb-14 text-center reveal">
          <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-widest font-semibold text-primary">
            FAQ
          </Badge>
          <h2 className="text-[clamp(28px,3.2vw,42px)] font-bold tracking-tight leading-[1.1] mb-3.5 text-foreground">
            Common questions
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[500px] mx-auto">
            Everything you need to know about getting started with Pulse.
          </p>
        </div>

        <Accordion type="single" collapsible className="reveal">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-[15px] font-semibold text-foreground text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
