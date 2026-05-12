/**
 * Hand-tuned rules for the static ASL alphabet (24 letters; J and Z are dynamic).
 * Each rule receives 21 hand landmarks + handedness and returns
 *   { match, confidence, hints? }.
 *
 * Tuning notes:
 * - "match" must be reasonably strict so the player isn't auto-passed.
 * - "confidence" should still rise even when match is false, so the bar
 *   in /play feels responsive.
 * - Letters in the same handshape family (M/N/S/T, K/V, A/S/T) are inherently
 *   hard to disambiguate from 2D landmarks. Those are flagged with TUNE-NEEDED.
 */

import {
  HAND,
  allCurled,
  allExtended,
  angleAt,
  dist2,
  isCurled,
  isExtended,
  palmDirection,
  pipAngle,
  smooth01,
  tip,
  tipDistance,
} from "../helpers";
import type { ClassifyInput, RuleResult } from "../types";

const F_INDEX_MID_RING_PINKY = ["index", "middle", "ring", "pinky"] as const;

/* ────────────────── A ────────────────── */
export function ruleA(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const fistClosed = allCurled(landmarks, ["index", "middle", "ring", "pinky"]);
  const thumbStraight = angleAt(landmarks[HAND.THUMB_MCP], landmarks[HAND.THUMB_IP], landmarks[HAND.THUMB_TIP]) > 145;
  const thumbNearIndex = dist2(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_MCP]) < 0.18;
  const score = [fistClosed, thumbStraight, thumbNearIndex].filter(Boolean).length / 3;
  const match = score >= 0.66 && fistClosed;

  const hints = [];
  if (!fistClosed) hints.push({ kind: "fingers" as const, message: "Curl all four fingers tighter into a fist." });
  if (!thumbStraight) hints.push({ kind: "fingers" as const, message: "Straighten your thumb alongside your index." });
  return { letter: "A", match, confidence: smooth01(score), hints };
}

/* ────────────────── B ────────────────── */
export function ruleB(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const fourUp = allExtended(landmarks, ["index", "middle", "ring", "pinky"]);
  const thumbFolded = !isExtended(landmarks, "thumb", 150);
  const fingersAboveWrist =
    landmarks[HAND.INDEX_TIP].y < landmarks[HAND.WRIST].y &&
    landmarks[HAND.PINKY_TIP].y < landmarks[HAND.WRIST].y;
  const score = [fourUp, thumbFolded, fingersAboveWrist].filter(Boolean).length / 3;
  const match = fourUp && thumbFolded && fingersAboveWrist;
  const hints = [];
  if (!fourUp) hints.push({ kind: "fingers" as const, message: "Straighten all four fingers upward." });
  if (!thumbFolded) hints.push({ kind: "fingers" as const, message: "Tuck your thumb across your palm." });
  return { letter: "B", match, confidence: smooth01(score), hints };
}

/* ────────────────── C ────────────────── */
export function ruleC(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const halfCurledScores = F_INDEX_MID_RING_PINKY.map((f) => {
    const a = pipAngle(landmarks, f);
    if (a < 90 || a > 170) return 0;
    return 1 - Math.min(Math.abs(a - 135) / 45, 1);
  });
  const avgHalf = halfCurledScores.reduce((s, x) => s + x, 0) / halfCurledScores.length;

  const thumbAngle = angleAt(landmarks[HAND.THUMB_MCP], landmarks[HAND.THUMB_IP], landmarks[HAND.THUMB_TIP]);
  const thumbCurved = thumbAngle > 120 && thumbAngle < 170 ? 1 : 0;

  const indexThumbDist = tipDistance(landmarks, "index", "thumb");
  const tipsOpen = indexThumbDist > 0.35 ? 1 : indexThumbDist > 0.25 ? 0.5 : 0;

  const dir = palmDirection(landmarks);
  const sideways = dir === "left" || dir === "right" ? 1 : 0.5;

  const score = avgHalf * 0.5 + thumbCurved * 0.2 + tipsOpen * 0.15 + sideways * 0.15;
  const match = avgHalf > 0.6 && tipsOpen > 0.5;
  const hints = [];
  if (avgHalf < 0.6) hints.push({ kind: "fingers" as const, message: "Curve your fingers gently — not closed, not straight." });
  if (tipsOpen < 0.5) hints.push({ kind: "fingers" as const, message: "Open the gap between your thumb and index." });
  return { letter: "C", match, confidence: smooth01(score), hints };
}

