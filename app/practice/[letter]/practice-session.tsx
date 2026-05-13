"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { TopNav } from "@/components/nav/top-nav";
import { Viewfinder } from "@/components/camera/viewfinder";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { ReferencePanel } from "@/components/reference/reference-panel";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import { LETTERS, type LetterMeta } from "@/lib/letters";
import type { SubCheck } from "@/lib/recognition/types";
import { SubCheckPanel } from "@/components/debug/sub-check-panel";
import { cn, pad2 } from "@/lib/utils";

export function PracticeSession({ meta }: { meta: LetterMeta }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const { hand: storedHand, setHand } = useHandPreference();
  const hand = storedHand ?? "right";
  const { status, error, detection, start, stop } = useHandLandmarker(videoRef, { facing });

  const [confidence, setConfidence] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [subChecks, setSubChecks] = useState<SubCheck[] | null>(null);

  useEffect(() => {
    if (!detection) return;
    const { result } = classifyAgainstTarget(detection, meta.code);
    setConfidence(result.confidence);
    setSubChecks(result.subChecks ?? null);
    if (result.match) {
      setHint(null);
      setLocked(true);
      const t = setTimeout(() => setLocked(false), 800);
      return () => clearTimeout(t);
    } else {
      setLocked(false);
      setHint(result.hints?.[0]?.message ?? null);
    }
  }, [detection, meta.code]);

  const handleFlip = useCallback(() => {
    setFacing((f) => (f === "user" ? "environment" : "user"));
    stop();
    setTimeout(() => start(), 80);
  }, [stop, start]);

  const mirrored = facing === "user";
  const flipReference = mirrored && hand === "right";
  const running = status === "running";

  const prev = LETTERS[(meta.index - 2 + LETTERS.length) % LETTERS.length];
  const next = LETTERS[meta.index % LETTERS.length];

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-ink">
      <SubCheckPanel target={meta.code} subChecks={subChecks} confidence={confidence} />
      <TopNav
        caption={`§ ${pad2(meta.index)} / 24 · ${meta.nato.toUpperCase()}`}
        rightSlot={
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setHand(hand === "right" ? "left" : "right")}
              className="caption hover:text-acid"
              aria-label="Toggle dominant hand"
            >
              {hand === "right" ? "RH" : "LH"}
            </button>
            <button
              onClick={handleFlip}
              disabled={!running}
              className="caption hover:text-acid disabled:opacity-30"
              aria-label="Flip camera"
            >
              ⟲
            </button>
            <Link href={`/practice/${prev.code.toLowerCase()}`} className="caption hover:text-acid">
              ← {prev.code}
            </Link>
            <Link href={`/practice/${next.code.toLowerCase()}`} className="caption hover:text-acid">
              {next.code} →
            </Link>
            <Link href="/" className="caption hover:text-acid hidden sm:inline">END</Link>
          </div>
        }
      />

      {/* ──────── REF + CAMERA SPLIT ──────── */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        {/* Reference — opposite side from camera */}
        <div
          className={cn(
            "relative border-b border-rule lg:border-b-0",
            hand === "right" ? "lg:order-1 lg:border-r" : "lg:order-2 lg:border-l",
          )}
        >
          <ReferencePanel letter={meta.code} mirror={flipReference} variant="practice" />
        </div>

        {/* Camera — dominant-hand side */}
        <div
          className={cn(
            "relative overflow-hidden bg-black",
            hand === "right" ? "lg:order-2" : "lg:order-1",
          )}
        >
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              hand === "right" ? "object-left" : "object-right",
              mirrored && "[transform:scaleX(-1)]",
            )}
            playsInline
            muted
            autoPlay
            aria-label="Camera viewport"
          />
          <LandmarkOverlay
            landmarks={detection?.landmarks ?? null}
            videoRef={videoRef}
            mirrored={mirrored}
            objectPosition={hand === "right" ? "left" : "right"}
            subChecks={subChecks}
          />
          <Viewfinder caption={running ? "REC · LOCAL ONLY" : "STANDBY"} active={running} />

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

          {/* Pre-flight gate */}
          {!running ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/96 px-6 text-center">
              <PreFlight status={status} error={error} onStart={start} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ──────── BOTTOM STRIP ──────── */}
      <div className="ruled-t bg-ink">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3 sm:gap-6">
          <span className="caption shrink-0">CONFIDENCE</span>
          <div className="relative h-[2px] flex-1 bg-rule">
            <motion.div
              className="absolute inset-y-0 left-0 bg-acid"
              animate={{ width: `${confidence * 100}%` }}
              transition={{ duration: 0.12 }}
            />
          </div>
          <span className="caption w-10 shrink-0 text-right text-bone">
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="ruled-t">
          <div className="mx-auto flex h-9 max-w-2xl items-center justify-center px-4">
            {hint ? (
              <p className="text-center font-mono text-xs text-bone-2 sm:text-sm">
                <span className="text-acid">→</span> {hint}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function PreFlight({
  status,
  error,
  onStart,
}: {
  status: ReturnType<typeof useHandLandmarker>["status"];
  error: string | null;
  onStart: () => void;
}) {
  if (status === "loading-model") return <Loader caption="LOADING MODEL" />;
  if (status === "requesting-camera") return <Loader caption="AWAITING CAMERA" />;
  if (status === "permission-denied")
    return (
      <p className="max-w-sm font-mono text-sm text-bone-2">
        Camera permission denied. Enable it in your browser settings and refresh.
      </p>
    );
  if (status === "error")
    return <p className="max-w-sm font-mono text-sm text-bone-2">{error}</p>;
  return (
    <button onClick={onStart} className="bg-acid px-7 py-4 font-mono text-sm text-ink">
      START CAMERA →
    </button>
  );
}

function Loader({ caption }: { caption: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="caption-acid">{caption}</p>
      <div className="h-[2px] w-32 overflow-hidden bg-rule">
        <div className="h-full w-1/3 animate-sweep bg-acid" />
      </div>
    </div>
  );
}
