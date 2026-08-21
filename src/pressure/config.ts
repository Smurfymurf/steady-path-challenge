/**
 * Tunables for the Pressure Test challenge.
 */

export const pressureConfig = {
  challengeName: 'Finger Challenge: Pressure Test',
  shareText:
    'I dared the Finger Challenge Pressure Test. Can your finger break it?',
  /** Freeze at this displayed percent before the scare. */
  freezeAt: 99,
  freezeHoldMs: 1100,
  blackBeatMs: 200,
  scareHoldMs: 950,
  /** Decay rate when finger lifts before freeze (percent per second). */
  releaseDecayPerSec: 18,
  /** Progress where the photo crack starts emerging. */
  crackRevealFrom: 96.5,
  /** Progress where the photo crack is fully shown. */
  crackRevealTo: 99,
  crackAsset: '/assets/pressure/screen-crack.png',
} as const;

export type PressureStage =
  | 'idle'
  | 'discover'
  | 'challenge'
  | 'cracks'
  | 'stress'
  | 'freeze'
  | 'black'
  | 'scare'
  | 'result';

export function stageFromProgress(progress: number): PressureStage {
  if (progress <= 0) {
    return 'idle';
  }
  if (progress < 40) {
    return 'discover';
  }
  if (progress < 75) {
    return 'challenge';
  }
  if (progress < 90) {
    return 'cracks';
  }
  if (progress < pressureConfig.freezeAt) {
    return 'stress';
  }
  return 'freeze';
}
