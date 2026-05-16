import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses Next 16 `await cookies()` API.
 *
 * Note: in Server Components, the `setAll` cookie writer is a no-op (you can't
 * mutate cookies during render). Middleware handles refresh; this client just
 * reads. Always call `supabase.auth.getUser()` in server code — never
 * `getSession()` (the latter only reads cookies and can be spoofed).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't set cookies — middleware refreshes them.
          }
        },
      },
    },
  );
}
