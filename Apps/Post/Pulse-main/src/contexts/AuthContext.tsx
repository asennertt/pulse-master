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
      // Single database hit for all user context
      const { data, error } = await supabase.rpc("get_user_context", {
        _user_id: userId,
      });

      if (error) throw error;

      if (data) {
        setProfile(data.profile as unknown as Profile);
        setIsSuperAdmin(!!data.is_super_admin);
        setIsDealerAdmin(!!data.is_dealer_admin);
      }

      // Check subscription (Edge Function call)
      await checkSubscription();
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
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

  // 2. Auth State Listener
  useEffect(() => {
    // Check initial session once
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        initializeUserData(initialSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

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

  const value = {
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