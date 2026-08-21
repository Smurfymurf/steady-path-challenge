/**
 * Sparse hairline crack mask — thin jagged lines that grow over time.
 * Stays mostly empty until late bleed, then densifies near the climax.
 */

export interface CrackLine {
  x: number;
  y: number;
  angle: number;
  /** Max length as a fraction of the short screen edge. */
  maxLength: number;
  birth: number;
  /** Relative thickness 0–1. */
  weight: number;
  jagged: number;
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

export function createCrackLines(seed = 61, count = 60): CrackLine[] {
  const rand = mulberry32(seed);
  const lines: CrackLine[] = [];
  // * Hold button sits near the vertical mid of the diagnostic UI.
  const bx = 0.5;
  const by = 0.56;

  const pushFromButton = (
    radiusMin: number,
    radiusMax: number,
    birthMin: number,
    birthMax: number,
    lengthMin: number,
    lengthMax: number,
    n: number,
  ) => {
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.55;
      const dist = radiusMin + rand() * (radiusMax - radiusMin);
      const x = bx + Math.cos(a) * dist;
      const y = by + Math.sin(a) * dist * 0.92;
      // * Grow outward from the button so cracks read as radiating from the press.
      const outward = Math.atan2(y - by, x - bx) + (rand() - 0.5) * 0.35;
      lines.push({
        x: Math.min(0.96, Math.max(0.04, x)),
        y: Math.min(0.96, Math.max(0.04, y)),
        angle: outward,
        maxLength: lengthMin + rand() * (lengthMax - lengthMin),
        birth: birthMin + rand() * (birthMax - birthMin),
        weight: 0.35 + rand() * 0.45,
        jagged: 0.3 + rand() * 0.55,
      });
    }
  };

  // * 1) Impact core — tiny hairlines right on / under the button.
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 + (rand() - 0.5) * 0.25;
    lines.push({
      x: bx + (rand() - 0.5) * 0.04,
      y: by + (rand() - 0.5) * 0.035,
      angle: a,
      maxLength: 0.06 + rand() * 0.1,
      birth: rand() * 0.14,
      weight: 0.5 + rand() * 0.35,
      jagged: 0.35 + rand() * 0.45,
    });
  }

  // * 2) Near ring — still focused on the press point.
  pushFromButton(0.04, 0.14, 0.1, 0.35, 0.07, 0.14, 16);

  // * 3) Mid ring — spreads a little further as pressure climbs.
  pushFromButton(0.12, 0.28, 0.32, 0.58, 0.06, 0.15, 16);

  // * 4) Outer / edges — only toward the end.
  const late = Math.max(8, count - lines.length);
  for (let i = 0; i < late; i += 1) {
    const edge = rand();
    let x = rand();
    let y = rand();
    if (edge < 0.25) {
      x = rand() * 0.12;
    } else if (edge < 0.5) {
      x = 0.88 + rand() * 0.12;
    } else if (edge < 0.75) {
      y = rand() * 0.12;
    } else {
      y = 0.88 + rand() * 0.12;
    }
    const outward = Math.atan2(y - by, x - bx) + (rand() - 0.5) * 0.5;
    lines.push({
      x,
      y,
      angle: outward,
      maxLength: 0.05 + rand() * 0.14,
      birth: 0.62 + rand() * 0.35,
      weight: 0.3 + rand() * 0.4,
      jagged: 0.25 + rand() * 0.55,
    });
  }

  // * Short spurs off early/mid button-centred lines.
  const baseCount = lines.length;
  for (let i = 0; i < baseCount; i += 1) {
    const parent = lines[i]!;
    if (parent.birth > 0.55 || rand() < 0.45) {
      continue;
    }
    lines.push({
      x: parent.x + Math.cos(parent.angle) * parent.maxLength * 0.4,
      y: parent.y + Math.sin(parent.angle) * parent.maxLength * 0.4,
      angle: parent.angle + (rand() > 0.5 ? 1 : -1) * (0.55 + rand() * 0.85),
      maxLength: parent.maxLength * (0.3 + rand() * 0.35),
      birth: Math.min(0.7, parent.birth + 0.06 + rand() * 0.15),
      weight: parent.weight * 0.7,
      jagged: parent.jagged,
    });
  }

  return lines.sort((a, b) => a.birth - b.birth);
}

function strokeJaggedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  jagged: number,
  seed: number,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const steps = Math.max(3, Math.min(10, Math.floor(len / 14)));

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const wobble = Math.sin((seed + i) * 12.9898) * 43758.5453;
    const frac = wobble - Math.floor(wobble);
    const offset = (frac - 0.5) * 2 * jagged * Math.min(5, len * 0.08);
    ctx.lineTo(x1 + dx * t + nx * offset, y1 + dy * t + ny * offset);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * Paint opaque white hairlines where the crack video should show through.
 * Coverage stays tiny until late bleed, then lines lengthen and multiply.
 */
export function paintBreakMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lines: CrackLine[],
  bleed: number,
  _timeSec: number,
): void {
  ctx.clearRect(0, 0, width, height);
  if (bleed <= 0.001) {
    return;
  }

  const shortEdge = Math.min(width, height);
  // * Keep coverage sparse until the final push.
  const density = bleed < 0.75
    ? bleed * 0.55
    : 0.41 + ((bleed - 0.75) / 0.25) * 0.9;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (bleed < line.birth) {
      continue;
    }

    // * Grow once from birth, then hold — no oscillating length / alpha.
    const growWindow = Math.max(0.18, 0.42 - line.birth * 0.15);
    const local = Math.min(1, Math.max(0, (bleed - line.birth) / growWindow));
    if (local <= 0.02) {
      continue;
    }

    // * Drop some late lines until density catches up — random fill, not a sheet.
    if (line.birth > 0.35 && line.birth > density) {
      continue;
    }

    // * Ease out so each crack lengthens then locks.
    const growth = local * local * (3 - 2 * local);
    const settled = growth >= 0.98;
    const lengthFactor = settled
      ? (bleed < 0.85 ? 0.47 : 0.47 + ((bleed - 0.85) / 0.15) * 0.53)
      : 0.12 + growth * 0.35;
    const length = line.maxLength * shortEdge * lengthFactor;
    const x1 = line.x * width;
    const y1 = line.y * height;
    const x2 = x1 + Math.cos(line.angle) * length;
    const y2 = y1 + Math.sin(line.angle) * length;
    const thickness = Math.max(
      1,
      (0.8 + line.weight * 1.4) * (bleed < 0.9 ? 1 : 1 + (bleed - 0.9) * 2),
    );

    ctx.globalAlpha = settled ? 1 : 0.8 + growth * 0.2;
    ctx.lineWidth = thickness;
    strokeJaggedLine(ctx, x1, y1, x2, y2, line.jagged * thickness, index * 17.13);

    // * Tiny spur near the tip once the line has grown a bit.
    if (growth > 0.55 && bleed > 0.5) {
      const spurAngle = line.angle + (index % 2 === 0 ? 0.8 : -0.8);
      const spurLen = length * (0.2 + (index % 5) * 0.04);
      ctx.lineWidth = Math.max(0.7, thickness * 0.55);
      strokeJaggedLine(
        ctx,
        x2,
        y2,
        x2 + Math.cos(spurAngle) * spurLen,
        y2 + Math.sin(spurAngle) * spurLen,
        line.jagged * 0.7,
        index * 9.1,
      );
    }
  }

  // * Only at the very end: a light connective haze so the full clip can take over.
  if (bleed > 0.92) {
    const haze = (bleed - 0.92) / 0.08;
    ctx.globalAlpha = haze * 0.18;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalAlpha = 1;
}
