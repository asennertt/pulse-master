import { useSupabaseAuth } from '@/lib/supabase-auth-provider';

/**
 * useUser — convenience hook that returns the user object.
 *
 * Usage:
 *   const { user } = useUser();
 *   // or
 *   const user = useUser().user;
 */
export function useUser() {
  const { user, loading } = useSupabaseAuth();
  return { user, loading, data: user };
}

// Default export for pages that use: import useUser from "@/utils/useUser"
export default useUser;
