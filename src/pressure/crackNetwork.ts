/**
 * Seeded branching crack network in normalised 0–1 space (centre impact).
 * Designed for crisp Canvas2D stroking — not thick GL ribbons.
 */

export interface CrackSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Relative thickness 0–1 (near impact = thicker). */
  weight: number;
  /** 0–1 order for progressive reveal. */
  birth: number;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pushSegment(
  out: CrackSegment[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  weight: number,
  birth: number,
): void {
  out.push({ x1, y1, x2, y2, weight, birth });
}

/**
 * Spiderweb impact crack from centre, births normalised for growth.
 */
export function generateCrackNetwork(seed = 42): CrackSegment[] {
  const rand = mulberry32(seed);
  const segments: CrackSegment[] = [];
  const cx = 0.5;
  const cy = 0.5;
  const primaryRays = 8 + Math.floor(rand() * 3);
  let birthCursor = 0;

  for (let i = 0; i < primaryRays; i += 1) {
    const baseAngle = (i / primaryRays) * Math.PI * 2 + (rand() - 0.5) * 0.28;
    growRay(
      segments,
      rand,
      cx,
      cy,
      baseAngle,
      0.16 + rand() * 0.12,
      1,
      0,
      5,
      () => {
        birthCursor += 0.01 + rand() * 0.012;
        return birthCursor;
      },
    );
  }

  for (let i = 0; i < 22; i += 1) {
    const a = rand() * Math.PI * 2;
    const len = 0.015 + rand() * 0.04;
    pushSegment(
      segments,
      cx,
      cy,
      cx + Math.cos(a) * len,
      cy + Math.sin(a) * len,
      0.55 + rand() * 0.4,
      rand() * 0.2,
    );
  }

  let maxBirth = 0.0001;
  for (const seg of segments) {
    maxBirth = Math.max(maxBirth, seg.birth);
  }
  for (const seg of segments) {
    seg.birth /= maxBirth;
  }

  return segments;
}

function growRay(
  out: CrackSegment[],
  rand: () => number,
  x: number,
  y: number,
  angle: number,
  length: number,
  weight: number,
  depth: number,
  maxDepth: number,
  nextBirth: () => number,
): void {
  if (depth > maxDepth || length < 0.016) {
    return;
  }

  const a = angle + (rand() - 0.5) * 0.5;
  const x2 = x + Math.cos(a) * length;
  const y2 = y + Math.sin(a) * length;
  pushSegment(out, x, y, x2, y2, weight, nextBirth());

  if (rand() > 0.4 && depth > 0) {
    const spurAngle = a + (rand() > 0.5 ? 1 : -1) * (0.65 + rand() * 0.95);
    const spurLen = length * (0.22 + rand() * 0.35);
    pushSegment(
      out,
      x2,
      y2,
      x2 + Math.cos(spurAngle) * spurLen,
      y2 + Math.sin(spurAngle) * spurLen,
      weight * 0.45,
      nextBirth(),
    );
  }

  if (rand() < (depth < 2 ? 0.96 : 0.72)) {
    growRay(
      out,
      rand,
      x2,
      y2,
      a + (rand() - 0.5) * 0.35,
      length * (0.58 + rand() * 0.25),
      weight * (0.55 + rand() * 0.2),
      depth + 1,
      maxDepth,
      nextBirth,
    );
  }

  if (depth < maxDepth - 1 && rand() > 0.32) {
    const branchAngle = a + (rand() > 0.5 ? 1 : -1) * (0.5 + rand() * 0.8);
    growRay(
      out,
      rand,
      x2,
      y2,
      branchAngle,
      length * (0.38 + rand() * 0.28),
      weight * 0.5,
      depth + 1,
      maxDepth,
      nextBirth,
    );
  }
}
