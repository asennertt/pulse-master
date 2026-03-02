import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------
interface Profile {
  id: string;
  dealership_id: string | null;
  full_name: string | null;
  [key: string]: unknown;
}

type PlanKey = string;

function getPlanByProductId(productId: string): PlanKey | null {
  // Map Stripe product IDs to plan keys if needed
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

  // Guard against double-initialization from competing auth paths
  const initializingRef = useRef(false);
  const initializedUserRef = useRef<string | null>(null);

  const activeDealerId = impersonatingDealerId || profile?.dealership_id || null;

  // 1. Optimized Initialization using the Mega-RPC
  const initializeUserData = async (userId: string) => {
    // Prevent duplicate concurrent calls for the same user
    if (initializingRef.current && initializedUserRef.current === userId) {
      return;
    }
    initializingRef.current = true;
    initializedUserRef.current = userId;

    try {
      const { data, error } = await supabase.rpc("get_user_context", {
        _user_id: userId,
      });

      if (error) throw error;

      if (data) {
        setProfile(data.profile as unknown as Profile);
        setIsSuperAdmin(!!data.is_super_admin);
        setIsDealerAdmin(!!data.is_dealer_admin);
      }

      await checkSubscriptionForUser(userId);
    } catch (error) {
      console.error("Error initializing user data:", error);
    } finally {
      initializingRef.current = false;
    }
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
    initializedUserRef.current = null;
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
        // Update state synchronously
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
          await initializeUserData(currentSession.user.id);
        }

        if (event === "SIGNED_OUT") {
          clearAuth();
        }

        setLoading(false);
      }
    );

    // Now handle the session initialization
    if (accessToken && refreshToken) {
      // Cross-domain handoff: set session from Landing page tokens
      // This will trigger onAuthStateChange with SIGNED_IN, which handles everything
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).catch((err) => {
        console.error("Token relay failed:", err);
        setLoading(false);
      });
    } else {
      // Normal boot: getSession triggers onAuthStateChange with INITIAL_SESSION
      // If no session exists, we need to stop loading
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
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
      {!loading && children}
    </AuthContext.Provider>
  );
}
