/**
 * Hold zone component - the main interaction area.
 */

import { type PointerEvent as ReactPointerEvent } from 'react';
import styles from './HoldZone.module.css';

interface HoldZoneProps {
  held: boolean;
  disabled: boolean;
  targetSeconds: number;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

export function HoldZone({
  held,
  disabled,
  targetSeconds,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: HoldZoneProps) {
  return (
    <div className={styles.container}>
      {!held && (
        <div className={styles.instructions}>
          <h1 className={styles.title}>PRESS AND HOLD</h1>
          <p className={styles.subtitle}>
            Lift your finger when you think {targetSeconds} seconds have passed
          </p>
        </div>
      )}
      
      <div
        className={[
          styles.holdZone,
          held ? styles.held : '',
          disabled ? styles.disabled : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerDown={disabled ? undefined : onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Hold zone for ${targetSeconds} second challenge`}
        aria-pressed={held}
      >
        {held && (
          <div className={styles.heldIndicator}>
            <div className={styles.ripple} />
            <div className={styles.centerDot} />
          </div>
        )}
      </div>
    </div>
  );
}