/* ────────────────── D ──────────────────
 * Index up; middle/ring/pinky curl to meet thumb tip.
 */
export function ruleD(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexUp = isExtended(landmarks, "index");
  const othersCurled = allCurled(landmarks, ["middle", "ring", "pinky"]);
  const thumbToMiddle = tipDistance(landmarks, "thumb", "middle");
  const thumbMiddleClose = thumbToMiddle < 0.28;
  const score = ([indexUp, othersCurled, thumbMiddleClose].filter(Boolean).length / 3);
  const match = indexUp && othersCurled && thumbMiddleClose;
  const hints = [];
  if (!indexUp) hints.push({ kind: "fingers" as const, message: "Point your index finger straight up." });
  if (!othersCurled) hints.push({ kind: "fingers" as const, message: "Curl middle, ring, and pinky to your thumb." });
  if (!thumbMiddleClose) hints.push({ kind: "fingers" as const, message: "Bring your thumb to touch your middle fingertip." });
  return { letter: "D", match, confidence: smooth01(score), hints };
}

/* ────────────────── E ──────────────────
 * All four fingertips curl down to meet the thumb. Compact, palm forward.
 * TUNE-NEEDED — close to S and O.
 */
export function ruleE(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const allHalfOrMore = F_INDEX_MID_RING_PINKY.every((f) => pipAngle(landmarks, f) < 130);
  // Tips close to thumb (all four)
  const tipsToThumb = F_INDEX_MID_RING_PINKY.map((f) => tipDistance(landmarks, f, "thumb"));
  const avgClose = tipsToThumb.reduce((s, d) => s + (1 - Math.min(d / 0.22, 1)), 0) / 4;
  // Differ from O — should be more compact (smaller variance in tip Y)
  const tips = F_INDEX_MID_RING_PINKY.map((f) => tip(landmarks, f).y);
  const tipYVariance = Math.max(...tips) - Math.min(...tips);
  const compact = tipYVariance < 0.10 ? 1 : tipYVariance < 0.15 ? 0.5 : 0;

  const score = allHalfOrMore ? avgClose * 0.7 + compact * 0.3 : avgClose * 0.4;
  const match = allHalfOrMore && avgClose > 0.55 && compact > 0.5;
  const hints = [];
  if (!allHalfOrMore) hints.push({ kind: "fingers" as const, message: "Curl all four fingers tighter." });
  if (avgClose < 0.55) hints.push({ kind: "fingers" as const, message: "Pull your fingertips to meet your thumb." });
  return { letter: "E", match, confidence: smooth01(score), hints };
}

/* ────────────────── F ──────────────────
 * Index + thumb pinch into an O; middle, ring, pinky extended up.
 */
export function ruleF(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const pinch = tipDistance(landmarks, "index", "thumb");
  const pinching = pinch < 0.12 ? 1 : pinch < 0.18 ? 0.5 : 0;
  const threeUp = allExtended(landmarks, ["middle", "ring", "pinky"]);

  const score = pinching * 0.55 + (threeUp ? 0.45 : 0);
  const match = pinching > 0.7 && threeUp;
  const hints = [];
  if (pinching < 0.7) hints.push({ kind: "fingers" as const, message: "Pinch your index and thumb tips together." });
  if (!threeUp) hints.push({ kind: "fingers" as const, message: "Extend middle, ring, and pinky upward." });
  return { letter: "F", match, confidence: smooth01(score), hints };
}

