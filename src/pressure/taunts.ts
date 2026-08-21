/**
 * Stage-keyed taunt pools. Thumb jokes live separately and fire sparingly.
 */

import type { PressureStage } from './config';

const discoverTaunts = [
  'Testing...',
  'Pressure detected',
  'Analysing finger pressure...',
] as const;

const challengeTaunts = [
  'Increase force...',
  'Keep pushing...',
  'Harder.',
  "That's all you've got?",
  'Your finger can do better than that...',
  'Maximum pressure required.',
  'Maximum finger power required.',
] as const;

const crackTaunts = [
  'Almost...',
  "Don't give up now.",
  "You're close...",
  'I can feel the pressure increasing...',
] as const;

const stressTaunts = [
  'WARNING',
  'Too much pressure',
  'Maximum pressure',
] as const;

export const thumbTaunts = [
  'Hmm...',
  "That doesn't look like a finger...",
  'Are you cheating?',
  "THAT'S A THUMB 😂",
  'No thumbs allowed.',
  "That's a thumb.",
  'Nice try, thumb warrior.',
  'Your thumb is cheating.',
  'We said finger. Not a hammer.',
  'Suspiciously large finger detected.',
  'Are you pressing with your finger or your elbow?',
  'Tiny finger. Big effort.',
] as const;

type TauntPool = readonly string[];

const stagePools: Partial<Record<PressureStage, TauntPool>> = {
  discover: discoverTaunts,
  challenge: challengeTaunts,
  cracks: crackTaunts,
  stress: stressTaunts,
};

let lastTaunt = '';
let lastThumbTaunt = '';

function pickWithoutImmediateRepeat(pool: TauntPool, last: string): string {
  if (pool.length === 0) {
    return '';
  }
  if (pool.length === 1) {
    return pool[0]!;
  }
  let next = pool[Math.floor(Math.random() * pool.length)]!;
  let guard = 0;
  while (next === last && guard < 8) {
    next = pool[Math.floor(Math.random() * pool.length)]!;
    guard += 1;
  }
  return next;
}

/** Primary status line for a stage (first / default). */
export function defaultStatusForStage(stage: PressureStage): string {
  switch (stage) {
    case 'idle':
      return 'Place your finger on the button';
    case 'discover':
      return 'Testing...';
    case 'challenge':
      return 'Increase force...';
    case 'cracks':
      return 'Almost...';
    case 'stress':
      return 'WARNING';
    case 'freeze':
      return '';
    case 'black':
    case 'scare':
      return '';
    case 'result':
      return 'FINGER CHALLENGE COMPLETE';
    default:
      return '';
  }
}

export function pickStageTaunt(stage: PressureStage): string | null {
  const pool = stagePools[stage];
  if (!pool) {
    return null;
  }
  const next = pickWithoutImmediateRepeat(pool, lastTaunt);
  lastTaunt = next;
  return next;
}

export function pickThumbTaunt(): string {
  const next = pickWithoutImmediateRepeat(thumbTaunts, lastThumbTaunt);
  lastThumbTaunt = next;
  return next;
}

/** Idle / pre-hold headline. */
export function idleHeadline(): string {
  return 'CAN YOU BREAK IT?';
}
