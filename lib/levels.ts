import { LETTERS, type LetterCode } from "./letters";

export type LevelNumber = 1 | 2 | 3 | 4;

export interface LevelDef {
  number: LevelNumber;
  /** Cumulative letter pool — every letter playable at this level (inclusive of prior levels). */
  pool: LetterCode[];
  /** Letters NEWLY introduced in this level. */
  newLetters: LetterCode[];
  /** Tagline shown on the intro page. */
  blurb: string;
  /** Curated word list. Every letter in every word is in the pool. */
  words: string[];
}

function poolUpTo(level: LevelNumber): LetterCode[] {
  return LETTERS.filter((l) => l.level <= level).map((l) => l.code);
}
function lettersFor(level: LevelNumber): LetterCode[] {
  return LETTERS.filter((l) => l.level === level).map((l) => l.code);
}

export const LEVELS: Record<LevelNumber, LevelDef> = {
  1: {
    number: 1,
    pool: poolUpTo(1),
    newLetters: lettersFor(1),
    blurb: "Get ready to learn the letters A, B, C, E, L, O, V, W, U, Y.",
    words: ["ACE", "BOY", "COW", "OWL", "CAVE", "CLAY"],
  },
  2: {
    number: 2,
    pool: poolUpTo(2),
    newLetters: lettersFor(2),
    blurb: "We add the letters D, F, I, K, R, S, T to your vocabulary.",
    words: ["DICE", "FACE", "KITE", "FAST", "RIDE", "STAR"],
  },
  3: {
    number: 3,
    pool: poolUpTo(3),
    newLetters: lettersFor(3),
    blurb: "Ready for more — this time G, H, M, N, X.",
    words: ["GAME", "MAN", "MIX", "HUG", "NICE", "THINK"],
  },
  4: {
    number: 4,
    pool: poolUpTo(4),
    newLetters: lettersFor(4),
    blurb:
      "Two letters where you turn your hand downward — P and Q. (J and Z need motion and arrive in a future edition.)",
    words: ["POP", "CUP", "MAP", "QUARK", "QUIET", "HAPPY"],
  },
};

export const LEVEL_NUMBERS: LevelNumber[] = [1, 2, 3, 4];

export function levelFromParam(raw: string): LevelDef | null {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3 || n === 4) return LEVELS[n];
  return null;
}

/**
 * The final challenge — exam mode.
 * Pool: all 24 static letters. No reference image during play.
 * Completing all words earns the certificate.
 */
export const CHALLENGE = {
  pool: LETTERS.map((l) => l.code),
  blurb: "No reference image. From memory. Ten words spanning every static letter.",
  words: [
    "ALPHABET",
    "QUICKLY",
    "NIGHT",
    "WOLF",
    "MAX",
    "RUSH",
    "SPEND",
    "DREAM",
    "WAVE",
    "FACT",
  ],
} as const;
