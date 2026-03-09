import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

/**
 * /platform login — Dedicated super-admin login page.
 * Visually distinct from the dealer auth flow; authenticates
 * via Supabase email/password and checks is_super_admin.
 */
export default function PlatformLogin() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated as super admin, go straight to dashboard
  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) {
      navigate("/platform/dashboard", { replace: true });
    }
  }, [authLoading, user, isSuperAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }

      if (!data.user) {
        setError("Authentication failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Check if user is super admin via the RPC
      const { data: ctx, error: rpcErr } = await supabase.rpc("get_user_context", {
        _user_id: data.user.id,
      });

      if (rpcErr || !ctx?.is_super_admin) {
        setError("Access denied. This portal is restricted to platform administrators.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      // AuthContext will pick up the session and set isSuperAdmin.
      // Navigate happens via the useEffect above once state settles.
      // But to avoid any delay, navigate immediately:
      navigate("/platform/dashboard", { replace: true });
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while AuthContext initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-destructive/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={pulseLogo} alt="Pulse" className="h-10" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Shield className="h-5 w-5 text-destructive" />
              <span className="text-sm font-bold text-destructive uppercase tracking-widest">Platform</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted access — platform administrators only
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-xl p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive/50 transition-all"
                placeholder="admin@lotlyauto.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Access Platform
                </>
              )}
            </button>
          </form>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono uppercase tracking-wider">System Operational</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Pulse Platform v1.0 · Lotly Auto Inc.
        </p>
      </div>
    </div>
  );
}
