import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/Contexts/AuthContext";
import { Loader2 } from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

/**
 * Auth page — thin redirect layer.
 *
 * If the user arrives with access_token + refresh_token query params
 * (from the Landing page cross-domain relay), AuthContext handles the
 * session hydration and navigates to /dashboard.
 *
 * If the user arrives with NO session and NO tokens, we redirect them
 * to the universal auth screen on the Landing page. Any invite tokens
 * or other params are forwarded.
 */
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    // If user is authenticated, AuthContext will trigger navigation to /dashboard.
    if (user) return;

    // No tokens in URL means the user navigated here directly — redirect to Landing auth
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken && !refreshToken) {
      const landingBase =
        import.meta.env.VITE_PULSE_LANDING_URL || "https://pulse.lotlyauto.com";

      // Build the Landing auth URL, forwarding mode=post plus any invite token
      const landingUrl = new URL(`${landingBase}/auth`);
      landingUrl.searchParams.set("mode", "post");

      // Forward invite token if present
      const invite = searchParams.get("invite");
      if (invite) landingUrl.searchParams.set("invite", invite);

      // Forward plan if present
      const plan = searchParams.get("plan");
      if (plan) landingUrl.searchParams.set("plan", plan);

      window.location.href = landingUrl.toString();
    }
    // If tokens ARE present, AuthContext.tsx will pick them up and hydrate the session.
  }, [authLoading, user, searchParams]);

  // Show a loading screen while AuthContext resolves the session
  // (either from tokens in URL or while redirecting to Landing)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src={pulseLogo} alt="Pulse" className="h-12 mx-auto animate-pulse" />
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            Loading Pulse Post\u2026
          </p>
        </div>
      </div>
    </div>
  );
}
