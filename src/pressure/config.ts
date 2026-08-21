/**
 * Tunables for the Pressure Test challenge.
 */

export const pressureConfig = {
  challengeName: 'Finger Challenge: Pressure Test',
  shareText:
    'I dared the Finger Challenge Pressure Test. Can your finger break it?',
  /** Displayed percent when the crack sequence starts. */
  freezeAt: 99,
  /** Short hold on 99% before the crack video plays. */
  freezeHoldMs: 450,
  blackBeatMs: 200,
  scareHoldMs: 950,
  /** Decay rate when finger lifts before freeze (percent per second). */
  releaseDecayPerSec: 18,
  /** Hold progress where patchy crack-video bleed begins. */
  crackBleedFrom: 78,
  /** Trimmed web crack clip (first ~2.8s of the source video). */
  crackVideoSrc: '/assets/pressure/crack-web.mp4',
  /** Safety cap if `ended` never fires. */
  crackVideoMaxMs: 3200,
} as const;

export type PressureStage =
  | 'idle'
  | 'discover'
  | 'challenge'
  | 'cracks'
  | 'stress'
  | 'freeze'
  | 'crackVideo'
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
