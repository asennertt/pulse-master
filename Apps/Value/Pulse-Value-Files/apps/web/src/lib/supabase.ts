import { createBrowserClient } from '@supabase/ssr';

let _supabase = null;

function getEnvVar(name) {
  // Try process.env first (server/SSR), then import.meta.env (client)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  try {
    // import.meta.env is statically replaced by Vite at build time
    const val = import.meta.env?.[name];
    if (val) return val;
  } catch (e) {
    // ignore
  }
  return undefined;
}

/**
 * Lazy-initialized Supabase client.
 * Defers createClient until first use so env vars are read at runtime, not module load.
 */
export function getSupabaseClient() {
  if (_supabase) return _supabase;

  const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const key = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !key) {
    console.warn('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    return null;
  }

  _supabase = createBrowserClient(url, key);
  return _supabase;
}

// Backwards-compatible default export — lazy getter
// Code that does `import { supabase } from '@/lib/supabase'` will get the client
// at first property access rather than at module load time.
let _proxy = null;
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!_proxy) _proxy = getSupabaseClient();
    if (!_proxy) {
      throw new Error('Supabase client not initialized — missing env vars');
    }
    return _proxy[prop];
  }
});
