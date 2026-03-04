import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import pulsePostLogo from "@/assets/pulse-post-logo.png";
import pulseValueLogo from "@/assets/pulse-value-logo.png";

interface BundleWelcomeSplashProps {
  userName?: string;
  onSelectProduct: (product: "post" | "value") => void;
}

/**
 * Full-screen splash shown after Bundle signup.
 * Tells the user they have access to both products
 * and lets them choose which one to launch first.
 */
export default function BundleWelcomeSplash({
  userName,
  onSelectProduct,
}: BundleWelcomeSplashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const greeting = userName ? `Welcome, ${userName}` : "Welcome to Pulse";

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-background flex items-center justify-center px-4 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, gray 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-[520px] text-center">
        {/* Greeting */}
        <Badge
          variant="outline"
          className="mb-6 text-[10px] uppercase tracking-[0.2em] font-bold border-green-500/30 text-green-400"
        >
          Bundle Activated
        </Badge>

        <h1 className="text-3xl font-bold text-foreground italic uppercase tracking-tighter mb-2">
          {greeting}
        </h1>

        <p className="text-sm text-muted-foreground mb-2 max-w-[400px] mx-auto">
          Your account includes full access to both Pulse terminals.
        </p>

        <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-semibold mb-10">
          One login — both products
        </p>

        {/* Product cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Post card */}
          <button
            onClick={() => onSelectProduct("post")}
            className="group relative rounded-xl border border-primary/20 bg-card/50 backdrop-blur-xl p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <img
              src={pulsePostLogo}
              alt="Pulse Post"
              className="h-10 mx-auto mb-4 brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <h2 className="text-sm font-bold uppercase tracking-tight text-foreground mb-1">
              Pulse Post
            </h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
              Inventory management, AI descriptions, marketplace posting
            </p>
            <Button
              variant="default"
              size="sm"
              className="w-full font-bold italic uppercase tracking-widest text-[11px]"
              tabIndex={-1}
            >
              Launch Post
            </Button>
          </button>

          {/* Value card */}
          <button
            onClick={() => onSelectProduct("value")}
            className="group relative rounded-xl border border-primary/20 bg-card/50 backdrop-blur-xl p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <img
              src={pulseValueLogo}
              alt="Pulse Value"
              className="h-10 mx-auto mb-4 brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <h2 className="text-sm font-bold uppercase tracking-tight text-foreground mb-1">
              Pulse Value
            </h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
              Real-time appraisals, market intelligence, valuation reports
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full font-bold italic uppercase tracking-widest text-[11px]"
              tabIndex={-1}
            >
              Launch Value
            </Button>
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          You can switch between products anytime
        </p>
      </div>
    </div>
  );
}
