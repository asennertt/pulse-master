import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
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

  // Splash screen state — only shown on fresh sign-in transitions
  const [showSplash, setShowSplash] = useState(false);
  const [splashUserName, setSplashUserName] = useState<string | undefined>(undefined);

  // Guard: tracks in-flight init promise to prevent duplicate RPC calls
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const initializedUserRef = useRef<string | null>(null);
  // Track whether a session existed at mount (page refresh = no splash)
  const hadSessionOnMountRef = useRef(false);

  const activeDealerId = impersonatingDealerId || profile?.dealership_id || null;

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // 1. Optimized Initialization using the Mega-RPC
  const initializeUserData = (userId: string): Promise<void> => {
    // If already initializing for this exact user, return the in-flight promise
    if (initPromiseRef.current && initializedUserRef.current === userId) {
      return initPromiseRef.current;
    }
    initializedUserRef.current = userId;

    const promise = (async () => {
      try {
        console.log("[AuthContext] calling get_user_context for", userId);
        const { data, error } = await supabase.rpc("get_user_context", {
          _user_id: userId,
        });

        console.log("[AuthContext] get_user_context result:", JSON.stringify(data), "error:", error);

        if (error) throw error;

        if (data) {
          setProfile(data.profile as unknown as Profile);
          setIsSuperAdmin(!!data.is_super_admin);
          setIsDealerAdmin(!!data.is_dealer_admin);
          console.log("[AuthContext] isDealerAdmin:", !!data.is_dealer_admin, "isSuperAdmin:", !!data.is_super_admin);
        }

        await checkSubscriptionForUser(userId);
      } catch (error) {
        console.error("Error initializing user data:", error);
      } finally {
        initPromiseRef.current = null;
      }
    })();

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
      console.error("Error checking subscription:", e);
    }
  };

  const checkSubscription = async () => {
    if (user?.id) {
      await checkSubscriptionForUser(user.id);
    }
  };

  const clearAuth = () => {
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
  };

  // 2. Auth State Listener — single path, no competing lock acquisitions
  useEffect(() => {
    // Check for cross-domain token relay from Landing page
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // Clean tokens from URL immediately (regardless of validity)
    if (accessToken || refreshToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete("access_token");
      url.searchParams.delete("refresh_token");
      window.history.replaceState({}, "", url.toString());
    }

    // Set up the auth state listener FIRST — this is the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("[AuthContext] onAuthStateChange:", event, currentSession?.user?.id);

        // Update state synchronously
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
          // Fully resolve profile + roles BEFORE setting loading=false
          await initializeUserData(currentSession.user.id);

          // Show splash only on a real sign-in, not on page refresh
          if (event === "SIGNED_IN" && !hadSessionOnMountRef.current) {
            const name = currentSession.user.user_metadata?.full_name as string | undefined;
            setSplashUserName(name);
            setShowSplash(true);
          }
        }

        if (event === "SIGNED_OUT") {
          clearAuth();
        }

        console.log("[AuthContext] setting loading=false after event:", event);
        setLoading(false);
      }
    );

    // Now handle the session initialization
    if (accessToken && refreshToken) {
      // Cross-domain handoff: set session from Landing page tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).catch((err) => {
        console.error("Token relay failed:", err);
        setLoading(false);
      });
    } else {
      // Normal boot: getSession triggers onAuthStateChange with INITIAL_SESSION
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        if (existingSession) {
          hadSessionOnMountRef.current = true;
        }
        if (!existingSession) {
          setLoading(false);
        }
        // If session exists, onAuthStateChange will fire and handle it
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  // 3. Subscription Polling
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
    refreshProfile: () => user ? initializeUserData(user.id) : Promise.resolve(),
    subscribed, subscriptionTier, subscriptionEnd, checkSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Splash overlay — shown on fresh sign-in, dismissed after 2.5s */}
      {showSplash && (
        <LoginSuccessSplash
          userName={splashUserName}
          onComplete={handleSplashComplete}
        />
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
}
