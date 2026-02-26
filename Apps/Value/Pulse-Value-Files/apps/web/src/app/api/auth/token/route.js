import { supabase } from '@/lib/supabase';

/**
 * POST /api/auth/token
 *
 * Exchanges an email + password (or a magic-link token) for a Supabase
 * access_token + refresh_token pair that the Landing page can relay to
 * this app via URL params on a redirect.
 *
 * Body (JSON):
 *   { email, password }          — password sign-in
 *   { token, type }               — email OTP / magic-link verification
 *
 * Response (JSON):
 *   { access_token, refresh_token, user }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    let session;
    let user;

    if (body.token && body.type) {
      // Magic-link / OTP flow
      const { data, error } = await supabase.auth.verifyOtp({
        token: body.token,
        type: body.type,
        email: body.email,
      });
      if (error) throw error;
      session = data.session;
      user = data.user;
    } else if (body.email && body.password) {
      // Password sign-in flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error) throw error;
      session = data.session;
      user = data.user;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
