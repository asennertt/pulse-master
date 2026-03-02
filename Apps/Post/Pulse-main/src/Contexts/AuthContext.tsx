import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  const activeDealerId = impersonatingDealerId || profile?.dealership_id || null;

  // 1. Optimized Initialization using the Mega-RPC
  const initializeUserData = async (userId: string) => {
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

      await checkSubscription();
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  };

  const checkSubscription = async () => {
    try {
      // Use RPC function (stub returns subscribed: false until Stripe is integrated)
      const { data, error } = await supabase.rpc("check_subscription", {
        _user_id: user?.id ?? null,
      });
      if (error) throw error;
      setSubscribed(data?.subscribed ?? false);
      setSubscriptionTier(data?.product_id ? getPlanByProductId(data.product_id) : null);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (e) {
      console.error("Error checking subscription:", e);
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
  };

  // 2. Auth State Listener (with cross-domain token relay from Landing page)
  useEffect(() => {
    // Check for token relay from Landing page (access_token/refresh_token in URL params)
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // Cross-domain handoff: set session from Landing page tokens
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data: { session: relayedSession } }) => {
          if (relayedSession) {
            setSession(relayedSession);
            setUser(relayedSession.user);
            // Clean the URL so tokens aren't visible/bookmarkable
            const url = new URL(window.location.href);
            url.searchParams.delete('access_token');
            url.searchParams.delete('refresh_token');
            window.history.replaceState({}, '', url.toString());
            initializeUserData(relayedSession.user.id).finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    } else {
      // Normal session check (no relay tokens)
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          initializeUserData(initialSession.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (currentSession?.user) {
            await initializeUserData(currentSession.user.id);
          }
        }

        if (event === 'SIGNED_OUT') {
          clearAuth();
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 3. Subscription Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      interval = setInterval(checkSubscription, 60000);
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
