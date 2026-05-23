"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wraps the app in a MotionConfig that respects the user's
 * `prefers-reduced-motion` setting, and a LazyMotion boundary that loads only
 * the `domAnimation` feature bundle. All call-sites use `m.X` (not `motion.X`)
 * so the heavier feature bundles never ship.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