/* ────────────────── G ──────────────────
 * Index horizontal, thumb parallel above. Palm faces sideways.
 */
export function ruleG(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexExt = isExtended(landmarks, "index");
  const thumbExt = isExtended(landmarks, "thumb", 140);
  const othersDown = allCurled(landmarks, ["middle", "ring", "pinky"]);
  // Index pointing sideways (small dy relative to dx)
  const idxDx = landmarks[HAND.INDEX_TIP].x - landmarks[HAND.INDEX_MCP].x;
  const idxDy = landmarks[HAND.INDEX_TIP].y - landmarks[HAND.INDEX_MCP].y;
  const horizontal = Math.abs(idxDx) > Math.abs(idxDy) * 1.5 ? 1 : 0.3;
  // Thumb parallel to index (similar direction vector)
  const thbDx = landmarks[HAND.THUMB_TIP].x - landmarks[HAND.THUMB_MCP].x;
  const thbDy = landmarks[HAND.THUMB_TIP].y - landmarks[HAND.THUMB_MCP].y;
  const parallel = Math.sign(idxDx) === Math.sign(thbDx) && Math.abs(idxDy - thbDy) < 0.12 ? 1 : 0.3;

  const score = ([indexExt, thumbExt, othersDown].filter(Boolean).length / 3) * 0.6 + horizontal * 0.2 + parallel * 0.2;
  const match = indexExt && thumbExt && othersDown && horizontal > 0.7;
  const hints = [];
  if (!indexExt) hints.push({ kind: "fingers" as const, message: "Extend your index finger." });
  if (!othersDown) hints.push({ kind: "fingers" as const, message: "Curl middle, ring, and pinky." });
  if (horizontal < 0.7) hints.push({ kind: "orientation" as const, message: "Point your index sideways, not up." });
  return { letter: "G", match, confidence: smooth01(score), hints };
}

/* ────────────────── H ──────────────────
 * Index + middle extended sideways together. Ring/pinky curled.
 */
export function ruleH(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxExt = isExtended(landmarks, "index");
  const midExt = isExtended(landmarks, "middle");
  const othersDown = allCurled(landmarks, ["ring", "pinky"]);
  const spread = tipDistance(landmarks, "index", "middle");
  const closeTogether = spread < 0.20 ? 1 : 0.3;
  const idxDx = landmarks[HAND.INDEX_TIP].x - landmarks[HAND.INDEX_MCP].x;
  const idxDy = landmarks[HAND.INDEX_TIP].y - landmarks[HAND.INDEX_MCP].y;
  const horizontal = Math.abs(idxDx) > Math.abs(idxDy) * 1.2 ? 1 : 0.3;

  const score = ([idxExt, midExt, othersDown].filter(Boolean).length / 3) * 0.55 + closeTogether * 0.25 + horizontal * 0.2;
  const match = idxExt && midExt && othersDown && closeTogether > 0.7 && horizontal > 0.7;
  const hints = [];
  if (!(idxExt && midExt)) hints.push({ kind: "fingers" as const, message: "Extend index and middle together." });
  if (closeTogether < 0.7) hints.push({ kind: "fingers" as const, message: "Keep index and middle touching." });
  if (horizontal < 0.7) hints.push({ kind: "orientation" as const, message: "Point sideways, not up." });
  return { letter: "H", match, confidence: smooth01(score), hints };
}

/* ────────────────── I ──────────────────
 * Pinky up. Others curled.
 */
export function ruleI(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const pinkyUp = isExtended(landmarks, "pinky");
  const othersDown = allCurled(landmarks, ["index", "middle", "ring"]);
  const thumbFolded = !isExtended(landmarks, "thumb", 150);

  const score = [pinkyUp, othersDown, thumbFolded].filter(Boolean).length / 3;
  const match = pinkyUp && othersDown;
  const hints = [];
  if (!pinkyUp) hints.push({ kind: "fingers" as const, message: "Extend your pinky upward." });
  if (!othersDown) hints.push({ kind: "fingers" as const, message: "Curl your index, middle, and ring." });
  return { letter: "I", match, confidence: smooth01(score), hints };
}

