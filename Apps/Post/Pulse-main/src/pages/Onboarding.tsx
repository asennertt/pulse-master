import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { toast } from "sonner";
import {
  Building2, MapPin, CheckCircle2, ChevronRight, ChevronLeft,
  Loader2, PackagePlus, Sparkles, Chrome, Share2,
  ArrowRight, Car, Wand2, Download, MousePointerClick,
} from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

/* ── placeholder — swap with the real Web Store URL once the extension is live ── */
const CHROME_EXTENSION_URL = "#extension-coming-soon";

/* ── tutorial slides shown in step 3 ── */
const tutorialSlides = [
  {
    id: "inventory",
    icon: PackagePlus,
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10 border-blue-500/20",
    title: "Import Your Inventory",
    subtitle: "Add vehicles to your Pulse Post dashboard",
    bullets: [
      { icon: Car, text: "Navigate to the Dashboard and click \"Add Vehicle\"" },
      { icon: PackagePlus, text: "Enter vehicle details — year, make, model, and price" },
      { icon: ArrowRight, text: "Upload photos manually or drag & drop images" },
    ],
    tip: "You can add vehicles one at a time or bulk-import from your inventory list.",
  },
  {
    id: "ai-descriptions",
    icon: Sparkles,
    accent: "text-amber-400",
    accentBg: "bg-amber-500/10 border-amber-500/20",
    title: "Generate AI Descriptions",
    subtitle: "Let AI write compelling listings for every vehicle",
    bullets: [
      { icon: Wand2, text: "Open any vehicle card and click \"Generate Description\"" },
      { icon: Sparkles, text: "AI crafts a Marketplace-ready listing in seconds" },
      { icon: ArrowRight, text: "Review, edit if needed, and save" },
    ],
    tip: "AI descriptions are optimized for Facebook Marketplace search visibility.",
  },
  {
    id: "extension",
    icon: Chrome,
    accent: "text-green-400",
    accentBg: "bg-green-500/10 border-green-500/20",
    title: "Install the Chrome Extension",
    subtitle: "The Pulse Post extension powers one-click posting",
    bullets: [
      { icon: Download, text: "Click the button below to add the extension from the Chrome Web Store" },
      { icon: Chrome, text: "Pin the Pulse Post icon to your browser toolbar" },
      { icon: ArrowRight, text: "Sign in with the same account you used here" },
    ],
    tip: "The extension works with Google Chrome and Chromium-based browsers (Edge, Brave, etc.).",
    cta: {
      label: "Get the Chrome Extension",
      url: CHROME_EXTENSION_URL,
    },
  },
  {
    id: "post",
    icon: Share2,
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10 border-purple-500/20",
    title: "Post to Facebook Marketplace",
    subtitle: "Use the extension to list vehicles in one click",
    bullets: [
      { icon: MousePointerClick, text: "Open Facebook Marketplace in Chrome" },
      { icon: Chrome, text: "Click the Pulse Post extension icon in your toolbar" },
      { icon: Share2, text: "Select a vehicle — the extension auto-fills the listing form" },
    ],
    tip: "Staff members you invite can post too. Track everyone's activity from the Admin panel.",
  },
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(profile?.onboarding_step || 1);
  const [loading, setLoading] = useState(false);

  // Step 2 — dealership verification
  const [bizName, setBizName] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  // Step 3 — tutorial slide index (0-based)
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (profile?.onboarding_complete) navigate("/");
    if (profile?.onboarding_step) setStep(profile.onboarding_step);
  }, [profile, navigate]);

  /* ── helpers ── */
  const saveStep = async (nextStep: number) => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_step: nextStep }).eq("user_id", user.id);
    setStep(nextStep);
    await refreshProfile();
  };

  const handleVerification = async () => {
    if (!bizName.trim() || !bizAddress.trim()) {
      toast.error("Business name and address are required");
      return;
    }
    if (!user) { toast.error("Not authenticated"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("setup_dealership", {
        _biz_name: bizName.trim(),
        _biz_address: bizAddress.trim(),
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Dealership registered!");
      await refreshProfile();
      setStep(3);
    } catch (e: any) {
      toast.error("Setup failed", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTutorial = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ onboarding_step: 4, onboarding_complete: true }).eq("user_id", user!.id);
    if (profile?.dealership_id) {
      await supabase.from("dealerships").update({ status: "active" }).eq("id", profile.dealership_id);
    }
    setLoading(false);
    toast.success("You're all set! Welcome to Pulse Post.");
    await refreshProfile();
    navigate("/billing");
  };

  const slide = tutorialSlides[slideIdx];
  const isLastSlide = slideIdx === tutorialSlides.length - 1;

  /* ── stepper config ── */
  const stepsMeta = [
    { num: 1, label: "Account Created" },
    { num: 2, label: "Verification" },
    { num: 3, label: "How It Works" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img src={pulseLogo} alt="Pulse Post" className="h-14" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Dealer Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            {step < 3 ? "Complete these steps to activate your account" : "Learn how Pulse Post works"}
          </p>
        </div>

        {/* ── Progress ── */}
        <div className="flex items-center justify-between px-4">
          {stepsMeta.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step > s.num ? "bg-primary border-primary text-primary-foreground" :
                  step === s.num ? "border-primary text-primary" :
                  "border-border text-muted-foreground"
                }`}>
                  {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className="hidden sm:block text-xs font-medium">{s.label}</span>
              </div>
              {i < stepsMeta.length - 1 && (
                <ChevronRight className="h-4 w-4 text-border mx-2 sm:mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* ── Step Content ── */}
        <div className="glass-card rounded-xl p-6">

          {/* Step 1 — Account Created */}
          {step === 1 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Account Created!</h2>
              <p className="text-sm text-muted-foreground">Your account is ready. Let's set up your dealership.</p>
              <button
                onClick={() => saveStep(2)}
                className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continue to Verification <ChevronRight className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          )}

          {/* Step 2 — Dealership Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Dealership Verification
              </h2>
              <p className="text-sm text-muted-foreground">Enter your business information for verification.</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Business Name</label>
                  <input
                    value={bizName}
                    onChange={e => setBizName(e.target.value)}
                    placeholder="Sunshine Motors"
                    className="w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Business Address
                  </label>
                  <input
                    value={bizAddress}
                    onChange={e => setBizAddress(e.target.value)}
                    placeholder="1234 Auto Blvd, Dallas, TX 75201"
                    className="w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <button
                onClick={handleVerification}
                disabled={loading}
                className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Submit & Continue
              </button>
            </div>
          )}

          {/* Step 3 — Tutorial Walkthrough */}
          {step === 3 && (
            <div className="space-y-5">
              {/* slide header */}
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${slide.accentBg} border flex items-center justify-center`}>
                  <slide.icon className={`h-5 w-5 ${slide.accent}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{slide.title}</h2>
                  <p className="text-xs text-muted-foreground">{slide.subtitle}</p>
                </div>
              </div>

              {/* slide progress dots */}
              <div className="flex items-center gap-1.5 justify-center">
                {tutorialSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slideIdx ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"
                    }`}
                  />
                ))}
              </div>

              {/* bullets */}
              <div className="space-y-3">
                {slide.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/40 border border-border p-3">
                    <div className="mt-0.5 h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <b.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* tip */}
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Tip: </span>{slide.tip}
              </div>

              {/* extension CTA */}
              {slide.cta && (
                <a
                  href={slide.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 text-sm font-medium transition-colors w-full"
                >
                  <Chrome className="h-4 w-4" />
                  {slide.cta.label}
                </a>
              )}

              {/* navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))}
                  disabled={slideIdx === 0}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                {isLastSlide ? (
                  <button
                    onClick={handleFinishTutorial}
                    disabled={loading}
                    className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Go to Billing & Activate
                  </button>
                ) : (
                  <button
                    onClick={() => setSlideIdx(slideIdx + 1)}
                    className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
