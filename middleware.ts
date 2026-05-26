import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth cookie before Server Components run.
 * Defensive: if env vars aren't configured yet, falls through cleanly so
 * Phase 1 flows keep working without Supabase setup.
 */
export async function middleware(request: NextRequest) {
  // Deep-link safety net: a certificate opened as `/?code=<share_token>`
  // (a misrouted/old link) has no handler at the root, so forward it to the
  // canonical /cert/[token] page. Cert tokens are 32 hex chars — distinct from
  // Supabase auth codes (dashed UUIDs), which are handled at /auth/callback,
  // so this never swallows a real auth redirect.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/") {
    const code = searchParams.get("code");
    if (code && /^[a-f0-9]{32}$/i.test(code)) {
      const dest = request.nextUrl.clone();
      dest.pathname = `/cert/${code}`;
      dest.search = "";
      return NextResponse.redirect(dest);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Trigger token refresh. Result intentionally unused here.
  // Swallow errors so a Supabase outage / misconfig never bricks the site —
  // pages will just render in a signed-out state.
  try {
    await supabase.auth.getUser();
  } catch {
    // no-op
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     *  - Next internal assets (_next/static, _next/image)
     *  - Static files (favicon, icon, service worker, letter SVGs)
     *  - Public images
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js|letters/).*)",
  ],
};
