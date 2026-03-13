import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check } from "lucide-react";
import pulsePostLogo from "@/assets/pulse-post-logo.png";

const products = [
{
  tag: "🏪 Marketplace",
  title: "Pulse Post",
  desc: "Sync inventory, generate AI descriptions, and post your entire lot to Facebook Marketplace in minutes. No more manual posting.",
  logo: pulsePostLogo,
  features: [
  "Chrome extension — post to Facebook in under 60 seconds",
  "AI-powered listing descriptions that sell",
  "DMS sync or website scraper — choose your inventory source",
  "AI smart image filtering — scores & sorts your best photos",
  "Attribution tracking — see which posts drive leads & sales",
  "Sold alerts — auto-pull ads when cars leave",
  "Staff invites with role-based access",
  "Admin dashboard with posting analytics"]

}];


const Products = () => {
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
    <section id="products" className="py-24 px-[clamp(24px,5%,80px)] bg-background" ref={ref}>
      <div className="max-w-[1120px] mx-auto">
        <div className="mb-14 reveal">
          <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-widest font-semibold text-primary">
            Products
          </Badge>
          <h2 className="text-[clamp(28px,3.2vw,42px)] font-bold tracking-tight leading-[1.1] mb-3.5 text-foreground">
            Everything your dealership needs
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[500px]">The powerful tool that streamlines your marketplace operation. From inventory to sale.
          </p>
        </div>

        <div className="grid grid-cols-1 max-w-[560px] mx-auto gap-6 reveal">
          {products.map((prod) =>
          <Card key={prod.tag} className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 border-border">
              <CardContent className="p-10 relative">
                {/* Glow */}
                <div
                className="absolute -top-20 -right-20 w-[260px] h-[260px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)"
                }} />


                <Badge className="mb-6 text-[11px] uppercase tracking-widest font-bold">
                  {prod.tag}
                </Badge>

                {prod.logo &&
              <img src={prod.logo} alt={prod.title} className="h-24 mb-7 brightness-0 invert mx-auto" />
              }

                <p className="text-[15px] text-muted-foreground leading-relaxed mb-7">
                  {prod.desc}
                </p>

                <ul className="flex flex-col gap-2.5 mb-8">
                  {prod.features.map((f) =>
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/70 leading-snug">
                      <span className="w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-accent-foreground" />
                      </span>
                      {f}
                    </li>
                )}
                </ul>

                

              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>);

};

export default Products;
