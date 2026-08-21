import { pressureConfig } from './config';

/** Map hold progress → patchy bleed 0–1 (decays when they let go). */
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
  // * Ease-in so early malfunction is sparse, then accelerates.
  return t * t;
}
