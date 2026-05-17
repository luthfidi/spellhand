import type { Handedness, MotionPath, MotionPoint } from "./types";

/* ───────────────────────────── Buffer ───────────────────────────── */

/**
 * Time-windowed point buffer for trajectory recording. Mutable container —
 * call sites drive `add()` per detection frame and `clear()` when starting
 * a new trace. Older points are evicted when they fall outside `windowMs`.
 */
export class MotionBuffer {
  private points: MotionPoint[] = [];
  private readonly windowMs: number;

  constructor(windowMs = 1800) {
    this.windowMs = windowMs;
  }

  add(x: number, y: number, t: number): void {
    this.points.push({ x, y, t });
    const cutoff = t - this.windowMs;
    while (this.points.length > 0 && this.points[0].t < cutoff) {
      this.points.shift();
    }
  }

  clear(): void {
    this.points = [];
  }

  get length(): number {
    return this.points.length;
  }

  /** Read-only snapshot of the current buffer. */
  snapshot(): MotionPath {
    return [...this.points];
  }

  /** Total path distance in normalised coords (rough proxy for "did the user move"). */
  totalDistance(): number {
    let d = 0;
    for (let i = 1; i < this.points.length; i++) {
      const a = this.points[i - 1];
      const b = this.points[i];
      d += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return d;
  }
}

/* ─────────────────────────── Path helpers ─────────────────────────── */

function bbox(path: MotionPath) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of path) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  return { xMin, xMax, yMin, yMax, w: xMax - xMin, h: yMax - yMin };
}

/**
 * Direction sign of a segment of the path. Returns +1 if the *user* moved
 * to their right, -1 if to their left. Accounts for the front camera
 * mirroring: MediaPipe sees the unflipped frame, so what the user
 * perceives as "left" actually maps to higher x in MediaPipe coords.
 */
function userDx(start: MotionPoint, end: MotionPoint): number {
  // Front camera + display flip means: user-right === image-left.
  // We negate the raw dx so a positive return reads as "user moved right".
  return -(end.x - start.x);
}

/* ─────────────────────────── Classifier: J ─────────────────────────── */
/*
 * Right-handed J shape (mirror for left-handed):
 *   1. Pinky drops downward (large dy).
 *   2. At the bottom, the tip hooks to the user's left (their pinky-side).
 *
 * We expect: roughly half the path is the downward stroke, the rest is the
 * left-hooking curve. We do not try to track speed — only relative shape.
 */
export interface MotionResult {
  match: boolean;
  confidence: number;
  /** Per-segment booleans for the overlay/hint UI. */
  checks: { label: string; satisfied: boolean }[];
}

const MIN_POINTS = 8;
const MIN_TOTAL_DISTANCE = 0.10; // normalised coords; the user must actually move

export function classifyJMotion(path: MotionPath, handedness: Handedness): MotionResult {
  const fail = (reason: string): MotionResult => ({
    match: false,
    confidence: 0,
    checks: [{ label: reason, satisfied: false }],
  });

  if (path.length < MIN_POINTS) return fail("Trace the J shape");

  const { h, w } = bbox(path);
  if (h + w < MIN_TOTAL_DISTANCE) return fail("Trace a bigger J");

  const mid = Math.floor(path.length / 2);
  const first = path.slice(0, Math.max(2, mid));
  const second = path.slice(mid);

  // 1. First half: pinky drops (y increases in image coords; "down" on screen).
  const firstDy = first[first.length - 1].y - first[0].y;
  const droppedFirst = firstDy > 0.05;

  // 2. Second half: hooks toward the user's thumb-side (mirror image of how
  // you'd write a J on paper). Right-handed: hook goes to the user's LEFT.
  // Left-handed: hook goes to the user's RIGHT.
  const hookDir = handedness === "Right" ? -1 : 1;
  const secondUserDx = userDx(second[0], second[second.length - 1]);
  const hookedCorrectly = Math.sign(secondUserDx) === hookDir && Math.abs(secondUserDx) > 0.03;

  // 3. Overall: vertical extent is larger than the hook, so the J looks tall.
  const tallEnough = h > w * 0.6;

  const checks = [
    { label: "Pinky drops down", satisfied: droppedFirst },
    { label: "Pinky hooks at the bottom", satisfied: hookedCorrectly },
    { label: "Trace is tall enough", satisfied: tallEnough },
  ];
  const passed = checks.filter((c) => c.satisfied).length;
  return {
    match: passed === checks.length,
    confidence: passed / checks.length,
    checks,
  };
}

/* ─────────────────────────── Classifier: Z ─────────────────────────── */
/*
 * Z = three strokes drawn in the air with the index finger:
 *   1. Right.
 *   2. Diagonal down-left.
 *   3. Right.
 * "Right" is from the user's perspective; we use `userDx` to flip the sign
 * for the mirrored front camera. Hand is irrelevant for direction here:
 * everyone draws a Z in the same air-space layout.
 */
export function classifyZMotion(path: MotionPath, _handedness: Handedness): MotionResult {
  void _handedness;
  const fail = (reason: string): MotionResult => ({
    match: false,
    confidence: 0,
    checks: [{ label: reason, satisfied: false }],
  });

  if (path.length < MIN_POINTS) return fail("Trace the Z shape");
  const { h, w } = bbox(path);
  if (h + w < MIN_TOTAL_DISTANCE) return fail("Trace a bigger Z");

  // Three equal-sized segments.
  const third = Math.max(2, Math.floor(path.length / 3));
  const s1 = path.slice(0, third);
  const s2 = path.slice(third, third * 2);
  const s3 = path.slice(third * 2);

  const dx1 = userDx(s1[0], s1[s1.length - 1]);
  const dx2 = userDx(s2[0], s2[s2.length - 1]);
  const dx3 = userDx(s3[0], s3[s3.length - 1]);
  const dy2 = s2[s2.length - 1].y - s2[0].y;

  // 1. Top stroke: rightward (from user perspective).
  const stroke1 = dx1 > 0.03;
  // 2. Diagonal stroke: leftward AND downward — both components meaningful.
  const stroke2 = dx2 < -0.025 && dy2 > 0.025;
  // 3. Bottom stroke: rightward again.
  const stroke3 = dx3 > 0.03;

  const checks = [
    { label: "Top stroke goes right", satisfied: stroke1 },
    { label: "Diagonal goes down-left", satisfied: stroke2 },
    { label: "Bottom stroke goes right", satisfied: stroke3 },
  ];
  const passed = checks.filter((c) => c.satisfied).length;
  return {
    match: passed === checks.length,
    confidence: passed / checks.length,
    checks,
  };
}
