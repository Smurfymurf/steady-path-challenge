/**
 * Result screen showing timing accuracy.
 */

import { useState } from 'react';
import type { TimerResult, PersonalBest, ChallengeDuration } from '../types';
import { formatTime, formatError } from '../timer';
import { shareOrCopy } from '../share';
import { trackShareClicked, trackShareCompleted } from '../analytics';
import styles from './ResultScreen.module.css';

interface ResultScreenProps {
  result: TimerResult;
  duration: ChallengeDuration;
  personalBest: PersonalBest | null;
  isNewRecord: boolean;
  onTryAgain: () => void;
  onChallengeFrend: () => void;
  onChangeDuration: () => void;
}

export function ResultScreen({
  result,
  duration,
  personalBest,
  isNewRecord,
  onTryAgain,
  onChallengeFrend,
  onChangeDuration,
}: ResultScreenProps) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const error = formatError(result.errorMs);
  
  const handleShare = async () => {
    trackShareClicked();
    const status = await shareOrCopy(duration, result);
    
    if (status === 'shared') {
      setShareStatus('Shared!');
      trackShareCompleted();
    } else if (status === 'copied') {
      setShareStatus('Copied to clipboard!');
    } else {
      setShareStatus('Failed to share');
    }
    
    setTimeout(() => setShareStatus(null), 2000);
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {isNewRecord && (
          <div className={styles.recordBanner}>
            <div className={styles.confetti}>
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={styles.confettiPiece}
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][
                      Math.floor(Math.random() * 5)
                    ],
                  }}
                />
              ))}
            </div>
            <h2 className={styles.recordTitle}>NEW PERSONAL BEST</h2>
          </div>
        )}
        
        <div className={styles.results}>
          <div className={styles.resultRow}>
            <span className={styles.label}>TARGET</span>
            <span className={styles.value}>{formatTime(result.targetMs)}</span>
          </div>
          
          <div className={styles.resultRow}>
            <span className={styles.label}>YOU</span>
            <span className={styles.value}>{formatTime(result.actualMs)}</span>
          </div>
          
          <div className={[styles.resultRow, styles.errorRow].join(' ')}>
            <span className={styles.label}>ERROR</span>
            <span className={[styles.value, styles.errorValue].join(' ')}>
              {result.errorMs < 0 ? '-' : '+'}
              {error.value}
            </span>
          </div>
        </div>
        
        <div className={styles.performance}>
          <p className={styles.performanceLabel}>{result.performance}</p>
          <p className={styles.errorDescription}>{error.description}</p>
        </div>
        
        {personalBest && !isNewRecord && (
          <div className={styles.personalBest}>
            <p className={styles.pbLabel}>Personal best</p>
            <p className={styles.pbValue}>{personalBest.errorSeconds.toFixed(3)} seconds</p>
          </div>
        )}
        
        <div className={styles.actions}>
          <button
            type="button"
            className={[styles.button, styles.primaryButton].join(' ')}
            onClick={onTryAgain}
          >
            TRY AGAIN
          </button>
          
          <button
            type="button"
            className={[styles.button, styles.secondaryButton].join(' ')}
            onClick={handleShare}
          >
            {shareStatus || 'SHARE RESULT'}
          </button>
          
          <button
            type="button"
            className={[styles.button, styles.tertiaryButton].join(' ')}
            onClick={onChallengeFrend}
          >
            CHALLENGE A FRIEND
          </button>
          
          <button
            type="button"
            className={styles.linkButton}
            onClick={onChangeDuration}
          >
            Change duration
          </button>
        </div>
      </div>
    </div>
  );
}
