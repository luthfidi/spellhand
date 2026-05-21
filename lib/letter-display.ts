import type { LetterCode } from "./letters";

/** Letters whose Wikimedia illustration shows the hand from palm-away — mirror
 * the image opposite to the user's hand-preference flip so the reference
 * matches the camera view. */
export const INVERTED_LETTERS = new Set<LetterCode>(["G", "H", "P", "Q"]);

/** Letters whose orientation is non-trivial — show a "palm faces away" note. */
export const NEEDS_PERSPECTIVE_NOTE = new Set<LetterCode>(["G", "H", "P", "Q"]);

/** Per-letter rotation override (degrees). Negative = counter-clockwise. */
export const ROTATED_LETTERS = new Map<LetterCode, number>();

export function letterImageSrc(letter: LetterCode): string {
  return `/letters/asl/${letter.toLowerCase()}.svg`;
}
