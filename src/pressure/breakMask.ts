/**
 * Irregular “screen breaking” mask patches — not a flat crossfade.
 */

export interface BreakPatch {
  x: number;
  y: number;
  birth: number;
  radius: number;
  stretch: number;
  rotation: number;
  kind: 'blob' | 'slash' | 'block' | 'shard';
  /** Occasional flicker while forming. */
  flicker: number;
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

export function createBreakPatches(seed = 41, count = 28): BreakPatch[] {
  const rand = mulberry32(seed);
  const patches: BreakPatch[] = [];

  // * Dense cluster near centre (under the finger / button).
  for (let i = 0; i < 8; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = rand() * 0.18;
    patches.push({
      x: 0.5 + Math.cos(a) * d,
      y: 0.52 + Math.sin(a) * d * 0.85,
      birth: rand() * 0.22,
      radius: 0.06 + rand() * 0.1,
      stretch: 0.7 + rand() * 0.8,
      rotation: rand() * Math.PI,
      kind: rand() > 0.55 ? 'shard' : 'blob',
      flicker: rand(),
    });
  }

  for (let i = 0; i < count - 8; i += 1) {
    const kinds: BreakPatch['kind'][] = ['blob', 'slash', 'block', 'shard'];
    patches.push({
      x: rand(),
      y: rand(),
      birth: 0.12 + rand() * 0.78,
      radius: 0.04 + rand() * 0.14,
      stretch: 0.45 + rand() * 1.4,
      rotation: rand() * Math.PI,
      kind: kinds[Math.floor(rand() * kinds.length)]!,
      flicker: rand(),
    });
  }

  return patches.sort((a, b) => a.birth - b.birth);
}

/**
 * Paint opaque white where the crack video should show through.
 */
export function paintBreakMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patches: BreakPatch[],
  bleed: number,
  timeSec: number,
): void {
  ctx.clearRect(0, 0, width, height);
  if (bleed <= 0.001) {
    return;
  }

  // * Soft global haze only at high bleed — still patch-led, not a flat fade.
  if (bleed > 0.72) {
    const haze = (bleed - 0.72) / 0.28;
    ctx.fillStyle = `rgba(255,255,255,${haze * 0.22})`;
    ctx.fillRect(0, 0, width, height);
  }

  for (const patch of patches) {
    if (bleed < patch.birth * 0.85) {
      continue;
    }

    const local = Math.min(1, Math.max(0, (bleed - patch.birth) / Math.max(0.08, 1 - patch.birth)));
    if (local <= 0) {
      continue;
    }

    // * Early patches randomly blink out — malfunction, not a smooth dissolve.
    const flickerGate = 0.55 + 0.45 * Math.sin(timeSec * (7 + patch.flicker * 11) + patch.flicker * 20);
    if (local < 0.55 && flickerGate < 0.22 + patch.flicker * 0.15) {
      continue;
    }

    const growth = local * local * (3 - 2 * local);
    const cx = patch.x * width;
    const cy = patch.y * height;
    const rx = patch.radius * Math.min(width, height) * (0.25 + growth * 0.95);
    const ry = rx * patch.stretch;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(patch.rotation + (patch.kind === 'slash' ? growth * 0.15 : 0));
    ctx.fillStyle = '#fff';

    if (patch.kind === 'slash') {
      ctx.beginPath();
      ctx.moveTo(-rx * 1.6, -ry * 0.12);
      ctx.lineTo(rx * 1.6, -ry * 0.08);
      ctx.lineTo(rx * 1.45, ry * 0.18);
      ctx.lineTo(-rx * 1.5, ry * 0.22);
      ctx.closePath();
      ctx.fill();
      // * Jagged twin tear.
      ctx.beginPath();
      ctx.moveTo(-rx * 0.9, ry * 0.35);
      ctx.lineTo(rx * 1.1, ry * 0.55);
      ctx.lineTo(rx * 0.95, ry * 0.75);
      ctx.lineTo(-rx * 1.05, ry * 0.6);
      ctx.closePath();
      ctx.globalAlpha = 0.75;
      ctx.fill();
    } else if (patch.kind === 'block') {
      // * Dead LCD block / tear rectangle.
      const w = rx * (1.1 + growth);
      const h = ry * (0.35 + growth * 0.5);
      ctx.globalAlpha = 0.65 + growth * 0.35;
      ctx.fillRect(-w, -h, w * 2, h * 2);
      if (growth > 0.4) {
        ctx.fillRect(-w * 0.4, h * 0.9, w * 1.5, h * 0.55);
      }
    } else if (patch.kind === 'shard') {
      ctx.beginPath();
      const spikes = 5 + Math.floor(patch.flicker * 3);
      for (let i = 0; i < spikes; i += 1) {
        const a = (i / spikes) * Math.PI * 2;
        const jagged = i % 2 === 0 ? 1 : 0.45 + patch.flicker * 0.25;
        const px = Math.cos(a) * rx * jagged * (0.7 + growth * 0.5);
        const py = Math.sin(a) * ry * jagged * (0.7 + growth * 0.5);
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // * Soft organic blob (ellipse + offset lobes).
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(rx * 0.35, -ry * 0.2, rx * 0.55, ry * 0.4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // * Horizontal scan tears near the end for extra “broken panel” chaos.
  if (bleed > 0.45) {
    const tears = 3 + Math.floor(bleed * 5);
    for (let i = 0; i < tears; i += 1) {
      const y = ((i * 97 + bleed * 130) % 100) / 100 * height;
      const h = (2 + (i % 3)) * (0.5 + bleed);
      const w = width * (0.15 + bleed * 0.55) * (0.4 + ((i * 13) % 10) / 10);
      const x = ((i * 53) % 100) / 100 * (width - w);
      const pulse = 0.5 + 0.5 * Math.sin(timeSec * 9 + i);
      if (pulse < 0.25 && bleed < 0.85) {
        continue;
      }
      ctx.globalAlpha = 0.35 + bleed * 0.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, w, h);
    }
  }

  ctx.globalAlpha = 1;
}
