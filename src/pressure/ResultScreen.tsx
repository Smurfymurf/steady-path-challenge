import { useState } from 'react';
import { sharePressureChallenge } from './share';
import styles from './ResultScreen.module.css';

export interface PressureResult {
  fingerStrength: number;
  fearLevel: number;
}

interface ResultScreenProps {
  result: PressureResult;
  onRetry: () => void;
  /** Apply glass displacement so finish text looks warped under the crack. */
  distort?: boolean;
}

/**
 * Post-scare virality card.
 */
export function ResultScreen({ result, onRetry, distort = false }: ResultScreenProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');

  const handleShare = async () => {
    const outcome = await sharePressureChallenge();
    setShareStatus(outcome);
  };

  return (
    <div
      className={`${styles.root} ${distort ? styles.distorted : ''}`}
      style={distort ? { filter: 'url(#pressure-glass-distort)' } : undefined}
    >
      <p className={styles.eyebrow}>Finger Challenge</p>
      <h1 className={styles.title}>FINGER CHALLENGE COMPLETE</h1>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Finger strength</dt>
          <dd>{result.fingerStrength}%</dd>
        </div>
        <div className={styles.stat}>
          <dt>Fear level</dt>
          <dd>{result.fearLevel}%</dd>
        </div>
      </dl>

      <button type="button" className={styles.share} onClick={() => void handleShare()}>
        CHALLENGE A FRIEND
      </button>
      {shareStatus === 'copied' && (
        <p className={styles.hint}>Link copied — send it to a friend.</p>
      )}
      {shareStatus === 'failed' && (
        <p className={styles.hint}>Couldn’t share — copy the URL and send it.</p>
      )}

      <button type="button" className={styles.retry} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
