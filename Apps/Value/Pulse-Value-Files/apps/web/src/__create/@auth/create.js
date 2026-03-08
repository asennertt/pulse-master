/**
 * Supabase Auth stub for @auth/create compatibility layer.
 *
 * This file exists so that any legacy imports of `@auth/create` continue
 * to resolve. All auth logic has been migrated to Supabase; this module
 * simply re-exports the Supabase client and a no-op for backwards compat.
 */
import { supabase } from '@/lib/supabase';

export { supabase };

/** @deprecated Use `supabase.auth` directly instead */
export const auth = supabase.auth;

/** @deprecated No-op kept for backwards compatibility */
export function createAuth() {
  console.warn('[create-auth] createAuth() is deprecated. Use Supabase auth directly.');
  return supabase.auth;
}
