"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser components.
 * Reads from NEXT_PUBLIC_* env vars; safe to call repeatedly (cached internally).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
