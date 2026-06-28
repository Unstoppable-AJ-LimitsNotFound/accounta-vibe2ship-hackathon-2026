import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a Supabase client optimized for Browser (Client Component) environments.
 * Returns null if Supabase environment variables are missing, ensuring the app won't crash on load.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      sameSite: 'none',
      secure: true,
    }
  });
}
