import { gameConfig } from '../config/game';
import type { LevelScoreResult } from './scoring';

export interface SessionState {
  sessionId: string;
  currentLevel: number;
  lives: number;
  totalFailures: number;
  failuresByLevel: Record<number, number>;
  levelProgress: number;
  furthestProgress: number;
  furthestLevel: number;
  startedAt: number;
  completedLevels: number[];
  levelScores: LevelScoreResult[];
  soundEnabled: boolean;
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSession(
  soundEnabled: boolean,
  startLevel = 1,
): SessionState {
  return {
    sessionId: createSessionId(),
    currentLevel: startLevel,
    lives: gameConfig.startingLives,
    totalFailures: 0,
    failuresByLevel: {},
    levelProgress: 0,
    furthestProgress: 0,
    furthestLevel: startLevel,
    startedAt: Date.now(),
    completedLevels: [],
    levelScores: [],
    soundEnabled,
  };
}

export function recordFailure(session: SessionState): SessionState {
  const level = session.currentLevel;
  const failuresForLevel = (session.failuresByLevel[level] ?? 0) + 1;
  const nextLives = Math.max(0, session.lives - 1);

  return {
    ...session,
    lives: nextLives,
    totalFailures: session.totalFailures + 1,
    failuresByLevel: {
      ...session.failuresByLevel,
      [level]: failuresForLevel,
    },
    levelProgress: 0,
  };
}

export function recordProgress(
  session: SessionState,
  progress: number,
): SessionState {
  return {
    ...session,
    levelProgress: progress,
    furthestProgress: Math.max(session.furthestProgress, progress),
  };
}

export function recordLevelComplete(
  session: SessionState,
  score: LevelScoreResult,
): SessionState {
  const completed = session.completedLevels.includes(session.currentLevel)
    ? session.completedLevels
    : [...session.completedLevels, session.currentLevel];

  const withoutPrior = session.levelScores.filter(
    (entry) => entry.levelId !== score.levelId,
  );

  return {
    ...session,
    completedLevels: completed,
    levelProgress: 1,
    furthestProgress: Math.max(session.furthestProgress, 1),
    furthestLevel: Math.max(session.furthestLevel, session.currentLevel),
    levelScores: [...withoutPrior, score],
  };
}

export function advanceLevel(session: SessionState): SessionState {
  const nextLevel = session.currentLevel + 1;
  return {
    ...session,
    currentLevel: nextLevel,
    levelProgress: 0,
    furthestLevel: Math.max(session.furthestLevel, nextLevel),
  };
}

/** After all lives are spent, restart from Level 1 with a fresh life pool. */
export function resetRunFromLevelOne(session: SessionState): SessionState {
  return {
    ...session,
    currentLevel: 1,
    lives: gameConfig.startingLives,
    levelProgress: 0,
    completedLevels: [],
    levelScores: [],
  };
}
