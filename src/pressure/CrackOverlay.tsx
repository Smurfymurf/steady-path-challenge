import { useEffect, useRef } from 'react';
import { CrackGLRenderer } from './CrackGL';
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
 * Procedural WebGL glass crack — grows with reveal, no PNG plate.
 */
export function CrackOverlay({
  photoReveal,
  persist = false,
  variant = 'button',
  revealOverButton = false,
}: CrackOverlayProps) {
  const show = photoReveal > 0.01 || persist;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CrackGLRenderer | null>(null);
  const revealRef = useRef(photoReveal);
  const persistRef = useRef(persist);
  const rafRef = useRef(0);

  revealRef.current = photoReveal;
  persistRef.current = persist;

  useEffect(() => {
    if (!show) {
      return undefined;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let renderer: CrackGLRenderer | null = null;
    try {
      renderer = new CrackGLRenderer(canvas, variant === 'button' ? 77 : 91);
      rendererRef.current = renderer;
    } catch {
      rendererRef.current = null;
      return undefined;
    }

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent || !rendererRef.current) {
        return;
      }
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rendererRef.current.resize(rect.width, rect.height, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    const started = performance.now();
    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const active = rendererRef.current;
      if (!active) {
        return;
      }
      const reveal = persistRef.current ? 1 : revealRef.current;
      const opacity = persistRef.current
        ? 1
        : Math.min(1, 0.25 + revealRef.current * 0.85);
      active.draw(reveal, opacity, (now - started) / 1000);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer?.dispose();
      rendererRef.current = null;
    };
  }, [show, variant]);

  if (!show) {
    return null;
  }

  const distortScale = persist ? 12 : Math.min(14, 3 + photoReveal * 12);

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
      {/* * Soft procedural warp under finish text (no PNG displacement map). */}
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
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045"
              numOctaves="3"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={distortScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
