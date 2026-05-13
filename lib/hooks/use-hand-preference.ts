"use client";

import { useCallback, useEffect, useState } from "react";

export type Hand = "right" | "left";
const KEY = "spellhand:hand";

/**
 * Reads + writes a user's hand preference from localStorage.
 * `loaded` is false on the first render to avoid hydration mismatches —
 * components should wait for `loaded` before showing a hand-dependent UI.
 */
export function useHandPreference() {
  const [hand, setHandState] = useState<Hand | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored === "right" || stored === "left") setHandState(stored);
    } catch {
      // ignore (private mode etc)
    }
    setLoaded(true);
  }, []);

  const setHand = useCallback((h: Hand) => {
    setHandState(h);
    try {
      window.localStorage.setItem(KEY, h);
    } catch {
      // ignore
    }
  }, []);

  return { hand, setHand, loaded };
}
