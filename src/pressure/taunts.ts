/**
 * Stage-keyed taunt pools — keep pushing, never “stop / warning”.
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
  'Maximum finger power required.',
  'Push harder...',
] as const;

const crackTaunts = [
  'Almost...',
  "Don't give up now.",
  "You're close...",
  'Keep going — harder!',
  'I can feel the pressure increasing...',
  'More force...',
] as const;

const stressTaunts = [
  'Harder!',
  'Keep pushing!',
  "Don't stop now...",
  'More pressure...',
  "You're almost there — push!",
  'Give it everything...',
  'Maximum force — now!',
] as const;

type TauntPool = readonly string[];

const stagePools: Partial<Record<PressureStage, TauntPool>> = {
  discover: discoverTaunts,
  challenge: challengeTaunts,
  cracks: crackTaunts,
  stress: stressTaunts,
};

let lastTaunt = '';

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
      return 'Keep pushing...';
    case 'stress':
      return 'Harder!';
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

/** Idle / pre-hold headline. */
export function idleHeadline(): string {
  return 'CAN YOU BREAK IT?';
}
