/**
 * Fake force meter — stage curves + noise so holding feels like pressure.
 */

import { pressureConfig, stageFromProgress, type PressureStage } from './config';

export interface PressureTickInput {
  held: boolean;
  progress: number;
  elapsedSec: number;
  dt: number;
}

export interface PressureTickResult {
  progress: number;
  stage: PressureStage;
  /** 0–1 crack intensity for overlays. */
  crackIntensity: number;
  reachedFreeze: boolean;
}

/** Base fill rate (% per second) by stage while held. */
function baseRate(progress: number): number {
  if (progress < 40) {
    return 22;
  }
  if (progress < 60) {
    return 9;
  }
  if (progress < 75) {
    return 5.5;
  }
  if (progress < 90) {
    return 3.2;
  }
  return 2.1;
}

/**
 * Oscillation amplitude grows in mid/late stages so the bar can dip
 * (73 → 72) while generally climbing.
 */
function noiseDelta(progress: number, elapsedSec: number, dt: number): number {
  if (progress < 40) {
    return Math.sin(elapsedSec * 6) * 0.15 * dt;
  }
  if (progress < 75) {
    const wobble =
      Math.sin(elapsedSec * 4.2) * 1.8
      + Math.sin(elapsedSec * 9.1) * 0.9
      + (Math.random() - 0.55) * 2.2;
    return wobble * dt;
  }
  if (progress < 90) {
    const wobble =
      Math.sin(elapsedSec * 5.5) * 2.4
      + Math.sin(elapsedSec * 11) * 1.1
      + (Math.random() - 0.5) * 2.8;
    return wobble * dt;
  }
  const wobble =
    Math.sin(elapsedSec * 7) * 1.6
    + (Math.random() - 0.48) * 2.0;
  return wobble * dt;
}

export function tickPressure(input: PressureTickInput): PressureTickResult {
  const { held, progress, elapsedSec, dt } = input;

  if (!held) {
    const next = Math.max(0, progress - pressureConfig.releaseDecayPerSec * dt);
    return {
      progress: next,
      stage: stageFromProgress(next),
      crackIntensity: crackIntensityFor(next),
      reachedFreeze: false,
    };
  }

  if (progress >= pressureConfig.freezeAt) {
    return {
      progress: pressureConfig.freezeAt,
      stage: 'freeze',
      crackIntensity: 1,
      reachedFreeze: true,
    };
  }

  const rate = baseRate(progress);
  let next = progress + rate * dt + noiseDelta(progress, elapsedSec, dt);

  // * Soft ceiling so we approach freeze gradually, not overshoot in one frame.
  if (next > pressureConfig.freezeAt) {
    next = pressureConfig.freezeAt;
  }
  // * Never drop below a soft floor while held after discovery.
  if (progress >= 40) {
    next = Math.max(next, progress - 1.8 * dt);
  }
  next = Math.max(0, Math.min(pressureConfig.freezeAt, next));

  const reachedFreeze = next >= pressureConfig.freezeAt;
  return {
    progress: next,
    stage: reachedFreeze ? 'freeze' : stageFromProgress(next),
    crackIntensity: crackIntensityFor(next),
    reachedFreeze,
  };
}

export function crackIntensityFor(progress: number): number {
  if (progress < 75) {
    return 0;
  }
  if (progress < 85) {
    return (progress - 75) / 10 * 0.35;
  }
  if (progress < 90) {
    return 0.35 + ((progress - 85) / 5) * 0.25;
  }
  return 0.6 + ((progress - 90) / 8) * 0.4;
}

export function formatPower(progress: number): number {
  return Math.round(Math.min(100, Math.max(0, progress)));
}
