/**
 * Duration selector landing screen.
 */

import type { ChallengeDuration, PersonalBest } from '../types';
import styles from './DurationSelector.module.css';

interface DurationSelectorProps {
  personalBests: Record<ChallengeDuration, PersonalBest | null>;
  onSelectDuration: (duration: ChallengeDuration) => void;
  onSettings: () => void;
}

export function DurationSelector({ personalBests, onSelectDuration, onSettings }: DurationSelectorProps) {
  const durations: ChallengeDuration[] = [10, 20, 30, 60];
  
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.settingsButton}
        onClick={onSettings}
        aria-label="Settings"
      >
        ⚙️
      </button>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>FINGER CHALLENGE</h1>
          <p className={styles.subtitle}>Choose your target</p>
        </div>
        
        <div className={styles.durations}>
          {durations.map(duration => {
            const pb = personalBests[duration];
            
            return (
              <button
                key={duration}
                type="button"
                className={styles.durationButton}
                onClick={() => onSelectDuration(duration)}
              >
                <span className={styles.durationValue}>{duration} SEC</span>
                {pb && (
                  <span className={styles.pbBadge}>
                    PB: {pb.errorSeconds.toFixed(3)}s
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className={styles.instructions}>
          <p className={styles.instructionText}>
            Press and hold your finger
          </p>
          <p className={styles.instructionText}>
            Lift when you think the time is up
          </p>
          <p className={styles.warningText}>
            No timer. Obviously.
          </p>
        </div>
      </div>
    </div>
  );
}
