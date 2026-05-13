import type { LetterCode } from "@/lib/letters";

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type Handedness = "Left" | "Right";

export interface ClassifyInput {
  landmarks: Landmark[]; // 21 points
  handedness: Handedness;
}

export type HintKind = "orientation" | "fingers" | "position";

export interface Hint {
  kind: HintKind;
  message: string;
}

/**
 * A single sub-condition that a letter rule decomposes into.
 * - `satisfied`: whether this specific condition is currently met
 * - `landmarks` + `connections`: which parts of the skeleton this condition
 *   pertains to (so the overlay can highlight unsatisfied parts in grey).
 */
export type Connection = readonly [number, number];

export interface SubCheck {
  label: string;
  satisfied: boolean;
  landmarks: readonly number[];
  connections: readonly Connection[];
}

export interface RuleResult {
  letter: LetterCode;
  match: boolean;
  /** 0..1, derived from sub-check pass rate. */
  confidence: number;
  /** Per-aspect breakdown. The overlay reads this to color the skeleton. */
  subChecks?: SubCheck[];
  /** Short corrective hints shown when not matching. */
  hints?: Hint[];
  notImplemented?: boolean;
}

export type LetterRule = (input: ClassifyInput) => RuleResult;

export const FINGER_NAMES = ["thumb", "index", "middle", "ring", "pinky"] as const;
export type FingerName = (typeof FINGER_NAMES)[number];
