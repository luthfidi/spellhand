export type LetterCode =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I"
  | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S"
  | "T" | "U" | "V" | "W" | "X" | "Y";
// J and Z are dynamic — Phase 4

export interface LetterMeta {
  code: LetterCode;
  index: number;          // 01..24 (catalogue order)
  nato: string;           // NATO phonetic name
  description: string;    // one-line anatomical description
  fingers: string[];      // bullet list of finger positions
  level: 1 | 2 | 3 | 4;   // progression bucket (mirrors fingerspelling.xyz)
  implemented: boolean;   // whether a real rule exists yet
}

export const LETTERS: LetterMeta[] = [
  { code: "A", index: 1,  nato: "Alpha",    level: 1, implemented: true,
    description: "Closed fist with thumb riding along the side.",
    fingers: ["Index curled tightly", "Middle curled tightly", "Ring curled tightly", "Pinky curled tightly", "Thumb extended along index"] },
  { code: "B", index: 2,  nato: "Bravo",    level: 1, implemented: true,
    description: "Four fingers stand upright, thumb folded across the palm.",
    fingers: ["Index extended up", "Middle extended up", "Ring extended up", "Pinky extended up", "Thumb folded across palm"] },
  { code: "C", index: 3,  nato: "Charlie",  level: 1, implemented: true,
    description: "Hand curves into the shape of a C, palm facing the side.",
    fingers: ["All four fingers curved together", "Thumb curved to meet fingers", "Palm faces sideways"] },
  { code: "D", index: 4,  nato: "Delta",    level: 2, implemented: true,
    description: "Index points up, other fingertips meet the thumb.",
    fingers: ["Index extended up", "Middle, ring, pinky curled to thumb", "Thumb touches middle fingertip"] },
  { code: "E", index: 5,  nato: "Echo",     level: 1, implemented: true,
    description: "Fingertips curl down to meet the thumb.",
    fingers: ["All fingers curled to thumb", "Thumb tucks under fingers", "Palm faces forward"] },
  { code: "F", index: 6,  nato: "Foxtrot",  level: 2, implemented: true,
    description: "Index and thumb pinch into a circle, three fingers extended.",
    fingers: ["Index + thumb form O", "Middle extended up", "Ring extended up", "Pinky extended up"] },
  { code: "G", index: 7,  nato: "Golf",     level: 3, implemented: true,
    description: "Index finger points sideways, thumb rests above it.",
    fingers: ["Index extended horizontally", "Thumb extended parallel above index", "Others curled"] },
  { code: "H", index: 8,  nato: "Hotel",    level: 3, implemented: true,
    description: "Index and middle extended sideways together.",
    fingers: ["Index extended horizontally", "Middle extended horizontally", "Others curled"] },
  { code: "I", index: 9,  nato: "India",    level: 2, implemented: true,
    description: "Pinky stands alone; fist is closed.",
    fingers: ["Pinky extended up", "Index, middle, ring curled", "Thumb across palm"] },
  { code: "K", index: 10, nato: "Kilo",     level: 2, implemented: true,
    description: "Index up, middle finger angled out, thumb between them.",
    fingers: ["Index extended up", "Middle extended at angle", "Thumb between index + middle", "Ring + pinky curled"] },
  { code: "L", index: 11, nato: "Lima",     level: 1, implemented: true,
    description: "Thumb and index form a clean right angle.",
    fingers: ["Index extended up", "Thumb extended sideways (90°)", "Middle, ring, pinky curled"] },
  { code: "M", index: 12, nato: "Mike",     level: 4, implemented: true,
    description: "Three fingers fold over the thumb.",
    fingers: ["Index, middle, ring fold over thumb", "Pinky curled", "Thumb tucked beneath three fingers"] },
  { code: "N", index: 13, nato: "November", level: 3, implemented: true,
    description: "Two fingers fold over the thumb.",
    fingers: ["Index, middle fold over thumb", "Ring, pinky curled", "Thumb tucked beneath two fingers"] },
  { code: "O", index: 14, nato: "Oscar",    level: 1, implemented: true,
    description: "Hand forms a hollow O — fingertips meet the thumb tip.",
    fingers: ["All four fingertips curl to meet thumb tip", "Hand forms a closed loop"] },
  { code: "P", index: 15, nato: "Papa",     level: 3, implemented: true,
    description: "Like K but rotated so the hand points down.",
    fingers: ["Hand inverted", "Index extended down", "Middle angled out", "Thumb between"] },
  { code: "Q", index: 16, nato: "Quebec",   level: 4, implemented: true,
    description: "Like G but pointed down.",
    fingers: ["Index extended down", "Thumb extended parallel above index", "Others curled"] },
  { code: "R", index: 17, nato: "Romeo",    level: 2, implemented: true,
    description: "Index and middle fingers cross.",
    fingers: ["Index extended up", "Middle crossed in front of index", "Ring, pinky curled", "Thumb across palm"] },
  { code: "S", index: 18, nato: "Sierra",   level: 4, implemented: true,
    description: "Closed fist with thumb wrapped over the front.",
    fingers: ["All four fingers curled tight", "Thumb across the front of the fingers"] },
  { code: "T", index: 19, nato: "Tango",    level: 3, implemented: true,
    description: "Closed fist, thumb tucked between index and middle.",
    fingers: ["All fingers curled", "Thumb pokes up between index and middle"] },
  { code: "U", index: 20, nato: "Uniform",  level: 1, implemented: true,
    description: "Index and middle extended together, side by side.",
    fingers: ["Index extended up", "Middle extended up (touching index)", "Others curled", "Thumb across palm"] },
  { code: "V", index: 21, nato: "Victor",   level: 1, implemented: true,
    description: "Index and middle spread apart in a V.",
    fingers: ["Index extended up", "Middle extended up (spread from index)", "Ring, pinky curled", "Thumb across palm"] },
  { code: "W", index: 22, nato: "Whiskey",  level: 1, implemented: true,
    description: "Three fingers extended and spread.",
    fingers: ["Index extended up", "Middle extended up", "Ring extended up (all spread)", "Pinky curled to thumb"] },
  { code: "X", index: 23, nato: "X-Ray",    level: 4, implemented: true,
    description: "Index finger crooked like a hook.",
    fingers: ["Index half-curled (hook)", "Middle, ring, pinky curled", "Thumb across palm"] },
  { code: "Y", index: 24, nato: "Yankee",   level: 1, implemented: true,
    description: "Thumb and pinky extended — the hang-loose shape.",
    fingers: ["Thumb extended", "Pinky extended", "Index, middle, ring curled"] },
];

export const LETTER_BY_CODE: Record<LetterCode, LetterMeta> = LETTERS.reduce(
  (acc, l) => {
    acc[l.code] = l;
    return acc;
  },
  {} as Record<LetterCode, LetterMeta>,
);

export const LEVEL_1_CODES = LETTERS.filter((l) => l.level === 1).map((l) => l.code);
export const LEVEL_2_CODES = LETTERS.filter((l) => l.level === 2).map((l) => l.code);
export const LEVEL_3_CODES = LETTERS.filter((l) => l.level === 3).map((l) => l.code);
export const LEVEL_4_CODES = LETTERS.filter((l) => l.level === 4).map((l) => l.code);

export function lettersForLevel(level: 1 | 2 | 3 | 4): LetterMeta[] {
  return LETTERS.filter((l) => l.level <= level);
}
