import type { LetterCode } from "@/lib/letters";
import type { LetterRule } from "../types";
import {
  ruleA, ruleB, ruleC, ruleD, ruleE, ruleF, ruleG, ruleH, ruleI,
  ruleK, ruleL, ruleM, ruleN, ruleO, ruleP, ruleQ, ruleR, ruleS,
  ruleT, ruleU, ruleV, ruleW, ruleX, ruleY,
} from "./implemented";

export const LETTER_RULES: Record<LetterCode, LetterRule> = {
  A: ruleA, B: ruleB, C: ruleC, D: ruleD, E: ruleE, F: ruleF,
  G: ruleG, H: ruleH, I: ruleI, K: ruleK, L: ruleL, M: ruleM,
  N: ruleN, O: ruleO, P: ruleP, Q: ruleQ, R: ruleR, S: ruleS,
  T: ruleT, U: ruleU, V: ruleV, W: ruleW, X: ruleX, Y: ruleY,
};
