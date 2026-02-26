/**
 * GET /api/auth/expo-web-success
 *
 * After a successful Supabase OAuth or magic-link sign-in on the web,
 * Supabase redirects here with the session tokens in the URL hash / query.
 * This route extracts the tokens and redirects the user to the app with
 * them embedded as query params so the SupabaseAuthProvider can call
 * supabase.auth.setSession() and establish a local session.
 *
 * This is the "token relay" endpoint for cross-domain auth.
 */
export async function GET(request) {
  const url = new URL(request.url);

  // Supabase puts tokens in the hash fragment on the client side,
  // but for server-side we read from query params (PKCE flow).
  const accessToken = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!accessToken || !refreshToken) {
    // If tokens aren’t in query params, redirect to root and let the
    // client-side SupabaseAuthProvider handle the hash fragment.
    return new Response(null, {
      status: 302,
      headers: { Location: '/' },
    });
  }

  // Relay the tokens to the target page as query params
  const redirectUrl = new URL(next, url.origin);
  redirectUrl.searchParams.set('access_token', accessToken);
  redirectUrl.searchParams.set('refresh_token', refreshToken);

  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl.toString() },
  });
}
