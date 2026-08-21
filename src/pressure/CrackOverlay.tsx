import { pressureConfig } from './config';
import styles from './CrackOverlay.module.css';

interface CrackOverlayProps {
  /** Photo crack reveal 0–1 (ramps hard near 98–99%). */
  photoReveal: number;
  /** Keep the broken-glass look over the finish/result UI. */
  persist?: boolean;
  /**
   * `button` — small crack centred on the hold target (hidden under the finger).
   * `screen` — larger plate for the finish / result overlay.
   */
  variant?: 'button' | 'screen';
  /** When true, button crack renders above the button (finger lifted). */
  revealOverButton?: boolean;
}

/**
 * Photo crack only — no SVG hairlines.
 * Button-sized while holding so the finger hides it until lift-off.
 */
export function CrackOverlay({
  photoReveal,
  persist = false,
  variant = 'button',
  revealOverButton = false,
}: CrackOverlayProps) {
  const showPhoto = photoReveal > 0.01 || persist;

  if (!showPhoto) {
    return null;
  }

  const clipPercent = Math.min(150, 12 + photoReveal * 140);
  const photoOpacity = persist ? 1 : Math.min(1, 0.2 + photoReveal * 0.9);
  const distort = persist ? 1 : Math.min(1, photoReveal);

  return (
    <div
      className={[
        styles.root,
        variant === 'button' ? styles.buttonAnchor : styles.screenAnchor,
        variant === 'button' && revealOverButton ? styles.buttonAnchorVisible : '',
        persist ? styles.persist : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
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
              scale={3 + distort * 14}
              xChannelSelector="R"
              yChannelSelector="A"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={styles.photoWrap}
        style={{
          opacity: photoOpacity,
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
    </div>
  );
}
