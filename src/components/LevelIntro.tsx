import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../game/sound';
import styles from './LevelIntro.module.css';

interface LevelIntroProps {
  levelNumber: number;
  totalLevels: number;
  timeLimitSec: number;
  taunt: string;
  onComplete: () => void;
}

type IntroPhase = 'title' | 'timer' | 'taunt' | 'ready' | 'fly';

/**
 * Sequenced level intro: title → timer → taunt → GO, then timer flies to HUD.
 */
export function LevelIntro({
  levelNumber,
  totalLevels,
  timeLimitSec,
  taunt,
  onComplete,
}: LevelIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('title');
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = () => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    const preferReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (preferReduced) {
      setPhase('ready');
      playSfx('pop');
      return undefined;
    }

    playSfx('pop');
    const showTimer = window.setTimeout(() => {
      setPhase('timer');
      playSfx('tick');
    }, 1100);
    const showTaunt = window.setTimeout(() => {
      setPhase('taunt');
      playSfx('whoosh');
    }, 2400);
    const showGo = window.setTimeout(() => {
      setPhase('ready');
      playSfx('pop');
    }, 3800);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(showTaunt);
      window.clearTimeout(showGo);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'fly') {
      return undefined;
    }
    // * Reliable finish even if animationend is missed / overridden.
    const done = window.setTimeout(() => {
      if (finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      onCompleteRef.current();
    }, 820);
    return () => window.clearTimeout(done);
  }, [phase]);

  const handleGo = () => {
    if (phase === 'fly' || finishedRef.current) {
      return;
    }
    playSfx('go');
    const preferReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (preferReduced) {
      finish();
      return;
    }
    setPhase('fly');
  };

  const showTimer = phase === 'timer' || phase === 'taunt' || phase === 'ready' || phase === 'fly';
  const showTaunt = phase === 'taunt' || phase === 'ready' || phase === 'fly';
  const showGo = phase === 'ready';
  const isFlying = phase === 'fly';

  return (
    <div
      className={`${styles.overlay} ${isFlying ? styles.overlayFly : ''}`}
      role="dialog"
      aria-label={`Level ${levelNumber} intro`}
    >
      <div className={`${styles.stack} ${isFlying ? styles.stackFly : ''}`}>
        <div className={`${styles.titleBlock} ${styles.enter}`}>
          <p className={styles.kicker}>Level {levelNumber} / {totalLevels}</p>
          <h2 className={styles.title}>Ready?</h2>
        </div>

        {showTimer && (
          <div
            className={[
              styles.timer,
              !isFlying ? styles.enter : '',
              phase === 'timer' ? styles.timerPulse : '',
              isFlying ? styles.timerFly : '',
            ].filter(Boolean).join(' ')}
          >
            <span className={styles.timerLabel}>You have</span>
            <strong className={styles.timerValue}>{timeLimitSec}</strong>
            <span className={styles.timerUnit}>seconds</span>
          </div>
        )}

        {showTaunt && (
          <p className={`${styles.taunt} ${!isFlying ? styles.enter : ''}`}>{taunt}</p>
        )}

        {showGo && (
          <button
            type="button"
            className={`${styles.goButton} ${styles.enter}`}
            onClick={handleGo}
          >
            GO!
          </button>
        )}
      </div>
    </div>
  );
}
