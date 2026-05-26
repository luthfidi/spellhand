"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

const NAME_MAX = 40;

function sanitizeName(raw: string): string {
  return raw.trim().slice(0, NAME_MAX);
}

/**
 * Send a magic link to claim a certificate. The display name is carried in
 * the redirect URL so it survives a different-device click on the email link
 * (no reliance on localStorage).
 */
export async function sendCertMagicLink(
  email: string,
  displayName: string,
): Promise<{ ok: true } | { error: string }> {
  const t = await getTranslations("errors");
  const cleanName = sanitizeName(displayName);
  if (!cleanName) return { error: t("name_required") };

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: t("invalid_email") };
  }

  const supabase = await createClient();
  const h = await headers();
  // Magic links must point at the canonical production URL, never a localhost
  // (or preview) origin. Prefer an explicit env, then Vercel's auto-provided
  // production domain, then the request origin, then local dev.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ??
    h.get("origin") ??
    "http://localhost:3000";

  const redirect =
    `${origin}/auth/callback?next=` +
    encodeURIComponent(`/challenge/claim?name=${encodeURIComponent(cleanName)}`);

  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: redirect,
      shouldCreateUser: true,
    },
  });

  if (error) return { error: error.message };
  return { ok: true };
}
