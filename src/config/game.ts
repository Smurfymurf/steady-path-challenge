/**
 * Central gameplay configuration.
 */
export const gameConfig = {
  gameName: 'Finger Challenge',
  tagline: 'Beat the clock.\nDon’t touch the walls.',
  challengeLine: 'How steady is your finger?',
  levels: 3,
  startingLives: 3,
  /** Fallback hold if score card is skipped. */
  levelCompleteHoldMs: 900,
  normalFailureFlashMs: 220,
  /** Soft failure (timeout) overlay hold. */
  normalFailureMessageMs: 900,
  /** Quick shock then clear — wall-hit jump scare hold. */
  jumpScareHoldMs: 950,
  failureMessage: 'You touched the wall!',
  timeoutMessage: 'Time’s up!',
  outOfLivesMessage: 'Out of lives!',
  soundEnabledByDefault: true,
  vibrationEnabledByDefault: true,
  /** Max progress jump allowed between pointer samples before treating as a skip. */
  maxProgressSkip: 0.1,
  /** How close to the end (0–1) counts as reaching the finish zone via the path. */
  finishProgressThreshold: 0.92,
  /** Edge ratio above this counts as a near-miss (0–1 of half-width used). */
  nearMissEdgeRatio: 0.78,
  shareUrl: 'https://steady-path-challenge.netlify.app',
  shareText: 'I dare you to beat Finger Challenge without touching the walls.',
} as const;

export type GameState =
  | 'landing'
  | 'playing'
  | 'levelComplete'
  | 'normalFailure'
  | 'gameOver'
  | 'spinWheel'
  | 'allComplete';
