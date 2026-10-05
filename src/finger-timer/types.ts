/**
 * Type definitions for the Finger Timer Challenge.
 */

export type ChallengeDuration = 10 | 20 | 30 | 60;

export type DistractionIntensity = 1 | 2 | 3;

export interface DistractionEvent {
  id: string;
  /** Minimum target duration in seconds for this event to be eligible. */
  minTargetSeconds: number;
  /** Earliest point in challenge (0-1) where this can trigger. */
  earliestProgress: number;
  /** Latest point in challenge (0-1) where this can trigger. */
  latestProgress: number;
  /** How long the distraction lasts (ms). */
  durationMs: number;
  /** Intensity level 1 (mild) to 3 (extreme). */
  intensity: DistractionIntensity;
  /** Minimum time after this event before another can trigger (ms). */
  cooldownMs?: number;
  /** IDs of events that should not appear in the same round. */
  incompatibleWith?: string[];
  /** Whether this event respects reduced-motion preferences. */
  safeForReducedMotion: boolean;
  /** Weight for random selection (higher = more likely). */
  weight: number;
}

export interface JumpScareEvent extends DistractionEvent {
  type: 'jumpscare';
  /** Path to scare image (portrait). */
  assetPortrait: string;
  /** Path to scare image (landscape). */
  assetLandscape: string;
  /** Path to scream audio. */
  audio: string;
  /** Custom result messages. */
  resultMessages?: {
    early?: string[];
    survived?: string[];
  };
}

export interface ScheduledDistraction {
  event: DistractionEvent | JumpScareEvent;
  /** When this should trigger (progress 0-1). */
  triggerProgress: number;
  /** Scheduled time in ms from start. */
  triggerTimeMs: number;
  /** Has this been triggered yet. */
  triggered: boolean;
}

export interface TimerResult {
  targetMs: number;
  actualMs: number;
  errorMs: number;
  errorSeconds: number;
  direction: 'early' | 'late' | 'perfect';
  performance: string;
  scheduledDistractions: ScheduledDistraction[];
  triggeredDistractions: ScheduledDistraction[];
}

export interface PersonalBest {
  duration: ChallengeDuration;
  errorMs: number;
  errorSeconds: number;
  timestamp: number;
}

export interface GameConfig {
  /** Enable/disable jump scares globally. */
  jumpScaresEnabled: boolean;
  /** Enable/disable sound. */
  soundEnabled: boolean;
  /** Respect prefers-reduced-motion. */
  respectReducedMotion: boolean;
  /** Jump scare probability by duration (0-1). */
  jumpScareProbability: {
    10: number;
    20: number;
    30: number;
    60: number;
  };
}

export type GamePhase =
  | 'landing'
  | 'holding'
  | 'releasing'
  | 'result'
  | 'spinWheel';
