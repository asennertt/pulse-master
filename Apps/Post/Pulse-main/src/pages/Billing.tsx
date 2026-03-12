import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { toast } from "sonner";
import {
  Check, Zap, ArrowLeft, Loader2, CreditCard, ExternalLink,
  Sparkles, Users, BarChart3, HeadphonesIcon, Shield, Infinity,
} from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";
import { PLANS } from "@/lib/stripe-plans";

// ── Plan display config ────────────────────────────────
const planCards = [
  {
    key: "starter" as const,
    name: "Starter",
    price: 49,
    period: "/mo",
    tagline: "Perfect for the independent lot.",
    includes: "Up to 30 posts per month",
    features: [
      { text: "Up to 30 Posts/mo", icon: Zap },
      { text: "AI Description Generator", icon: Sparkles },
      { text: "Smart Image Sorter", icon: BarChart3 },
      { text: "DMS Sync", icon: Shield },
      { text: "Staff Invites (up to 3)", icon: Users },
      { text: "Email Support", icon: HeadphonesIcon },
    ],
    featured: false,
    cta: "Start 7-Day Free Trial",
    note: "No credit card required for trial",
  },
  {
    key: "unlimited" as const,
    name: "Unlimited",
    price: 99,
    period: "/mo",
    tagline: "For high-volume dealerships.",
    includes: "Unlimited posts, unlimited staff",
    features: [
      { text: "Unlimited Posts", icon: Infinity },
      { text: "Everything in Starter", icon: Check },
      { text: "Unlimited Staff Invites", icon: Users },
      { text: "Role-Based Access Control", icon: Shield },
      { text: "Admin Performance Dashboard", icon: BarChart3 },
      { text: "Priority Support", icon: HeadphonesIcon },
    ],
    featured: true,
    cta: "Go Unlimited",
    note: "Most popular choice",
  },
];

export default function BillingPage() {
  const navigate = useNavigate();
  const { user, subscribed, subscriptionTier, subscriptionEnd, checkSubscription, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Handle checkout return
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      toast.success("Payment successful! Your subscription is active.", {
        duration: 5000,
      });
      // Refresh subscription state
      checkSubscription();
      // Clean up URL
      setSearchParams({}, { replace: true });
    } else if (checkoutStatus === "cancelled") {
      toast.info("Checkout cancelled. You can try again anytime.");
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleCheckout = async (planKey: "starter" | "unlimited") => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PLANS[planKey].price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast.error("Failed to start checkout", { description: e.message });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (e: any) {
      toast.error("Failed to open billing portal", { description: e.message });
    } finally {
      setLoadingPortal(false);
    }
  };

  // Determine the current plan name
  const currentPlanName = subscriptionTier
    ? Object.values(PLANS).find(p => p.product_id === subscriptionTier)?.name || subscriptionTier
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(subscribed || isSuperAdmin ? "/dashboard" : "/")}
              className="rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <img src={pulseLogo} alt="Pulse" className="h-7" />
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Billing</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Manage your subscription
              </p>
            </div>
          </div>
          {subscribed && (
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loadingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Manage Subscription
            </button>
          )}
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Current plan banner (if subscribed) */}
        {subscribed && currentPlanName && (
          <div className="glass-card rounded-xl p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">
                  Active: {currentPlanName} Plan
                </div>
                {subscriptionEnd && (
                  <div className="text-xs text-muted-foreground">
                    Renews {new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {loadingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              Change Plan
            </button>
          </div>
        )}

        {/* Heading */}
        {!subscribed && (
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              Choose your plan
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start posting vehicles to Facebook Marketplace in minutes. Upgrade or downgrade anytime.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[840px] mx-auto">
          {planCards.map(plan => {
            const isCurrentPlan = subscriptionTier === PLANS[plan.key].product_id;

            return (
              <div
                key={plan.key}
                className={`glass-card rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 ${
                  plan.featured ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""
                }`}
              >
                {/* Featured badge */}
                {plan.featured && (
                  <div className="bg-primary px-4 py-1.5 text-center">
                    <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 space-y-5">
                  {/* Plan name + tagline */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-muted-foreground">$</span>
                    <span className="text-5xl font-bold tracking-tight text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.includes}</p>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f.text} className="flex items-center gap-2.5 text-sm text-foreground/80">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <f.icon className="h-3 w-3 text-primary" />
                        </div>
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => isCurrentPlan ? handleManageSubscription() : handleCheckout(plan.key)}
                    disabled={loadingPlan === plan.key || loadingPortal}
                    className={`w-full rounded-lg py-3 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? "bg-success/10 border border-success/20 text-success"
                        : plan.featured
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {loadingPlan === plan.key ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : isCurrentPlan ? (
                      <><Check className="h-4 w-4" /> Current Plan</>
                    ) : (
                      plan.cta
                    )}
                  </button>

                  <p className="text-[10px] text-center text-muted-foreground">{plan.note}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact sales */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need enterprise pricing or custom features?{" "}
          <a href="mailto:sales@lotlyauto.com" className="text-primary font-medium hover:underline">
            Contact sales
          </a>
        </p>
      </div>
    </div>
  );
}
