import { useEffect, useState } from 'react';
import { JumpScare } from '../components/JumpScare';
import { pickScareFace, pickScareScream, preloadScareAssets } from '../config/scares';
import { playScream, stopScream } from '../game/sound';
import { pressureConfig } from './config';

interface JumpscareTriggerProps {
  active: boolean;
  onComplete: () => void;
}

/**
 * Black beat → fullscreen face + scream → hand off to result.
 */
export function JumpscareTrigger({ active, onComplete }: JumpscareTriggerProps) {
  const [phase, setPhase] = useState<'idle' | 'black' | 'face'>('idle');
  const [faceSrc, setFaceSrc] = useState<string | null>(null);

  useEffect(() => {
    void preloadScareAssets();
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setFaceSrc(null);
      stopScream();
      return;
    }

    setPhase('black');
    setFaceSrc(null);

    const blackTimer = window.setTimeout(() => {
      const face = pickScareFace();
      const scream = pickScareScream();
      setFaceSrc(face);
      setPhase('face');
      playScream(scream);
      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 80, 40, 120]);
      }
    }, pressureConfig.blackBeatMs);

    const doneTimer = window.setTimeout(() => {
      stopScream();
      onComplete();
    }, pressureConfig.blackBeatMs + pressureConfig.scareHoldMs);

    return () => {
      window.clearTimeout(blackTimer);
      window.clearTimeout(doneTimer);
      stopScream();
    };
  }, [active, onComplete]);

  if (!active) {
    return null;
  }

  if (phase === 'black') {
    return <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }} aria-hidden />;
  }

  return <JumpScare visible={phase === 'face'} imageSrc={faceSrc} />;
}