/* ────────────────── K ──────────────────
 * Index up; middle out at angle; thumb between them.
 * Similar to V but thumb interposed.
 */
export function ruleK(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxUp = isExtended(landmarks, "index");
  const midExt = isExtended(landmarks, "middle");
  const othersDown = allCurled(landmarks, ["ring", "pinky"]);
  const spread = tipDistance(landmarks, "index", "middle");
  const spreadOk = spread > 0.30 ? 1 : 0.4;
  // Thumb tip near middle MCP
  const thumbBetween = dist2(landmarks[HAND.THUMB_TIP], landmarks[HAND.MIDDLE_MCP]) < 0.18 ? 1 : 0.3;

  const score = ([idxUp, midExt, othersDown].filter(Boolean).length / 3) * 0.55 + spreadOk * 0.2 + thumbBetween * 0.25;
  const match = idxUp && midExt && othersDown && spreadOk > 0.6 && thumbBetween > 0.7;
  const hints = [];
  if (!(idxUp && midExt)) hints.push({ kind: "fingers" as const, message: "Extend index up and middle out at an angle." });
  if (thumbBetween < 0.7) hints.push({ kind: "fingers" as const, message: "Place your thumb between index and middle." });
  return { letter: "K", match, confidence: smooth01(score), hints };
}

/* ────────────────── L ────────────────── */
export function ruleL(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexUp = isExtended(landmarks, "index");
  const thumbOut = isExtended(landmarks, "thumb", 145);
  const othersDown = allCurled(landmarks, ["middle", "ring", "pinky"]);
  const angle = angleAt(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_MCP], landmarks[HAND.INDEX_TIP]);
  const rightAngleScore = 1 - Math.min(Math.abs(angle - 90) / 45, 1);
  const score = ([indexUp, thumbOut, othersDown].filter(Boolean).length / 3) * 0.7 + rightAngleScore * 0.3;
  const match = indexUp && thumbOut && othersDown && rightAngleScore > 0.4;
  const hints = [];
  if (!indexUp) hints.push({ kind: "fingers" as const, message: "Point your index finger straight up." });
  if (!thumbOut) hints.push({ kind: "fingers" as const, message: "Extend your thumb out to the side." });
  if (!othersDown) hints.push({ kind: "fingers" as const, message: "Curl your middle, ring, and pinky." });
  return { letter: "L", match, confidence: smooth01(score), hints };
}

/* ────────────────── M ──────────────────
 * Three fingers fold over the thumb (index, middle, ring tucked over thumb).
 * TUNE-NEEDED — very similar to N, S, T.
 */
export function ruleM(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  // index, middle, ring half-curled (PIP < 130) but TIP near thumb area
  const halfCurled = ["index", "middle", "ring"].every((f) => pipAngle(landmarks, f as "index") < 130);
  const pinkyCurled = isCurled(landmarks, "pinky");
  // Thumb tucked low (thumb tip y below INDEX_MCP)
  const thumbTucked = landmarks[HAND.THUMB_TIP].y > landmarks[HAND.INDEX_MCP].y ? 1 : 0;
  // Three finger tips beneath their MCPs (folded over)
  const foldedScore = (["index", "middle", "ring"] as const).reduce((s, f) => {
    const tipY = tip(landmarks, f).y;
    const mcpIdx = f === "index" ? HAND.INDEX_MCP : f === "middle" ? HAND.MIDDLE_MCP : HAND.RING_MCP;
    return s + (tipY > landmarks[mcpIdx].y ? 1 : 0);
  }, 0) / 3;

  const score = (halfCurled ? 0.3 : 0.1) + (pinkyCurled ? 0.2 : 0) + thumbTucked * 0.2 + foldedScore * 0.3;
  const match = halfCurled && pinkyCurled && foldedScore >= 0.66 && thumbTucked > 0;
  const hints = [];
  if (!halfCurled) hints.push({ kind: "fingers" as const, message: "Fold three fingers over your thumb." });
  if (foldedScore < 0.66) hints.push({ kind: "fingers" as const, message: "Tuck the tips of index, middle, and ring beneath." });
  return { letter: "M", match, confidence: smooth01(score), hints };
}

