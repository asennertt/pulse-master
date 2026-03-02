import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import { LoginSuccessSplash } from './LoginSuccessSplash';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  /** True while the initial session check is in flight OR while the splash is visible */
  loading: boolean;
  /** True while the login-success splash is showing */
  showSplash: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  showSplash: false,
  signOut: async () => {},
});

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  // Track whether a session already existed when the provider first mounted.
  // If a session is present from the very first getSession() / onAuthStateChange
  // call we treat it as a "page refresh" and skip the splash. Only a transition
  // from null → session warrants the splash.
  const initialSessionChecked = useRef(false);
  const hadSessionOnMount = useRef(false);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    // ── Cross-domain token relay (Landing → Value via query string) ──────────
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data: { session: newSession } }) => {
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              // Clean the URL
              const url = new URL(window.location.href);
              url.searchParams.delete('access_token');
              url.searchParams.delete('refresh_token');
              window.history.replaceState({}, '', url.toString());

              // This is always a fresh login transition — show the splash.
              // Keep loading=true so children don't render until splash is done.
              setShowSplash(true);
              initialSessionChecked.current = true;
              hadSessionOnMount.current = false;
            } else {
              setLoading(false);
            }
          })
          .catch(() => setLoading(false));
        return;
      }
    }

    // ── Normal session check ─────────────────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      initialSessionChecked.current = true;

      if (existingSession) {
        // Session already present on mount → page refresh, no splash.
        hadSessionOnMount.current = true;
        setLoading(false);
      } else {
        // No session yet; keep loading=false so the auth page can render.
        setLoading(false);
      }
    });

    // ── Listen for subsequent auth state changes (sign-in / sign-out) ────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const wasSignedOut = !session && !hadSessionOnMount.current;
      const isNowSignedIn = !!newSession;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Only trigger splash if this is a real sign-in transition, not the
      // initial hydration event that fires immediately after getSession().
      if (initialSessionChecked.current && wasSignedOut && isNowSignedIn) {
        setShowSplash(true);
        // Keep loading=true so children are gated behind the splash.
        setLoading(true);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    hadSessionOnMount.current = false;
  };

  const userName = user?.user_metadata?.full_name as string | undefined;

  return (
    <AuthContext.Provider value={{ user, session, loading, showSplash, signOut }}>
      {/* Splash sits above children but still provides them via context */}
      {showSplash && (
        <LoginSuccessSplash
          userName={userName}
          onComplete={handleSplashComplete}
        />
      )}
      {/*
        Render children regardless — the splash is a fixed overlay.
        Pages that need to gate rendering can check `loading` or `showSplash`
        from context. This keeps routing / layout trees alive underneath.
      */}
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  return useContext(AuthContext);
}
