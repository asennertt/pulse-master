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
  loading: boolean;
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

// Detect whether this is a brand-new account (created within the last 30s)
function isNewAccount(user: User): boolean {
  if (!user.created_at) return false;
  const createdMs = new Date(user.created_at).getTime();
  return Date.now() - createdMs < 30_000;
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [splashVariant, setSplashVariant] = useState<'login' | 'signup'>('login');

  const hadSessionOnMount = useRef(false);
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
              const variant = isNewAccount(newSession.user) ? 'signup' : 'login';
              setSplashVariant(variant);
              setShowSplash(true);
              initialSessionChecked.current = true;
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));

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

    // ── Listen for subsequent auth state changes ────────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        clearAuth();
        return;
      }

      // Show splash on real sign-in/sign-up (not page refresh)
      if (
        event === 'SIGNED_IN' &&
        initialSessionChecked.current &&
        !hadSessionOnMount.current &&
        newSession?.user
      ) {
        const variant = isNewAccount(newSession.user) ? 'signup' : 'login';
        setSplashVariant(variant);
        setShowSplash(true);
      }
    });

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
      {showSplash && (
        <LoginSuccessSplash
          userName={userName}
          variant={splashVariant}
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
