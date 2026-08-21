import styles from './CrackOverlay.module.css';

interface CrackOverlayProps {
  intensity: number;
}

/**
 * Placeholder SVG hairline cracks — opacity/length driven by intensity (0–1).
 * Swap later for a WebGL glass shader if the concept sticks.
 */
export function CrackOverlay({ intensity }: CrackOverlayProps) {
  if (intensity <= 0.01) {
    return null;
  }

  const opacity = Math.min(1, intensity * 1.15);
  const showSecond = intensity > 0.28;
  const showThird = intensity > 0.5;
  const showFourth = intensity > 0.72;

  return (
    <div className={styles.root} aria-hidden>
      <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <g
          fill="none"
          stroke="rgba(40, 40, 45, 0.55)"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity }}
        >
          <path
            className={styles.line}
            d="M50 42 L51 28 L48 18 L52 8"
            strokeWidth={0.35 + intensity * 0.25}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={Math.max(0, 1 - intensity * 1.4)}
          />
          {showSecond && (
            <path
              className={styles.line}
              d="M50 44 L58 36 L68 30 L78 22"
              strokeWidth={0.3 + intensity * 0.2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={Math.max(0, 1 - (intensity - 0.2) * 1.5)}
            />
          )}
          {showThird && (
            <path
              className={styles.line}
              d="M49 45 L40 34 L32 24 L22 14"
              strokeWidth={0.3 + intensity * 0.2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={Math.max(0, 1 - (intensity - 0.4) * 1.6)}
            />
          )}
          {showFourth && (
            <>
              <path
                d="M52 50 L62 55 L74 58 L86 70"
                strokeWidth={0.28}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={Math.max(0, 1 - (intensity - 0.65) * 2)}
              />
              <path
                d="M47 52 L36 60 L28 72 L18 84"
                strokeWidth={0.28}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={Math.max(0, 1 - (intensity - 0.7) * 2)}
              />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
