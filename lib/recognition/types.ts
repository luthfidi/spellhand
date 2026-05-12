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

export interface RuleResult {
  /** Letter that this rule represents. */
  letter: LetterCode;
  /** True if landmarks satisfy the rule strongly. */
  match: boolean;
  /** 0..1 — how confident the rule is. Used for soft "almost!" feedback. */
  confidence: number;
  /** Optional human-readable corrections. Shown when not matching. */
  hints?: Hint[];
  /** True if no real rule exists yet (placeholder). */
  notImplemented?: boolean;
}

export type LetterRule = (input: ClassifyInput) => RuleResult;

export const FINGER_NAMES = ["thumb", "index", "middle", "ring", "pinky"] as const;
export type FingerName = (typeof FINGER_NAMES)[number];
