import { gameConfig } from '../config/game';

export interface LevelAttemptMetrics {
  levelId: number;
  timeLimitMs: number;
  elapsedMs: number;
  /** Average of (distance / halfWidth), 0 = perfect center, 1 = at wall. */
  averageEdgeRatio: number;
  sampleCount: number;
  nearMissCount: number;
  /** Finger trail length in SVG units. */
  fingerPathLength: number;
  /** Ideal centerline length in SVG units. */
  idealPathLength: number;
  wallHitsBeforeClear: number;
}

export interface ScoreLine {
  label: string;
  detail: string;
  points: number;
}

export interface LevelScoreResult {
  levelId: number;
  elapsedMs: number;
  timeLimitMs: number;
  totalPoints: number;
  grade: string;
  title: string;
  lines: ScoreLine[];
  accuracyPct: number;
  efficiencyPct: number;
  nearMissCount: number;
  wallHitsBeforeClear: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pickGrade(total: number): { grade: string; title: string } {
  if (total >= 950) {
    return { grade: 'S', title: 'Finger of the Gods' };
  }
  if (total >= 850) {
    return { grade: 'A', title: 'Butter-Smooth Boss' };
  }
  if (total >= 700) {
    return { grade: 'B', title: 'Respectably Shaky' };
  }
  if (total >= 550) {
    return { grade: 'C', title: 'Survived, Barely' };
  }
  return { grade: 'D', title: 'Wall Tour Enthusiast' };
}

/**
 * Builds a cheeky per-level scorecard from attempt telemetry.
 */
export function buildLevelScore(metrics: LevelAttemptMetrics): LevelScoreResult {
  const remainingRatio = clamp(
    1 - metrics.elapsedMs / Math.max(1, metrics.timeLimitMs),
    0,
    1,
  );
  const accuracy = clamp(1 - metrics.averageEdgeRatio, 0, 1);
  const efficiency = clamp(
    metrics.idealPathLength / Math.max(metrics.fingerPathLength, 1),
    0.35,
    1.15,
  );
  const efficiencyScore = clamp(efficiency, 0, 1);

  const timePoints = Math.round(remainingRatio * 420);
  const accuracyPoints = Math.round(accuracy * 380);
  const efficiencyPoints = Math.round(efficiencyScore * 140);
  const nearMissPenalty = Math.min(80, metrics.nearMissCount * 8);
  const heartBonus = Math.max(0, 60 - metrics.wallHitsBeforeClear * 30);

  const lines: ScoreLine[] = [
    {
      label: remainingRatio > 0.55 ? 'Speed Demon Bonus' : 'Fashionably Late Tax',
      detail: `${(metrics.elapsedMs / 1000).toFixed(1)}s / ${(metrics.timeLimitMs / 1000).toFixed(0)}s`,
      points: timePoints,
    },
    {
      label: accuracy > 0.72 ? 'Laser Finger Award' : 'Wobbly Noodle Fine',
      detail: `${Math.round(accuracy * 100)}% path center accuracy`,
      points: accuracyPoints,
    },
    {
      label: efficiencyScore > 0.85 ? 'No Scenic Route' : 'Took the Scenic Route',
      detail: `${Math.round(efficiencyScore * 100)}% path efficiency`,
      points: efficiencyPoints,
    },
    {
      label: metrics.nearMissCount === 0 ? 'Clean Edges Club' : 'Wall Whisperer',
      detail:
        metrics.nearMissCount === 0
          ? 'Zero near-misses'
          : `${metrics.nearMissCount} cheeky near-misses`,
      points: -nearMissPenalty,
    },
    {
      label: metrics.wallHitsBeforeClear === 0 ? 'Heart Preservation Bonus' : 'Retry Tax Refund',
      detail:
        metrics.wallHitsBeforeClear === 0
          ? 'Cleared first try'
          : `${metrics.wallHitsBeforeClear} wall hit${metrics.wallHitsBeforeClear === 1 ? '' : 's'} first`,
      points: heartBonus,
    },
  ];

  const totalPoints = Math.max(
    0,
    lines.reduce((sum, line) => sum + line.points, 0),
  );
  const { grade, title } = pickGrade(totalPoints);

  return {
    levelId: metrics.levelId,
    elapsedMs: metrics.elapsedMs,
    timeLimitMs: metrics.timeLimitMs,
    totalPoints,
    grade,
    title,
    lines,
    accuracyPct: Math.round(accuracy * 100),
    efficiencyPct: Math.round(efficiencyScore * 100),
    nearMissCount: metrics.nearMissCount,
    wallHitsBeforeClear: metrics.wallHitsBeforeClear,
  };
}

export function sumLevelScores(scores: LevelScoreResult[]): number {
  return scores.reduce((sum, score) => sum + score.totalPoints, 0);
}

export function finaleTitle(total: number): string {
  const max = gameConfig.levels * 1000;
  const ratio = total / max;
  if (ratio >= 0.9) {
    return 'Certified Steady-Hand Legend';
  }
  if (ratio >= 0.75) {
    return 'Pretty Impressive, Honestly';
  }
  if (ratio >= 0.55) {
    return 'You Made It. Walls Are Crying.';
  }
  return 'Chaos Complete — We Still Clap';
}
