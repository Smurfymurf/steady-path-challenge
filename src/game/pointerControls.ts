import type { Point } from './collision';

/**
 * Converts a pointer event into SVG viewBox coordinates using the SVG's
 * current screen CTM. Prefer this over getBoundingClientRect + naive scale
 * so high-DPI and preserveAspectRatio layouts stay accurate.
 */
export function clientPointToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return null;
  }

  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
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
      element.releasePointerCapture(pointerId);
    } catch {
      // Ignore release errors when capture was never held.
    }
  }
}
