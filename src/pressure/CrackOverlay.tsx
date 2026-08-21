import { useEffect, useRef } from 'react';
import { CrackCanvasPainter } from './CrackCanvas';
import styles from './CrackOverlay.module.css';

interface CrackOverlayProps {
  /** Crack growth 0–1 (ramps hard near 98–99%). */
  photoReveal: number;
  /** Keep cracks over the finish / result UI. */
  persist?: boolean;
  /**
   * `button` — small crack on the hold target (hidden under the finger).
   * `screen` — larger plate for the finish overlay.
   */
  variant?: 'button' | 'screen';
  /** When true, button crack renders above the button (finger lifted). */
  revealOverButton?: boolean;
}

/**
 * Realistic cracked-glass overlay (Canvas2D).
 * Transparent hairlines only — never warps the UI underneath.
 */
export function CrackOverlay({
  photoReveal,
  persist = false,
  variant = 'button',
  revealOverButton = false,
}: CrackOverlayProps) {
  const show = photoReveal > 0.01 || persist;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const painterRef = useRef<CrackCanvasPainter | null>(null);
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

    const painter = new CrackCanvasPainter(variant === 'button' ? 77 : 91);
    painterRef.current = painter;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent || !painterRef.current) {
        return;
      }
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      painterRef.current.resize(rect.width, rect.height, dpr, canvas);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    let lastKey = '';
    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      const active = painterRef.current;
      if (!active || !ctx) {
        return;
      }
      const reveal = persistRef.current ? 1 : revealRef.current;
      const opacity = persistRef.current
        ? 1
        : Math.min(1, 0.35 + revealRef.current * 0.75);
      const key = `${Math.round(reveal * 100)}:${Math.round(opacity * 100)}:${canvas.width}x${canvas.height}`;
      if (key === lastKey) {
        return;
      }
      lastKey = key;
      active.paint(ctx, reveal, opacity);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      painterRef.current = null;
    };
  }, [show, variant]);

  if (!show) {
    return null;
  }

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
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