/* ────────────────── N ──────────────────
 * Two fingers (index, middle) fold over the thumb.
 * TUNE-NEEDED.
 */
export function ruleN(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexHalf = pipAngle(landmarks, "index") < 130;
  const middleHalf = pipAngle(landmarks, "middle") < 130;
  const ringCurled = isCurled(landmarks, "ring");
  const pinkyCurled = isCurled(landmarks, "pinky");
  const indexFolded = landmarks[HAND.INDEX_TIP].y > landmarks[HAND.INDEX_MCP].y ? 1 : 0;
  const middleFolded = landmarks[HAND.MIDDLE_TIP].y > landmarks[HAND.MIDDLE_MCP].y ? 1 : 0;

  const score = ([indexHalf, middleHalf, ringCurled, pinkyCurled].filter(Boolean).length / 4) * 0.5
    + ((indexFolded + middleFolded) / 2) * 0.5;
  const match = indexHalf && middleHalf && ringCurled && pinkyCurled && indexFolded > 0 && middleFolded > 0;
  const hints = [];
  if (!(indexHalf && middleHalf)) hints.push({ kind: "fingers" as const, message: "Fold index and middle over your thumb." });
  if (!(ringCurled && pinkyCurled)) hints.push({ kind: "fingers" as const, message: "Curl ring and pinky tight." });
  return { letter: "N", match, confidence: smooth01(score), hints };
}

/* ────────────────── O ──────────────────
 * Fingertips meet the thumb to form a hollow O.
 * Tuned looser after testing — touching tips register at ~0.10 normalized,
 * not <0.05.
 */
export function ruleO(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  // Index tip near thumb tip — touching scores ~1, 0.30 away scores 0.
  const idxThumb = tipDistance(landmarks, "index", "thumb");
  const touchScore = 1 - Math.min(idxThumb / 0.30, 1);

  // Middle/ring/pinky tips also curve around the thumb. They typically don't
  // touch — just need to be in the rough thumb neighborhood.
  const others = ["middle", "ring", "pinky"] as const;
  const otherAvg = others.reduce(
    (s, f) => s + (1 - Math.min(tipDistance(landmarks, f, "thumb") / 0.60, 1)),
    0,
  ) / others.length;

  // Any curl is acceptable — fingers can be fully or partly curled, just not extended.
  const allCurved = ["index", "middle", "ring", "pinky"].every((f) => {
    return pipAngle(landmarks, f as "index") < 170;
  });

  const score = touchScore * 0.55 + otherAvg * 0.30 + (allCurved ? 0.15 : 0);
  const match = touchScore > 0.45 && otherAvg > 0.30 && allCurved;
  const hints = [];
  if (touchScore < 0.45) hints.push({ kind: "fingers" as const, message: "Bring your index and thumb closer to close the O." });
  if (otherAvg < 0.30) hints.push({ kind: "fingers" as const, message: "Curve your other fingers around the thumb." });
  if (!allCurved) hints.push({ kind: "fingers" as const, message: "Curl all four fingers." });
  return { letter: "O", match, confidence: smooth01(score), hints };
}

/* ────────────────── P ──────────────────
 * Like K but rotated so the hand points down.
 */
