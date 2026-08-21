import { useState } from 'react';
import { playSfx } from '../game/sound';
import { sharePressureChallenge } from './share';
import styles from './ResultScreen.module.css';

export interface PressureResult {
  fingerStrength: number;
  fearLevel: number;
}

interface ResultScreenProps {
  result: PressureResult;
  onRetry: () => void;
  showPrizeWheel?: boolean;
  onSpin?: () => void;
}

/**
 * Post-scare virality card — optional prize spin for eligible geos.
 */
export function ResultScreen({
  result,
  onRetry,
  showPrizeWheel = false,
  onSpin,
}: ResultScreenProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');

  const handleShare = async () => {
    playSfx('tap');
    const outcome = await sharePressureChallenge();
    setShareStatus(outcome);
  };

  return (
    <div className={styles.root}>
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

      {showPrizeWheel && onSpin && (
        <button
          type="button"
          className={styles.spin}
          onClick={() => {
            playSfx('go');
            onSpin();
          }}
        >
          SPIN TO WIN A PRIZE
        </button>
      )}

      <button
        type="button"
        className={showPrizeWheel ? styles.shareSecondary : styles.share}
        onClick={() => void handleShare()}
      >
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
