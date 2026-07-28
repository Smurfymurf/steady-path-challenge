export interface LevelNarrowing {
  /** Progress (0–1) where the corridor begins to tighten. */
  startProgress: number;
  /** Interaction width at the finish. */
  endWidth: number;
  /** Visual corridor width at the finish. */
  endVisualWidth: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  /** SVG viewBox width. */
  width: number;
  /** SVG viewBox height. */
  height: number;
  /** Centerline path for the maze corridor. */
  pathD: string;
  /** Visual stroke width for the corridor. */
  visualWidth: number;
  /** Valid interaction stroke width (forgiveness). */
  interactionWidth: number;
  /** Countdown budget for a successful clear (seconds). */
  timeLimitSec: number;
  /** Cheeky line shown on the level intro card. */
  taunt: string;
  start: { x: number; y: number; radius: number };
  finish: { x: number; y: number; radius: number };
  /** Optional late-path tightening used by harder levels. */
  narrowing?: LevelNarrowing;
}

export const level1: LevelDefinition = {
  id: 1,
  name: 'Level 1',
  width: 300,
  height: 520,
  timeLimitSec: 5,
  taunt: 'Even a sleepy thumb could do this… right?',
  // * Gentle S-curve — teach the interaction.
  pathD: [
    'M 150 455',
    'L 150 390',
    'C 150 360 70 360 70 320',
    'C 70 280 150 280 150 240',
    'C 150 200 230 200 230 160',
    'C 230 120 150 120 150 80',
    'L 150 55',
  ].join(' '),
  visualWidth: 60,
  interactionWidth: 60,
  start: { x: 150, y: 455, radius: 30 },
  finish: { x: 150, y: 55, radius: 28 },
};

export const level2: LevelDefinition = {
  id: 2,
  name: 'Level 2',
  width: 300,
  height: 520,
  timeLimitSec: 20,
  taunt: 'Okay hotshot?\nTry not to cry.',
  // * Dense zig-zag with tight corners — genuinely hard.
  pathD: [
    'M 150 468',
    'L 150 445',
    'C 150 428 38 428 38 405',
    'C 38 382 262 382 262 358',
    'C 262 334 42 334 42 310',
    'C 42 286 258 286 258 262',
    'C 258 238 48 238 48 214',
    'C 48 190 252 190 252 166',
    'C 252 142 55 142 55 118',
    'C 55 94 230 94 230 78',
    'C 230 58 150 58 150 48',
    'L 150 40',
  ].join(' '),
  visualWidth: 24,
  interactionWidth: 24,
  start: { x: 150, y: 468, radius: 20 },
  finish: { x: 150, y: 40, radius: 18 },
};

export const level3: LevelDefinition = {
  id: 3,
  name: 'Level 3',
  width: 300,
  height: 520,
  timeLimitSec: 60,
  taunt: 'This one eats fingers for breakfast.',
  // * Brutal razor corridor: extreme switches, late double-backs, needle finish.
  pathD: [
    'M 150 478',
    'L 150 462',
    'C 150 448 22 448 22 430',
    'C 22 412 278 412 278 394',
    'C 278 376 24 376 24 358',
    'C 24 340 276 340 275 322',
    'C 275 304 26 304 26 286',
    'C 26 268 274 268 274 250',
    'C 274 232 28 232 28 214',
    'C 28 196 272 196 272 178',
    'C 272 160 30 160 30 142',
    'C 30 124 250 124 250 110',
    'C 250 96 55 96 55 82',
    // * Nasty late double-back before the needle.
    'C 55 68 245 68 245 56',
    'C 245 44 70 44 70 36',
    'C 70 28 150 26 150 20',
    'L 150 14',
  ].join(' '),
  visualWidth: 13,
  interactionWidth: 13,
  narrowing: {
    startProgress: 0.55,
    endWidth: 6,
    endVisualWidth: 6,
  },
  start: { x: 150, y: 478, radius: 14 },
  finish: { x: 150, y: 14, radius: 10 },
};

export const levels: LevelDefinition[] = [level1, level2, level3];

export function getLevel(levelId: number): LevelDefinition {
  const level = levels.find((item) => item.id === levelId);
  if (!level) {
    throw new Error(`Level ${levelId} is not defined yet.`);
  }
  return level;
}

export function getTotalLevels(): number {
  return levels.length;
}

export function hasNextLevel(levelId: number): boolean {
  return levels.some((level) => level.id === levelId + 1);
}

/** Extra corridor width on phones so the finger stays readable on the path. */
export const MOBILE_PATH_WIDTH_SCALE = 1.42;

/**
 * Scales corridor + start/finish radii for touch devices.
 * Path geometry is unchanged so desktop levels stay identical.
 */
export function scaleLevelPathWidths(
  level: LevelDefinition,
  scale: number,
): LevelDefinition {
  if (scale === 1) {
    return level;
  }

  return {
    ...level,
    visualWidth: level.visualWidth * scale,
    interactionWidth: level.interactionWidth * scale,
    start: {
      ...level.start,
      radius: level.start.radius * scale,
    },
    finish: {
      ...level.finish,
      radius: level.finish.radius * scale,
    },
    narrowing: level.narrowing
      ? {
          ...level.narrowing,
          endWidth: level.narrowing.endWidth * scale,
          endVisualWidth: level.narrowing.endVisualWidth * scale,
        }
      : undefined,
  };
}

function easeInQuad(t: number): number {
  return t * t;
}

function taperAmount(level: LevelDefinition, progress: number): number {
  if (!level.narrowing) {
    return 0;
  }

  const { startProgress } = level.narrowing;
  if (progress <= startProgress) {
    return 0;
  }

  const span = Math.max(0.0001, 1 - startProgress);
  return easeInQuad(Math.min(1, Math.max(0, (progress - startProgress) / span)));
}

/**
 * Collision corridor matches the visible path so failure only happens
 * when the pointer actually reaches the wall edge.
 */
export function getInteractionWidth(
  level: LevelDefinition,
  progress: number,
): number {
  return getVisualWidth(level, progress);
}

/**
 * Visual corridor width at a given progress along a tapering level.
 */
export function getVisualWidth(
  level: LevelDefinition,
  progress: number,
): number {
  if (!level.narrowing) {
    return level.visualWidth;
  }

  const t = taperAmount(level, progress);
  return level.visualWidth
    + (level.narrowing.endVisualWidth - level.visualWidth) * t;
}
