import { brandConfig } from '../config/brand';
import { gameConfig } from '../config/game';
import styles from './LivesDisplay.module.css';

interface LivesDisplayProps {
  lives: number;
}

export function LivesDisplay({ lives }: LivesDisplayProps) {
  return (
    <div className={styles.lives} aria-label={`${lives} lives remaining`}>
      <span className={styles.label}>Lives</span>
      <div className={styles.row}>
        {Array.from({ length: gameConfig.startingLives }, (_, index) => {
          const filled = index < lives;
          return (
            <span
              key={index}
              className={`${styles.life} ${filled ? styles.filled : styles.empty}`}
              style={{ color: brandConfig.lifeColour }}
              aria-hidden="true"
            >
              ♥
            </span>
          );
        })}
      </div>
    </div>
  );
}
