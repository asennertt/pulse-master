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
  /** True while the initial session check is in flight */
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
  const hadSessionOnMount = useRef(false);
  // Track whether the initial session check has completed.
  const initialSessionChecked = useRef(false);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setSession(null);
    setShowSplash(false);
    hadSessionOnMount.current = false;
  }, []);

  useEffect(() => {
    // ── Cross-domain token relay (Landing → Value via query string) ──────────
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        // Clean the URL immediately
        const url = new URL(window.location.href);
        url.searchParams.delete('access_token');
        url.searchParams.delete('refresh_token');
        window.history.replaceState({}, '', url.toString());

        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data: { session: newSession } }) => {
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              // Fresh login via relay — show splash
              setShowSplash(true);
              initialSessionChecked.current = true;
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
        // Don't set up getSession below — we're handling it here
        // But still set up the auth state listener

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === 'SIGNED_OUT') {
            clearAuth();
          } else if (newSession) {
            setSession(newSession);
            setUser(newSession.user ?? null);
          }
        });

        // Safety net
        const safetyTimeout = setTimeout(() => {
          setLoading((current) => {
            if (current) {
              console.warn('[AuthProvider] Safety timeout: forcing loading=false after 8s');
              return false;
            }
            return current;
          });
        }, 8000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(safetyTimeout);
        };
      }
    }

    // ── Normal session check ─────────────────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      initialSessionChecked.current = true;

      if (existingSession) {
        hadSessionOnMount.current = true;
      }
      setLoading(false);
    });

    // ── Listen for subsequent auth state changes (sign-in / sign-out) ────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthProvider] onAuthStateChange:', event, newSession?.user?.id);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        clearAuth();
        return;
      }

      // Show splash on real sign-in transitions (not page refresh hydration)
      // This covers both sign-in and account creation (both fire SIGNED_IN)
      if (
        event === 'SIGNED_IN' &&
        initialSessionChecked.current &&
        !hadSessionOnMount.current
      ) {
        setShowSplash(true);
      }
    });

    // Safety net: never leave the user on a blank screen
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('[AuthProvider] Safety timeout: forcing loading=false after 8s');
          return false;
        }
        return current;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  const userName = user?.user_metadata?.full_name as string | undefined;

  return (
    <AuthContext.Provider value={{ user, session, loading, showSplash, signOut }}>
      {/* Splash overlay — shown on fresh sign-in / sign-up, dismissed after 2.5s */}
      {showSplash && (
        <LoginSuccessSplash
          userName={userName}
          onComplete={handleSplashComplete}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  return useContext(AuthContext);
}
