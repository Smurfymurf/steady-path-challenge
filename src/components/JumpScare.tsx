import { useEffect, useState } from 'react';
import styles from './JumpScare.module.css';

interface JumpScareProps {
  visible: boolean;
  imageSrc: string | null;
}

/**
 * Full-screen face slam with screen shake for wall-hit jump scares.
 */
export function JumpScare({ visible, imageSrc }: JumpScareProps) {
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (visible && imageSrc) {
      setBurstKey((value) => value + 1);
    }
  }, [visible, imageSrc]);

  if (!visible || !imageSrc) {
    return null;
  }

  return (
    <div className={styles.root} role="alert" aria-label="Jump scare">
      <div className={styles.flash} key={`flash-${burstKey}`} />
      <img
        key={`face-${burstKey}`}
        className={styles.face}
        src={imageSrc}
        alt=""
        draggable={false}
      />
      <div className={styles.vignette} />
    </div>
  );
}
