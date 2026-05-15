/** Shared motion config for stage transitions — subtle horizontal slide + fade. */
export const STAGE_MOTION = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};
