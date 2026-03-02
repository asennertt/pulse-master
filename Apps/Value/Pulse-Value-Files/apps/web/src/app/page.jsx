import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSupabaseAuth } from '@/lib/supabase-auth-provider';

/**
 * Root page — redirects based on auth state.
 * The SupabaseAuthProvider in root.tsx already handles token relay
 * from the Landing page (access_token/refresh_token in URL params).
 * This page just checks if the user is authenticated and redirects.
 */
export default function Page() {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      // Redirect to Landing page auth with mode=value so it redirects back after login
      const landingBase = import.meta.env.NEXT_PUBLIC_PULSE_LANDING_URL || 'https://pulse.lotlyauto.com';
      window.location.href = `${landingBase}/auth?mode=value`;
    }
  }, [user, loading, navigate]);

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
