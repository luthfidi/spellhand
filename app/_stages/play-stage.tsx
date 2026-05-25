"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { translateHint } from "@/lib/i18n/hints";
import type { Locale } from "@/lib/i18n/config";
import { LocaleToggle } from "@/components/locale-toggle";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { CameraGate } from "@/components/camera/camera-gate";
import { GameLeftPanel } from "@/components/reference/game-left-panel";
import { SubCheckPanel } from "@/components/debug/sub-check-panel";
import { ConfidenceDisplay } from "@/components/feedback/confidence-display";
import { LockedRing } from "@/components/feedback/locked-ring";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import { LEVELS, type LevelNumber } from "@/lib/levels";
import type { LetterCode } from "@/lib/letters";
import type { SubCheck } from "@/lib/recognition/types";
import type { Hand } from "@/lib/hooks/use-hand-preference";
import {
  CELEBRATE_HOLD_MS,
  DECAY_PER_SEC,
  NOT_IMPLEMENTED_AUTO_ADVANCE_MS,
  PROGRESS_LOCK,
  SKIP_OFFER_MS_PLAY as SKIP_OFFER_MS,
  SUSTAIN_PER_SEC,
} from "@/lib/timings";
import { cn, pad2 } from "@/lib/utils";
import { STAGE_MOTION } from "./stage-motion";

