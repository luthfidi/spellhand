"use client";

import { useEffect } from "react";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/**
 * Best-effort: warm the browser cache with the MediaPipe JS chunk, WASM
 * fileset, and model `.task` so the next camera-using page (e.g. /play) hits
 * cache instead of cold-downloading multiple MB.
 *
 * Scheduled via `requestIdleCallback` so it doesn't compete with the current
 * page's render. Failure is silent — the real loader on /play falls back to
 * a normal fetch.
 */
export function useWarmMediaPipe() {
  useEffect(() => {
    let cancelled = false;

    const idle = (cb: () => void) => {
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void) => number;
      };
      if (w.requestIdleCallback) w.requestIdleCallback(cb);
      else setTimeout(cb, 200);
    };

    idle(async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        if (cancelled) return;
        await vision.FilesetResolver.forVisionTasks(WASM_CDN);
        if (cancelled) return;
        fetch(MODEL_URL, { mode: "cors", credentials: "omit" }).catch(() => {});
      } catch {
        // Preload is best-effort; let the real loader handle the cold path.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);
}
