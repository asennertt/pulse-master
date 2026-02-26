import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useAuth — lightweight hook that returns the current Supabase session & user.
 *
 * Usage:
 *   const { user, session, loading, signOut } = useAuth();
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get the current session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return { session, user, loading, signOut };
}

/**
 * useRequireAuth — redirects to sign-in if the user is not authenticated.
 *
 * Usage (inside a protected route component):
 *   useRequireAuth('/account/signin');
 */
export function useRequireAuth(redirectTo = '/account/signin') {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo]);

  return { user, loading };
}
