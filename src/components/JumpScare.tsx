import { useEffect, useState } from 'react';
import { jumpScareVibration } from '../finger-timer/vibration';
import styles from './JumpScare.module.css';

interface JumpScareProps {
  visible: boolean;
  imageSrc: string | null;
}

// * Defined in styles/global.css so it can target #root outside this module.
const SHAKE_CLASS = 'jumpScareShake';

/**
 * Full-screen face slam with screen shake for wall-hit jump scares.
 */
export function JumpScare({ visible, imageSrc }: JumpScareProps) {
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (!visible || !imageSrc) {
      return;
    }

    setBurstKey((value) => value + 1);
    jumpScareVibration();

    // * Shake the entire app, not just this overlay, so the phone feels hit.
    const root = document.getElementById('root');
    if (!root) {
      return;
    }

    root.classList.remove(SHAKE_CLASS);
    // ! Force a reflow so the animation restarts on back-to-back scares.
    void root.offsetWidth;
    root.classList.add(SHAKE_CLASS);

    const cleanupShake = () => root.classList.remove(SHAKE_CLASS);
    root.addEventListener('animationend', cleanupShake, { once: true });

    return () => {
      root.removeEventListener('animationend', cleanupShake);
      cleanupShake();
    };
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
