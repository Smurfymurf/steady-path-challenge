import { brandConfig } from '../config/brand';
import { gameConfig } from '../config/game';
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
  return (
    <main className={styles.landing}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Finger challenge</p>
        <h1 className={styles.title} style={{ color: brandConfig.textColour }}>
          {gameConfig.gameName}
        </h1>
        <p className={styles.tagline}>{gameConfig.tagline}</p>
        <p className={styles.claim}>{gameConfig.challengeLine}</p>
      </section>

      <section className={styles.actions}>
        <button type="button" className={styles.startButton} onClick={onStart}>
          Start Challenge
        </button>

        <div className={styles.meta}>
          <button
            type="button"
            className={`${styles.soundPill} ${soundEnabled ? '' : styles.soundMuted}`}
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Sound enabled' : 'Sound muted'}
          >
            <span className={styles.soundIcon} aria-hidden="true">
              {soundEnabled ? '♪' : '×'}
            </span>
            {soundEnabled ? 'Sound on' : 'Sound off'}
          </button>

          <button type="button" className={styles.ghostLink}>
            Sensitivity options
          </button>
        </div>
      </section>
    </main>
  );
}
