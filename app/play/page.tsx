"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { TopNav } from "@/components/nav/top-nav";
import { Viewfinder } from "@/components/camera/viewfinder";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { ReferencePanel } from "@/components/reference/reference-panel";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import { type LetterCode } from "@/lib/letters";
import { cn, pad2 } from "@/lib/utils";

/* Wordlist spanning all 24 static letters. Skips J and Z (dynamic, Phase 4). */
const DEMO_WORDS = [
  "CAB",  "BOY",  "LAY",  "USE",
  "ICE",  "KEY",  "TOP",  "MAP",
  "HUG",  "FIX",  "CAT",  "BED",
  "PEN",  "BOX",  "WAR",  "CUP",
  "OWL",  "NAP",  "QUAD",
];

const SUSTAIN_PER_SEC = 1.7;
const DECAY_PER_SEC = 0.6;
const PROGRESS_LOCK = 1.0;

export default function PlayPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [hand, setHand] = useState<"right" | "left">("right");
  const { status, error, detection, start, stop } = useHandLandmarker(videoRef, { facing });

  const [wordIndex, setWordIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [matchProgress, setMatchProgress] = useState(0);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });
  const [celebrate, setCelebrate] = useState(false);

  const word = DEMO_WORDS[wordIndex];
  const targetLetter = (word[letterIndex] ?? "A") as LetterCode;

  const advance = useCallback(() => {
    setScore((s) => ({ correct: s.correct + 1, attempted: s.attempted + 1 }));
    setMatchProgress(0);
    setLastTs(null);
    setHint(null);

    if (letterIndex + 1 >= word.length) {
      setCelebrate(true);
      setTimeout(() => {
        setCelebrate(false);
        setWordIndex((wi) => (wi + 1) % DEMO_WORDS.length);
        setLetterIndex(0);
      }, 1100);
    } else {
      setLetterIndex((li) => li + 1);
    }
  }, [letterIndex, word]);

  useEffect(() => {
    if (!detection || celebrate) return;
    const now = detection.timestamp;
    const dt = lastTs == null ? 0.04 : Math.min((now - lastTs) / 1000, 0.2);
    setLastTs(now);

    const { result } = classifyAgainstTarget(detection, targetLetter);

    if (result.notImplemented) {
      setHint("Skipping — this letter is on the bench for Phase 1.");
      const t = setTimeout(advance, 1600);
      return () => clearTimeout(t);
    }

    if (result.match) {
      setHint(null);
      setMatchProgress((p) => Math.min(p + SUSTAIN_PER_SEC * dt, PROGRESS_LOCK));
    } else {
      setHint(result.hints?.[0]?.message ?? null);
      setMatchProgress((p) => Math.max(p - DECAY_PER_SEC * dt, 0));
    }
  }, [detection, targetLetter, lastTs, advance, celebrate]);

  useEffect(() => {
    if (detection || status !== "running") return;
    const t = setInterval(() => {
      setMatchProgress((p) => Math.max(p - 0.04, 0));
      setHint("Place your hand inside the frame.");
    }, 100);
    return () => clearInterval(t);
  }, [detection, status]);

  useEffect(() => {
    if (matchProgress >= PROGRESS_LOCK && !celebrate) advance();
  }, [matchProgress, celebrate, advance]);

  const handleFlip = useCallback(() => {
    setFacing((f) => (f === "user" ? "environment" : "user"));
    stop();
    setTimeout(() => start(), 80);
  }, [stop, start]);

  const accuracy = score.attempted ? Math.round((score.correct / score.attempted) * 100) : 0;
  const mirrored = facing === "user";
  // Right-handed user + mirrored selfie video → flip reference so the visual matches.
  // Reference SVGs depict a right hand frontally; mirror inverts that on screen.
  const flipReference = mirrored && hand === "right";
  const running = status === "running";

  return (
    <main className="flex h-svh flex-col bg-ink overflow-hidden">
      <TopNav
        caption={`§ ${pad2(wordIndex + 1)} / ${pad2(DEMO_WORDS.length)}`}
        rightSlot={
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setHand((h) => (h === "right" ? "left" : "right"))}
              className="caption hover:text-acid"
              aria-label={`Switch to ${hand === "right" ? "left" : "right"}-handed mode`}
              title="Toggle dominant hand"
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
            <span className="caption hidden sm:inline">SCORE</span>
            <span className="text-bone">{score.correct}</span>
            <span className="caption hidden sm:inline">ACC {accuracy}%</span>
            <Link href="/" className="caption hover:text-acid">END</Link>
          </div>
        }
      />

      {/* ──────── REF + CAMERA SPLIT ──────── */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        {/* Reference */}
        <div className="relative border-b border-rule lg:border-b-0 lg:border-r">
          <ReferencePanel letter={targetLetter} mirror={flipReference} />
        </div>

        {/* Camera */}
        <div className="relative overflow-hidden bg-black">
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              mirrored && "[transform:scaleX(-1)]",
            )}
            playsInline
            muted
            autoPlay
            aria-label="Camera viewport"
          />
          <LandmarkOverlay landmarks={detection?.landmarks ?? null} mirrored={mirrored} />
          <Viewfinder
            caption={running ? "REC · LOCAL ONLY" : "STANDBY"}
            active={running}
          />

          {/* Pre-flight gate */}
          {!running ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/96 px-6 text-center">
              <PreFlight status={status} error={error} onStart={start} />
            </div>
          ) : null}

          {/* Word-complete burst */}
          <AnimatePresence>
            {celebrate ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-ink/85"
              >
                <div className="text-center">
                  <p className="caption-acid">WORD COMPLETE</p>
                  <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-6xl italic">
                    {word}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ──────── BOTTOM STRIP — word + progress + hint (minimal) ──────── */}
      <div className="ruled-t bg-ink">
        {/* Word with per-letter progress */}
        <div className="mx-auto flex max-w-2xl items-end justify-center gap-3 px-4 pt-3 pb-1 sm:gap-5 sm:pt-4">
          {word.split("").map((ch, i) => {
            const isCurrent = i === letterIndex;
            const isDone = i < letterIndex;
            const fill = isCurrent ? matchProgress : isDone ? 1 : 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none transition-colors sm:text-4xl",
                    isCurrent ? "text-acid" : isDone ? "text-bone-3" : "text-bone-2",
                  )}
                >
                  {ch}
                </span>
                <span className="relative block h-[2px] w-6 bg-rule sm:w-8">
                  <motion.span
                    className={cn(
                      "absolute inset-y-0 left-0",
                      isCurrent ? "bg-acid" : "bg-bone-3",
                    )}
                    animate={{ width: `${fill * 100}%` }}
                    transition={{ duration: 0.12, ease: "linear" }}
                  />
                </span>
              </div>
            );
          })}
        </div>

        {/* One-line hint, always reserved height to avoid jumps */}
        <div className="ruled-t mt-2">
          <div className="mx-auto flex h-9 max-w-2xl items-center justify-center px-4">
            <AnimatePresence mode="wait">
              {hint ? (
                <motion.p
                  key={hint}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center font-mono text-xs text-bone-2 sm:text-sm"
                >
                  <span className="text-acid">→</span> {hint}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ──────── Pre-flight: dense info BEFORE the session, none during ──────── */
function PreFlight({
  status,
  error,
  onStart,
}: {
  status: ReturnType<typeof useHandLandmarker>["status"];
  error: string | null;
  onStart: () => void;
}) {
  if (status === "loading-model") {
    return <Loader caption="LOADING MODEL" label="Compiling MediaPipe HandLandmarker…" />;
  }
  if (status === "requesting-camera") {
    return <Loader caption="ACCESS" label="Awaiting camera permission…" />;
  }
  if (status === "permission-denied") {
    return (
      <div className="max-w-sm">
        <p className="caption text-blood">PERMISSION DENIED</p>
        <h2 className="mt-2 font-[family-name:var(--font-display-loaded)] text-3xl italic">
          The instrument needs a camera.
        </h2>
        <p className="mt-3 text-sm text-bone-2">
          Open your browser settings, allow camera access for this site, then refresh.
          No video ever leaves the device.
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="max-w-sm">
        <p className="caption text-blood">FAULT</p>
        <h2 className="mt-2 font-[family-name:var(--font-display-loaded)] text-3xl italic">
          Failed to start.
        </h2>
        <p className="mt-3 text-sm text-bone-2">{error ?? "Unknown error."}</p>
      </div>
    );
  }
  return (
    <div className="max-w-sm">
      <p className="caption-acid">SESSION 01</p>
      <h2 className="mt-3 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-[0.95]">
        Place your hand
        <br />
        inside the bracket.
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-bone-2">
        Frames stay on your device.
      </p>
      <button
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-3 bg-acid px-5 py-3 text-ink"
      >
        <span className="font-mono text-sm tracking-[0.05em]">GRANT &amp; BEGIN</span>
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

function Loader({ caption, label }: { caption: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="caption-acid">{caption}</p>
      <p className="font-[family-name:var(--font-display-loaded)] text-2xl italic">{label}</p>
      <div className="mt-3 h-[2px] w-40 overflow-hidden bg-rule">
        <div className="h-full w-1/3 animate-sweep bg-acid" />
      </div>
    </div>
  );
}
