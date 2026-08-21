/**
 * Tunables for the Pressure Test challenge.
 */

export const pressureConfig = {
  challengeName: 'Finger Challenge: Pressure Test',
  shareText:
    'I dared the Finger Challenge Pressure Test. Can your finger break it?',
  /** Freeze at this displayed percent before the scare. */
  freezeAt: 98,
  freezeHoldMs: 1000,
  blackBeatMs: 200,
  scareHoldMs: 950,
  /** Decay rate when finger lifts before freeze (percent per second). */
  releaseDecayPerSec: 28,
  /** Minimum hold before thumb-suspicion taunts can fire. */
  thumbSuspicionMinHoldMs: 2800,
  /** Cooldown between thumb taunts. */
  thumbTauntCooldownMs: 4500,
  /** Chance each evaluation window to fire a thumb taunt when suspicious. */
  thumbTauntChance: 0.35,
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
