/**
 * High-precision timer and scoring logic for the Finger Challenge.
 * 
 * CRITICAL: Uses performance.now() for accurate measurement.
 * Animation timing and game timing are completely separated.
 */

import type { ChallengeDuration, TimerResult } from './types';

/**
 * Get performance labels based on absolute error.
 */
export function getPerformanceLabel(errorSeconds: number): string {
  if (errorSeconds <= 0.050) return 'ARE YOU A CLOCK?';
  if (errorSeconds <= 0.150) return 'RIDICULOUSLY CLOSE';
  if (errorSeconds <= 0.300) return 'ELITE FINGER';
  if (errorSeconds <= 0.750) return 'VERY SOLID';
  if (errorSeconds <= 1.500) return 'NOT BAD';
  if (errorSeconds <= 3.000) return 'TIME IS SUBJECTIVE';
  return 'DO YOU KNOW WHAT A SECOND IS?';
}

/**
 * Calculate timing result from target and actual duration.
 */
export function calculateResult(
  targetSeconds: ChallengeDuration,
  startTimeMs: number,
  endTimeMs: number,
  scheduledDistractions: any[] = [],
  triggeredDistractions: any[] = [],
): TimerResult {
  const targetMs = targetSeconds * 1000;
  const actualMs = endTimeMs - startTimeMs;
  const errorMs = actualMs - targetMs;
  const errorSeconds = Math.abs(errorMs / 1000);
  
  const direction = 
    Math.abs(errorMs) < 10 ? 'perfect' : 
    errorMs < 0 ? 'early' : 
    'late';
  
  const performance = getPerformanceLabel(errorSeconds);
  
  return {
    targetMs,
    actualMs,
    errorMs,
    errorSeconds,
    direction,
    performance,
    scheduledDistractions,
    triggeredDistractions,
  };
}

/**
 * Format milliseconds to display format (e.g., "10.437").
 */
export function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(3);
}

/**
 * Format error for display (e.g., "+0.437 seconds late").
 */
export function formatError(errorMs: number): {
  value: string;
  direction: string;
  description: string;
} {
  const seconds = Math.abs(errorMs / 1000);
  const value = seconds.toFixed(3);
  
  if (Math.abs(errorMs) < 10) {
    return {
      value: '0.000',
      direction: 'perfect',
      description: 'IMPOSSIBLY PERFECT',
    };
  }
  
  if (errorMs < 0) {
    return {
      value,
      direction: 'early',
      description: `${value} seconds early`,
    };
  }
  
  return {
    value,
    direction: 'late',
    description: `${value} seconds late`,
  };
}
