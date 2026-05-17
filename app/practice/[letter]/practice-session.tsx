"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { translateHint } from "@/lib/i18n/hints";
import type { Locale } from "@/lib/i18n/config";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { CameraGate } from "@/components/camera/camera-gate";
import { ConfidenceDisplay } from "@/components/feedback/confidence-display";
import { LockedRing } from "@/components/feedback/locked-ring";
import { LetterGlyph } from "@/components/specimen/letter-glyph";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import { LETTERS, type LetterCode, type LetterMeta } from "@/lib/letters";
import type { SubCheck } from "@/lib/recognition/types";
import { SubCheckPanel } from "@/components/debug/sub-check-panel";
import { cn, pad2 } from "@/lib/utils";

const INVERTED_LETTERS = new Set<LetterCode>(["G", "H", "P", "Q"]);
const NEEDS_PERSPECTIVE_NOTE = new Set<LetterCode>(["G", "H", "P", "Q"]);
const ROTATED_LETTERS = new Map<LetterCode, number>();

export function PracticeSession({ meta }: { meta: LetterMeta }) {
  const t = useTranslations("practice");
  const tCamera = useTranslations("camera");
  const locale = useLocale() as Locale;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing] = useState<"user" | "environment">("user");
  const { hand: storedHand, setHand } = useHandPreference();
  const hand = storedHand ?? "right";
  const { status, error, detection, start, stop } = useHandLandmarker(videoRef, { facing });

  const [confidence, setConfidence] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [subChecks, setSubChecks] = useState<SubCheck[] | null>(null);

  // Auto-start camera on mount.
  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!detection) return;
    const { result } = classifyAgainstTarget(detection, meta.code);
    setConfidence(result.confidence);
    setSubChecks(result.subChecks ?? null);
    if (result.match) {
      setHint(null);
    } else {
      const raw = result.hints?.[0]?.message;
      setHint(raw ? translateHint(raw, locale) : null);
    }
  }, [detection, meta.code, locale]);

  // Reset when target letter changes (user clicked an arrow).
  useEffect(() => {
    setConfidence(0);
    setSubChecks(null);
    setHint(null);
  }, [meta.code]);

  // Reset when hand leaves frame.
  useEffect(() => {
    if (detection || status !== "running") return;
    setConfidence(0);
    setSubChecks(null);
    setHint(t("hint_place_hand"));
    const timer = setInterval(() => {
      setHint(t("hint_place_hand"));
      setConfidence(0);
      setSubChecks(null);
    }, 400);
    return () => clearInterval(timer);
  }, [detection, status, t]);

  const mirrored = facing === "user";
  const flipReference = mirrored && hand === "right";
  const running = status === "running";

  const prev = LETTERS[(meta.index - 2 + LETTERS.length) % LETTERS.length];
  const next = LETTERS[meta.index % LETTERS.length];

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-ink">
      <SubCheckPanel target={meta.code} subChecks={subChecks} confidence={confidence} />

      {/* Compact header — wordmark + NATO + hand toggle + end */}
      <header className="ruled-b sticky top-0 z-30 bg-ink/85 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <SpellhandMark href="/" />
          <span className="caption">
            {t("header_count", { index: pad2(meta.index), nato: meta.nato.toUpperCase() })}
          </span>
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setHand(hand === "right" ? "left" : "right")}
              className="caption hover:text-acid"
              aria-label={t("toggle_hand_label")}
            >
              {hand === "right" ? t("right_handed") : t("left_handed")}
            </button>
            <Link href="/" className="caption hover:text-acid">
              {t("end")}
            </Link>
          </div>
        </div>
      </header>

      {/* REF + CAMERA SPLIT — same as PlayStage */}
      <div className="grid flex-1 grid-cols-1 grid-rows-2 overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
        {/* Reference */}
        <div
          className={cn(
            "relative border-b border-rule lg:border-b-0",
            hand === "right" ? "lg:order-1 lg:border-r" : "lg:order-2 lg:border-l",
          )}
        >
          <PracticeReferencePanel letter={meta.code} mirror={flipReference} />
        </div>

        {/* Camera */}
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
        </div>
      </div>

      {/* Big edge arrows — always visible */}
      <EdgeArrow
        side="left"
        href={`/practice/${prev.code.toLowerCase()}`}
        letter={prev.code}
        label={t("prev")}
        ariaLabel={t("go_to_letter_label", { letter: prev.code })}
      />
      <EdgeArrow
        side="right"
        href={`/practice/${next.code.toLowerCase()}`}
        letter={next.code}
        label={t("next")}
        ariaLabel={t("go_to_letter_label", { letter: next.code })}
      />
    </main>
  );
}

