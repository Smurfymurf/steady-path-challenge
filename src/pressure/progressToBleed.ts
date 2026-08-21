import { pressureConfig } from './config';

/**
 * Map hold progress → hairline bleed 0–1.
 * Stays very low through most of the climb, then ramps hard near the end.
 */
export function progressToBleed(progress: number): number {
  const from = pressureConfig.crackBleedFrom;
  const to = pressureConfig.freezeAt;
  if (progress <= from) {
    return 0;
  }
  if (progress >= to) {
    return 1;
  }
  const t = (progress - from) / (to - from);
  // * Aggressive ease-in: mostly empty until the final push.
  return t * t * t;
}