export function ruleP(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexExt = isExtended(landmarks, "index");
  const midExt = isExtended(landmarks, "middle");
  const othersDown = allCurled(landmarks, ["ring", "pinky"]);
  // Hand inverted: index tip below MCP
  const indexInverted = landmarks[HAND.INDEX_TIP].y > landmarks[HAND.INDEX_MCP].y ? 1 : 0;
  const spread = tipDistance(landmarks, "index", "middle");
  const spreadOk = spread > 0.25 ? 1 : 0.4;

  const score = ([indexExt, midExt, othersDown].filter(Boolean).length / 3) * 0.5 + indexInverted * 0.3 + spreadOk * 0.2;
  const match = indexExt && midExt && othersDown && indexInverted > 0;
  const hints = [];
  if (!indexInverted) hints.push({ kind: "orientation" as const, message: "Point your hand downward (this is K rotated down)." });
  if (!(indexExt && midExt)) hints.push({ kind: "fingers" as const, message: "Extend index and middle." });
  return { letter: "P", match, confidence: smooth01(score), hints };
}

/* ────────────────── Q ──────────────────
 * Like G but pointed down.
 */
export function ruleQ(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexExt = isExtended(landmarks, "index");
  const thumbExt = isExtended(landmarks, "thumb", 140);
  const othersDown = allCurled(landmarks, ["middle", "ring", "pinky"]);
  const indexDown = landmarks[HAND.INDEX_TIP].y > landmarks[HAND.INDEX_MCP].y ? 1 : 0;
  const thumbDown = landmarks[HAND.THUMB_TIP].y > landmarks[HAND.THUMB_MCP].y ? 1 : 0;

  const score = ([indexExt, thumbExt, othersDown].filter(Boolean).length / 3) * 0.5 + indexDown * 0.25 + thumbDown * 0.25;
  const match = indexExt && thumbExt && othersDown && indexDown > 0 && thumbDown > 0;
  const hints = [];
  if (!indexDown) hints.push({ kind: "orientation" as const, message: "Point your hand downward." });
  if (!othersDown) hints.push({ kind: "fingers" as const, message: "Curl middle, ring, and pinky." });
  return { letter: "Q", match, confidence: smooth01(score), hints };
}

/* ────────────────── R ──────────────────
 * Index and middle extended, then crossed (one in front of the other).
 * TUNE-NEEDED — crossing is hard to read from 2D landmarks alone.
 */
export function ruleR(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxExt = isExtended(landmarks, "index");
  const midExt = isExtended(landmarks, "middle");
  const othersDown = allCurled(landmarks, ["ring", "pinky"]);
  // Crossed = index and middle TIPS very close (overlap) even though MCPs are apart
  const tipsClose = tipDistance(landmarks, "index", "middle");
  const mcpsApart = dist2(landmarks[HAND.INDEX_MCP], landmarks[HAND.MIDDLE_MCP]);
  const crossing = tipsClose < 0.08 && mcpsApart > 0.05 ? 1 : tipsClose < 0.13 ? 0.5 : 0;

  const score = ([idxExt, midExt, othersDown].filter(Boolean).length / 3) * 0.5 + crossing * 0.5;
  const match = idxExt && midExt && othersDown && crossing > 0.7;
  const hints = [];
  if (!(idxExt && midExt)) hints.push({ kind: "fingers" as const, message: "Extend index and middle upward." });
  if (crossing < 0.7) hints.push({ kind: "fingers" as const, message: "Cross your middle finger over your index." });
  return { letter: "R", match, confidence: smooth01(score), hints };
}

/* ────────────────── S ──────────────────
 * Closed fist, thumb wrapped across the front.
 * TUNE-NEEDED — similar to A and T.
 */
