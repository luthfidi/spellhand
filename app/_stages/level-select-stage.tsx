"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { CHALLENGE, LEVELS, LEVEL_NUMBERS, type LevelNumber } from "@/lib/levels";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Hand } from "@/lib/hooks/use-hand-preference";
import { pad2 } from "@/lib/utils";
import { STAGE_MOTION } from "./stage-motion";

export function LevelSelectStage({
  onPick,
  onChallenge,
  onBack,
  hand,
  onToggleHand,
}: {
  onPick: (n: LevelNumber) => void;
  onChallenge: () => void;
  onBack: () => void;
  hand: Hand;
  onToggleHand: () => void;
}) {
  const t = useTranslations("level_select");
  return (
    <m.main {...STAGE_MOTION} className="flex h-svh flex-col overflow-hidden bg-ink">
      <header className="ruled-b shrink-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          {/* Compact "S" on phones reclaims the width the toggles need. */}
          <span className="sm:hidden">
            <SpellhandMark href="/" compact />
          </span>
          <span className="hidden sm:inline-flex">
            <SpellhandMark href="/" />
          </span>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <span aria-hidden className="hidden text-bone-3 sm:inline">·</span>
            <LocaleToggle />
            <span aria-hidden className="hidden text-bone-3 sm:inline">·</span>
            <button onClick={onBack} className="caption hover:text-acid">
              {t("back")}
            </button>
          </div>
        </div>
      </header>

      {/* Four level cards — fill the upper portion */}
      <section className="ruled-b -mx-px min-h-0 flex-[3]">
        <div className="grid h-full grid-cols-2 lg:grid-cols-4 [&>*]:border-l [&>*]:border-r [&>*]:border-rule [&>*]:-ml-px">
          {LEVEL_NUMBERS.map((n, idx) => {
            const lv = LEVELS[n];
            return (
              <m.button
                key={n}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onPick(n)}
                className="group relative block h-full overflow-hidden bg-ink px-4 py-3 text-left transition-colors hover:bg-ink-2 sm:px-5 sm:py-4"
              >
                <div className="flex items-start justify-between">
                  <span className="caption">{t("level_label")} {pad2(n)}</span>
                  <span className="caption text-bone-3">{lv.words.length} {t("words")}</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-[family-name:var(--font-display-loaded)] text-[7rem] italic leading-[0.85] text-bone transition-colors group-hover:text-acid sm:text-[9rem] lg:text-[11rem]">
                    {n}
                  </span>
                </div>

                <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-4">
                  <p className="caption truncate text-bone-2">+{lv.newLetters.join(" ")}</p>
                  <span className="caption-acid">→</span>
                </div>
              </m.button>
            );
          })}
        </div>
      </section>

      {/* Challenge — wider, distinct, fills the lower portion */}
      <m.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={onChallenge}
        className="group relative block min-h-0 flex-[2] overflow-hidden border-b border-rule bg-ink px-6 text-left transition-colors hover:bg-acid/[0.04] sm:px-10"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6">
          <div className="flex-1">
            <p className="caption-acid">{t("challenge_eyebrow")}</p>
            <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] text-bone transition-colors group-hover:text-acid sm:text-5xl lg:text-6xl">
              {t("challenge_title")}
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-bone-2 sm:text-sm">
              {t("challenge_body", { letters: CHALLENGE.pool.length, words: CHALLENGE.words.length })}
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <span className="font-[family-name:var(--font-display-loaded)] text-[5rem] italic leading-[0.85] text-acid sm:text-[6rem] lg:text-[8rem]">
              ✦
            </span>
          </div>
        </div>
        <span aria-hidden className="absolute right-6 bottom-4 text-acid sm:right-10 sm:bottom-6">
          →
        </span>
      </m.button>

      {/* Hand toggle footer */}
      <div className="shrink-0">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 sm:px-6 sm:py-4">
          <button onClick={onToggleHand} className="caption hover:text-acid">
            {hand === "right" ? t("right_handed") : t("left_handed")} · {t("change")}
          </button>
        </div>
      </div>
    </m.main>
  );
}
