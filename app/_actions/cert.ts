"use server";

import { createClient } from "@/lib/supabase/server";

const NAME_MAX = 40;

function sanitizeName(raw: string): string {
  return raw.trim().slice(0, NAME_MAX);
}

/**
 * Issue a certificate for the currently-authenticated user. Idempotent:
 * if the user already has a cert (unique constraint on user_id), returns
 * the existing share_token instead of erroring.
 */
export async function issueCertificate(
  displayName: string,
): Promise<{ share_token: string } | { error: string }> {
  const cleanName = sanitizeName(displayName);
  if (!cleanName) return { error: "Display name is required." };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated." };
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