export function ruleS(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const fistClosed = allCurled(landmarks, ["index", "middle", "ring", "pinky"]);
  // Thumb across the front: thumb tip x is between MCPs of index and pinky (across the front of fist),
  // and its y is between the MCPs (mid-height of fist).
  const idxMcpX = landmarks[HAND.INDEX_MCP].x;
  const pkMcpX = landmarks[HAND.PINKY_MCP].x;
  const minX = Math.min(idxMcpX, pkMcpX);
  const maxX = Math.max(idxMcpX, pkMcpX);
  const thumbX = landmarks[HAND.THUMB_TIP].x;
  const acrossFront = thumbX > minX && thumbX < maxX ? 1 : 0.2;
  // Differentiate from A: thumb tip y should be lower (closer to fingers) rather than alongside.
  const thumbLow = landmarks[HAND.THUMB_TIP].y > landmarks[HAND.INDEX_MCP].y ? 1 : 0.3;

  const score = (fistClosed ? 0.5 : 0.15) + acrossFront * 0.3 + thumbLow * 0.2;
  const match = fistClosed && acrossFront > 0.7 && thumbLow > 0.6;
  const hints = [];
  if (!fistClosed) hints.push({ kind: "fingers" as const, message: "Close your fist tight." });
  if (acrossFront < 0.7) hints.push({ kind: "fingers" as const, message: "Wrap your thumb across the front of your fingers." });
  return { letter: "S", match, confidence: smooth01(score), hints };
}

/* ────────────────── T ──────────────────
 * Closed fist, thumb tucked between index and middle.
 * TUNE-NEEDED.
 */
export function ruleT(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const fistClosed = allCurled(landmarks, ["index", "middle", "ring", "pinky"]);
  // Thumb tip between index PIP and middle PIP
  const idxPIP = landmarks[HAND.INDEX_PIP];
  const midPIP = landmarks[HAND.MIDDLE_PIP];
  const tipP = landmarks[HAND.THUMB_TIP];
  const between =
    tipP.x > Math.min(idxPIP.x, midPIP.x) - 0.04 &&
    tipP.x < Math.max(idxPIP.x, midPIP.x) + 0.04
      ? 1
      : 0.2;
  // Thumb tip should be near the height of those PIPs
  const heightOk = Math.abs(tipP.y - (idxPIP.y + midPIP.y) / 2) < 0.08 ? 1 : 0.3;

  const score = (fistClosed ? 0.45 : 0.1) + between * 0.3 + heightOk * 0.25;
  const match = fistClosed && between > 0.7 && heightOk > 0.6;
  const hints = [];
  if (!fistClosed) hints.push({ kind: "fingers" as const, message: "Close your fist tight." });
  if (between < 0.7) hints.push({ kind: "fingers" as const, message: "Poke your thumb between index and middle." });
  return { letter: "T", match, confidence: smooth01(score), hints };
}

/* ────────────────── U ──────────────────
 * Index + middle up together (close, not spread).
 * Loosened thresholds — real-world hands don't hit 160° PIP angles often.
 */
export function ruleU(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxUp = isExtended(landmarks, "index", 150);
  const midUp = isExtended(landmarks, "middle", 150);
  const ringDown = isCurled(landmarks, "ring", 125);
  const pinkyDown = isCurled(landmarks, "pinky", 125);
  const othersDown = ringDown && pinkyDown;

  // Tip distance: ramp from 1 (at < 0.12) to 0 (at > 0.30).
  const spread = tipDistance(landmarks, "index", "middle");
  const touching =
    spread < 0.12 ? 1 :
    spread < 0.30 ? (0.30 - spread) / 0.18 :
    0;

  const score = ([idxUp, midUp, othersDown].filter(Boolean).length / 3) * 0.55 + touching * 0.45;
  const match = idxUp && midUp && othersDown && touching > 0.45;

  const hints = [];
  if (!(idxUp && midUp)) hints.push({ kind: "fingers" as const, message: "Extend index and middle upward." });
  if (!othersDown) hints.push({ kind: "fingers" as const, message: "Curl your ring and pinky tighter." });
  if (touching < 0.45) hints.push({ kind: "fingers" as const, message: "Keep index and middle touching — no V-spread." });
  return { letter: "U", match, confidence: smooth01(score), hints };
}

