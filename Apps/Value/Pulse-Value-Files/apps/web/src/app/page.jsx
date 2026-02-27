import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useSupabaseAuth } from '@/lib/supabase-auth-provider';

/**
 * Root page — redirects based on auth state.
 * If the user arrived with token params (from Landing), set the session first.
 * If authenticated, send them to the dashboard.
 * If not, redirect to the Landing page to sign in.
 */
export default function Page() {
  const { user, loading, supabase } = useSupabaseAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    // If we arrived with tokens from Landing, set the session
    if (accessToken && refreshToken && supabase) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => {
        // Clean the URL and go to dashboard
        navigate('/dashboard', { replace: true });
      }).catch((err) => {
        console.error('Failed to set session:', err);
        // Redirect to landing if session setup fails
        window.location.href = import.meta.env.VITE_PULSE_LANDING_URL || 'https://pulse.lotlyauto.com';
      });
      return;
    }

    if (loading) return;

    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      // Redirect to Landing page for authentication
      window.location.href = import.meta.env.VITE_PULSE_LANDING_URL || 'https://pulse.lotlyauto.com';
    }
  }, [user, loading, navigate, searchParams, supabase]);

  // Show loading spinner while checking auth
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontWeight: 700,
          fontStyle: 'italic',
          opacity: 0.7,
        }}>
          Loading Pulse Value...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
