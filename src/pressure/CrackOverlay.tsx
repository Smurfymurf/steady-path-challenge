import { pressureConfig } from './config';
import styles from './CrackOverlay.module.css';

interface CrackOverlayProps {
  /** Overall early hairline intensity (0–1). */
  intensity: number;
  /** Photo crack reveal 0–1 (ramps hard near 98–99%). */
  photoReveal: number;
  /** Keep the broken-glass look over the finish/result UI. */
  persist?: boolean;
}

/**
 * Screen-crack illusion: early SVG hairlines, then the photo crack bloom,
 * then a locked overlay that sits above finish text with glass distortion.
 */
export function CrackOverlay({ intensity, photoReveal, persist = false }: CrackOverlayProps) {
  const showHairlines = intensity > 0.02 && photoReveal < 0.85;
  const showPhoto = photoReveal > 0.01 || (persist && intensity > 0.5);

  if (!showHairlines && !showPhoto) {
    return null;
  }

  // * Expanding radial reveal from impact centre.
  const clipPercent = Math.min(150, 8 + photoReveal * 142);
  const photoOpacity = Math.min(1, 0.15 + photoReveal * 0.95);
  const distort = Math.min(1, photoReveal);

  return (
    <div className={`${styles.root} ${persist ? styles.persist : ''}`} aria-hidden>
      {/* * Displacement map filter warps UI sitting under this layer. */}
      <svg className={styles.filterHost} aria-hidden>
        <defs>
          <filter
            id="pressure-glass-distort"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={pressureConfig.crackAsset}
              result="crackMap"
              preserveAspectRatio="xMidYMid meet"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="crackMap"
              scale={4 + distort * 18}
              xChannelSelector="R"
              yChannelSelector="A"
            />
          </filter>
        </defs>
      </svg>

      {showHairlines && (
        <svg className={styles.hairlines} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <g
            fill="none"
            stroke="rgba(40, 40, 45, 0.5)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: Math.min(0.85, intensity * 1.4) * (1 - photoReveal) }}
          >
            <path
              d="M50 48 L51 34 L49 22 L52 10"
              strokeWidth={0.3 + intensity * 0.25}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={Math.max(0, 1 - intensity * 1.5)}
            />
            {intensity > 0.25 && (
              <path
                d="M50 49 L60 40 L72 32 L84 22"
                strokeWidth={0.28}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={Math.max(0, 1 - (intensity - 0.15) * 1.4)}
              />
            )}
            {intensity > 0.45 && (
              <path
                d="M49 50 L38 39 L28 28 L16 16"
                strokeWidth={0.28}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={Math.max(0, 1 - (intensity - 0.35) * 1.5)}
              />
            )}
          </g>
        </svg>
      )}

      {showPhoto && (
        <div
          className={styles.photoWrap}
          style={{
            opacity: persist ? 1 : photoOpacity,
            clipPath: persist
              ? 'circle(150% at 50% 50%)'
              : `circle(${clipPercent}% at 50% 50%)`,
          }}
        >
          <img
            className={styles.photo}
            src={pressureConfig.crackAsset}
            alt=""
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}

/** CSS filter id for content under the crack. */
export const GLASS_DISTORT_FILTER = 'url(#pressure-glass-distort)';
