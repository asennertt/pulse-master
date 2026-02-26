import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Product Railway URLs — update these when you deploy each product.
const PRODUCT_URLS: Record<string, string> = {
  inventory: 'https://pulse-inventory.up.railway.app',
  value:     'https://pulse-value.up.railway.app',
  // add more products here as you deploy them
};

/**
 * Redirects the user to a product app after a successful sign-in.
 * Relays the Supabase session tokens via URL query params so the
 * target app can call supabase.auth.setSession() on arrival.
 */
async function redirectToProduct(product: string) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error('No active session — cannot redirect to product.');
    return;
  }

  const baseUrl = PRODUCT_URLS[product];
  if (!baseUrl) {
    console.error(`Unknown product: ${product}`);
    return;
  }

  const url = new URL('/', baseUrl);
  url.searchParams.set('access_token',  session.access_token);
  url.searchParams.set('refresh_token', session.refresh_token);

  window.location.href = url.toString();
}

type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const [mode, setMode]       = useState<AuthMode>('signin');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage('Check your email for a confirmation link.');
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        // After sign-in, redirect to the appropriate product.
        // Default to 'inventory' — update to match your post-login flow.
        await redirectToProduct('inventory');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {mode === 'signin' ? 'Sign in to Pulse' : 'Create your Pulse account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error   && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          {mode === 'signin' ? (
            <>
              Don’t have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-blue-400 hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="text-blue-400 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
