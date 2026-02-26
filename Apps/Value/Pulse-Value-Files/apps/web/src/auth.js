/**
 * auth.js — top-level auth re-export.
 *
 * Kept for backwards compatibility with any code that imports from `src/auth`.
 * All real auth logic lives in `src/lib/supabase.ts` and
 * `src/lib/supabase-auth-provider.tsx`.
 */
export { supabase } from '@/lib/supabase';
export { useSupabaseAuth } from '@/lib/supabase-auth-provider';
