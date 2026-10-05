/**
 * Personal best tracking and localStorage management.
 */

import type { ChallengeDuration, PersonalBest, GameConfig } from './types';

const STORAGE_KEY_PREFIX = 'finger-challenge';
const PB_KEY = (duration: ChallengeDuration) => `${STORAGE_KEY_PREFIX}-pb-${duration}`;
const CONFIG_KEY = `${STORAGE_KEY_PREFIX}-config`;
const STATS_KEY = `${STORAGE_KEY_PREFIX}-stats`;

interface GameStats {
  totalRounds: number;
  roundsByDuration: Record<ChallengeDuration, number>;
  lastPlayed: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Get personal best for a specific duration.
 */
export function getPersonalBest(duration: ChallengeDuration): PersonalBest | null {
  try {
    const stored = localStorage.getItem(PB_KEY(duration));
    if (!stored) return null;
    return JSON.parse(stored) as PersonalBest;
  } catch {
    return null;
  }
}

/**
 * Save personal best if it beats the existing record.
 */
export function savePersonalBest(
  duration: ChallengeDuration,
  errorMs: number,
): { isNewRecord: boolean; previous: PersonalBest | null } {
  const errorSeconds = Math.abs(errorMs / 1000);
  const current = getPersonalBest(duration);
  
  if (current && current.errorSeconds <= errorSeconds) {
    return { isNewRecord: false, previous: current };
  }
  
  const newBest: PersonalBest = {
    duration,
    errorMs,
    errorSeconds,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(PB_KEY(duration), JSON.stringify(newBest));
  } catch {
    // * Storage full or disabled.
  }
  
  return { isNewRecord: true, previous: current };
}

/**
 * Get all personal bests.
 */
export function getAllPersonalBests(): PersonalBest[] {
  const durations: ChallengeDuration[] = [10, 20, 30, 60];
  return durations
    .map(duration => getPersonalBest(duration))
    .filter((pb): pb is PersonalBest => pb !== null);
}

/**
 * Get game configuration.
 */
export function getGameConfig(): GameConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (!stored) return getDefaultConfig();
    return { ...getDefaultConfig(), ...JSON.parse(stored) };
  } catch {
    return getDefaultConfig();
  }
}

/**
 * Save game configuration.
 */
export function saveGameConfig(config: GameConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // * Storage full or disabled.
  }
}

/**
 * Get default configuration.
 */
export function getDefaultConfig(): GameConfig {
  // * Check prefers-reduced-motion.
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    jumpScaresEnabled: true,
    soundEnabled: false,
    respectReducedMotion: prefersReducedMotion,
    jumpScareProbability: {
      10: 0.075,
      20: 0.125,
      30: 0.175,
      60: 0.25,
    },
  };
}

/**
 * Get game statistics.
 */
export function getGameStats(): GameStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return {
        totalRounds: 0,
        roundsByDuration: { 10: 0, 20: 0, 30: 0, 60: 0 },
        lastPlayed: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }
    const parsed = JSON.parse(stored) as GameStats;
    // * Backward compatibility
    return {
      ...parsed,
      currentStreak: parsed.currentStreak ?? 0,
      longestStreak: parsed.longestStreak ?? 0,
    };
  } catch {
    return {
      totalRounds: 0,
      roundsByDuration: { 10: 0, 20: 0, 30: 0, 60: 0 },
      lastPlayed: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }
}

/**
 * Record a completed round and update streak.
 */
export function recordRound(duration: ChallengeDuration): void {
  const stats = getGameStats();
  stats.totalRounds += 1;
  stats.roundsByDuration[duration] = (stats.roundsByDuration[duration] || 0) + 1;
  stats.lastPlayed = Date.now();
  
  // * Increment streak
  stats.currentStreak += 1;
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }
  
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // * Storage full or disabled.
  }
}

/**
 * Check if reward trigger should fire.
 */
export function shouldTriggerReward(config: { afterRounds: number }): boolean {
  const stats = getGameStats();
  
  // * Simple trigger after N rounds.
  if (stats.totalRounds > 0 && stats.totalRounds % config.afterRounds === 0) {
    return true;
  }
  
  return false;
}
