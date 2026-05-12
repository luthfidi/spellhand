"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { Viewfinder } from "@/components/camera/viewfinder";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import type { LetterCode } from "@/lib/letters";
import { cn } from "@/lib/utils";

export function PracticeCamera({
  targetLetter,
  implemented,
}: {
  targetLetter: LetterCode;
  implemented: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const { status, error, detection, start, stop } = useHandLandmarker(videoRef, { facing });

  const [confidence, setConfidence] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!detection || !implemented) return;
    const { result } = classifyAgainstTarget(detection, targetLetter);
    setConfidence(result.confidence);

    if (result.match) {
      setHint(null);
      setLocked(true);
      const t = setTimeout(() => setLocked(false), 900);
      return () => clearTimeout(t);
    } else {
      setLocked(false);
      setHint(result.hints?.[0]?.message ?? null);
    }
  }, [detection, targetLetter, implemented]);

  const mirrored = facing === "user";

  const handleFlip = useCallback(() => {
    setFacing((f) => (f === "user" ? "environment" : "user"));
    stop();
    setTimeout(() => start(), 80);
  }, [start, stop]);

  return (
    <div>
      {/* Camera */}
      <div className="hairline relative aspect-[3/4] w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            mirrored && "[transform:scaleX(-1)]",
          )}
          playsInline
          muted
          autoPlay
        />
        <LandmarkOverlay landmarks={detection?.landmarks ?? null} mirrored={mirrored} />
        <Viewfinder caption={status === "running" ? "REC · LOCAL" : "STANDBY"} active={status === "running"} />

        {/* Lock badge */}
        {locked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-3 hairline bg-acid px-3 py-1.5 text-ink"
          >
            <span className="font-mono text-xs tracking-[0.12em]">LOCKED</span>
          </motion.div>
        ) : null}

        {/* Pre-flight overlay */}
        {status !== "running" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/95 px-6 text-center">
            {status === "loading-model" || status === "requesting-camera" ? (
              <p className="caption-acid">PREPARING INSTRUMENT…</p>
            ) : status === "permission-denied" ? (
              <p className="font-mono text-sm text-bone-2">
                Camera permission was denied. Update site settings, then refresh.
              </p>
            ) : status === "error" ? (
              <p className="font-mono text-sm text-bone-2">{error}</p>
            ) : (
              <button
                onClick={start}
                className="bg-acid px-5 py-3 font-mono text-sm text-ink"
              >
                START CAMERA →
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Live confidence meter */}
      <div className="ruled-b ruled-t mt-4 px-1 py-3">
        <div className="flex items-center justify-between">
          <p className="caption">CONFIDENCE · {targetLetter}</p>
          <p className="caption">
            {implemented ? `${(confidence * 100).toFixed(0)}%` : "UNGRADED"}
          </p>
        </div>
        <div className="relative mt-3 h-[2px] w-full bg-rule">
          <motion.div
            className="absolute inset-y-0 left-0 bg-acid"
            animate={{ width: implemented ? `${confidence * 100}%` : "0%" }}
            transition={{ duration: 0.12 }}
          />
        </div>
      </div>

      {/* Hint */}
      <div className="min-h-[2.4em] py-3">
        {implemented && hint ? (
          <p className="font-mono text-sm text-bone-2">
            <span className="text-acid">→</span> {hint}
          </p>
        ) : implemented ? (
          <p className="caption text-bone-3">Hold the shape — the bar above tracks your match.</p>
        ) : (
          <p className="caption text-bone-3">No rule yet — observe the description and try the shape.</p>
        )}
      </div>

      {/* Controls */}
      <div className="ruled-t flex items-center justify-between pt-3">
        <button
          onClick={handleFlip}
          disabled={status !== "running"}
          className="caption hover:text-acid disabled:opacity-30"
        >
          ⟲ FLIP CAMERA
        </button>
      </div>
    </div>
  );
}
