import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

/**
 * Returns a Supabase client optimized for Server (Server Components, Route Handlers, Server Actions) environments.
 * Returns null if Supabase environment variables are missing, allowing fallback logic.
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                sameSite: 'none',
                secure: true,
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be safely ignored in most cases (e.g., when middleware refreshes sessions).
          }
        },
      },
      cookieOptions: {
        sameSite: 'none',
        secure: true,
      }
    }
  );
}
