import { useEffect, useState, type ReactNode } from 'react';
import { getSceneTheme, type SceneTheme } from '../config/scenes';
import styles from './ScenicBackdrop.module.css';

interface ScenicBackdropProps {
  levelId: number;
  children: ReactNode;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return reduced;
}

function Ambience({ theme, animate }: { theme: SceneTheme; animate: boolean }) {
  if (!animate) {
    return null;
  }

  if (theme.ambience === 'sparkle') {
    return (
      <div className={styles.sparkles} aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>
    );
  }

  const kind = theme.ambience === 'petals' ? styles.petal : styles.leaf;
  const count = theme.ambience === 'petals' ? 12 : 10;

  return (
    <div className={styles.particles} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={`${theme.ambience}-${index}`}
          className={`${styles.particle} ${kind}`}
          style={{
            left: `${6 + ((index * 19) % 88)}%`,
            animationDelay: `${(index * 0.85) % 9}s`,
            animationDuration: `${10 + (index % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Painted portrait scene with light CSS ambience so the maze path sits
 * inside a premium clearing (not a CSS toy landscape).
 */
export function ScenicBackdrop({ levelId, children }: ScenicBackdropProps) {
  const theme = getSceneTheme(levelId);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={`${styles.scene} ${styles[`scene-${theme.id}`]}`}
      data-level={levelId}
      style={{ backgroundColor: theme.washColour }}
    >
      <img
        className={styles.art}
        src={theme.artSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
        style={{ objectPosition: theme.objectPosition }}
      />

      <div className={styles.playfield}>{children}</div>

      <div className={styles.near} aria-hidden="true">
        <Ambience theme={theme} animate={!reducedMotion} />
        <div className={styles.lightSweep} />
      </div>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
