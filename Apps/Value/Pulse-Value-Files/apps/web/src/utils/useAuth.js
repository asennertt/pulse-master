import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useAuth — lightweight hook that returns the current Supabase session & user,
 * plus sign-in, sign-up, and sign-out helpers.
 *
 * Usage:
 *   const { user, session, loading, signOut, signInWithCredentials, signUpWithCredentials } = useAuth();
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

  const signOut = async (options = {}) => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    if (options.redirect !== false) {
      window.location.href = options.callbackUrl || '/';
    }
  };

  const signInWithCredentials = async ({ email, password, callbackUrl, redirect } = {}) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message === 'Invalid login credentials' ? 'CredentialsSignin' : error.message);
    }
    setSession(data.session);
    setUser(data.user);
    if (redirect !== false && callbackUrl) {
      window.location.href = callbackUrl;
    }
    return data;
  };

  const signUpWithCredentials = async ({ email, password, callbackUrl, redirect } = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message.includes('already registered') ? 'EmailCreateAccount' : error.message);
    }
    setSession(data.session);
    setUser(data.user);
    if (redirect !== false && callbackUrl) {
      window.location.href = callbackUrl;
    }
    return data;
  };

  return { session, user, loading, signOut, signInWithCredentials, signUpWithCredentials };
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

// Default export for pages that use: import useAuth from "@/utils/useAuth"
export default useAuth;
