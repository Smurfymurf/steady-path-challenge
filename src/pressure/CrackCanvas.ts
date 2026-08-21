/**
 * Crisp Canvas2D cracked-glass painter.
 *
 * Design rules (what actually reads as a broken phone screen):
 * - Transparent overlay — UI underneath stays sharp (never warp the page)
 * - Hairline dark fractures + 1px specular edge
 * - Jagged mid-point displacement (not straight CAD lines)
 * - Dense impact crush at centre
 * - Optional micro facet tints (very low alpha) for depth — not distortion
 */

import { generateCrackNetwork, type CrackSegment } from './crackNetwork';

export class CrackCanvasPainter {
  private segments: CrackSegment[];
  private rand: () => number;
  private width = 1;
  private height = 1;
  private dpr = 1;

  constructor(seed = 77) {
    this.segments = generateCrackNetwork(seed);
    let t = (seed * 2654435761) >>> 0;
    this.rand = () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  resize(cssWidth: number, cssHeight: number, dpr: number, canvas: HTMLCanvasElement): void {
    this.width = Math.max(1, cssWidth);
    this.height = Math.max(1, cssHeight);
    this.dpr = Math.min(dpr, 2.5);
    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
  }

  paint(ctx: CanvasRenderingContext2D, reveal: number, opacity: number): void {
    const w = this.width * this.dpr;
    const h = this.height * this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (opacity <= 0.01 || reveal <= 0.01) {
      return;
    }

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.globalAlpha = opacity;

    const size = Math.min(this.width, this.height);
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    // * 1) Tiny facet shading near impact — depth cue, not warp.
    if (reveal > 0.35) {
      this.paintImpactFacets(ctx, cx, cy, size, reveal);
    }

    // * 2) Main fractures (dark hairline).
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const seg of this.segments) {
      if (seg.birth > reveal) {
        continue;
      }
      const local = Math.min(1, Math.max(0.05, (reveal - seg.birth) / 0.1));
      const x1 = seg.x1 * this.width;
      const y1 = seg.y1 * this.height;
      const x2 = seg.x1 * this.width + (seg.x2 - seg.x1) * this.width * local;
      const y2 = seg.y1 * this.height + (seg.y2 - seg.y1) * this.height * local;
      const dist = Math.hypot(x1 - cx, y1 - cy) / size;
      const thickness = (0.55 + seg.weight * 1.1) * (1.15 - dist * 0.55);

      this.strokeJagged(ctx, x1, y1, x2, y2, thickness, 'dark');
      this.strokeJagged(ctx, x1, y1, x2, y2, thickness * 0.35, 'light');
    }

    // * 3) Impact crush — pulverised glass at the strike point.
    if (reveal > 0.08) {
      this.paintImpactCrush(ctx, cx, cy, size, reveal);
    }

    ctx.restore();
  }

  private paintImpactFacets(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    reveal: number,
  ): void {
    const wedges = 7;
    ctx.save();
    for (let i = 0; i < wedges; i += 1) {
      // * Deterministic wedges — avoid flicker on repaint.
      const jitter = ((i * 41) % 10) / 100;
      const a0 = (i / wedges) * Math.PI * 2 + jitter;
      const a1 = ((i + 1) / wedges) * Math.PI * 2 + jitter * 0.5;
      const r = size * (0.09 + (i % 3) * 0.02) * reveal;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0
        ? 'rgba(0, 0, 0, 0.05)'
        : 'rgba(255, 255, 255, 0.045)';
      ctx.fill();
    }
    ctx.restore();
  }

  private paintImpactCrush(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    reveal: number,
  ): void {
    const radius = size * 0.034 * (0.6 + reveal * 0.5);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.2);
    grd.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    grd.addColorStop(0.35, 'rgba(180, 185, 195, 0.12)');
    grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 28; i += 1) {
      const a = (i / 28) * Math.PI * 2 + (i % 5) * 0.15;
      const d = ((i * 17) % 100) / 100 * radius * 1.6;
      const s = 0.5 + (i % 3) * 0.35;
      ctx.fillStyle = i % 2 === 0
        ? 'rgba(20, 22, 28, 0.55)'
        : 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(cx + Math.cos(a) * d - s / 2, cy + Math.sin(a) * d - s / 2, s, s);
    }
  }

  /**
   * Recursive midpoint displacement — the classic “real glass” stroke.
   */
  private strokeJagged(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number,
    mode: 'dark' | 'light',
  ): void {
    const points: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
    this.subdivide(points, x1, y1, x2, y2, Math.hypot(x2 - x1, y2 - y1) * 0.18, 0, 4);
    points.push({ x: x2, y: y2 });

    ctx.beginPath();
    if (mode === 'light') {
      // * Specular lip offset ~0.5–1px so the edge catches light.
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const ox = (-dy / len) * 0.6;
      const oy = (dx / len) * 0.6;
      ctx.moveTo(points[0]!.x + ox, points[0]!.y + oy);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i]!.x + ox, points[i]!.y + oy);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = Math.max(0.4, thickness * 0.45);
      ctx.stroke();
      return;
    }

    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i]!.x, points[i]!.y);
    }
    ctx.strokeStyle = 'rgba(18, 20, 26, 0.78)';
    ctx.lineWidth = Math.max(0.7, thickness);
    ctx.stroke();

    // * Soft shadow under the fracture for depth on white UI.
    ctx.beginPath();
    ctx.moveTo(points[0]!.x + 0.6, points[0]!.y + 0.6);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i]!.x + 0.6, points[i]!.y + 0.6);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = Math.max(0.5, thickness * 0.7);
    ctx.stroke();
  }

  private subdivide(
    out: Array<{ x: number; y: number }>,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displace: number,
    depth: number,
    maxDepth: number,
  ): void {
    if (depth >= maxDepth || displace < 0.35) {
      return;
    }
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const offset = (this.rand() - 0.5) * 2 * displace;
    const px = mx + nx * offset;
    const py = my + ny * offset;
    this.subdivide(out, x1, y1, px, py, displace * 0.55, depth + 1, maxDepth);
    out.push({ x: px, y: py });
    this.subdivide(out, px, py, x2, y2, displace * 0.55, depth + 1, maxDepth);
  }
}
