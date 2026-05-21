"use client";

import { useEffect, useRef } from "react";
import type { Landmark, SubCheck } from "@/lib/recognition/types";

/* Hand connection pairs (MediaPipe convention) */
const CONNECTIONS: Array<[number, number]> = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm bridges
  [5, 9], [9, 13], [13, 17],
];

export type CanvasObjectPosition = "left" | "right" | "center";

interface LandmarkOverlayProps {
  landmarks: Landmark[] | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  mirrored?: boolean;
  objectPosition?: CanvasObjectPosition;
  /** Per-aspect breakdown from the rule. Failing checks dim their segments. */
  subChecks?: SubCheck[] | null;
}

const ACID = "oklch(0.89 0.215 128)";
const DIM = "oklch(0.42 0.012 65)";

function connKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function LandmarkOverlay({
  landmarks,
  videoRef,
  mirrored = false,
  objectPosition = "center",
  subChecks,
}: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!landmarks || landmarks.length === 0) return;

    // ── Compute satisfied / failing landmark + connection sets ──
    const failingLandmarks = new Set<number>();
    const failingConnections = new Set<string>();

    if (subChecks) {
      // A connection is "failing" iff some unsatisfied check claims it AND
      // no satisfied check claims it. Same for landmarks.
      const claimsLM = new Map<number, { sat: number; fail: number }>();
      const claimsConn = new Map<string, { sat: number; fail: number }>();
      for (const c of subChecks) {
        for (const i of c.landmarks) {
          const e = claimsLM.get(i) ?? { sat: 0, fail: 0 };
          if (c.satisfied) e.sat += 1;
          else e.fail += 1;
          claimsLM.set(i, e);
        }
        for (const [a, b] of c.connections) {
          const k = connKey(a, b);
          const e = claimsConn.get(k) ?? { sat: 0, fail: 0 };
          if (c.satisfied) e.sat += 1;
          else e.fail += 1;
          claimsConn.set(k, e);
        }
      }
      for (const [i, e] of claimsLM) if (e.fail > 0 && e.sat === 0) failingLandmarks.add(i);
      for (const [k, e] of claimsConn) if (e.fail > 0 && e.sat === 0) failingConnections.add(k);
    }

    // ── Mapping (handles object-cover crop) ──
    const vw = video?.videoWidth ?? 0;
    const vh = video?.videoHeight ?? 0;
    let toPx: (lm: Landmark) => { x: number; y: number };
    if (vw > 0 && vh > 0) {
      const scale = Math.max(rect.width / vw, rect.height / vh);
      const visW = rect.width / scale;
      const visH = rect.height / scale;
      let offX: number;
      if (objectPosition === "left") offX = 0;
      else if (objectPosition === "right") offX = vw - visW;
      else offX = (vw - visW) / 2;
      const offY = (vh - visH) / 2;
      toPx = (lm) => {
        const srcX = lm.x * vw - offX;
        const srcY = lm.y * vh - offY;
        let x = (srcX / visW) * rect.width;
        const y = (srcY / visH) * rect.height;
        if (mirrored) x = rect.width - x;
        return { x, y };
      };
    } else {
      toPx = (lm) => {
        const x = mirrored ? 1 - lm.x : lm.x;
        return { x: x * rect.width, y: lm.y * rect.height };
      };
    }

    // ── Draw connections ──
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    for (const [a, b] of CONNECTIONS) {
      const failing = failingConnections.has(connKey(a, b));
      ctx.strokeStyle = failing ? DIM : ACID;
      const p1 = toPx(landmarks[a]);
      const p2 = toPx(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // ── Draw landmarks ──
    for (let i = 0; i < landmarks.length; i++) {
      const failing = failingLandmarks.has(i);
      ctx.fillStyle = failing ? DIM : ACID;
      const p = toPx(landmarks[i]);
      const r = i === 0 ? 4.5 : i % 4 === 0 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [landmarks, mirrored, objectPosition, videoRef, subChecks]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
    />
  );
}
