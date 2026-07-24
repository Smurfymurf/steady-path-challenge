export interface SessionState {
  sessionId: string;
  currentLevel: number;
  totalFailures: number;
  failuresByLevel: Record<number, number>;
  levelProgress: number;
  furthestProgress: number;
  startedAt: number;
  completedLevels: number[];
  soundEnabled: boolean;
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSession(soundEnabled: boolean): SessionState {
  return {
    sessionId: createSessionId(),
    currentLevel: 1,
    totalFailures: 0,
    failuresByLevel: {},
    levelProgress: 0,
    furthestProgress: 0,
    startedAt: Date.now(),
    completedLevels: [],
    soundEnabled,
  };
}

export function recordFailure(session: SessionState): SessionState {
  const level = session.currentLevel;
  const failuresForLevel = (session.failuresByLevel[level] ?? 0) + 1;

  return {
    ...session,
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

export function recordLevelComplete(session: SessionState): SessionState {
  const completed = session.completedLevels.includes(session.currentLevel)
    ? session.completedLevels
    : [...session.completedLevels, session.currentLevel];

  return {
    ...session,
    completedLevels: completed,
    levelProgress: 1,
    furthestProgress: Math.max(session.furthestProgress, 1),
  };
}
