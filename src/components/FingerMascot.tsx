import styles from './FingerMascot.module.css';

interface FingerMascotProps {
  size?: 'hero' | 'compact' | 'title' | 'end';
  animateIn?: boolean;
}

/**
 * Title-screen / UI mascot — uses the painted PNG art (no SVG stand-in).
 */
export function FingerMascot({
  size = 'hero',
  animateIn = false,
}: FingerMascotProps) {
  return (
    <div
      className={`${styles.wrap} ${styles[size]} ${animateIn ? styles.slideUp : ''}`}
      aria-hidden="true"
    >
      <img
        className={styles.finger}
        src="/assets/branding/finger-mascot.png"
        alt=""
        draggable={false}
      />
    </div>
  );
}
