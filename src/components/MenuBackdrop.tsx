import styles from './MenuBackdrop.module.css';

/**
 * Shared premium title-menu backdrop used across start / game-over / spin.
 */
export function MenuBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <img
        className={styles.art}
        src="/assets/branding/menu-backdrop.jpg"
        alt=""
        draggable={false}
      />
      <span className={styles.shade} />
      <span className={styles.stageRing} />
    </div>
  );
}
