import type { LetterCode } from "@/lib/letters";
import { LETTER_RULES } from "./asl";
import type { ClassifyInput, RuleResult } from "./types";

export interface ClassifyAgainstTargetResult {
  target: LetterCode;
  result: RuleResult;
}

/** Run the rule for a single target letter. */
export function classifyAgainstTarget(
  input: ClassifyInput,
  target: LetterCode,
): ClassifyAgainstTargetResult {
  const rule = LETTER_RULES[target];
  return { target, result: rule(input) };
}

/** Run all letter rules, return the highest-confidence match. */
export function classifyAll(input: ClassifyInput): RuleResult | null {
  let best: RuleResult | null = null;
  for (const code of Object.keys(LETTER_RULES) as LetterCode[]) {
    const r = LETTER_RULES[code](input);
    if (r.notImplemented) continue;
    if (!best || r.confidence > best.confidence) best = r;
  }
  return best;
}
