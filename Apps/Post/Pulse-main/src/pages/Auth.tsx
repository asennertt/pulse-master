import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, User, Loader2, Users } from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [mode, setMode] = useState<"login" | "signup">(inviteToken ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteDealership, setInviteDealership] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

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
        toast.error("This invite link is invalid or has expired");
      }
    })();
  }, [inviteToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Login failed", { description: error.message });
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    if (!agreedToTerms || !agreedToPrivacy) { toast.error("You must agree to the Terms of Service and Privacy Policy"); return; }
    setLoading(true);
    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });
    if (error) {
      setLoading(false);
      toast.error("Signup failed", { description: error.message });
      return;
    }

    // If invite token present and user has a session, accept the invite
    if (inviteToken && signupData.session) {
      try {
        const { data: result, error: invError } = await supabase.rpc("accept_invite", {
          _token: inviteToken,
        });
        if (invError) throw invError;
        if (result?.error) throw new Error(result.error);
        toast.success(`Joined ${result.dealership_name || "the dealership"}!`);
        navigate("/");
      } catch (e: any) {
        toast.error("Failed to accept invite", { description: e.message });
      }
    } else if (signupData.session) {
      // Email confirmation is disabled — user gets a session immediately
      toast.success("Account created! Welcome to Pulse.");
      navigate("/");
    } else {
      // Fallback: if for some reason email confirmation is re-enabled later
      toast.success("Check your email to verify your account!");
    }
    setLoading(false);
  };

  const inputCls = "w-full rounded-lg bg-secondary border border-border px-4 py-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card rounded-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img src={pulseLogo} alt="Pulse Posting" className="h-14" />
          </div>
          <p className="text-sm text-muted-foreground">
            {inviteToken
              ? "You've been invited to join a dealership"
              : mode === "login"
              ? "Sign in to your dashboard"
              : "Create your dealer account"}
          </p>
        </div>

        {/* Invite banner */}
        {inviteToken && inviteDealership && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground">
              Joining <strong>{inviteDealership}</strong> as a team member
            </span>
          </div>
        )}

        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className={inputCls} />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required className={inputCls} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6} className={inputCls} />
          </div>
          {mode === "signup" && (
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={e => setAgreedToPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </div>
          )}
          <button type="submit" disabled={loading || (mode === "signup" && (!agreedToTerms || !agreedToPrivacy))} className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <><LogIn className="h-4 w-4" /> Sign In</>
            ) : (
              <><UserPlus className="h-4 w-4" /> {inviteToken ? "Join Team" : "Create Account"}</>
            )}
          </button>
        </form>

        <div className="text-center">
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-xs text-primary hover:underline">
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
