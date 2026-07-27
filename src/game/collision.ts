export interface Point {
  x: number;
  y: number;
}

export interface ClosestPathSample {
  point: Point;
  distance: number;
  /** Normalised progress along the path, 0–1. */
  progress: number;
  lengthAlongPath: number;
}

/**
 * Samples an SVG path geometry to find the closest centerline point to a pointer.
 * Uses a coarse pass then a refined local search for stable mobile collision checks.
 */
export function getClosestPointOnPath(
  pathElement: SVGGeometryElement,
  point: Point,
  coarseSamples = 80,
  refineSamples = 24,
): ClosestPathSample {
  const totalLength = pathElement.getTotalLength();
  if (totalLength <= 0) {
    return {
      point: { x: 0, y: 0 },
      distance: Number.POSITIVE_INFINITY,
      progress: 0,
      lengthAlongPath: 0,
    };
  }

  let bestLength = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPoint: Point = { x: 0, y: 0 };

  for (let i = 0; i <= coarseSamples; i += 1) {
    const length = (totalLength * i) / coarseSamples;
    const sample = pathElement.getPointAtLength(length);
    const distance = distanceBetween(point, sample);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestLength = length;
      bestPoint = { x: sample.x, y: sample.y };
    }
  }

  const window = totalLength / coarseSamples;
  const refineStart = Math.max(0, bestLength - window);
  const refineEnd = Math.min(totalLength, bestLength + window);

  for (let i = 0; i <= refineSamples; i += 1) {
    const t = i / refineSamples;
    const length = refineStart + (refineEnd - refineStart) * t;
    const sample = pathElement.getPointAtLength(length);
    const distance = distanceBetween(point, sample);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestLength = length;
      bestPoint = { x: sample.x, y: sample.y };
    }
  }

  return {
    point: bestPoint,
    distance: bestDistance,
    progress: bestLength / totalLength,
    lengthAlongPath: bestLength,
  };
}

export function distanceBetween(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function isInsideCircle(
  point: Point,
  center: Point,
  radius: number,
): boolean {
  return distanceBetween(point, center) <= radius;
}

export type CollisionResult =
  | { ok: true; progress: number; closest: ClosestPathSample }
  | {
      ok: false;
      reason: 'wall' | 'skip' | 'outside_path';
      progress: number;
      closest: ClosestPathSample;
    };

/**
 * Validates whether a pointer sample remains inside the interaction corridor
 * and has not skipped ahead along the path.
 */
export function evaluatePointerSample(options: {
  pathElement: SVGGeometryElement;
  point: Point;
  interactionHalfWidth: number;
  previousProgress: number;
  maxProgressSkip: number;
  hasStarted: boolean;
}): CollisionResult {
  const closest = getClosestPointOnPath(options.pathElement, options.point);

  if (closest.distance > options.interactionHalfWidth) {
    return {
      ok: false,
      reason: 'wall',
      progress: closest.progress,
      closest,
    };
  }

  if (
    options.hasStarted
    && closest.progress > options.previousProgress + options.maxProgressSkip
  ) {
    return {
      ok: false,
      reason: 'skip',
      progress: closest.progress,
      closest,
    };
  }

  // * Small backward wobble is normal; only fail on large reverse jumps.
  if (
    options.hasStarted
    && closest.progress < options.previousProgress - options.maxProgressSkip * 1.5
  ) {
    return {
      ok: false,
      reason: 'skip',
      progress: closest.progress,
      closest,
    };
  }

  return {
    ok: true,
    progress: Math.max(options.previousProgress, closest.progress),
    closest,
  };
}
