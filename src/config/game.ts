/**
 * Central gameplay configuration for the Phase 1 prototype.
 * Scare / share / analytics settings are reserved for later phases.
 */
export const gameConfig = {
  gameName: 'Steady Path Challenge',
  tagline: 'Three levels. Don’t touch the walls.',
  challengeLine: 'How steady is your finger?',
  levels: 3,
  normalFailureFlashMs: 220,
  /** How long the failure message overlay stays visible. */
  normalFailureMessageMs: 900,
  failureMessage: 'You touched the wall. Try again.',
  soundEnabledByDefault: true,
  vibrationEnabledByDefault: true,
  /** Visual corridor width in SVG user units (scaled to screen). */
  visualPathWidth: 60,
  /**
   * Valid interaction corridor width. Slightly narrower than the visual path
   * so the collision boundary sits inside the visible wall edge.
   */
  interactionPathWidth: 50,
  /** Max progress jump allowed between pointer samples before treating as a skip. */
  maxProgressSkip: 0.08,
  /** How close to the end (0–1) counts as reaching the finish zone via the path. */
  finishProgressThreshold: 0.92,
} as const;

export type GameState =
  | 'landing'
  | 'playing'
  | 'levelComplete'
  | 'normalFailure';