/* ────────────── Reference (hand + letter, no word/chrome) ────────────── */

function PracticeReferencePanel({
  letter,
  mirror,
}: {
  letter: LetterCode;
  mirror: boolean;
}) {
  return (
    <div className="relative flex h-full w-full bg-ink-2">
      <div className="flex flex-1 items-center justify-center gap-1 overflow-hidden px-2 py-2 sm:gap-2 sm:px-3 sm:py-3">
        <div className="relative flex h-full flex-[2.2] items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={letter}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex max-h-full max-w-full flex-col items-center gap-2 sm:gap-3"
            >
              {NEEDS_PERSPECTIVE_NOTE.has(letter) ? <PalmAwayNote /> : null}
              <div className="flex min-h-0 w-full flex-1 items-center justify-center p-3 sm:p-0">
                <LetterImage letter={letter} mirror={mirror} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={letter}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <LetterGlyph
                letter={letter}
                size="xl"
                className="text-[20vw] leading-none text-bone sm:text-[15vw] lg:text-[12vw] xl:text-[12rem]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PalmAwayNote() {
  const t = useTranslations("practice");
  return (
    <p className="caption-acid whitespace-nowrap text-center text-sm tracking-[0.14em] sm:text-base">
      {t("palm_away_note")}
    </p>
  );
}

function LetterImage({ letter, mirror }: { letter: LetterCode; mirror: boolean }) {
  const t = useTranslations("practice");
  const [errored, setErrored] = useState(false);
  const effectiveMirror = INVERTED_LETTERS.has(letter) ? !mirror : mirror;
  const rotation = ROTATED_LETTERS.get(letter) ?? 0;
  const transform =
    (effectiveMirror ? "scaleX(-1) " : "") + (rotation ? `rotate(${rotation}deg)` : "");
  const style = transform.trim() ? { transform } : undefined;

  if (errored) {
    return (
      <LetterGlyph
        letter={letter}
        size="xl"
        className="text-[24vw] sm:text-[18vw] lg:text-[14vw] xl:text-[12rem] text-bone"
        style={style}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`/letters/asl/${letter.toLowerCase()}.svg`}
      alt={t("letter_alt", { letter })}
      onError={() => setErrored(true)}
      className={cn(
        "max-h-full max-w-full object-contain",
        "[filter:invert(0.97)_sepia(0.08)_saturate(0.4)]",
        "[width:auto] [height:auto]",
      )}
      style={style}
      draggable={false}
    />
  );
}

/* ────────────── Edge arrows (prev / next) ────────────── */

function EdgeArrow({
  side,
  href,
  letter,
  label,
  ariaLabel,
}: {
  side: "left" | "right";
  href: string;
  letter: string;
  label: string;
  ariaLabel: string;
}) {
  const initialX = side === "left" ? -40 : 40;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: initialX }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-1/2 z-40 -translate-y-1/2",
        side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5",
      )}
    >
      <Link
        href={href}
        className="group hairline flex flex-col items-center gap-1 bg-acid px-3 py-5 text-ink shadow-xl transition-transform hover:scale-105 sm:px-5 sm:py-7"
        aria-label={ariaLabel}
      >
        <span className="font-mono text-[10px] tracking-[0.15em] sm:text-xs">{label}</span>
        <span className="font-[family-name:var(--font-display-loaded)] text-4xl italic leading-none sm:text-6xl">
          {letter}
        </span>
        <span className="font-mono text-lg leading-none sm:text-2xl" aria-hidden>
          {side === "left" ? "←" : "→"}
        </span>
      </Link>
    </motion.div>
  );
}

