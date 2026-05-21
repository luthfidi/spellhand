/**
 * Cross-cutting timing constants for the gameplay stages.
 * Keep these here so play / challenge / practice stay in sync, and so any
 * tuning conversation can point at one file.
 */

/** Acid build-up speed when the rule matches (units per second). */
export const SUSTAIN_PER_SEC = 1.7;

/** Acid decay speed when the rule no longer matches (units per second). */
export const DECAY_PER_SEC = 0.6;

/** Match progress reaches this value and the letter is considered locked. */
export const PROGRESS_LOCK = 1.0;

/** Hold duration for the "WORD COMPLETE" celebration overlay (ms). */
export const CELEBRATE_HOLD_MS = 1100;

/** Auto-advance delay shown when classifier reports `notImplemented` (ms). */
export const NOT_IMPLEMENTED_AUTO_ADVANCE_MS = 1600;

/** How long the user must struggle before we offer a "skip letter" button. */
export const SKIP_OFFER_MS_PLAY = 15_000;

/** Same idea in the Challenge — slightly stricter since it gates the cert. */
export const SKIP_OFFER_MS_CHALLENGE = 20_000;
