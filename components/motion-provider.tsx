"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wraps the app in a MotionConfig that respects the user's
 * `prefers-reduced-motion` setting. Set once at the root so every
 * `motion.X` component picks it up automatically.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
