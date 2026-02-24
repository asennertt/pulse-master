import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Building2, MapPin, Upload, Link2, Facebook, CheckCircle2,
  ChevronRight, Loader2,
} from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(profile?.onboarding_step || 1);
  const [loading, setLoading] = useState(false);

  // Step 2 state
  const [bizName, setBizName] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  // Step 3 state
  const [logoUrl, setLogoUrl] = useState("");
  const [dmsConnected, setDmsConnected] = useState(false);
  const [fbToken, setFbToken] = useState("");

  useEffect(() => {
    if (profile?.onboarding_complete) navigate("/");
    if (profile?.onboarding_step) setStep(profile.onboarding_step);
  }, [profile, navigate]);

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
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-dealership", {
        body: { bizName: bizName.trim(), bizAddress: bizAddress.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLoading(false);
      toast.success("Dealership registered!");
      await refreshProfile();
      setStep(3);
    } catch (e: any) {
      setLoading(false);
      toast.error("Setup failed", { description: e.message });
    }
  };

  const handleChecklist = async () => {
    setLoading(true);
    // Mark onboarding as complete — no admin approval needed
    await supabase.from("profiles").update({ onboarding_step: 4, onboarding_complete: true }).eq("user_id", user!.id);
    // Also activate the dealership
    if (profile?.dealership_id) {
      await supabase.from("dealerships").update({ status: "active" }).eq("id", profile.dealership_id);
    }
    setLoading(false);
    toast.success("You're all set! Welcome to Pulse: Post.");
    await refreshProfile();
    navigate("/");
  };

  const steps = [
    { num: 1, label: "Account Created", icon: CheckCircle2 },
    { num: 2, label: "Verification", icon: Building2 },
    { num: 3, label: "Setup Checklist", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img src={pulseLogo} alt="Pulse Posting" className="h-14" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Dealer Onboarding</h1>
          <p className="text-sm text-muted-foreground">Complete these steps to activate your account</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between px-4">
          {steps.map((s, i) => (
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
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-border mx-2 sm:mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-xl p-6">
          {step === 1 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Account Created!</h2>
              <p className="text-sm text-muted-foreground">Your account is ready. Let's set up your dealership.</p>
              <button onClick={() => saveStep(2)} className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
                Continue to Verification <ChevronRight className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Dealership Verification
              </h2>
              <p className="text-sm text-muted-foreground">Enter your business information for verification.</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Business Name</label>
                  <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Sunshine Motors" className="w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Business Address</label>
                  <input value={bizAddress} onChange={e => setBizAddress(e.target.value)} placeholder="1234 Auto Blvd, Dallas, TX 75201" className="w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <button onClick={handleVerification} disabled={loading} className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Submit & Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Setup Checklist
              </h2>
              <p className="text-sm text-muted-foreground">Complete these items to get the most out of Pulse: Post.</p>
              <div className="space-y-3">
                <div className="rounded-md bg-secondary/60 border border-border p-4 flex items-center gap-3">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Upload Logo</div>
                    <div className="text-xs text-muted-foreground">Used on AI-generated image overlays</div>
                    <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="mt-2 w-full rounded-md bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  {logoUrl ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
                </div>
                <div className="rounded-md bg-secondary/60 border border-border p-4 flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Connect DMS Feed</div>
                    <div className="text-xs text-muted-foreground">Link your Dealer Management System for auto-ingestion</div>
                  </div>
                  <button onClick={() => { setDmsConnected(true); toast.success("DMS connected (simulated)"); }} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${dmsConnected ? "bg-success/10 text-success border border-success/20" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"}`}>
                    {dmsConnected ? "Connected" : "Connect"}
                  </button>
                </div>
                <div className="rounded-md bg-secondary/60 border border-border p-4 flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Add Facebook Token</div>
                    <div className="text-xs text-muted-foreground">Required for automated posting to Marketplace</div>
                    <input value={fbToken} onChange={e => setFbToken(e.target.value)} placeholder="Paste your page access token" className="mt-2 w-full rounded-md bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  {fbToken ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
                </div>
              </div>
              <button onClick={handleChecklist} disabled={loading} className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                Complete Setup
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
