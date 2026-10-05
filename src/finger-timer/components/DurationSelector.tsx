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
          <h1 className={styles.title}>FINGER</h1>
          <h1 className={styles.title}>CHALLENGE</h1>
          <p className={styles.subtitle}>Can you guess time perfectly?</p>
          <p className={styles.tagline}>Spoiler: You can't.</p>
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
                <div className={styles.durationMain}>
                  <span className={styles.durationValue}>{duration}</span>
                  <span className={styles.durationUnit}>SEC</span>
                </div>
                {pb && (
                  <span className={styles.pbBadge}>
                    Best: {pb.errorSeconds.toFixed(3)}s
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className={styles.instructions}>
          <div className={styles.instructionStep}>
            <div className={styles.stepNumber}>1</div>
            <p className={styles.instructionText}>Press & hold</p>
          </div>
          <div className={styles.instructionStep}>
            <div className={styles.stepNumber}>2</div>
            <p className={styles.instructionText}>Timer disappears</p>
          </div>
          <div className={styles.instructionStep}>
            <div className={styles.stepNumber}>3</div>
            <p className={styles.instructionText}>Release at perfect time</p>
          </div>
          <p className={styles.warningText}>
            We'll try to distract you.
          </p>
        </div>
      </div>
    </div>
  );
}