/* ────────────────── V ────────────────── */
export function ruleV(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const indexUp = isExtended(landmarks, "index");
  const middleUp = isExtended(landmarks, "middle");
  const ringDown = isCurled(landmarks, "ring");
  const pinkyDown = isCurled(landmarks, "pinky");
  const spread = tipDistance(landmarks, "index", "middle");
  const spreadScore = Math.min(spread / 0.45, 1);
  const score = ([indexUp, middleUp, ringDown, pinkyDown].filter(Boolean).length / 4) * 0.6 + spreadScore * 0.4;
  const match = indexUp && middleUp && ringDown && pinkyDown && spreadScore > 0.5;
  const hints = [];
  if (!indexUp || !middleUp) hints.push({ kind: "fingers" as const, message: "Extend your index and middle fingers up." });
  if (!ringDown || !pinkyDown) hints.push({ kind: "fingers" as const, message: "Curl your ring and pinky fingers." });
  if (spreadScore < 0.5) hints.push({ kind: "fingers" as const, message: "Spread your index and middle apart into a V." });
  return { letter: "V", match, confidence: smooth01(score), hints };
}

/* ────────────────── W ──────────────────
 * Three fingers extended (index, middle, ring); pinky curled.
 */
export function ruleW(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxUp = isExtended(landmarks, "index");
  const midUp = isExtended(landmarks, "middle");
  const ringUp = isExtended(landmarks, "ring");
  const pinkyDown = isCurled(landmarks, "pinky");
  // Some spread between any two
  const spread = (tipDistance(landmarks, "index", "middle") + tipDistance(landmarks, "middle", "ring")) / 2;
  const spreadOk = spread > 0.22 ? 1 : 0.4;
  const score = ([idxUp, midUp, ringUp, pinkyDown].filter(Boolean).length / 4) * 0.7 + spreadOk * 0.3;
  const match = idxUp && midUp && ringUp && pinkyDown;
  const hints = [];
  if (!(idxUp && midUp && ringUp)) hints.push({ kind: "fingers" as const, message: "Extend index, middle, and ring upward." });
  if (!pinkyDown) hints.push({ kind: "fingers" as const, message: "Curl your pinky." });
  return { letter: "W", match, confidence: smooth01(score), hints };
}

/* ────────────────── X ──────────────────
 * Index hooks (PIP ~90°); others curled.
 */
export function ruleX(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const idxPIP = pipAngle(landmarks, "index");
  const hookOk = idxPIP > 70 && idxPIP < 130 ? 1 - Math.abs(idxPIP - 100) / 30 : 0;
  const othersDown = allCurled(landmarks, ["middle", "ring", "pinky"]);
  // Index TIP should still be above its MCP (pointing up but bent)
  const idxAbove = landmarks[HAND.INDEX_TIP].y < landmarks[HAND.INDEX_MCP].y ? 1 : 0;
  const score = hookOk * 0.5 + (othersDown ? 0.3 : 0) + idxAbove * 0.2;
  const match = hookOk > 0.5 && othersDown && idxAbove > 0;
  const hints = [];
  if (hookOk < 0.5) hints.push({ kind: "fingers" as const, message: "Hook your index — half-bend at the middle joint." });
  if (!othersDown) hints.push({ kind: "fingers" as const, message: "Curl middle, ring, and pinky." });
  return { letter: "X", match, confidence: smooth01(score), hints };
}

/* ────────────────── Y ────────────────── */
export function ruleY(input: ClassifyInput): RuleResult {
  const { landmarks } = input;
  const thumbOut = isExtended(landmarks, "thumb", 145);
  const pinkyOut = isExtended(landmarks, "pinky");
  const middleDown = allCurled(landmarks, ["index", "middle", "ring"]);
  const score = [thumbOut, pinkyOut, middleDown].filter(Boolean).length / 3;
  const match = thumbOut && pinkyOut && middleDown;
  const hints = [];
  if (!thumbOut) hints.push({ kind: "fingers" as const, message: "Extend your thumb out." });
  if (!pinkyOut) hints.push({ kind: "fingers" as const, message: "Extend your pinky out." });
  if (!middleDown) hints.push({ kind: "fingers" as const, message: "Curl your index, middle, and ring fingers." });
  return { letter: "Y", match, confidence: smooth01(score), hints };
}
