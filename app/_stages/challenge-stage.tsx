"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { translateHint } from "@/lib/i18n/hints";
import type { Locale } from "@/lib/i18n/config";
import { LandmarkOverlay } from "@/components/camera/landmark-overlay";
import { CameraGate } from "@/components/camera/camera-gate";
import { SubCheckPanel } from "@/components/debug/sub-check-panel";
import { ConfidenceDisplay } from "@/components/feedback/confidence-display";
import { LockedRing } from "@/components/feedback/locked-ring";
import { LocaleToggle } from "@/components/locale-toggle";
import { CertificateCard } from "@/components/certificate/certificate-card";
import { LetterGlyph } from "@/components/specimen/letter-glyph";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { useHandLandmarker } from "@/lib/mediapipe/use-hand-landmarker";
import { classifyAgainstTarget } from "@/lib/recognition/classify";
import { CHALLENGE } from "@/lib/levels";
import type { LetterCode } from "@/lib/letters";
import type { SubCheck } from "@/lib/recognition/types";
import type { Hand } from "@/lib/hooks/use-hand-preference";
import {
  CELEBRATE_HOLD_MS,
  DECAY_PER_SEC,
  NOT_IMPLEMENTED_AUTO_ADVANCE_MS,
  PROGRESS_LOCK,
  SKIP_OFFER_MS_CHALLENGE as SKIP_OFFER_MS,
  SUSTAIN_PER_SEC,
} from "@/lib/timings";
import { cn, pad2 } from "@/lib/utils";
import { STAGE_MOTION } from "./stage-motion";

export function ChallengeStage({
  hand,
  onBack,
}: {
  hand: Hand;
  onBack: () => void;
}) {
  const t = useTranslations("challenge");
  const tCamera = useTranslations("camera");
  const locale = useLocale() as Locale;
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

  const word = CHALLENGE.words[wordIndex];
  const targetLetter = (word?.[letterIndex] ?? "A") as LetterCode;

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
          if (wordIndex + 1 >= CHALLENGE.words.length) {
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
    [letterIndex, word, wordIndex, stop],
  );

  const advance = useCallback(() => goNext(true), [goNext]);
  const skip = useCallback(() => goNext(false), [goNext]);

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
    return <CertificateEarned score={score} onReplay={replay} />;
  }

  return (
    <m.main {...STAGE_MOTION} className="flex h-svh flex-col overflow-hidden bg-ink">
      <SubCheckPanel target={targetLetter} subChecks={subChecks} confidence={confidence} />

      <header className="ruled-b sticky top-0 z-30 bg-ink/85 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onBack} className="caption hover:text-acid">
            {t("back")}
          </button>
          <span className="caption">
            {t("word_label", { current: pad2(wordIndex + 1), total: pad2(CHALLENGE.words.length) })}
          </span>
          {/* Language stays reachable mid-challenge (English hints); the
              CHALLENGE mode tag is decorative, so it drops off on phones. */}
          <div className="flex items-center gap-3">
            <span className="caption-acid hidden sm:inline">{t("challenge_label")}</span>
            <span aria-hidden className="hidden text-bone-3 sm:inline">·</span>
            <LocaleToggle />
          </div>
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
          <m.div
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
          </m.div>
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
                <m.span
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
                </m.span>
                <span className="relative block h-[2px] w-6 bg-rule sm:w-8">
                  <m.span
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
}: {
  score: { correct: number; attempted: number };
  onReplay: () => void;
}) {
  const t = useTranslations("challenge");
  const tHero = useTranslations("hero");
  const accuracy = score.attempted ? Math.round((score.correct / score.attempted) * 100) : 0;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resentFlash, setResentFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = name.trim() || tHero("cert_name_placeholder");
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 0 && emailLooksValid && !sending && !sent;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const { sendCertMagicLink } = await import("@/app/_actions/auth");
      const res = await sendCertMagicLink(email, name);
      if ("error" in res) {
        setError(res.error);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generic_send_error"));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await send();
  };

  const editEmail = () => {
    setSent(false);
    setError(null);
  };

  const resend = async () => {
    if (sending) return;
    await send();
    setResentFlash(true);
    setTimeout(() => setResentFlash(false), 2500);
  };

  return (
    <m.main {...STAGE_MOTION} className="flex min-h-svh flex-col bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <SpellhandMark href="/" />
          <span className="caption-acid">{t("earned_header")}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="caption-acid"
        >
          {t("earned_eyebrow", { pct: accuracy })}
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-[family-name:var(--font-display-loaded)] text-5xl italic leading-[0.95] sm:text-7xl"
        >
          {t("earned_title")}
        </m.h1>

        {/* Live preview certificate — shared design with the cert page / PNG. */}
        <m.div
          initial={{ opacity: 0, y: 24, scale: 1.05, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 w-full max-w-3xl"
        >
          <CertificateCard name={display} />
        </m.div>

        {/* Claim form */}
        {!sent ? (
          <m.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10 flex w-full max-w-md flex-col items-center gap-3"
          >
            <p className="caption text-bone-2">{t("claim_caption")}</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder={t("name_placeholder")}
              autoComplete="name"
              required
              className="hairline w-full bg-ink px-4 py-3 text-center font-mono text-sm text-bone outline-none placeholder:text-bone-3 focus:border-acid focus:bg-ink-2"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder")}
              autoComplete="email"
              required
              className="hairline w-full bg-ink px-4 py-3 text-center font-mono text-sm text-bone outline-none placeholder:text-bone-3 focus:border-acid focus:bg-ink-2"
            />
            {error ? (
              <p className="caption text-blood">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 inline-flex w-full items-center justify-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {sending ? t("submit_sending") : t("submit_idle")}
            </button>
            <p className="caption mt-2 max-w-xs text-center text-bone-3">
              {t("no_password_note")}
            </p>
            <button
              type="button"
              onClick={onReplay}
              className="caption mt-4 hover:text-acid"
            >
              {t("play_again_link")}
            </button>
          </m.form>
        ) : (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 flex w-full max-w-md flex-col items-center gap-3 text-center"
          >
            <p className="caption-acid">{t("sent_eyebrow")}</p>
            <p className="font-[family-name:var(--font-display-loaded)] text-3xl italic leading-tight sm:text-4xl">
              {t("sent_title")}
            </p>
            <p className="font-mono text-sm leading-relaxed text-bone-2">
              {t("sent_body_prefix")} <span className="text-bone">{email}</span>.
              <br />
              {t("sent_body_suffix")}
            </p>
            <p className="caption mt-2 text-bone-3">{t("sent_footnote")}</p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={resend}
                disabled={sending}
                className="caption hover:text-acid disabled:opacity-50"
              >
                {sending ? t("submit_sending") : resentFlash ? t("resend_done") : t("resend")}
              </button>
              <span aria-hidden className="text-bone-3">·</span>
              <button
                type="button"
                onClick={editEmail}
                className="caption hover:text-acid"
              >
                {t("edit_email")}
              </button>
            </div>
            {error ? <p className="caption mt-2 text-blood">{error}</p> : null}
          </m.div>
        )}
      </div>
    </m.main>
  );
}

