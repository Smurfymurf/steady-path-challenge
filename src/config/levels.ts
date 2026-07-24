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
  start: { x: number; y: number; radius: number };
  finish: { x: number; y: number; radius: number };
}

/**
 * Phase 1 ships a single wide, gentle test maze.
 * Levels 2–3 will be added once collision feel is validated.
 */
export const testLevel: LevelDefinition = {
  id: 1,
  name: 'Level 1',
  width: 300,
  height: 520,
  // * Gentle S-curve from bottom start to top finish — easy teaching maze.
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
  interactionWidth: 50,
  start: { x: 150, y: 455, radius: 28 },
  finish: { x: 150, y: 55, radius: 26 },
};

export const levels: LevelDefinition[] = [testLevel];

export function getLevel(levelId: number): LevelDefinition {
  const level = levels.find((item) => item.id === levelId);
  if (!level) {
    throw new Error(`Level ${levelId} is not defined yet.`);
  }
  return level;
}
