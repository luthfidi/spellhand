"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Viewfinder } from "@/components/camera/viewfinder";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { ReferencePanel } from "@/components/reference/reference-panel";
import { HandPreferenceModal } from "@/components/onboard/hand-preference-modal";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import type { LetterCode } from "@/lib/letters";
import type { LevelDef } from "@/lib/levels";
import type { SubCheck } from "@/lib/recognition/types";
import { SubCheckPanel } from "@/components/debug/sub-check-panel";
import { cn, pad2 } from "@/lib/utils";

const SUSTAIN_PER_SEC = 1.7;
const DECAY_PER_SEC = 0.6;
const PROGRESS_LOCK = 1.0;

export function PlaySession({ level }: { level: LevelDef }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing] = useState<"user" | "environment">("user");
  const { hand: storedHand, setHand: setStoredHand, loaded: handLoaded } = useHandPreference();
  const hand = storedHand ?? "right";
  const { status, error, detection, start, stop } = useHandLandmarker(videoRef, { facing });

  const [wordIndex, setWordIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [matchProgress, setMatchProgress] = useState(0);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });
  const [celebrate, setCelebrate] = useState(false);
  const [complete, setComplete] = useState(false);
  const [subChecks, setSubChecks] = useState<SubCheck[] | null>(null);
  const [confidence, setConfidence] = useState(0);

  const word = level.words[wordIndex];
  const targetLetter = (word?.[letterIndex] ?? "A") as LetterCode;

  const advance = useCallback(() => {
    setScore((s) => ({ correct: s.correct + 1, attempted: s.attempted + 1 }));
    setMatchProgress(0);
    setLastTs(null);
    setHint(null);

    if (letterIndex + 1 >= word.length) {
      setCelebrate(true);
      setTimeout(() => {
        setCelebrate(false);
        if (wordIndex + 1 >= level.words.length) {
          setComplete(true);
          stop();
        } else {
          setWordIndex((wi) => wi + 1);
          setLetterIndex(0);
        }
      }, 1100);
    } else {
      setLetterIndex((li) => li + 1);
    }
  }, [letterIndex, word, wordIndex, level.words.length, stop]);

  useEffect(() => {
    if (!detection || celebrate || complete) return;
    const now = detection.timestamp;
    const dt = lastTs == null ? 0.04 : Math.min((now - lastTs) / 1000, 0.2);
    setLastTs(now);
    const { result } = classifyAgainstTarget(detection, targetLetter);
    setSubChecks(result.subChecks ?? null);
    setConfidence(result.confidence);
    if (result.notImplemented) {
      setHint("Skipping — this letter is on the bench.");
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
  }, [detection, targetLetter, lastTs, advance, celebrate, complete]);

  useEffect(() => {
    if (detection || status !== "running" || celebrate || complete) return;
    const t = setInterval(() => {
      setMatchProgress((p) => Math.max(p - 0.04, 0));
      setHint("Place your hand inside the frame.");
    }, 100);
    return () => clearInterval(t);
  }, [detection, status, celebrate, complete]);

  useEffect(() => {
    if (matchProgress >= PROGRESS_LOCK && !celebrate && !complete) advance();
  }, [matchProgress, celebrate, complete, advance]);

  const mirrored = facing === "user";
  const flipReference = mirrored && hand === "right";
  const running = status === "running";

  const replay = useCallback(() => {
    setWordIndex(0);
    setLetterIndex(0);
    setMatchProgress(0);
    setHint(null);
    setScore({ correct: 0, attempted: 0 });
    setComplete(false);
    setCelebrate(false);
    start();
  }, [start]);

  const showHandModal = handLoaded && !storedHand;

  if (complete) {
    return <LevelComplete level={level} score={score} onReplay={replay} />;
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-ink">
      <HandPreferenceModal open={showHandModal} onPick={setStoredHand} />
      <SubCheckPanel target={targetLetter} subChecks={subChecks} confidence={confidence} />

      {/* Minimal in-game header: back + word counter */}
      <header className="ruled-b sticky top-0 z-30 bg-ink/85 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/levels/${level.number}`} className="caption hover:text-acid">
            ← BACK
          </Link>
          <span className="caption">
            WORD {pad2(wordIndex + 1)} / {pad2(level.words.length)}
          </span>
          <span className="caption text-bone-3">L{level.number}</span>
        </div>
      </header>

      {/* REF + CAMERA SPLIT */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div
          className={cn(
            "relative border-b border-rule lg:border-b-0",
            hand === "right" ? "lg:order-1 lg:border-r" : "lg:order-2 lg:border-l",
          )}
        >
          <ReferencePanel letter={targetLetter} mirror={flipReference} />
        </div>

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

          {!running ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/96 px-6 text-center">
              <PreFlight status={status} error={error} onStart={start} />
            </div>
          ) : null}

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

      {/* Bottom strip — word letters + per-letter progress + hint */}
      <div className="ruled-t bg-ink">
        <div className="mx-auto flex max-w-2xl items-end justify-center gap-3 px-4 pt-3 pb-1 sm:gap-5 sm:pt-4">
          {word?.split("").map((ch, i) => {
            const isCurrent = i === letterIndex;
            const isDone = i < letterIndex;
            // Show live confidence on the current letter — partial-credit fill.
            const fill = isCurrent ? confidence : isDone ? 1 : 0;
            const locking = isCurrent && confidence >= 0.999;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <motion.span
                  animate={locking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={
                    locking
                      ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                  className={cn(
                    "font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none transition-colors sm:text-4xl",
                    isCurrent ? "text-acid" : isDone ? "text-bone-3" : "text-bone-2",
                  )}
                >
                  {ch}
                </motion.span>
                <span className="relative block h-[2px] w-6 bg-rule sm:w-8">
                  <motion.span
                    className={cn("absolute inset-y-0 left-0", isCurrent ? "bg-acid" : "bg-bone-3")}
                    animate={{ width: `${fill * 100}%` }}
                    transition={{ duration: 0.12, ease: "linear" }}
                  />
                </span>
              </div>
            );
          })}
        </div>

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

/* ─────────────── END-OF-LEVEL SUMMARY ─────────────── */

function LevelComplete({
  level,
  score,
  onReplay,
}: {
  level: LevelDef;
  score: { correct: number; attempted: number };
  onReplay: () => void;
}) {
  const accuracy = score.attempted ? Math.round((score.correct / score.attempted) * 100) : 0;
  const nextLevel = level.number < 4 ? level.number + 1 : null;

  return (
    <main className="flex min-h-svh flex-col bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/levels" className="caption hover:text-acid">← Levels</Link>
          <span className="caption">LEVEL {pad2(level.number)} · COMPLETE</span>
          <span aria-hidden></span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <p className="caption-acid">RESULT</p>
        <h1 className="mt-4 font-[family-name:var(--font-display-loaded)] text-6xl italic leading-[0.95] sm:text-8xl">
          Well done.
        </h1>

        <div className="ruled-y mt-12 grid w-full grid-cols-3 divide-x divide-rule">
          <Stat label="Words" value={String(level.words.length)} />
          <Stat label="Correct" value={String(score.correct)} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <button
            onClick={onReplay}
            className="hairline bg-ink px-6 py-3 font-mono text-sm hover:bg-acid hover:text-ink"
          >
            PLAY AGAIN
          </button>
          {nextLevel ? (
            <Link
              href={`/levels/${nextLevel}`}
              className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink"
            >
              NEXT LEVEL <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink"
            >
              FINISH <span aria-hidden>→</span>
            </Link>
          )}
          <Link href="/levels" className="caption hover:text-acid">← All levels</Link>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-5">
      <p className="caption">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none text-bone">
        {value}
      </p>
    </div>
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
  if (status === "error") return <p className="max-w-sm font-mono text-sm text-bone-2">{error}</p>;
  return (
    <div className="max-w-sm">
      <p className="caption-acid">READY</p>
      <h2 className="mt-3 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-[0.95]">
        Place your hand
        <br />
        inside the bracket.
      </h2>
      <button onClick={onStart} className="mt-6 inline-flex items-center gap-3 bg-acid px-5 py-3 text-ink">
        <span className="font-mono text-sm tracking-[0.05em]">START</span>
        <span aria-hidden>→</span>
      </button>
    </div>
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
