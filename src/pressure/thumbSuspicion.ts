/**
 * Playful "thumb detection" illusion — humour, not accuracy.
 * Uses touch radius / force / movement hints when available, plus randomness.
 */

export interface TouchSample {
  radiusX?: number;
  radiusY?: number;
  force?: number;
  clientX: number;
  clientY: number;
}

export interface ThumbSuspicionState {
  /** 0–1 cumulative suspicion. */
  score: number;
  /** True once the run has "accused" the player. */
  flagged: boolean;
  sampleCount: number;
}

export function createThumbSuspicionState(): ThumbSuspicionState {
  return {
    score: 0,
    flagged: false,
    sampleCount: 0,
  };
}

/**
 * Fold a touch sample into suspicion. Large contact area and high force
 * nudge the score up; tiny contacts can also joke ("Tiny finger").
 */
export function ingestTouchSample(
  state: ThumbSuspicionState,
  sample: TouchSample | null,
): ThumbSuspicionState {
  if (!sample) {
    return {
      ...state,
      sampleCount: state.sampleCount + 1,
      score: Math.min(1, state.score + 0.02 + Math.random() * 0.03),
    };
  }

  const radiusX = sample.radiusX ?? 0;
  const radiusY = sample.radiusY ?? 0;
  const area = Math.PI * Math.max(radiusX, 0.1) * Math.max(radiusY, 0.1);
  const force = sample.force ?? 0;

  let bump = 0.015 + Math.random() * 0.02;

  // * Large contact patches feel "thumb-like" on many devices.
  if (area > 40) {
    bump += 0.08;
  } else if (area > 22) {
    bump += 0.045;
  } else if (area > 0 && area < 6) {
    bump += 0.03;
  }

  if (force > 0.65) {
    bump += 0.05;
  } else if (force > 0.4) {
    bump += 0.025;
  }

  // * Occasional random bump so mouse users still get the bit.
  if (Math.random() < 0.08) {
    bump += 0.06;
  }

  const score = Math.min(1, state.score + bump);
  return {
    score,
    flagged: state.flagged || score >= 0.55,
    sampleCount: state.sampleCount + 1,
  };
}

/**
 * Whether to surface a thumb taunt now (sparingly).
 */
export function shouldFireThumbTaunt(
  state: ThumbSuspicionState,
  holdMs: number,
  lastThumbTauntAt: number,
  now: number,
  minHoldMs: number,
  cooldownMs: number,
  chance: number,
): boolean {
  if (holdMs < minHoldMs) {
    return false;
  }
  if (now - lastThumbTauntAt < cooldownMs) {
    return false;
  }
  if (state.score < 0.42) {
    return false;
  }
  return Math.random() < chance;
}
