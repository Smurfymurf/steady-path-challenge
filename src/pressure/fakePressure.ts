/**
 * Fake force meter — stage curves + noise so holding feels like pressure.
 * Late stages crawl so the player really has to keep pushing.
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
  /** 0–1 overall crack overlay strength (hairlines + photo). */
  crackIntensity: number;
  /** 0–1 photo crack reveal (mostly 96.5–99%). */
  photoReveal: number;
  reachedFreeze: boolean;
}

/**
 * Base fill rate (% per second) while held.
 * Rough continuous hold: ~50–70s to freeze if they never release.
 */
function baseRate(progress: number): number {
  if (progress < 25) {
    return 10;
  }
  if (progress < 40) {
    return 6.5;
  }
  if (progress < 55) {
    return 2.4;
  }
  if (progress < 70) {
    return 1.5;
  }
  if (progress < 80) {
    return 0.85;
  }
  if (progress < 90) {
    return 0.55;
  }
  if (progress < 95) {
    return 0.32;
  }
  if (progress < 97.5) {
    return 0.18;
  }
  // * Final grind — feels stuck without actually stopping.
  return 0.09;
}

/**
 * Oscillation grows mid/late so the bar can dip while generally climbing.
 */
function noiseDelta(progress: number, elapsedSec: number, dt: number): number {
  if (progress < 40) {
    return Math.sin(elapsedSec * 5) * 0.12 * dt;
  }
  if (progress < 75) {
    const wobble =
      Math.sin(elapsedSec * 3.8) * 1.4
      + Math.sin(elapsedSec * 8.4) * 0.7
      + (Math.random() - 0.55) * 1.6;
    return wobble * dt;
  }
  if (progress < 90) {
    const wobble =
      Math.sin(elapsedSec * 4.8) * 1.8
      + Math.sin(elapsedSec * 10) * 0.9
      + (Math.random() - 0.5) * 2.0;
    return wobble * dt;
  }
  const wobble =
    Math.sin(elapsedSec * 6.2) * 1.1
    + (Math.random() - 0.52) * 1.4;
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
      photoReveal: photoRevealFor(next),
      reachedFreeze: false,
    };
  }

  if (progress >= pressureConfig.freezeAt) {
    return {
      progress: pressureConfig.freezeAt,
      stage: 'freeze',
      crackIntensity: 1,
      photoReveal: 1,
      reachedFreeze: true,
    };
  }

  const rate = baseRate(progress);
  let next = progress + rate * dt + noiseDelta(progress, elapsedSec, dt);

  if (next > pressureConfig.freezeAt) {
    next = pressureConfig.freezeAt;
  }
  // * Soft floor while held after discovery — can still dip a little.
  if (progress >= 40) {
    next = Math.max(next, progress - 1.1 * dt);
  }
  next = Math.max(0, Math.min(pressureConfig.freezeAt, next));

  const reachedFreeze = next >= pressureConfig.freezeAt;
  return {
    progress: next,
    stage: reachedFreeze ? 'freeze' : stageFromProgress(next),
    crackIntensity: crackIntensityFor(next),
    photoReveal: photoRevealFor(next),
    reachedFreeze,
  };
}

export function crackIntensityFor(progress: number): number {
  if (progress < 78) {
    return 0;
  }
  if (progress < 90) {
    return ((progress - 78) / 12) * 0.35;
  }
  if (progress < pressureConfig.crackRevealFrom) {
    return 0.35 + ((progress - 90) / (pressureConfig.crackRevealFrom - 90)) * 0.25;
  }
  return 0.6 + photoRevealFor(progress) * 0.4;
}

/** Gradual photo crack reveal concentrated in the final 96.5–99% window. */
export function photoRevealFor(progress: number): number {
  const { crackRevealFrom, crackRevealTo, freezeAt } = pressureConfig;
  if (progress < crackRevealFrom) {
    return 0;
  }
  if (progress >= freezeAt || progress >= crackRevealTo) {
    return 1;
  }
  return (progress - crackRevealFrom) / (crackRevealTo - crackRevealFrom);
}

export function formatPower(progress: number): number {
  return Math.round(Math.min(100, Math.max(0, progress)));
}
