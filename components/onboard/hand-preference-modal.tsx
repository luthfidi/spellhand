"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Hand } from "@/lib/hooks/use-hand-preference";

export function HandPreferenceModal({
  open,
  onPick,
}: {
  open: boolean;
  onPick: (h: Hand) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Pick your dominant hand"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hairline w-full max-w-lg bg-ink-2 px-6 py-10 text-center sm:px-12 sm:py-14"
          >
            <p className="caption-acid">SETUP · 01 / 01</p>
            <h2 className="mt-4 font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] sm:text-5xl">
              Left or right<br />handed?
            </h2>
            <p className="mt-5 max-w-sm mx-auto text-xs text-bone-3 sm:text-sm">
              Pick the hand you&apos;ll sign with. We&apos;ll mirror the reference to match.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => onPick("left")}
                className="hairline bg-ink px-6 py-6 font-mono text-sm tracking-[0.08em] transition-colors hover:bg-acid hover:text-ink sm:py-8 sm:text-base"
              >
                LEFT
              </button>
              <button
                onClick={() => onPick("right")}
                className="hairline bg-ink px-6 py-6 font-mono text-sm tracking-[0.08em] transition-colors hover:bg-acid hover:text-ink sm:py-8 sm:text-base"
              >
                RIGHT
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
