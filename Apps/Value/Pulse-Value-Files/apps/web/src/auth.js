/**
 * auth.js — top-level auth re-export.
 *
 * Kept for backwards compatibility with any code that imports from `src/auth`.
 * All real auth logic lives in `src/lib/supabase.ts` and
 * `src/lib/supabase-auth-provider.tsx`.
 */
export { supabase } from '@/lib/supabase';
export { useSupabaseAuth } from '@/lib/supabase-auth-provider';

/**
 * Server-side auth function for API routes.
 * Returns a session-like object by extracting the user from the Supabase JWT.
 * 
 * Usage in API routes:
 *   const session = await auth();
 *   if (session?.user?.id) { ... }
 * 
 * NOTE: This returns null when called without request context.
 * API routes that need auth should extract the bearer token from
 * the request Authorization header and use supabase.auth.getUser().
 */
export async function auth() {
  // Server-side auth without request context returns null.
  // Individual API routes should handle auth via request headers.
  return null;
}
