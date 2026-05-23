"use client";

import { m } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The big % display in the top-right of the camera viewport.
 * Subtle pulse + acid colour shift once confidence gets close to lock.
 */
export function ConfidenceDisplay({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const near = confidence >= 0.9;
  const locked = confidence >= 0.999;

  return (
    <m.p
      animate={locked ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={
        locked
          ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      className={cn(
        "font-[family-name:var(--font-display-loaded)] text-5xl italic leading-none tabular-nums transition-colors sm:text-6xl",
        near ? "text-acid" : "text-bone",
      )}
    >
      {pct}
      <span className="text-2xl sm:text-3xl">%</span>
    </m.p>
  );
}
