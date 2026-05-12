import type { FingerName, Landmark } from "./types";

/* MediaPipe Hand Landmark indices.
 * 0 wrist
 * 1-4   thumb  : CMC, MCP, IP, TIP
 * 5-8   index  : MCP, PIP, DIP, TIP
 * 9-12  middle : MCP, PIP, DIP, TIP
 * 13-16 ring   : MCP, PIP, DIP, TIP
 * 17-20 pinky  : MCP, PIP, DIP, TIP
 */
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

export function dist3(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function dist2(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Angle (in degrees) at landmark b between (a→b) and (c→b). */
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

/** PIP-joint angle. ~180° = fully extended, ~80° = fully curled. */
export function pipAngle(landmarks: Landmark[], finger: FingerName): number {
  const [mcp, pip, dip] = FINGER_JOINTS[finger];
  return angleAt(landmarks[mcp], landmarks[pip], landmarks[dip]);
}

export function isExtended(landmarks: Landmark[], finger: FingerName, threshold = 160): boolean {
  return pipAngle(landmarks, finger) >= threshold;
}

export function isCurled(landmarks: Landmark[], finger: FingerName, threshold = 110): boolean {
  return pipAngle(landmarks, finger) <= threshold;
}

/** Tip-to-MCP distance (normalized to wrist→middle-MCP as palm length). */
export function fingerSpan(landmarks: Landmark[], finger: FingerName): number {
  const [mcp, , , tip] = FINGER_JOINTS[finger];
  const palmLen = dist3(landmarks[HAND.WRIST], landmarks[HAND.MIDDLE_MCP]) || 1;
  return dist3(landmarks[mcp], landmarks[tip]) / palmLen;
}

/** Tip position helper. */
export function tip(landmarks: Landmark[], finger: FingerName): Landmark {
  return landmarks[FINGER_JOINTS[finger][3]];
}

/** Distance between two fingertips, normalized by palm length. */
export function tipDistance(landmarks: Landmark[], a: FingerName, b: FingerName): number {
  const palmLen = dist3(landmarks[HAND.WRIST], landmarks[HAND.MIDDLE_MCP]) || 1;
  return dist3(tip(landmarks, a), tip(landmarks, b)) / palmLen;
}

/** Whether all listed fingers are curled. */
export function allCurled(landmarks: Landmark[], fingers: FingerName[]): boolean {
  return fingers.every((f) => isCurled(landmarks, f));
}

/** Whether all listed fingers are extended. */
export function allExtended(landmarks: Landmark[], fingers: FingerName[]): boolean {
  return fingers.every((f) => isExtended(landmarks, f));
}

export type PalmDirection = "up" | "down" | "left" | "right" | "forward" | "back";

/** Rough palm-facing direction in screen space. */
export function palmDirection(landmarks: Landmark[]): PalmDirection {
  // Vector from wrist to middle MCP (palm axis).
  const w = landmarks[HAND.WRIST];
  const m = landmarks[HAND.MIDDLE_MCP];
  const p = landmarks[HAND.PINKY_MCP];
  const i = landmarks[HAND.INDEX_MCP];

  const ax = m.x - w.x, ay = m.y - w.y;

  // Determine fingers-pointing direction.
  if (Math.abs(ay) > Math.abs(ax)) {
    if (ay < 0) return "up"; // y is inverted in image coords; smaller y = up
    return "down";
  }
  // Otherwise pointing sideways
  // Determine palm normal (left/right) via cross between index-MCP and pinky-MCP
  return i.x < p.x ? "left" : "right";
  // z-based forward/back inference omitted (less reliable on web)
}

/** Map [0,1]→0..1 confidence with smooth ease near edges. */
export function smooth01(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}
