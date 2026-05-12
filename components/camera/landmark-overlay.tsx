"use client";

import { useEffect, useRef } from "react";
import type { Landmark } from "@/lib/recognition/types";

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

interface LandmarkOverlayProps {
  landmarks: Landmark[] | null;
  /** Mirror the canvas horizontally (for front camera). */
  mirrored?: boolean;
  /** Color override. Default is acid lime. */
  color?: string;
}

export function LandmarkOverlay({
  landmarks,
  mirrored = false,
  color = "oklch(0.89 0.215 128)",
}: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution to match its CSS size for crisp lines.
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!landmarks || landmarks.length === 0) return;

    const toPx = (lm: Landmark) => {
      const x = mirrored ? 1 - lm.x : lm.x;
      return { x: x * rect.width, y: lm.y * rect.height };
    };

    // Connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.lineCap = "round";
    for (const [a, b] of CONNECTIONS) {
      const p1 = toPx(landmarks[a]);
      const p2 = toPx(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Points
    ctx.fillStyle = color;
    for (let i = 0; i < landmarks.length; i++) {
      const p = toPx(landmarks[i]);
      const r = i === 0 ? 4.5 : i % 4 === 0 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [landmarks, mirrored, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
    />
  );
}
