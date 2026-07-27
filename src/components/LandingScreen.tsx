import { useMemo } from 'react';
import { gameConfig } from '../config/game';
import { pickMenuTaunt } from '../config/menuTaunts';
import { FingerMascot } from './FingerMascot';
import { MenuBackdrop } from './MenuBackdrop';
import styles from './LandingScreen.module.css';

interface LandingScreenProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onStart: () => void;
}

export function LandingScreen({
  soundEnabled,
  onToggleSound,
  onStart,
}: LandingScreenProps) {
  const taunt = useMemo(() => pickMenuTaunt(), []);

  return (
    <main className={styles.landing}>
      <MenuBackdrop />

      <button
        type="button"
        className={`${styles.soundToggle} ${soundEnabled ? '' : styles.soundMuted}`}
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Sound enabled' : 'Sound muted'}
      >
        <span aria-hidden="true">{soundEnabled ? '♪' : '×'}</span>
      </button>

      {/* * Single tight stack — no space-between void in the middle */}
      <section className={styles.stack}>
        <p className={styles.ribbon} aria-hidden="true">
          3 levels · Don’t touch the walls
        </p>

        <h1 className={styles.logo} aria-label={gameConfig.gameName}>
          <span className={styles.logoFinger}>Finger</span>
          <span className={styles.logoChallenge}>Challenge</span>
        </h1>

        <p className={styles.tagline}>{gameConfig.tagline}</p>

        <div className={styles.mascot}>
          <FingerMascot size="title" animateIn />
        </div>

        <button
          type="button"
          className={styles.startButton}
          onClick={onStart}
          aria-label={`Start challenge: ${taunt}`}
        >
          <span className={styles.startShine} aria-hidden="true" />
          <span className={styles.startLabel}>{taunt}</span>
        </button>
      </section>
    </main>
  );
}
