"use client";

import { useEffect } from "react";

/**
 * Registers the MediaPipe-caching service worker (public/sw.js). Production
 * only — a dev-mode SW fights Turbopack HMR and serves stale chunks. Fully
 * best-effort: any failure (unsupported browser, blocked registration) is
 * swallowed since the app works fine without it.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // best-effort — ignore
    });
  }, []);

  return null;
}
