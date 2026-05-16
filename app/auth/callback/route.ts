import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link callback. Exchanges the code in the URL for a session,
 * then redirects to the `next` query param (default: home).
 *
 * The `next` value typically points to `/challenge/claim?name=...` so the
 * client can finish issuing the certificate after auth succeeds.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Only allow same-origin redirects.
      const target = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  // Fallback: send user home with an error param the client can display.
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
