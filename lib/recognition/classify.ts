import type { LetterCode } from "@/lib/letters";
import { LETTER_RULES } from "./asl";
import type { ClassifyInput, Landmark, RuleResult } from "./types";

export interface ClassifyAgainstTargetResult {
  target: LetterCode;
  result: RuleResult;
}

/**
 * Detection objects from `useHandLandmarker` may carry both raw and
 * aspect-corrected landmarks. Pick the corrected ones when available so
 * distance ratios behave the same across phone / laptop camera aspects.
 */
function pickLandmarks(input: ClassifyInput | { scaledLandmarks?: Landmark[]; landmarks: Landmark[]; handedness: ClassifyInput["handedness"] }): ClassifyInput {
  const maybeScaled = (input as { scaledLandmarks?: Landmark[] }).scaledLandmarks;
  if (maybeScaled && maybeScaled.length > 0) {
    return { landmarks: maybeScaled, handedness: input.handedness };
  }
  return { landmarks: input.landmarks, handedness: input.handedness };
}

/** Run the rule for a single target letter. */
export function classifyAgainstTarget(
  input: ClassifyInput | { scaledLandmarks?: Landmark[]; landmarks: Landmark[]; handedness: ClassifyInput["handedness"] },
  target: LetterCode,
): ClassifyAgainstTargetResult {
  const rule = LETTER_RULES[target];
  return { target, result: rule(pickLandmarks(input)) };
}

/** Run all letter rules, return the highest-confidence match. */
export function classifyAll(
  input: ClassifyInput | { scaledLandmarks?: Landmark[]; landmarks: Landmark[]; handedness: ClassifyInput["handedness"] },
): RuleResult | null {
  const resolved = pickLandmarks(input);
  let best: RuleResult | null = null;
  for (const code of Object.keys(LETTER_RULES) as LetterCode[]) {
    const r = LETTER_RULES[code](resolved);
    if (r.notImplemented) continue;
    if (!best || r.confidence > best.confidence) best = r;
  }
  return best;
}
