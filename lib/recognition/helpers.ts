import type { LetterCode } from "@/lib/letters";
import type { Connection, FingerName, Landmark, RuleResult, SubCheck } from "./types";

/* MediaPipe Hand Landmark indices. */
export const HAND = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const;

const FINGER_JOINTS: Record<FingerName, [number, number, number, number]> = {
  thumb:  [HAND.THUMB_CMC, HAND.THUMB_MCP, HAND.THUMB_IP, HAND.THUMB_TIP],
  index:  [HAND.INDEX_MCP, HAND.INDEX_PIP, HAND.INDEX_DIP, HAND.INDEX_TIP],
  middle: [HAND.MIDDLE_MCP, HAND.MIDDLE_PIP, HAND.MIDDLE_DIP, HAND.MIDDLE_TIP],
  ring:   [HAND.RING_MCP, HAND.RING_PIP, HAND.RING_DIP, HAND.RING_TIP],
  pinky:  [HAND.PINKY_MCP, HAND.PINKY_PIP, HAND.PINKY_DIP, HAND.PINKY_TIP],
};

/** Landmark indices that belong to each finger. */
export const FINGER_LANDMARKS: Record<FingerName, readonly number[]> = FINGER_JOINTS;

/** Connection pairs that visualize each finger (including the wrist anchor where natural). */
export const FINGER_CONNECTIONS: Record<FingerName, readonly Connection[]> = {
  thumb:  [[0, 1], [1, 2], [2, 3], [3, 4]],
  index:  [[0, 5], [5, 6], [6, 7], [7, 8]],
  middle: [[9, 10], [10, 11], [11, 12]],
  ring:   [[13, 14], [14, 15], [15, 16]],
  pinky:  [[0, 17], [17, 18], [18, 19], [19, 20]],
};

/* ── Math primitives ── */

export function dist3(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function dist2(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const ax = a.x - b.x, ay = a.y - b.y, az = a.z - b.z;
  const cx = c.x - b.x, cy = c.y - b.y, cz = c.z - b.z;
  const dot = ax * cx + ay * cy + az * cz;
  const magA = Math.sqrt(ax * ax + ay * ay + az * az);
  const magC = Math.sqrt(cx * cx + cy * cy + cz * cz);
  if (magA === 0 || magC === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magA * magC)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function pipAngle(landmarks: Landmark[], finger: FingerName): number {
  const [mcp, pip, dip] = FINGER_JOINTS[finger];
  return angleAt(landmarks[mcp], landmarks[pip], landmarks[dip]);
}

export function isExtended(landmarks: Landmark[], finger: FingerName, threshold = 150): boolean {
  return pipAngle(landmarks, finger) >= threshold;
}

export function isCurled(landmarks: Landmark[], finger: FingerName, threshold = 110): boolean {
  return pipAngle(landmarks, finger) <= threshold;
}

export function tip(landmarks: Landmark[], finger: FingerName): Landmark {
  return landmarks[FINGER_JOINTS[finger][3]];
}

export function tipDistance(landmarks: Landmark[], a: FingerName, b: FingerName): number {
  const palmLen = dist3(landmarks[HAND.WRIST], landmarks[HAND.MIDDLE_MCP]) || 1;
  return dist3(tip(landmarks, a), tip(landmarks, b)) / palmLen;
}

/* ── Sub-check builders ── */

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function checkCurled(landmarks: Landmark[], finger: FingerName, threshold = 110): SubCheck {
  return {
    label: `${cap(finger)} curled`,
    satisfied: isCurled(landmarks, finger, threshold),
    landmarks: FINGER_LANDMARKS[finger],
    connections: FINGER_CONNECTIONS[finger],
  };
}

export function checkExtended(landmarks: Landmark[], finger: FingerName, threshold = 150): SubCheck {
  return {
    label: `${cap(finger)} extended`,
    satisfied: isExtended(landmarks, finger, threshold),
    landmarks: FINGER_LANDMARKS[finger],
    connections: FINGER_CONNECTIONS[finger],
  };
}

export function checkHalfCurled(
  landmarks: Landmark[],
  finger: FingerName,
  min = 80,
  max = 160,
): SubCheck {
  const a = pipAngle(landmarks, finger);
  return {
    label: `${cap(finger)} half-curled`,
    satisfied: a >= min && a <= max,
    landmarks: FINGER_LANDMARKS[finger],
    connections: FINGER_CONNECTIONS[finger],
  };
}

/**
 * Generic check for any boolean condition that targets specific landmarks.
 * Pass `[]` for landmarks/connections if it's a relation that has no
 * visual finger to color (it still counts toward confidence).
 */
export function check(
  label: string,
  satisfied: boolean,
  landmarks: readonly number[] = [],
  connections: readonly Connection[] = [],
): SubCheck {
  return { label, satisfied, landmarks, connections };
}

/* ── Aggregate ── */

export function aggregate(letter: LetterCode, subChecks: SubCheck[]): RuleResult {
  const passed = subChecks.filter((c) => c.satisfied).length;
  return {
    letter,
    match: passed === subChecks.length,
    confidence: passed / subChecks.length,
    subChecks,
    hints: subChecks
      .filter((c) => !c.satisfied)
      .slice(0, 2)
      .map((c) => ({ kind: "fingers" as const, message: c.label })),
  };
}

/* ── Palm direction (still used for some letters) ── */

export type PalmDirection = "up" | "down" | "left" | "right";

export function palmDirection(landmarks: Landmark[]): PalmDirection {
  const w = landmarks[HAND.WRIST];
  const m = landmarks[HAND.MIDDLE_MCP];
  const i = landmarks[HAND.INDEX_MCP];
  const p = landmarks[HAND.PINKY_MCP];
  const ax = m.x - w.x, ay = m.y - w.y;
  if (Math.abs(ay) > Math.abs(ax)) return ay < 0 ? "up" : "down";
  return i.x < p.x ? "left" : "right";
}
