import styles from './ProgressMeter.module.css';

interface ProgressMeterProps {
  percent: number;
  visible: boolean;
}

/**
 * POWER meter — diagnostic-style bar + percent.
 */
export function ProgressMeter({ percent, visible }: ProgressMeterProps) {
  if (!visible) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * 14);

  return (
    <div className={styles.root} aria-live="polite">
      <div className={styles.labelRow}>
        <span className={styles.label}>POWER</span>
        <span className={styles.percent}>{clamped}%</span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.fill} style={{ width: `${clamped}%` }} />
      </div>
      <div className={styles.blocks} aria-hidden>
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className={index < filled ? styles.blockOn : styles.blockOff}
          />
        ))}
      </div>
    </div>
  );
}
