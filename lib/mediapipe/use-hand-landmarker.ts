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
  landmarks: Landmark[]; // 21 points
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

  const start = useCallback(async () => {
    setError(null);

    try {
      // ── Load MediaPipe ──
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

      // ── Camera ──
      setStatus("requesting-camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("video element not mounted");
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();

      setStatus("ready");

      // ── Detection loop ──
      const minFrameInterval = 1000 / maxFps;
      runningRef.current = true;
      setStatus("running");

      const tick = () => {
        if (!runningRef.current) return;
        rafRef.current = requestAnimationFrame(tick);

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
            setDetection({
              landmarks: lm as Landmark[],
              handedness: (hd.categoryName as Handedness) ?? "Right",
              timestamp: now,
            });
          } else {
            setDetection(null);
          }
        } catch (e) {
          // Swallow per-frame errors to avoid breaking the loop.
          console.warn("Detection frame failed:", e);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.toLowerCase().includes("permission") || message.includes("NotAllowed")) {
        setStatus("permission-denied");
      } else {
        setStatus("error");
      }
      setError(message);
    }
  }, [videoRef, facing, maxFps]);

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
    setDetection(null);
    setStatus("idle");
  }, [videoRef]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { status, error, detection, start, stop };
}
