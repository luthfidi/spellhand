"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LetterGlyph } from "@/components/specimen/letter-glyph";
import type { LetterCode } from "@/lib/letters";
import { cn } from "@/lib/utils";

const INVERTED_LETTERS = new Set<LetterCode>(["G", "H", "P", "Q"]);

/** Letters whose hand orientation is non-trivial — show a perspective note. */
const NEEDS_PERSPECTIVE_NOTE = new Set<LetterCode>(["G", "H", "P", "Q"]);

/** Per-letter rotation (degrees). Negative = counter-clockwise. */
const ROTATED_LETTERS = new Map<LetterCode, number>();

/**
 * Game-only left panel. Hand image + target letter side-by-side on top,
 * word being spelled below. No caption chrome.
 */
export function GameLeftPanel({
  letter,
  word,
  letterIndex,
  confidence,
  mirror = false,
  className,
}: {
  letter: LetterCode;
  word: string;
  letterIndex: number;
  confidence: number;
  mirror?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative flex h-full w-full flex-col bg-ink-2", className)}>
      {/* Top: hand image + letter glyph side-by-side (hand dominant) */}
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
              {NEEDS_PERSPECTIVE_NOTE.has(letter) ? (
                <p className="caption-acid whitespace-nowrap text-center text-sm tracking-[0.14em] sm:text-base">
                  PALM FACES AWAY FROM CAMERA
                </p>
              ) : null}
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
                className="text-[16vw] leading-none text-bone sm:text-[12vw] lg:text-[9vw] xl:text-[9rem]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom: word with per-letter progress */}
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

function LetterImage({ letter, mirror }: { letter: LetterCode; mirror?: boolean }) {
  const [errored, setErrored] = useState(false);
  const effectiveMirror = INVERTED_LETTERS.has(letter) ? !mirror : mirror;
  const rotation = ROTATED_LETTERS.get(letter) ?? 0;

  // Compose transform — mirror then rotate (order matters; rotate first
  // would flip the visual rotation direction after mirroring).
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
      alt={`Hand shape for the letter ${letter}`}
      onError={() => setErrored(true)}
      className={cn(
        // Mobile: cap to viewport-relative size so it scales with phone height.
        // Desktop / tablet: fill container.
        "max-h-[22vh] max-w-[55vw] object-contain sm:max-h-full sm:max-w-full",
        "[filter:invert(0.97)_sepia(0.08)_saturate(0.4)]",
        "[width:auto] [height:auto]",
      )}
      style={style}
      draggable={false}
    />
  );
}
