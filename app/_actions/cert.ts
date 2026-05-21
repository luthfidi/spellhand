"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

const NAME_MAX = 40;

// Build regexes from codepoints so the source file stays pure ASCII (literal
// control characters in source are easy to copy-corrupt and hard to review).
function range(from: number, to: number): string {
  return `${String.fromCharCode(from)}-${String.fromCharCode(to)}`;
}

// C0 + C1 control characters (incl. bidi overrides that could spoof identity).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp(`[${range(0x00, 0x1f)}${range(0x7f, 0x9f)}]`, "gu");

// Zero-width joiners, bidi overrides, BOM, word joiners, variation selectors.
const INVISIBLE_CHARS = new RegExp(
  `[${range(0x200b, 0x200f)}${range(0x202a, 0x202e)}${range(0x2060, 0x206f)}\\uFEFF${range(0xfe00, 0xfe0f)}]`,
  "gu",
);

// Lone UTF-16 surrogate halves (broken from copy-paste / wonky encodings).
const LONE_SURROGATES = /[\uD800-\uDFFF]/gu;

/**
 * Clean the display name for safe rendering on the certificate page AND
 * inside the satori-rendered OG image. Caps to NAME_MAX after sanitisation.
 * Emoji and non-Latin scripts are preserved; only structural-attack and
 * unrenderable characters are stripped.
 */
function sanitizeName(raw: string): string {
  return raw
    .replace(CONTROL_CHARS, "")
    .replace(INVISIBLE_CHARS, "")
    .replace(LONE_SURROGATES, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX);
}

/**
 * Issue a certificate for the currently-authenticated user. Idempotent:
 * if the user already has a cert (unique constraint on user_id), returns
 * the existing share_token instead of erroring.
 */
export async function issueCertificate(
  displayName: string,
): Promise<{ share_token: string } | { error: string }> {
  const t = await getTranslations("errors");
  const cleanName = sanitizeName(displayName);
  if (!cleanName) return { error: t("display_name_required") };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: t("not_authenticated") };
  }

  const { data, error } = await supabase
    .from("certificates")
    .insert({ user_id: user.id, display_name: cleanName })
    .select("share_token")
    .single();

  if (error) {
    // Duplicate (already issued) — fetch existing.
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("certificates")
        .select("share_token")
        .eq("user_id", user.id)
        .single();
      if (existing) return { share_token: existing.share_token };
    }
    return { error: error.message };
  }

  return { share_token: data.share_token };
}
