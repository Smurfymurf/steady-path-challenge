import styles from './AnimatedBackground.module.css';

interface AnimatedBackgroundProps {
  variant?: 'landing' | 'game' | 'overlay';
}

export function AnimatedBackground({
  variant = 'landing',
}: AnimatedBackgroundProps) {
  return (
    <div className={`${styles.bg} ${styles[variant]}`} aria-hidden="true">
      <span className={`${styles.blob} ${styles.blobA}`} />
      <span className={`${styles.blob} ${styles.blobB}`} />
      <span className={`${styles.blob} ${styles.blobC}`} />
      <span className={`${styles.blob} ${styles.blobD}`} />
      <span className={styles.sparkles} />
    </div>
  );
}
