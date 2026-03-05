import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoginSuccessSplash from "@/components/LoginSuccessSplash";

// ---------- Types ----------
interface Profile {
  id: string;
  dealership_id: string | null;
  full_name: string | null;
  [key: string]: unknown;
}

type PlanKey = string;

function getPlanByProductId(productId: string): PlanKey | null {
  return productId ?? null;
}

// Detect whether this is a brand-new account (created within the last 30s)
function isNewAccount(user: User): boolean {
  if (!user.created_at) return false;
  const createdMs = new Date(user.created_at).getTime();
  return Date.now() - createdMs < 30_000;
}

// ---------- Context ----------
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isSuperAdmin: boolean;
  isDealerAdmin: boolean;
  loading: boolean;
  impersonatingDealerId: string | null;
  setImpersonatingDealerId: (id: string | null) => void;
  activeDealerId: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  subscribed: boolean;
  subscriptionTier: PlanKey | null;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ---------- Provider ----------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isDealerAdmin, setIsDealerAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [impersonatingDealerId, setImpersonatingDealerId] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<PlanKey | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  // Splash screen state
  const [showSplash, setShowSplash] = useState(false);
  const [splashUserName, setSplashUserName] = useState<string | undefined>(undefined);
  const [splashVariant, setSplashVariant] = useState<"login" | "signup">("login");

  // Guard: tracks in-flight init promise to prevent duplicate RPC calls
  const initPromiseRef = useRef<Promise<boolean> | null>(null);
  const initializedUserRef = useRef<string | null>(null);
  // Track whether a session existed at mount (page refresh = no splash)
  const hadSessionOnMountRef = useRef(false);
  // Track whether we're in the middle of a token relay (prevents stale session race)
  const tokenRelayInProgressRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  const activeDealerId = impersonatingDealerId || profile?.dealership_id || null;

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    // Navigate after splash completes — route based on onboarding status
    const dest = profile && !profile.onboarding_complete ? "/onboarding" : "/dashboard";
    if (location.pathname !== dest) {
      navigate(dest, { replace: true });
    }
  }, [navigate, location.pathname, profile]);

  const clearAuth = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsSuperAdmin(false);
    setIsDealerAdmin(false);
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
    setImpersonatingDealerId(null);
    setShowSplash(false);
    initializedUserRef.current = null;
    initPromiseRef.current = null;
  }, []);

  // Force sign-out: clears stale/invalid session so the user sees the login form
  const forceSignOut = useCallback(async () => {
    console.warn("[AuthContext] Forcing sign-out due to invalid session or missing profile.");
    try {
      await supabase.auth.signOut();
    } catch {
      // signOut can fail if the session is already invalid — that's fine
    }
    clearAuth();
    setLoading(false);
  }, [clearAuth]);

  // Returns true if initialization succeeded, false if the session is bad
  const initializeUserData = (userId: string): Promise<boolean> => {
    if (initPromiseRef.current && initializedUserRef.current === userId) {
      return initPromiseRef.current;
    }
    initializedUserRef.current = userId;

    const promise = (async (): Promise<boolean> => {
      // Retry logic: the handle_new_user trigger may not have finished yet
      const MAX_RETRIES = 4;
      const RETRY_DELAY_MS = 800;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { data, error } = await supabase.rpc("get_user_context", {
            _user_id: userId,
          });

          if (error) throw error;

          if (data?.error) {
            console.error("[AuthContext] get_user_context returned error:", data.error);
            return false;
          }

          if (!data?.profile) {
            if (attempt < MAX_RETRIES) {
              console.log(`[AuthContext] Profile not ready (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
              await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
              continue;
            }
            console.warn("[AuthContext] No profile found after retries — session may be stale.");
            return false;
          }

          setProfile(data.profile as unknown as Profile);
          setIsSuperAdmin(!!data.is_super_admin);
          setIsDealerAdmin(!!data.is_dealer_admin);

          await checkSubscriptionForUser(userId);
          return true;
        } catch (error) {
          console.error("[AuthContext] Error initializing user data:", error);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            continue;
          }
          return false;
        }
      }
      return false;
    })().finally(() => {
      initPromiseRef.current = null;
    });

    initPromiseRef.current = promise;
    return promise;
  };

  const checkSubscriptionForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("check_subscription", {
        _user_id: userId,
      });
      if (error) throw error;
      setSubscribed(data?.subscribed ?? false);
      setSubscriptionTier(data?.product_id ? getPlanByProductId(data.product_id) : null);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (e) {
      console.error("[AuthContext] Error checking subscription:", e);
    }
  };

  const checkSubscription = async () => {
    if (user?.id) {
      await checkSubscriptionForUser(user.id);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // If we have relay tokens, mark that we're in the middle of a token relay.
    // This prevents the INITIAL_SESSION handler from force-signing-out a stale
    // session before setSession() has a chance to replace it.
    if (accessToken && refreshToken) {
      tokenRelayInProgressRef.current = true;

      // Strip tokens from the URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete("access_token");
      url.searchParams.delete("refresh_token");
      window.history.replaceState({}, "", url.toString());
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // If we're relaying tokens and the INITIAL_SESSION fires with a stale session,
        // skip it — setSession() is about to replace it.
        if (tokenRelayInProgressRef.current && event === "INITIAL_SESSION") {
          console.log("[AuthContext] Skipping INITIAL_SESSION during token relay.");
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
          const success = await initializeUserData(currentSession.user.id);

          if (!success) {
            // Don't force sign-out during token relay — setSession hasn't fired yet
            if (!tokenRelayInProgressRef.current) {
              await forceSignOut();
            }
            return;
          }

          // Show splash only on a real sign-in/sign-up, not on page refresh
          if (event === "SIGNED_IN" && !hadSessionOnMountRef.current) {
            const name = currentSession.user.user_metadata?.full_name as string | undefined;
            const variant = isNewAccount(currentSession.user) ? "signup" : "login";
            setSplashUserName(name);
            setSplashVariant(variant);
            setShowSplash(true);
          }

          // Clear the token relay flag — we're done
          tokenRelayInProgressRef.current = false;
        }

        if (event === "SIGNED_OUT") {
          clearAuth();
        }

        setLoading(false);
      }
    );

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => {
        tokenRelayInProgressRef.current = false;
      }).catch((err) => {
        console.error("[AuthContext] Token relay failed:", err);
        tokenRelayInProgressRef.current = false;
        setLoading(false);
      });
    } else {
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        if (existingSession) {
          hadSessionOnMountRef.current = true;
        }
        if (!existingSession) {
          setLoading(false);
        }
      });
    }

    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn("[AuthContext] Safety timeout: forcing loading=false after 12s");
          return false;
        }
        return current;
      });
    }, 12000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      interval = setInterval(() => checkSubscriptionForUser(user.id), 60000);
    }
    return () => clearInterval(interval);
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  const value: AuthContextType = {
    user, session, profile, isSuperAdmin, isDealerAdmin, loading,
    impersonatingDealerId, setImpersonatingDealerId,
    activeDealerId, signOut,
    refreshProfile: () => user ? initializeUserData(user.id).then(() => {}) : Promise.resolve(),
    subscribed, subscriptionTier, subscriptionEnd, checkSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {showSplash && (
        <LoginSuccessSplash
          userName={splashUserName}
          variant={splashVariant}
          onComplete={handleSplashComplete}
        />
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
}
