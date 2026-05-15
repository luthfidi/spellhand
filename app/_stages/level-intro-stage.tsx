"use client";

import { motion } from "motion/react";
import { LEVELS, type LevelNumber } from "@/lib/levels";
import { LETTER_BY_CODE } from "@/lib/letters";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { cn, pad2 } from "@/lib/utils";
import { STAGE_MOTION } from "./stage-motion";

export function LevelIntroStage({
  level,
  onTurnOn,
  onBack,
}: {
  level: LevelNumber;
  onTurnOn: () => void;
  onBack: () => void;
}) {
  const lv = LEVELS[level];
  const newSet = new Set(lv.newLetters);

  return (
    <motion.main {...STAGE_MOTION} className="min-h-svh bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <SpellhandMark href="/" />
          <button onClick={onBack} className="caption hover:text-acid">
            ← Levels
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="caption mb-2">§ LEVEL {pad2(lv.number)}</p>
        <h1 className="font-[family-name:var(--font-display-loaded)] text-6xl italic leading-[0.9] sm:text-8xl">
          Level {lv.number}.
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-bone-2 sm:text-lg">
          {lv.blurb}
        </p>

        <div className="ruled-y -mx-px mt-12">
          <div className="caption ml-px py-3 text-bone-3">
            Letter pool · {lv.pool.length} letters
          </div>
        </div>
        <div className="grid grid-cols-6 -mx-px sm:grid-cols-8 lg:grid-cols-12 [&>*]:border-l [&>*]:border-b [&>*]:border-rule [&>*]:-ml-px [&>*]:-mb-px">
          {lv.pool.map((code, i) => {
            const meta = LETTER_BY_CODE[code];
            const isNew = newSet.has(code);
            return (
              <motion.div
                key={code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.015, duration: 0.3 }}
                className={cn(
                  "relative flex aspect-square items-center justify-center bg-ink",
                  isNew && "bg-acid/[0.06]",
                )}
                title={meta.nato}
              >
                <span
                  className={cn(
                    "font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none sm:text-4xl",
                    isNew ? "text-acid" : "text-bone-2",
                  )}
                >
                  {code}
                </span>
                {isNew ? (
                  <span className="caption-acid absolute right-1 top-1 text-[9px]">NEW</span>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 sm:mt-16">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            onClick={onTurnOn}
            className="group inline-flex items-center gap-5 bg-acid px-10 py-5 text-ink transition-transform hover:-translate-y-px sm:px-14 sm:py-6"
          >
            <span className="font-mono text-base font-medium tracking-[0.06em] sm:text-lg">
              TURN ON WEBCAM
            </span>
            <span aria-hidden className="text-lg transition-transform group-hover:translate-x-1 sm:text-xl">
              →
            </span>
          </motion.button>
          <p className="text-xs text-bone-3 sm:text-sm">
            Look at the hand and copy the shape. {lv.words.length} words to spell.
          </p>
        </div>
      </div>
    </motion.main>
  );
}
