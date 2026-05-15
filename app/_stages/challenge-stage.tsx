"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { CameraGate } from "@/components/camera/camera-gate";
import { SubCheckPanel } from "@/components/debug/sub-check-panel";
import { ConfidenceDisplay } from "@/components/feedback/confidence-display";
import { LockedRing } from "@/components/feedback/locked-ring";
import { LetterGlyph } from "@/components/specimen/letter-glyph";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import { CHALLENGE } from "@/lib/levels";
import type { LetterCode } from "@/lib/letters";
import type { SubCheck } from "@/lib/recognition/types";
import type { Hand } from "@/lib/hooks/use-hand-preference";
import { cn, pad2 } from "@/lib/utils";
import { STAGE_MOTION } from "./stage-motion";

const SUSTAIN_PER_SEC = 1.7;
const DECAY_PER_SEC = 0.6;
const PROGRESS_LOCK = 1.0;

export function ChallengeStage({
  hand,
  onBack,
  onHome,
}: {
  hand: Hand;
  onBack: () => void;
  onHome: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const facing: "user" | "environment" = "user";
  const { status, error, detection, start, stop, restart } = useHandLandmarker(videoRef, { facing });

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

  const word = CHALLENGE.words[wordIndex];
  const targetLetter = (word?.[letterIndex] ?? "A") as LetterCode;

  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = useCallback(() => {
    setScore((s) => ({ correct: s.correct + 1, attempted: s.attempted + 1 }));
    setMatchProgress(0);
    setLastTs(null);
    setHint(null);

    if (letterIndex + 1 >= word.length) {
      setCelebrate(true);
      setTimeout(() => {
        setCelebrate(false);
        if (wordIndex + 1 >= CHALLENGE.words.length) {
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
  }, [letterIndex, word, wordIndex, stop]);

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
    setConfidence(0);
    setSubChecks(null);
    setMatchProgress(0);
    setHint("Place your hand inside the frame.");
    const t = setInterval(() => {
      setHint("Place your hand inside the frame.");
      setConfidence(0);
      setSubChecks(null);
    }, 400);
    return () => clearInterval(t);
  }, [detection, status, celebrate, complete]);

  useEffect(() => {
    if (matchProgress >= PROGRESS_LOCK && !celebrate && !complete) advance();
  }, [matchProgress, celebrate, complete, advance]);

  const mirrored = facing === "user";
  const running = status === "running";

  const replay = useCallback(() => {
    setWordIndex(0);
    setLetterIndex(0);
    setMatchProgress(0);
    setHint(null);
    setScore({ correct: 0, attempted: 0 });
    setComplete(false);
    setCelebrate(false);
    restart();
  }, [restart]);

  if (complete) {
    return <CertificateEarned score={score} onReplay={replay} onHome={onHome} />;
  }

  return (
    <motion.main {...STAGE_MOTION} className="flex h-svh flex-col overflow-hidden bg-ink">
      <SubCheckPanel target={targetLetter} subChecks={subChecks} confidence={confidence} />

      <header className="ruled-b sticky top-0 z-30 bg-ink/85 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onBack} className="caption hover:text-acid">
            ← BACK
          </button>
          <span className="caption">
            WORD {pad2(wordIndex + 1)} / {pad2(CHALLENGE.words.length)}
          </span>
          <span className="caption-acid">CHALLENGE</span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 grid-rows-2 overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
        {/* Memory-only left panel — no reference image */}
        <div
          className={cn(
            "relative border-b border-rule lg:border-b-0",
            hand === "right" ? "lg:order-1 lg:border-r" : "lg:order-2 lg:border-l",
          )}
        >
          <MemoryLeftPanel
            letter={targetLetter}
            word={word ?? ""}
            letterIndex={letterIndex}
            confidence={confidence}
          />
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

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          <LandmarkOverlay
            landmarks={detection?.landmarks ?? null}
            videoRef={videoRef}
            mirrored={mirrored}
            objectPosition={hand === "right" ? "left" : "right"}
            subChecks={subChecks}
          />

          {running ? (
            <div className="pointer-events-none absolute right-5 top-4 z-20 text-right">
              <ConfidenceDisplay confidence={confidence} />
            </div>
          ) : null}

          <LockedRing active={running && confidence >= 0.999} />

          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-6">
            <AnimatePresence mode="wait">
              {running && hint ? (
                <motion.div
                  key={hint}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="hairline rounded-full bg-ink/75 px-4 py-2 backdrop-blur-sm sm:px-5 sm:py-2.5"
                >
                  <p className="font-mono text-xs text-bone sm:text-sm">
                    <span className="text-acid">→</span> {hint}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {!running ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/96 px-6 text-center">
              <CameraGate status={status} error={error} onRetry={start} />
            </div>
          ) : null}

          <AnimatePresence>
            {celebrate ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85"
              >
                <motion.div
                  initial={{ scale: 0.7, rotate: -3, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <p className="caption-acid">WORD COMPLETE</p>
                  <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-6xl italic text-acid sm:text-7xl">
                    {word}
                  </p>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}

/* ────────────── Memory-only left panel (no reference image) ────────────── */

function MemoryLeftPanel({
  letter,
  word,
  letterIndex,
  confidence,
}: {
  letter: LetterCode;
  word: string;
  letterIndex: number;
  confidence: number;
}) {
  return (
    <div className="relative flex h-full w-full flex-col bg-ink-2">
      {/* Big target letter — fills the upper area */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-2 py-2 sm:py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={letter}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <LetterGlyph
              letter={letter}
              size="xl"
              className="text-[40vw] leading-none text-bone sm:text-[28vw] lg:text-[22vw] xl:text-[20rem]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Word with per-letter progress */}
      <div className="ruled-t px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex items-end justify-center gap-3 sm:gap-5">
          {word.split("").map((ch, i) => {
            const isCurrent = i === letterIndex;
            const isDone = i < letterIndex;
            const fill = isCurrent ? confidence : isDone ? 1 : 0;
            const locking = isCurrent && confidence >= 0.999;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
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
      </div>
    </div>
  );
}

/* ────────────── End: Certificate Earned ────────────── */

function CertificateEarned({
  score,
  onReplay,
  onHome,
}: {
  score: { correct: number; attempted: number };
  onReplay: () => void;
  onHome: () => void;
}) {
  const accuracy = score.attempted ? Math.round((score.correct / score.attempted) * 100) : 0;
  const [name, setName] = useState("");
  const display = name.trim() || "— your name —";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.main {...STAGE_MOTION} className="flex min-h-svh flex-col bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onHome} className="caption hover:text-acid">
            ← Home
          </button>
          <span className="caption-acid">CERTIFICATE EARNED</span>
          <span aria-hidden></span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="caption-acid"
        >
          CHALLENGE COMPLETE · ACCURACY {accuracy}%
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-[family-name:var(--font-display-loaded)] text-5xl italic leading-[0.95] sm:text-7xl"
        >
          You earned it.
        </motion.h1>

        {/* The certificate — stamp-style entrance */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 1.05, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hairline relative mt-10 aspect-[4/3] w-full max-w-3xl bg-ink-2 p-6 sm:p-10"
        >
          <div className="hairline-soft absolute inset-3 sm:inset-5" aria-hidden />
          {["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"].map((c) => (
            <span key={c} aria-hidden className={`absolute ${c} h-1.5 w-1.5 bg-acid`} />
          ))}
          <div className="relative flex h-full flex-col items-center justify-center text-center">
            <p className="caption-acid">SPELLHAND</p>
            <p className="mt-3 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-tight sm:text-5xl">
              Certificate of
              <br />
              Fingerspelling
            </p>
            <p className="caption mt-6 text-bone-3">awarded to</p>
            <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-xl italic text-bone sm:text-3xl">
              {display}
            </p>
            <p className="caption mt-6 max-w-xs text-bone-3">
              for mastering the American Sign Language alphabet
            </p>
            <p className="caption mt-4 text-bone-3">{today}</p>
          </div>
        </motion.div>

        {/* Name input */}
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3">
          <label htmlFor="cert-name" className="caption text-bone-2">
            Your name on the certificate
          </label>
          <input
            id="cert-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Luthfi"
            className="hairline w-full bg-ink px-4 py-3 text-center font-mono text-sm text-bone outline-none placeholder:text-bone-3 focus:border-acid focus:bg-ink-2"
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <button
            onClick={onReplay}
            className="hairline bg-ink px-6 py-3 font-mono text-sm hover:bg-acid hover:text-ink"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onHome}
            className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink"
          >
            FINISH <span aria-hidden>→</span>
          </button>
        </div>
        <p className="caption mt-6 max-w-md text-center text-bone-3">
          A downloadable PDF and shareable link arrive when accounts ship.
        </p>
      </div>
    </motion.main>
  );
}