export function PlayStage({
  levelNumber,
  hand,
  onBack,
  onNextLevel,
  onAllLevels,
  onFinish,
}: {
  levelNumber: LevelNumber;
  hand: Hand;
  onBack: () => void;
  onNextLevel: () => void;
  onAllLevels: () => void;
  onFinish: () => void;
}) {
  const t = useTranslations("play");
  const tCamera = useTranslations("camera");
  const locale = useLocale() as Locale;
  const level = LEVELS[levelNumber];

  const videoRef = useRef<HTMLVideoElement>(null);
  const facing: "user" | "environment" = "user";
  const { status, error, detection, start, stop, restart } = useHandLandmarker(videoRef, { facing });

  const [wordIndex, setWordIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [matchProgress, setMatchProgress] = useState(0);
  // Frame-to-frame timing — keep as a ref so the classifier effect doesn't
  // depend on its own write and re-trigger every render (infinite loop).
  const lastTsRef = useRef<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });
  const [celebrate, setCelebrate] = useState(false);
  const [complete, setComplete] = useState(false);
  const [subChecks, setSubChecks] = useState<SubCheck[] | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [skipOffered, setSkipOffered] = useState(false);

  const word = level.words[wordIndex];
  const targetLetter = (word?.[letterIndex] ?? "A") as LetterCode;

  // Auto-start camera on mount (no extra "START" gate).
  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = useCallback(
    (counted: boolean) => {
      setScore((s) => ({
        correct: s.correct + (counted ? 1 : 0),
        attempted: s.attempted + 1,
      }));
      setMatchProgress(0);
      lastTsRef.current = null;
      setHint(null);
      setSkipOffered(false);

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
        }, CELEBRATE_HOLD_MS);
      } else {
        setLetterIndex((li) => li + 1);
      }
    },
    [letterIndex, word, wordIndex, level.words.length, stop],
  );

  const advance = useCallback(() => goNext(true), [goNext]);
  const skip = useCallback(() => goNext(false), [goNext]);

  // Offer a skip button if the user has been stuck on the same letter for a while.
  useEffect(() => {
    setSkipOffered(false);
    if (celebrate || complete) return;
    const timer = setTimeout(() => setSkipOffered(true), SKIP_OFFER_MS);
    return () => clearTimeout(timer);
  }, [letterIndex, wordIndex, celebrate, complete]);

  useEffect(() => {
    if (!detection || celebrate || complete) return;
    const now = detection.timestamp;
    const dt = lastTsRef.current == null ? 0.04 : Math.min((now - lastTsRef.current) / 1000, 0.2);
    lastTsRef.current = now;
    const { result } = classifyAgainstTarget(detection, targetLetter);
    setSubChecks(result.subChecks ?? null);
    setConfidence(result.confidence);
    if (result.notImplemented) {
      setHint(t("hint_skipping"));
      const timer = setTimeout(advance, NOT_IMPLEMENTED_AUTO_ADVANCE_MS);
      return () => clearTimeout(timer);
    }
    if (result.match) {
      setHint(null);
      setMatchProgress((p) => Math.min(p + SUSTAIN_PER_SEC * dt, PROGRESS_LOCK));
    } else {
      const raw = result.hints?.[0]?.message;
      setHint(raw ? translateHint(raw, locale) : null);
      setMatchProgress((p) => Math.max(p - DECAY_PER_SEC * dt, 0));
    }
  }, [detection, targetLetter, advance, celebrate, complete, locale, t]);

  useEffect(() => {
    if (detection || status !== "running" || celebrate || complete) return;
    setConfidence(0);
    setSubChecks(null);
    setMatchProgress(0);
    setHint(t("hint_place_hand"));
    const timer = setInterval(() => {
      setHint(t("hint_place_hand"));
      setConfidence(0);
      setSubChecks(null);
    }, 400);
    return () => clearInterval(timer);
  }, [detection, status, celebrate, complete, t]);

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
    restart();
  }, [restart]);

  if (complete) {
    return (
      <LevelComplete
        levelNumber={levelNumber}
        score={score}
        wordCount={level.words.length}
        onReplay={replay}
        onNextLevel={onNextLevel}
        onAllLevels={onAllLevels}
        onFinish={onFinish}
      />
    );
  }

  return (
    <m.main {...STAGE_MOTION} className="flex h-svh flex-col overflow-hidden bg-ink">
      <SubCheckPanel target={targetLetter} subChecks={subChecks} confidence={confidence} />

      <header className="ruled-b sticky top-0 z-30 bg-ink/85 backdrop-blur-sm">
        {/* justify-between (not a 3-col grid): the centred WORD/level group can
            be wider than a third of the bar on mobile, so equal columns made it
            collide with BACK / the toggle. Natural widths + space-between keeps
            it visually centred (BACK ≈ the toggle) without overlap. */}
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onBack} className="caption hover:text-acid">
            {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <span className="caption">
              {t("word_label", { current: pad2(wordIndex + 1), total: pad2(level.words.length) })}
            </span>
            <span className="caption text-bone-3">L{level.number}</span>
          </div>
          {/* Theme lives only on the menu screens (Home / Levels) — during a
              drill the language toggle is what matters (a learner who can't read
              the English hints needs to switch mid-play), and keeping it alone
              avoids the navbar colliding with the centred WORD / level on mobile. */}
          <LocaleToggle />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 grid-rows-2 overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
        <div
          className={cn(
            "relative border-b border-rule lg:border-b-0",
            hand === "right" ? "lg:order-1 lg:border-r" : "lg:order-2 lg:border-l",
          )}
        >
          <GameLeftPanel
            letter={targetLetter}
            word={word ?? ""}
            letterIndex={letterIndex}
            confidence={confidence}
            mirror={flipReference}
          />
        </div>

        <div
          data-theme="dark"
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
            aria-label={tCamera("viewport_label")}
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

          <AnimatePresence>
            {running && skipOffered && !celebrate ? (
              <m.button
                key="skip"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                onClick={skip}
                className="hairline absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-1.5 font-mono text-[11px] text-bone-2 backdrop-blur-sm transition-colors hover:text-acid sm:text-xs"
              >
                {t("skip_letter")} <span aria-hidden>→</span>
              </m.button>
            ) : null}
          </AnimatePresence>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-6"
          >
            <AnimatePresence mode="wait">
              {running && hint ? (
                <m.div
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
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Minimal loader — no extra START click required */}
          {!running ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/96 px-6 text-center">
              <CameraGate status={status} error={error} onRetry={start} />
            </div>
          ) : null}

          <AnimatePresence>
            {celebrate ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85"
              >
                <m.div
                  initial={{ scale: 0.7, rotate: -3, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <p className="caption-acid">{t("word_complete")}</p>
                  <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-6xl italic text-acid sm:text-7xl">
                    {word}
                  </p>
                </m.div>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </m.main>
  );
}

/* ─────────────── END-OF-LEVEL SUMMARY ─────────────── */

function LevelComplete({
  levelNumber,
  wordCount,
  score,
  onReplay,
  onNextLevel,
  onAllLevels,
  onFinish,
}: {
  levelNumber: LevelNumber;
  wordCount: number;
  score: { correct: number; attempted: number };
  onReplay: () => void;
  onNextLevel: () => void;
  onAllLevels: () => void;
  onFinish: () => void;
}) {
  const t = useTranslations("play");
  const accuracy = score.attempted ? Math.round((score.correct / score.attempted) * 100) : 0;
  const isLast = levelNumber >= 4;

  return (
    <m.main {...STAGE_MOTION} className="flex min-h-svh flex-col bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onAllLevels} className="caption hover:text-acid">
            {t("back_to_levels")}
          </button>
          <span className="caption">{t("level_complete_header", { n: pad2(levelNumber) })}</span>
          <span aria-hidden></span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="caption-acid"
        >
          {t("result")}
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-[family-name:var(--font-display-loaded)] text-6xl italic leading-[0.95] sm:text-8xl"
        >
          {t("well_done")}
        </m.h1>

        <div className="ruled-y mt-12 grid w-full grid-cols-3 divide-x divide-rule">
          <AnimatedStat label={t("stat_words")} value={wordCount} delay={0.35} />
          <AnimatedStat label={t("stat_correct")} value={score.correct} delay={0.5} />
          <AnimatedStat label={t("stat_accuracy")} value={accuracy} suffix="%" delay={0.65} />
        </div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
        >
          <button onClick={onReplay} className="hairline bg-ink px-6 py-3 font-mono text-sm transition-transform hover:-translate-y-px hover:bg-acid hover:text-ink">
            {t("play_again")}
          </button>
          {isLast ? (
            <button
              onClick={onFinish}
              className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-px"
            >
              {t("finish")} <span aria-hidden>→</span>
            </button>
          ) : (
            <button
              onClick={onNextLevel}
              className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-px"
            >
              {t("next_level")} <span aria-hidden>→</span>
            </button>
          )}
          <button onClick={onAllLevels} className="caption hover:text-acid">
            {t("all_levels")}
          </button>
        </m.div>
      </div>
    </m.main>
  );
}

function AnimatedStat({
  label,
  value,
  suffix = "",
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const startDelay = delay * 1000;
    const duration = 700;
    const t0 = performance.now() + startDelay;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / duration));
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="px-4 py-5"
    >
      <p className="caption">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none text-bone tabular-nums">
        {display}
        {suffix}
      </p>
    </m.div>
  );
}

