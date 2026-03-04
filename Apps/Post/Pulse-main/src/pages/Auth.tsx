import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/Contexts/AuthContext";
import { Loader2 } from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

/**
 * Auth page — thin redirect layer.
 *
 * If the user arrives with access_token + refresh_token query params
 * (from the Landing page cross-domain relay), AuthContext handles the
 * session hydration. Once the user + profile are available we redirect
 * to the appropriate destination:
 *   - New users (onboarding incomplete) → /onboarding
 *   - Existing users                   → /dashboard
 *
 * If the user arrives with NO session and NO tokens, we redirect them
 * to the universal auth screen on the Landing page.
 */
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    // ✅ User is authenticated → route based on onboarding status
    if (user) {
      if (profile && !profile.onboarding_complete) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
      return;
    }

    // No tokens in URL means the user navigated here directly — redirect to Landing auth
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken && !refreshToken) {
      const landingBase =
        import.meta.env.VITE_PULSE_LANDING_URL || "https://pulse.lotlyauto.com";

      // Build the Landing auth URL, forwarding mode=post plus any invite token
      const landingUrl = new URL(`${landingBase}/auth`);
      landingUrl.searchParams.set("mode", "post");

      // Forward invite token if present (invite = signup flow)
      const invite = searchParams.get("invite");
      if (invite) {
        landingUrl.searchParams.set("invite", invite);
      } else {
        // No invite means returning user — show login by default
        landingUrl.searchParams.set("view", "login");
      }

      // Forward plan if present
      const plan = searchParams.get("plan");
      if (plan) landingUrl.searchParams.set("plan", plan);

      window.location.href = landingUrl.toString();
    }
    // If tokens ARE present, AuthContext.tsx will pick them up and hydrate the session.
  }, [authLoading, user, searchParams, navigate]);

  // Show a loading screen while AuthContext resolves the session
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src={pulseLogo} alt="Pulse" className="h-12 mx-auto animate-pulse" />
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            Loading Pulse Post…
          </p>
        </div>
      </div>
    </div>
  );
}
