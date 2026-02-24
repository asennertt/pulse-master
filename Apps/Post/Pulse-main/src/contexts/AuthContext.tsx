import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { getPlanByProductId, type PlanKey } from "@/lib/stripe-plans";

interface Profile {
  id: string;
  user_id: string;
  dealership_id: string | null;
  full_name: string;
  avatar_url: string;
  onboarding_step: number;
  onboarding_complete: boolean;
}

interface AuthState {
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

const AuthContext = createContext<AuthState | undefined>(undefined);

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

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as unknown as Profile);
  };

  const checkSuperAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "super_admin",
    });
    setIsSuperAdmin(!!data);
  };

  const checkDealerAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "dealer_admin",
    });
    setIsDealerAdmin(!!data);
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data.subscribed ?? false);
      setSubscriptionTier(data.product_id ? getPlanByProductId(data.product_id) : null);
      setSubscriptionEnd(data.subscription_end ?? null);
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkSuperAdmin(session.user.id);
            checkDealerAdmin(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsSuperAdmin(false);
          setIsDealerAdmin(false);
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkSuperAdmin(session.user.id);
        checkDealerAdmin(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when user is available
  useEffect(() => {
    if (user) {
      checkSubscription();
      const interval = setInterval(checkSubscription, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsSuperAdmin(false);
    setIsDealerAdmin(false);
    setImpersonatingDealerId(null);
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, isSuperAdmin, isDealerAdmin, loading,
      impersonatingDealerId, setImpersonatingDealerId,
      activeDealerId, signOut, refreshProfile,
      subscribed, subscriptionTier, subscriptionEnd, checkSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
