import { useEffect, useRef } from 'react';
import { createCrackLines, paintBreakMask } from './breakMask';
import { pressureConfig } from './config';
import styles from './CrackVideo.module.css';

export type CrackVideoMode = 'bleed' | 'play' | 'hold';

interface CrackVideoProps {
  active: boolean;
  mode: CrackVideoMode;
  /** 0–1 patchy malfunction amount (driven by hold progress; decays on release). */
  bleed?: number;
  onPlayComplete?: () => void;
}

/**
 * Crack video revealed through sparse growing hairlines — not blobs or a flat fade.
 * Release the button → bleed drops → lines shrink away and the UI looks normal again.
 */
export function CrackVideo({
  active,
  mode,
  bleed = 0,
  onPlayComplete,
}: CrackVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const linesRef = useRef(createCrackLines(61, 58));
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onPlayComplete);
  const modeRef = useRef(mode);
  const bleedRef = useRef(bleed);
  const rafRef = useRef(0);

  onCompleteRef.current = onPlayComplete;
  modeRef.current = mode;
  bleedRef.current = bleed;

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    completedRef.current = false;

    if (!maskRef.current) {
      maskRef.current = document.createElement('canvas');
    }

    const resize = () => {
      const canvas = canvasRef.current;
      const mask = maskRef.current;
      if (!canvas || !mask) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      mask.width = w;
      mask.height = h;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    const finishPlay = () => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      try {
        video.pause();
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 0.04);
        }
      } catch {
        // ignore seek errors
      }
      onCompleteRef.current?.();
    };

    let safety = 0;
    const syncMode = () => {
      if (modeRef.current === 'play') {
        video.loop = false;
        video.currentTime = 0;
        void video.play().catch(() => finishPlay());
        safety = window.setTimeout(finishPlay, pressureConfig.crackVideoMaxMs);
        return;
      }
      if (modeRef.current === 'hold') {
        video.loop = false;
        const snap = () => {
          try {
            if (video.duration && Number.isFinite(video.duration)) {
              video.currentTime = Math.max(0, video.duration - 0.04);
            }
          } catch {
            // ignore
          }
          video.pause();
        };
        if (video.readyState >= 2) {
          snap();
        } else {
          video.addEventListener('loadeddata', snap, { once: true });
        }
        void video.play().then(snap).catch(snap);
        return;
      }
      // * Bleed — keep a living malfunction by scrubbing early frames.
      video.loop = true;
      void video.play().catch(() => {
        // Still paint whatever frame we have.
      });
    };

    const onEnded = () => {
      if (modeRef.current === 'play') {
        finishPlay();
      }
    };
    video.addEventListener('ended', onEnded);
    syncMode();

    const started = performance.now();
    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const mask = maskRef.current;
      if (!canvas || !mask) {
        return;
      }
      const ctx = canvas.getContext('2d');
      const maskCtx = mask.getContext('2d');
      if (!ctx || !maskCtx) {
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const timeSec = (now - started) / 1000;
      const currentMode = modeRef.current;
      let amount = currentMode === 'bleed' ? bleedRef.current : 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (currentMode === 'bleed' && amount < 0.01) {
        return;
      }

      // * During bleed, scrub within the early crack formation for a live glitch feel.
      if (currentMode === 'bleed' && video.readyState >= 2 && video.duration) {
        const target = Math.min(video.duration * 0.55, 0.05 + amount * Math.min(1.2, video.duration * 0.5));
        if (Math.abs(video.currentTime - target) > 0.12) {
          try {
            video.currentTime = target;
          } catch {
            // ignore
          }
        }
      }

      if (video.readyState >= 2) {
        // * Cover-fit draw.
        const scale = Math.max(w / video.videoWidth || w, h / video.videoHeight || h);
        const dw = (video.videoWidth || w) * scale;
        const dh = (video.videoHeight || h) * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
      } else {
        return;
      }

      if (currentMode === 'bleed') {
        paintBreakMask(maskCtx, w, h, linesRef.current, amount, timeSec);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(mask, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
      } else if (currentMode === 'hold') {
        ctx.globalAlpha = 0.62;
        // * Redraw with opacity for readable end copy.
        ctx.clearRect(0, 0, w, h);
        const scale = Math.max(w / video.videoWidth || w, h / video.videoHeight || h);
        const dw = (video.videoWidth || w) * scale;
        const dh = (video.videoHeight || h) * scale;
        ctx.globalAlpha = 0.62;
        ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.globalAlpha = 1;
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(safety);
      window.removeEventListener('resize', resize);
      video.removeEventListener('ended', onEnded);
      video.pause();
    };
  }, [active, mode]);

  if (!active) {
    return null;
  }

  return (
    <div
      className={[
        styles.root,
        mode === 'bleed' ? styles.bleed : '',
        mode === 'play' ? styles.play : '',
        mode === 'hold' ? styles.hold : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <video
        ref={videoRef}
        className={styles.hiddenVideo}
        src={pressureConfig.crackVideoSrc}
        muted
        playsInline
        preload="auto"
      />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
