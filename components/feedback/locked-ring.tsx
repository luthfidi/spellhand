"use client";

import { m, AnimatePresence } from "motion/react";

/**
 * Inset acid glow that fades in when the user has matched the target letter.
 * Subtle gamified feedback — visible but doesn't compete with the skeleton.
 */
export function LockedRing({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <m.div
          key="locked-ring"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.55] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            boxShadow:
              "inset 0 0 0 2px var(--color-acid), inset 0 0 60px 12px color-mix(in oklab, var(--color-acid) 35%, transparent)",
          }}
        />
      ) : null}
    </AnimatePresence>
  );
}
