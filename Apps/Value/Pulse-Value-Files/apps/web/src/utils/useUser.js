import { useSupabaseAuth } from '@/lib/supabase-auth-provider';

/**
 * useUser — convenience hook that returns just the user object.
 *
 * Usage:
 *   const user = useUser();
 */
export function useUser() {
  const { user } = useSupabaseAuth();
  return user;
}
