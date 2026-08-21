import type { PointerEvent as ReactPointerEvent } from 'react';
import styles from './PressureButton.module.css';

interface PressureButtonProps {
  pressed: boolean;
  stage: string;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

/**
 * Glossy red emergency-style hold target.
 */
export function PressureButton({
  pressed,
  stage,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerMove,
  disabled = false,
}: PressureButtonProps) {
  const pulse = stage === 'challenge' || stage === 'cracks' || stage === 'stress';
  const stress = stage === 'stress';

  return (
    <button
      type="button"
      className={[
        styles.button,
        pressed ? styles.pressed : '',
        pulse ? styles.pulse : '',
        stress ? styles.stress : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Press and hold"
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerMove={onPointerMove}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className={styles.gloss} aria-hidden />
      <span className={styles.label}>{pressed ? 'HOLDING' : 'HOLD'}</span>
    </button>
  );
}
