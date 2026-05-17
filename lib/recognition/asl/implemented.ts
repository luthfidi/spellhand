/**
 * Per-finger sub-check rules for the static ASL alphabet (24 letters; J/Z dynamic).
 *
 * Each rule decomposes the letter into independent boolean checks. The
 * overlay highlights satisfied parts in colour and dim-grey the failing
 * parts, so a learner can see *which finger* is wrong — not just the
 * overall pass/fail.
 *
 * confidence = (passed / total) checks. match = all passed.
 */

import {
  FINGER_CONNECTIONS,
  FINGER_LANDMARKS,
  HAND,
  aggregate,
  angleAt,
  check,
  checkCurled,
  checkExtended,
  checkHalfCurled,
  dist2,
  isExtended,
  pipAngle,
  tipDistance,
} from "../helpers";
import { classifyJMotion, classifyZMotion, type MotionResult } from "../motion";
import type { ClassifyInput, RuleResult, SubCheck } from "../types";

const THUMB_LM = FINGER_LANDMARKS.thumb;
const THUMB_CON = FINGER_CONNECTIONS.thumb;

/* ────────────────── A ──────────────────
 * Closed fist with thumb riding along the side.
 */
export function ruleA(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbStraight =
    angleAt(landmarks[HAND.THUMB_MCP], landmarks[HAND.THUMB_IP], landmarks[HAND.THUMB_TIP]) > 145;
  const thumbNearIndex =
    dist2(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_MCP]) < 0.18;
  return aggregate("A", [
    checkCurled(landmarks, "index"),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Thumb along side", thumbStraight && thumbNearIndex, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── B ──────────────────
 * Four fingers up, thumb folded across the palm.
 */
export function ruleB(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbFolded = !isExtended(landmarks, "thumb", 150);
  const fingersUp =
    landmarks[HAND.INDEX_TIP].y < landmarks[HAND.WRIST].y &&
    landmarks[HAND.PINKY_TIP].y < landmarks[HAND.WRIST].y;
  return aggregate("B", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkExtended(landmarks, "ring"),
    checkExtended(landmarks, "pinky"),
    check("Thumb folded across palm", thumbFolded, THUMB_LM, THUMB_CON),
    check("Hand pointing up", fingersUp),
  ]);
}

/* ────────────────── C ──────────────────
 * Curved hand forming a C, fingers half-curled.
 * Loosened after testing: real C hands have wide threshold variance.
 */
export function ruleC(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbAngle = angleAt(
    landmarks[HAND.THUMB_MCP],
    landmarks[HAND.THUMB_IP],
    landmarks[HAND.THUMB_TIP],
  );
  const thumbCurved = thumbAngle > 110 && thumbAngle < 178;
  const idxThumbGap = tipDistance(landmarks, "index", "thumb");
  // Just exclude "closed loop" (would be O) and unrealistic stretches.
  const gapOk = idxThumbGap > 0.15 && idxThumbGap < 0.90;
  return aggregate("C", [
    checkHalfCurled(landmarks, "index", 70, 175),
    checkHalfCurled(landmarks, "middle", 70, 175),
    checkHalfCurled(landmarks, "ring", 70, 175),
    checkHalfCurled(landmarks, "pinky", 70, 175),
    check("Thumb curved", thumbCurved, THUMB_LM, THUMB_CON),
    // Attach gap check to thumb+index so when it fails, both go dim — visible signal.
    check(
      "Open C-gap (thumb ↔ index)",
      gapOk,
      [...FINGER_LANDMARKS.index, ...THUMB_LM],
      [...FINGER_CONNECTIONS.index, ...THUMB_CON],
    ),
  ]);
}

/* ────────────────── D ──────────────────
 * Index up; middle, ring, pinky curl in to meet the thumb tip.
 */
export function ruleD(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbToMiddle = tipDistance(landmarks, "thumb", "middle");
  return aggregate("D", [
    checkExtended(landmarks, "index"),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check(
      "Thumb meets middle fingertip",
      thumbToMiddle < 0.28,
      THUMB_LM,
      THUMB_CON,
    ),
  ]);
}

/* ────────────────── E ──────────────────
 * All four fingertips curl down to meet the thumb. Compact.
 */
export function ruleE(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const tipsClose = (["index", "middle", "ring", "pinky"] as const).every(
    (f) => tipDistance(landmarks, f, "thumb") < 0.30,
  );
  return aggregate("E", [
    checkCurled(landmarks, "index", 130),
    checkCurled(landmarks, "middle", 130),
    checkCurled(landmarks, "ring", 130),
    checkCurled(landmarks, "pinky", 130),
    check("All four tips press against thumb", tipsClose, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── F ──────────────────
 * Index + thumb pinch into an O; middle, ring, pinky extended up.
 */
export function ruleF(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const pinch = tipDistance(landmarks, "index", "thumb") < 0.16;
  return aggregate("F", [
    check(
      "Index + thumb pinched",
      pinch,
      [...FINGER_LANDMARKS.index, ...THUMB_LM],
      [...FINGER_CONNECTIONS.index, ...THUMB_CON],
    ),
    checkExtended(landmarks, "middle"),
    checkExtended(landmarks, "ring"),
    checkExtended(landmarks, "pinky"),
  ]);
}

/* ────────────────── G ──────────────────
 * Index horizontal, thumb parallel above. Hand sideways.
 */
export function ruleG(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxDx = landmarks[HAND.INDEX_TIP].x - landmarks[HAND.INDEX_MCP].x;
  const idxDy = landmarks[HAND.INDEX_TIP].y - landmarks[HAND.INDEX_MCP].y;
  const horizontal = Math.abs(idxDx) > Math.abs(idxDy) * 1.3;
  return aggregate("G", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "thumb", 140),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Hand horizontal", horizontal),
  ]);
}

/* ────────────────── H ──────────────────
 * Index + middle extended sideways together; ring/pinky curled.
 * Further loosened — real-world H lands across a wide threshold range.
 */
export function ruleH(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const close = tipDistance(landmarks, "index", "middle") < 0.38;
  const idxDx = landmarks[HAND.INDEX_TIP].x - landmarks[HAND.INDEX_MCP].x;
  const idxDy = landmarks[HAND.INDEX_TIP].y - landmarks[HAND.INDEX_MCP].y;
  // Accept up to ~55° tilt from horizontal.
  const horizontal = Math.abs(idxDx) > Math.abs(idxDy) * 0.7;
  return aggregate("H", [
    checkExtended(landmarks, "index", 145),
    checkExtended(landmarks, "middle", 145),
    checkCurled(landmarks, "ring", 125),
    checkCurled(landmarks, "pinky", 125),
    check(
      "Index + middle touching",
      close,
      [...FINGER_LANDMARKS.index, ...FINGER_LANDMARKS.middle],
      [...FINGER_CONNECTIONS.index, ...FINGER_CONNECTIONS.middle],
    ),
    check(
      "Hand horizontal",
      horizontal,
      [...FINGER_LANDMARKS.index, ...FINGER_LANDMARKS.middle],
      [...FINGER_CONNECTIONS.index, ...FINGER_CONNECTIONS.middle],
    ),
  ]);
}

/* ────────────────── I ──────────────────
 * Pinky up, others curled.
 */
export function ruleI(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbFolded = !isExtended(landmarks, "thumb", 150);
  return aggregate("I", [
    checkExtended(landmarks, "pinky"),
    checkCurled(landmarks, "index"),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    check("Thumb folded", thumbFolded, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── K ──────────────────
 * Index up, middle out at angle, thumb between them.
 */
export function ruleK(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const spread = tipDistance(landmarks, "index", "middle") > 0.28;
  const thumbBetween = dist2(landmarks[HAND.THUMB_TIP], landmarks[HAND.MIDDLE_MCP]) < 0.18;
  return aggregate("K", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Index + middle angled apart", spread),
    check("Thumb between index + middle", thumbBetween, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── L ──────────────────
 * Index up + thumb out at ~90°.
 */
export function ruleL(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const angle = angleAt(
    landmarks[HAND.THUMB_TIP],
    landmarks[HAND.INDEX_MCP],
    landmarks[HAND.INDEX_TIP],
  );
  const rightAngle = Math.abs(angle - 90) < 45;
  return aggregate("L", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "thumb", 145),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Thumb ~ 90° from index", rightAngle),
  ]);
}

/* ────────────────── M ──────────────────
 * Fist with thumb tucked under three fingers. From 2D landmarks, M is
 * indistinguishable from N — the difference is which fingers cover the thumb,
 * which a single camera can't reliably see. The rule accepts a wide curl range
 * and uses thumb position to differentiate from A (thumb side) and S (thumb front).
 */
export function ruleM(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbTucked =
    landmarks[HAND.THUMB_TIP].y > landmarks[HAND.INDEX_MCP].y - 0.01;
  return aggregate("M", [
    checkHalfCurled(landmarks, "index", 30, 150),
    checkHalfCurled(landmarks, "middle", 30, 150),
    checkHalfCurled(landmarks, "ring", 30, 150),
    checkHalfCurled(landmarks, "pinky", 30, 150),
    check("Thumb tucked under fingers", thumbTucked, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── N ──────────────────
 * Fist with thumb tucked under two fingers. Same 2D ambiguity as M — the rule
 * is intentionally permissive; the reference image teaches the difference.
 */
export function ruleN(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbTucked =
    landmarks[HAND.THUMB_TIP].y > landmarks[HAND.INDEX_MCP].y - 0.01;
  return aggregate("N", [
    checkHalfCurled(landmarks, "index", 30, 150),
    checkHalfCurled(landmarks, "middle", 30, 150),
    checkHalfCurled(landmarks, "ring", 30, 150),
    checkHalfCurled(landmarks, "pinky", 30, 150),
    check("Thumb tucked under fingers", thumbTucked, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── O ──────────────────
 * Fingertips meet thumb to form a hollow loop.
 */
export function ruleO(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const pinch = tipDistance(landmarks, "index", "thumb") < 0.20;
  const othersClose = (["middle", "ring", "pinky"] as const).every(
    (f) => tipDistance(landmarks, f, "thumb") < 0.45,
  );
  return aggregate("O", [
    checkHalfCurled(landmarks, "index", 60, 170),
    checkHalfCurled(landmarks, "middle", 60, 170),
    checkHalfCurled(landmarks, "ring", 60, 170),
    checkHalfCurled(landmarks, "pinky", 60, 170),
    check(
      "Index + thumb close the loop",
      pinch,
      [...FINGER_LANDMARKS.index, ...THUMB_LM],
      [...FINGER_CONNECTIONS.index, ...THUMB_CON],
    ),
    check("Others curl toward thumb", othersClose),
  ]);
}

/* ────────────────── P ──────────────────
 * K rotated downward — index points down.
 */
export function ruleP(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexDown = landmarks[HAND.INDEX_TIP].y > landmarks[HAND.INDEX_MCP].y;
  const spread = tipDistance(landmarks, "index", "middle") > 0.22;
  return aggregate("P", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Hand inverted (index points down)", indexDown),
    check("Index + middle angled apart", spread),
  ]);
}

/* ────────────────── Q ──────────────────
 * G rotated downward.
 */
export function ruleQ(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexDown = landmarks[HAND.INDEX_TIP].y > landmarks[HAND.INDEX_MCP].y;
  const thumbDown = landmarks[HAND.THUMB_TIP].y > landmarks[HAND.THUMB_MCP].y;
  return aggregate("Q", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "thumb", 140),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Index + thumb point downward", indexDown && thumbDown),
  ]);
}

/* ────────────────── R ──────────────────
 * Index and middle crossed — tips end up close while their bases are apart.
 * Loosened thresholds: "touching" tips register at ~0.10–0.18 normalized.
 */
export function ruleR(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const tipsClose = tipDistance(landmarks, "index", "middle") < 0.20;
  const mcpsApart = dist2(landmarks[HAND.INDEX_MCP], landmarks[HAND.MIDDLE_MCP]) > 0.025;
  return aggregate("R", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    // Attach to index + middle so the visualization at least covers them
    // (overlay won't dim them while extended-checks satisfy, but failed
    // claims still show on the debug panel and contribute to confidence %).
    check(
      "Index + middle crossed",
      tipsClose && mcpsApart,
      [...FINGER_LANDMARKS.index, ...FINGER_LANDMARKS.middle],
      [...FINGER_CONNECTIONS.index, ...FINGER_CONNECTIONS.middle],
    ),
  ]);
}

/* ────────────────── S ──────────────────
 * Closed fist with thumb across the front.
 */
export function ruleS(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxX = landmarks[HAND.INDEX_MCP].x;
  const pkX = landmarks[HAND.PINKY_MCP].x;
  const minX = Math.min(idxX, pkX);
  const maxX = Math.max(idxX, pkX);
  const thumbX = landmarks[HAND.THUMB_TIP].x;
  const acrossFront = thumbX > minX && thumbX < maxX;
  const thumbLow = landmarks[HAND.THUMB_TIP].y > landmarks[HAND.INDEX_MCP].y;
  return aggregate("S", [
    checkCurled(landmarks, "index"),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Thumb wraps across the front", acrossFront && thumbLow, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── T ──────────────────
 * Fist + thumb tucked between index and middle.
 */
export function ruleT(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idx = landmarks[HAND.INDEX_PIP];
  const mid = landmarks[HAND.MIDDLE_PIP];
  const t = landmarks[HAND.THUMB_TIP];
  const between =
    t.x > Math.min(idx.x, mid.x) - 0.04 && t.x < Math.max(idx.x, mid.x) + 0.04;
  const height = Math.abs(t.y - (idx.y + mid.y) / 2) < 0.08;
  return aggregate("T", [
    checkCurled(landmarks, "index"),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Thumb pokes between index + middle", between && height, THUMB_LM, THUMB_CON),
  ]);
}

/* ────────────────── U ──────────────────
 * Index + middle up, touching.
 */
export function ruleU(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const spread = tipDistance(landmarks, "index", "middle");
  return aggregate("U", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkCurled(landmarks, "ring", 125),
    checkCurled(landmarks, "pinky", 125),
    check("Index + middle touching", spread < 0.18),
  ]);
}

/* ────────────────── V ──────────────────
 * Index + middle spread.
 */
export function ruleV(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const spread = tipDistance(landmarks, "index", "middle");
  return aggregate("V", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Index + middle spread apart", spread > 0.30),
  ]);
}

/* ────────────────── W ──────────────────
 * Three fingers up, pinky curled.
 */
export function ruleW(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const spread =
    (tipDistance(landmarks, "index", "middle") + tipDistance(landmarks, "middle", "ring")) / 2;
  return aggregate("W", [
    checkExtended(landmarks, "index"),
    checkExtended(landmarks, "middle"),
    checkExtended(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Three fingers spread", spread > 0.20),
  ]);
}

/* ────────────────── X ──────────────────
 * Index hooks at ~90°; others curled.
 */
export function ruleX(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxAbove = landmarks[HAND.INDEX_TIP].y < landmarks[HAND.INDEX_MCP].y;
  return aggregate("X", [
    check(
      "Index hooked (~90°)",
      (() => {
        const a = pipAngle(landmarks, "index");
        return a > 70 && a < 130;
      })(),
      FINGER_LANDMARKS.index,
      FINGER_CONNECTIONS.index,
    ),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
    checkCurled(landmarks, "pinky"),
    check("Index points upward (bent, not down)", idxAbove),
  ]);
}

/* ────────────────── Y ──────────────────
 * Thumb + pinky extended; others curled.
 */
export function ruleY(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  return aggregate("Y", [
    checkExtended(landmarks, "thumb", 145),
    checkExtended(landmarks, "pinky"),
    checkCurled(landmarks, "index"),
    checkCurled(landmarks, "middle"),
    checkCurled(landmarks, "ring"),
  ]);
}

/* ───────────── Dynamic letters (J, Z) ─────────────
 * These need a traced motion, not a still pose. The classifier runs against
 * `input.motion` — a path of fingertip positions captured after the user
 * locked the start pose (I shape for J, point-up for Z).
 *
 * When no motion is supplied yet, the rule returns `match: false` with the
 * "trace …" hint so the UI can prompt the user.
 */
function adaptMotion(letter: "J" | "Z", motion: MotionResult): RuleResult {
  const subChecks: SubCheck[] = motion.checks.map((c) => ({
    label: c.label,
    satisfied: c.satisfied,
    landmarks: [],
    connections: [],
  }));
  return {
    letter,
    match: motion.match,
    confidence: motion.confidence,
    subChecks,
    hints: motion.checks
      .filter((c) => !c.satisfied)
      .slice(0, 2)
      .map((c) => ({ kind: "fingers" as const, message: c.label })),
  };
}

export function ruleJ(input: ClassifyInput): RuleResult {
  if (!input.motion || input.motion.length === 0) {
    return {
      letter: "J",
      match: false,
      confidence: 0,
      subChecks: [],
      hints: [{ kind: "fingers", message: "Trace the J shape" }],
    };
  }
  return adaptMotion("J", classifyJMotion(input.motion, input.handedness));
}

export function ruleZ(input: ClassifyInput): RuleResult {
  if (!input.motion || input.motion.length === 0) {
    return {
      letter: "Z",
      match: false,
      confidence: 0,
      subChecks: [],
      hints: [{ kind: "fingers", message: "Trace the Z shape" }],
    };
  }
  return adaptMotion("Z", classifyZMotion(input.motion, input.handedness));
}
