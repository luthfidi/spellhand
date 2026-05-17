"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Handedness, Landmark } from "@/lib/recognition/types";

export type DetectorStatus =
  | "idle"
  | "loading-model"
  | "requesting-camera"
  | "permission-denied"
  | "ready"
  | "running"
  | "error";

export interface Detection {
  landmarks: Landmark[]; // 21 points, raw — used by the overlay (image-normalised)
  /**
   * Same 21 points with `x` and `z` scaled by image aspect ratio (w/h) so that
   * x and y end up in the same coordinate basis. Distance ratios computed on
   * these are aspect-invariant — use these for classifier rules.
   */
  scaledLandmarks: Landmark[];
  handedness: Handedness;
  timestamp: number;
}

export interface UseHandLandmarkerOptions {
  /** Front (user) or rear (environment) camera. Defaults to "user". */
  facing?: "user" | "environment";
  /** Max FPS for detection loop. Defaults to 24 (mobile-friendly). */
  maxFps?: number;
}

// Versions pinned to avoid breakage. Bump alongside package upgrades.
const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export function useHandLandmarker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseHandLandmarkerOptions = {},
) {
  const { facing = "user", maxFps = 24 } = options;

  const [status, setStatus] = useState<DetectorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);

  const landmarkerRef = useRef<unknown>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectionTsRef = useRef(0);
  const runningRef = useRef(false);
  // Guard against StrictMode double-mount and rapid re-entry.
  const startingRef = useRef(false);
  const pausedRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    landmarkerRef.current = null;
    startingRef.current = false;
    pausedRef.current = false;
    setDetection(null);
    setStatus("idle");
  }, [videoRef]);

  const start = useCallback(async () => {
    // Idempotent — ignore if already starting or running.
    if (startingRef.current || runningRef.current) return;
    startingRef.current = true;
    setError(null);

    try {
      setStatus("loading-model");
      const vision = await import("@mediapipe/tasks-vision");
      const { HandLandmarker, FilesetResolver } = vision;

      const wasm = await FilesetResolver.forVisionTasks(WASM_CDN);
      const landmarker = await HandLandmarker.createFromOptions(wasm, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      landmarkerRef.current = landmarker;

      setStatus("requesting-camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("video element not mounted");
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      // Autoplay can be blocked on mobile even with muted + playsInline if the
      // user-gesture window has expired during model load. Catch & continue —
      // the <video autoPlay> attribute + the detection loop's videoWidth check
      // will pick things up once the user next interacts with the page.
      try {
        await video.play();
      } catch (playError) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("video.play() blocked; will retry on next interaction:", playError);
        }
      }

      setStatus("ready");

      const minFrameInterval = 1000 / maxFps;
      runningRef.current = true;
      startingRef.current = false;
      setStatus("running");

      const tick = () => {
        if (!runningRef.current) return;
        rafRef.current = requestAnimationFrame(tick);

        // Skip detection while tab hidden — saves battery / GPU.
        if (pausedRef.current) return;

        const now = performance.now();
        if (now - lastDetectionTsRef.current < minFrameInterval) return;
        lastDetectionTsRef.current = now;

        if (!video.videoWidth) return;

        try {
          const result = (landmarker as { detectForVideo: (v: HTMLVideoElement, ts: number) => {
            landmarks?: Landmark[][];
            handedness?: Array<Array<{ categoryName: string }>>;
          } }).detectForVideo(video, now);
          const lm = result?.landmarks?.[0];
          const hd = result?.handedness?.[0]?.[0];
          if (lm && hd) {
            // Aspect-corrected copy: scale x and z (z is in same basis as x
            // per MediaPipe spec) by w/h so x and y share the same coordinate
            // basis. Distance ratios on these landmarks are aspect-invariant.
            const aspect = (video.videoWidth || 1) / (video.videoHeight || 1);
            const scaled = (lm as Landmark[]).map((p) => ({
              x: p.x * aspect,
              y: p.y,
              z: p.z * aspect,
            }));
            setDetection({
              landmarks: lm as Landmark[],
              scaledLandmarks: scaled,
              handedness: (hd.categoryName as Handedness) ?? "Right",
              timestamp: now,
            });
          } else {
            setDetection(null);
          }
        } catch {
          // Swallow per-frame errors silently — they shouldn't break the loop.
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      startingRef.current = false;
      if (message.toLowerCase().includes("permission") || message.includes("NotAllowed")) {
        setStatus("permission-denied");
      } else {
        setStatus("error");
      }
      setError(message);
    }
  }, [videoRef, facing, maxFps]);

  /** Full stop → start cycle. Used by "Play Again" flows. */
  const restart = useCallback(async () => {
    stop();
    // Give the previous stream a tick to release before re-requesting.
    await new Promise((r) => setTimeout(r, 50));
    await start();
  }, [stop, start]);

  // Pause detection loop while document is hidden (tab switch / minimised).
  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Retry video.play() on any user interaction. Mobile browsers sometimes block
  // autoplay even with muted + playsInline if the original gesture window
  // expired during model loading. Once user taps anywhere, this catches up.
  useEffect(() => {
    const retry = () => {
      const v = videoRef.current;
      if (v && v.srcObject && v.paused) {
        v.play().catch(() => {
          // Still blocked — wait for next interaction.
        });
      }
    };
    document.addEventListener("pointerdown", retry, { passive: true });
    document.addEventListener("touchstart", retry, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("touchstart", retry);
    };
  }, [videoRef]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { status, error, detection, start, stop, restart };
}
