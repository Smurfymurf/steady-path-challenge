import { useEffect, useRef } from 'react';
import { pressureConfig } from './config';
import styles from './CrackVideo.module.css';

export type CrackVideoMode = 'play' | 'hold';

interface CrackVideoProps {
  /** When false, the video element unmounts. */
  active: boolean;
  /** `play` runs the clip once; `hold` freezes the last frame over the end screen. */
  mode: CrackVideoMode;
  onPlayComplete?: () => void;
}

/**
 * Full-screen cracked-screen video — plays at the climax, then holds the final frame.
 */
export function CrackVideo({ active, mode, onPlayComplete }: CrackVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onPlayComplete);
  onCompleteRef.current = onPlayComplete;

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) {
      return undefined;
    }

    completedRef.current = false;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const finish = () => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      try {
        video.pause();
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 0.05);
        }
      } catch {
        // * Seeking can fail mid-load on some mobiles.
      }
      onCompleteRef.current?.();
    };

    if (mode === 'hold') {
      const snapToEnd = () => {
        try {
          if (video.duration && Number.isFinite(video.duration)) {
            video.currentTime = Math.max(0, video.duration - 0.05);
          }
        } catch {
          // ignore
        }
        video.pause();
      };
      if (video.readyState >= 2) {
        snapToEnd();
      } else {
        video.addEventListener('loadeddata', snapToEnd, { once: true });
      }
      void video.play().then(() => {
        snapToEnd();
      }).catch(() => {
        snapToEnd();
      });
      return () => {
        video.removeEventListener('loadeddata', snapToEnd);
      };
    }

    // * Play mode — run the crack clip once, then hand off to the scare.
    const onEnded = () => finish();
    video.addEventListener('ended', onEnded);
    video.currentTime = 0;
    void video.play().catch(() => {
      // * Autoplay blocked — still advance so the scare isn't stuck.
      finish();
    });

    const safety = window.setTimeout(finish, pressureConfig.crackVideoMaxMs);

    return () => {
      window.clearTimeout(safety);
      video.removeEventListener('ended', onEnded);
      video.pause();
    };
  }, [active, mode]);

  if (!active) {
    return null;
  }

  return (
    <div className={`${styles.root} ${mode === 'hold' ? styles.hold : styles.play}`} aria-hidden>
      <video
        ref={videoRef}
        className={styles.video}
        src={pressureConfig.crackVideoSrc}
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
