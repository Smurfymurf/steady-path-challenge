import type { Point } from './collision';

/**
 * Converts a client (screen) point into SVG user-space coordinates.
 * Uses the screen CTM when available, with a preserveAspectRatio-aware
 * bounding-box fallback for browsers/layouts where CTM is unreliable.
 */
export function clientPointToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point | null {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    try {
      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const transformed = point.matrixTransform(ctm.inverse());
      if (Number.isFinite(transformed.x) && Number.isFinite(transformed.y)) {
        return { x: transformed.x, y: transformed.y };
      }
    } catch {
      // Fall through to bounding-box mapping.
    }
  }

  const rect = svg.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const viewBox = svg.viewBox.baseVal;
  const vbWidth = viewBox.width || 300;
  const vbHeight = viewBox.height || 520;
  const scale = Math.min(rect.width / vbWidth, rect.height / vbHeight);
  if (scale <= 0) {
    return null;
  }

  const offsetX = (rect.width - vbWidth * scale) / 2;
  const offsetY = (rect.height - vbHeight * scale) / 2;

  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
}

export function tryCapturePointer(
  element: Element,
  pointerId: number,
): void {
  if ('setPointerCapture' in element) {
    try {
      element.setPointerCapture(pointerId);
    } catch {
      // * Some browsers throw if the pointer is already released.
    }
  }
}

export function tryReleasePointer(
  element: Element,
  pointerId: number,
): void {
  if ('releasePointerCapture' in element) {
    try {
      if (element.hasPointerCapture?.(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors when capture was never held.
    }
  }
}
