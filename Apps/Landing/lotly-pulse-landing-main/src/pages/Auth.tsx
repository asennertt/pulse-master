import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import BundleWelcomeSplash from "@/components/BundleWelcomeSplash";

// Branding Imports
import pulseHeroLogo from "@/assets/pulse-hero-logo.png";
import pulsePostLogo from "@/assets/pulse-post-logo.png";
import pulseValueLogo from "@/assets/pulse-value-logo.png";

/**
 * Product URLs.
 * Pull from env vars set in Cloudflare Pages / Railway.
 */
const PRODUCT_URLS: Record<string, string> = {
  post: import.meta.env.VITE_PULSE_POST_URL || "https://post.pulse.lotlyauto.com",
  value: import.meta.env.VITE_PULSE_VALUE_URL || "https://value.pulse.lotlyauto.com",
};

/**
 * Redirects an authenticated user to the correct product app,
 * passing Supabase tokens via URL for cross-domain session handoff.
 *
 * Accepts an optional session parameter — when called from inside
 * onAuthStateChange, pass the session directly to avoid the race
 * condition where getSession() returns stale/null data.
 */
const redirectToProduct = async (
  product: "post" | "value",
  existingSession?: { access_token: string; refresh_token: string } | null
) => {
  const targetUrl = PRODUCT_URLS[product];
  if (!targetUrl) return false;

  // Use the provided session, or fall back to fetching (for the getSession path)
  let session = existingSession;
  if (!session) {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  }
  if (!session) return false;

  const url = new URL(targetUrl);
  url.searchParams.set("access_token", session.access_token);
  url.searchParams.set("refresh_token", session.refresh_token);
  window.location.href = url.toString();
  return true;
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // URL Parameters
  const selectedPlan = searchParams.get("plan");
  const mode = searchParams.get("mode"); // 'post', 'value', or 'both'
  const inviteToken = searchParams.get("invite");
  const view = searchParams.get("view"); // 'login' or 'signup'

  const isBundle = mode === "both";

  // Default: signup if coming from landing (no mode), login if coming from Post/Value
  const [isSignUp, setIsSignUp] = useState(
    inviteToken ? true : view === "login" ? false : view === "signup" ? true : !mode
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dealershipName, setDealershipName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [inviteDealership, setInviteDealership] = useState<string | null>(null);

  // Bundle splash state
  const [showBundleSplash, setShowBundleSplash] = useState(false);
  const [bundleUserName, setBundleUserName] = useState<string | undefined>(undefined);

  // Track whether the current auth event was triggered by *this* page's signup/login
  const authTriggeredByForm = useRef(false);

  // If there's an invite token, force signup mode
  useEffect(() => {
    if (inviteToken) setIsSignUp(true);
  }, [inviteToken]);

  // Validate invite token on mount
  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      const { data } = await supabase
        .from("invitation_links")
        .select("dealership_name, expires_at, used_at")
        .eq("token", inviteToken)
        .single();
      if (data && !data.used_at && new Date(data.expires_at) > new Date()) {
        setInviteDealership(data.dealership_name);
      } else {
        toast({
          title: "Invalid Invite",
          description: "This invite link is invalid or has expired.",
          variant: "destructive",
        });
      }
    })();
  }, [inviteToken]);

  // Dynamic Logo Logic
  const getTerminalLogo = () => {
    if (mode === "post") return pulsePostLogo;
    if (mode === "value") return pulseValueLogo;
    return pulseHeroLogo;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Bundle users: show the product-chooser splash instead of auto-redirecting
          if (isBundle && authTriggeredByForm.current) {
            const name = session.user?.user_metadata?.full_name as string | undefined;
            setBundleUserName(name);
            setShowBundleSplash(true);
            authTriggeredByForm.current = false;
            return;
          }

          // Non-bundle or already-signed-in: redirect directly
          // Pass session directly to avoid getSession() race condition
          const targetProduct = isBundle ? "post" : (mode as "post" | "value");
          if (targetProduct) {
            const redirected = await redirectToProduct(targetProduct, session);
            if (!redirected) {
              navigate("/");
            }
          } else {
            navigate("/");
          }
        }
      }
    );

    // Check if already signed in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // If the user is already signed in and this is a bundle page, show the splash
        if (isBundle) {
          const name = session.user?.user_metadata?.full_name as string | undefined;
          setBundleUserName(name);
          setShowBundleSplash(true);
          return;
        }

        const targetProduct = mode as "post" | "value" | null;
        if (targetProduct) {
          const redirected = await redirectToProduct(targetProduct);
          if (!redirected) {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode, isBundle]);

  const handleBundleProductSelect = async (product: "post" | "value") => {
    await redirectToProduct(product);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && (!agreedToTerms || !agreedToPrivacy)) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    authTriggeredByForm.current = true;

    try {
      if (isSignUp) {
        const { data: signupData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              dealership_name: dealershipName,
              selected_plan: selectedPlan || mode || "post",
              terminal_mode: mode,
            },
          },
        });
        if (error) throw error;

        // If invite token present and user got a session, accept the invite
        if (inviteToken && signupData.session) {
          try {
            const { data: result, error: invError } = await supabase.rpc("accept_invite", {
              _token: inviteToken,
            });
            if (invError) throw invError;
            if (result?.error) throw new Error(result.error);
            toast({
              title: "Team Joined",
              description: `Welcome to ${result.dealership_name || "the dealership"}!`,
            });
          } catch (inviteErr: any) {
            toast({
              title: "Invite Error",
              description: inviteErr.message,
              variant: "destructive",
            });
          }
        } else if (signupData.session) {
          toast({
            title: "Account Created",
            description: "Welcome to Pulse!",
          });
        } else {
          toast({
            title: "Check Your Email",
            description: "We sent a verification link to confirm your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      authTriggeredByForm.current = false;
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Bundle splash overlay ──────────────────────────────────────────────────
  if (showBundleSplash) {
    return (
      <BundleWelcomeSplash
        userName={bundleUserName}
        onSelectProduct={handleBundleProductSelect}
      />
    );
  }

  // ── Normal auth form ───────────────────────────────────────────────────────
  const subtitle = inviteToken
    ? "You've been invited to join a dealership"
    : isSignUp
    ? "Secure your automotive intelligence suite."
    : "Enter your terminal credentials.";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <a href="/" className="inline-block transition-transform hover:scale-105">
            <img
              src={getTerminalLogo()}
              alt="Pulse Terminal"
              className={`h-12 mx-auto mb-6 brightness-0 invert ${mode ? 'animate-pulse' : ''}`}
            />
          </a>

          <div className="flex flex-col items-center gap-2">
            {mode && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] font-bold border-primary/30 text-primary">
                {mode === "both" ? "BUNDLE" : mode} TERMINAL ACTIVE
              </Badge>
            )}
            {selectedPlan && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-widest font-bold">
                PLAN: {selectedPlan}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mt-6 mb-1 italic uppercase tracking-tighter">
            {isSignUp ? "Initialize Enrollment" : "Dealer Access"}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {subtitle}
          </p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8">
            {/* Invite banner */}
            {inviteToken && inviteDealership && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-2 text-sm mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-foreground text-xs">
                  Joining <strong>{inviteDealership}</strong> as a team member
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter Full Name"
                      className="bg-background/50 border-primary/10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  {/* Only show dealership field if NOT joining via invite */}
                  {!inviteToken && (
                    <div className="space-y-1.5">
                      <Label htmlFor="dealership" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Dealership Name</Label>
                      <Input
                        id="dealership"
                        placeholder="Enter Dealership"
                        className="bg-background/50 border-primary/10"
                        value={dealershipName}
                        onChange={(e) => setDealershipName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@dealership.com"
                  className="bg-background/50 border-primary/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" title="Minimum 6 characters" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Secure Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-background/50 border-primary/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Terms & Privacy — only on signup */}
              {isSignUp && (
                <div className="space-y-3 mt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wider">
                      I agree to the{" "}
                      <a href="https://post.pulse.lotlyauto.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wider">
                      I agree to the{" "}
                      <a href="https://post.pulse.lotlyauto.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-4 font-bold italic uppercase tracking-widest"
                size="lg"
                disabled={loading || (isSignUp && (!agreedToTerms || !agreedToPrivacy))}
              >
                {loading
                  ? "AUTHENTICATING..."
                  : isSignUp
                  ? inviteToken
                    ? "Join Team"
                    : "Create Terminal Access"
                  : "Secure Login"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp
                  ? "Already Enrolled? Access Portal"
                  : "Need Enrollment? Initialize Here"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
