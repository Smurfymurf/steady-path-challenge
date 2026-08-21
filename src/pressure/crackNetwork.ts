/**
 * Seeded branching crack network in normalised 0–1 space (centre impact).
 */

export interface CrackSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Half-width in normalised units. */
  halfWidth: number;
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
  halfWidth: number,
  birth: number,
): void {
  out.push({ x1, y1, x2, y2, halfWidth, birth });
}

/**
 * Build a spiderweb impact crack from the centre, ordered for reveal.
 */
export function generateCrackNetwork(seed = 42): CrackSegment[] {
  const rand = mulberry32(seed);
  const segments: CrackSegment[] = [];
  const cx = 0.5;
  const cy = 0.5;

  const primaryRays = 7 + Math.floor(rand() * 3);
  let birthCursor = 0;

  for (let i = 0; i < primaryRays; i += 1) {
    const baseAngle = (i / primaryRays) * Math.PI * 2 + (rand() - 0.5) * 0.35;
    growRay(
      segments,
      rand,
      cx,
      cy,
      baseAngle,
      0.12 + rand() * 0.08,
      0.012,
      0,
      4,
      () => {
        birthCursor += 0.012 + rand() * 0.01;
        return Math.min(0.98, birthCursor);
      },
    );
  }

  // * Fine radial chips near the impact core.
  for (let i = 0; i < 18; i += 1) {
    const a = rand() * Math.PI * 2;
    const len = 0.02 + rand() * 0.045;
    const birth = rand() * 0.25;
    pushSegment(
      segments,
      cx,
      cy,
      cx + Math.cos(a) * len,
      cy + Math.sin(a) * len,
      0.0025 + rand() * 0.002,
      birth,
    );
  }

  // * Normalise births into 0–1 for uniform growth control.
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
  halfWidth: number,
  depth: number,
  maxDepth: number,
  nextBirth: () => number,
): void {
  if (depth > maxDepth || length < 0.018) {
    return;
  }

  const wobble = (rand() - 0.5) * 0.55;
  const a = angle + wobble;
  const x2 = x + Math.cos(a) * length;
  const y2 = y + Math.sin(a) * length;
  const birth = nextBirth();
  pushSegment(out, x, y, x2, y2, halfWidth, birth);

  // * Occasional hairline spur.
  if (rand() > 0.45 && depth > 0) {
    const spurAngle = a + (rand() > 0.5 ? 1 : -1) * (0.7 + rand() * 0.9);
    const spurLen = length * (0.25 + rand() * 0.35);
    pushSegment(
      out,
      x2,
      y2,
      x2 + Math.cos(spurAngle) * spurLen,
      y2 + Math.sin(spurAngle) * spurLen,
      halfWidth * 0.45,
      nextBirth(),
    );
  }

  const continueChance = depth < 2 ? 0.95 : 0.7;
  if (rand() < continueChance) {
    growRay(
      out,
      rand,
      x2,
      y2,
      a + (rand() - 0.5) * 0.4,
      length * (0.62 + rand() * 0.22),
      halfWidth * (0.62 + rand() * 0.15),
      depth + 1,
      maxDepth,
      nextBirth,
    );
  }

  // * Bifurcation.
  if (depth < maxDepth - 1 && rand() > 0.35) {
    const branchAngle = a + (rand() > 0.5 ? 1 : -1) * (0.55 + rand() * 0.75);
    growRay(
      out,
      rand,
      x2,
      y2,
      branchAngle,
      length * (0.4 + rand() * 0.3),
      halfWidth * 0.55,
      depth + 1,
      maxDepth,
      nextBirth,
    );
  }
}

/**
 * Build a triangle-list mesh for thick crack quads.
 * Each segment → 2 triangles (6 verts). Attr: x, y, side (-1|1), along (0|1).
 */
export function buildCrackMesh(
  segments: CrackSegment[],
  reveal: number,
): Float32Array {
  const visible = segments.filter((seg) => seg.birth <= reveal + 0.02);
  const floatsPerVert = 4;
  const data = new Float32Array(visible.length * 6 * floatsPerVert);
  let o = 0;

  for (const seg of visible) {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.hypot(dx, dy) || 0.0001;
    // * Growth within the segment once birth passes.
    const local = Math.min(1, Math.max(0, (reveal - seg.birth) / 0.08 + 0.15));
    const x2 = seg.x1 + dx * local;
    const y2 = seg.y1 + dy * local;
    const nx = -dy / len;
    const ny = dx / len;
    const w = seg.halfWidth;

    const ax = seg.x1 + nx * w;
    const ay = seg.y1 + ny * w;
    const bx = seg.x1 - nx * w;
    const by = seg.y1 - ny * w;
    const cx = x2 + nx * w;
    const cy = y2 + ny * w;
    const dxv = x2 - nx * w;
    const dyv = y2 - ny * w;

    // Tri 1: a, b, c
    data[o++] = ax; data[o++] = ay; data[o++] = 1; data[o++] = 0;
    data[o++] = bx; data[o++] = by; data[o++] = -1; data[o++] = 0;
    data[o++] = cx; data[o++] = cy; data[o++] = 1; data[o++] = 1;
    // Tri 2: b, d, c
    data[o++] = bx; data[o++] = by; data[o++] = -1; data[o++] = 0;
    data[o++] = dxv; data[o++] = dyv; data[o++] = -1; data[o++] = 1;
    data[o++] = cx; data[o++] = cy; data[o++] = 1; data[o++] = 1;
  }

  return data;
}
