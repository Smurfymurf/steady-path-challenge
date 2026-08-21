import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { playPressureSfx, setPressureAudioEnabled, unlockPressureAudio } from './audio';
import { pressureConfig, type PressureStage } from './config';
import { CrackOverlay } from './CrackOverlay';
import { formatPower, tickPressure } from './fakePressure';
import { JumpscareTrigger } from './JumpscareTrigger';
import { PressureButton } from './PressureButton';
import { ProgressMeter } from './ProgressMeter';
import { ResultScreen, type PressureResult } from './ResultScreen';
import {
  defaultStatusForStage,
  idleHeadline,
  pickStageTaunt,
} from './taunts';
import styles from './PressureTest.module.css';

type UiPhase = PressureStage;

/**
 * Standalone Pressure Test challenge — diagnostic aesthetic, scare payoff.
 */
export function PressureTest() {
  const [phase, setPhase] = useState<UiPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [crackIntensity, setCrackIntensity] = useState(0);
  const [photoReveal, setPhotoReveal] = useState(0);
  const [status, setStatus] = useState(defaultStatusForStage('idle'));
  const [headline, setHeadline] = useState(idleHeadline());
  const [held, setHeld] = useState(false);
  const [result, setResult] = useState<PressureResult | null>(null);
  const [scareActive, setScareActive] = useState(false);

  const heldRef = useRef(false);
  const progressRef = useRef(0);
  const phaseRef = useRef<UiPhase>('idle');
  const holdElapsedRef = useRef(0);
  const lastFrameAt = useRef(0);
  const lastTauntAt = useRef(0);
  const lastStageForTaunt = useRef<UiPhase>('idle');
  const audioMarks = useRef({ tick: false, creak: false, crack: false, warning: false });
  const statusMarks = useRef({ pressureDetected: false, increaseForce: false });
  const freezeTimer = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setPressureAudioEnabled(true);
  }, []);

  const resetRun = useCallback(() => {
    if (freezeTimer.current !== null) {
      window.clearTimeout(freezeTimer.current);
      freezeTimer.current = null;
    }
    heldRef.current = false;
    progressRef.current = 0;
    phaseRef.current = 'idle';
    holdElapsedRef.current = 0;
    audioMarks.current = { tick: false, creak: false, crack: false, warning: false };
    statusMarks.current = { pressureDetected: false, increaseForce: false };
    lastStageForTaunt.current = 'idle';
    setHeld(false);
    setProgress(0);
    setCrackIntensity(0);
    setPhotoReveal(0);
    setPhase('idle');
    setStatus(defaultStatusForStage('idle'));
    setHeadline(idleHeadline());
    setResult(null);
    setScareActive(false);
    pointerIdRef.current = null;
  }, []);

  const beginFreeze = useCallback(() => {
    if (phaseRef.current === 'freeze' || phaseRef.current === 'black' || phaseRef.current === 'scare') {
      return;
    }
    heldRef.current = false;
    setHeld(false);
    phaseRef.current = 'freeze';
    setPhase('freeze');
    setProgress(pressureConfig.freezeAt);
    setCrackIntensity(1);
    setPhotoReveal(1);
    setStatus('');
    setHeadline('');
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    freezeTimer.current = window.setTimeout(() => {
      phaseRef.current = 'black';
      setPhase('black');
      setScareActive(true);
    }, pressureConfig.freezeHoldMs);
  }, []);

  const onScareComplete = useCallback(() => {
    setScareActive(false);
    phaseRef.current = 'result';
    setPhase('result');
    // * Crack stays locked full after the scare.
    setCrackIntensity(1);
    setPhotoReveal(1);
    setResult({
      fingerStrength: 94 + Math.floor(Math.random() * 6),
      fearLevel: 100,
    });
  }, []);

  // * Main hold loop.
  useEffect(() => {
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (phaseRef.current === 'freeze' || phaseRef.current === 'black'
        || phaseRef.current === 'scare' || phaseRef.current === 'result') {
        return;
      }

      const last = lastFrameAt.current || now;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastFrameAt.current = now;

      if (heldRef.current) {
        holdElapsedRef.current += dt;
      }

      const tick = tickPressure({
        held: heldRef.current,
        progress: progressRef.current,
        elapsedSec: holdElapsedRef.current,
        dt,
      });

      progressRef.current = tick.progress;
      setProgress(tick.progress);
      setCrackIntensity(tick.crackIntensity);
      setPhotoReveal(tick.photoReveal);

      if (tick.reachedFreeze) {
        beginFreeze();
        return;
      }

      const nextStage = tick.stage;
      if (nextStage !== phaseRef.current && nextStage !== 'idle') {
        phaseRef.current = nextStage;
        setPhase(nextStage);

        if (nextStage !== lastStageForTaunt.current) {
          lastStageForTaunt.current = nextStage;
          const taunt = pickStageTaunt(nextStage);
          if (taunt) {
            setStatus(taunt);
            lastTauntAt.current = now;
          }
          if (nextStage === 'challenge' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        }
      } else if (heldRef.current && nextStage !== 'idle') {
        if (now - lastTauntAt.current > 4200 && Math.random() < 0.014) {
          const taunt = pickStageTaunt(nextStage);
          if (taunt) {
            setStatus(taunt);
            lastTauntAt.current = now;
          }
        }
      }

      if (heldRef.current && tick.progress >= 18 && !statusMarks.current.pressureDetected) {
        statusMarks.current.pressureDetected = true;
        setStatus('Pressure detected');
        lastTauntAt.current = now;
      }
      if (heldRef.current && tick.progress >= 42 && !statusMarks.current.increaseForce) {
        statusMarks.current.increaseForce = true;
        setStatus('Increase force...');
        lastTauntAt.current = now;
      }

      if (!heldRef.current && tick.progress <= 0 && phaseRef.current !== 'idle') {
        phaseRef.current = 'idle';
        setPhase('idle');
        setStatus(defaultStatusForStage('idle'));
        setHeadline(idleHeadline());
      }

      if (tick.progress >= 79 && !audioMarks.current.tick) {
        audioMarks.current.tick = true;
        playPressureSfx('tick');
      }
      if (tick.progress >= 86 && !audioMarks.current.creak) {
        audioMarks.current.creak = true;
        playPressureSfx('creak');
      }
      if (tick.progress >= 96.5 && !audioMarks.current.crack) {
        audioMarks.current.crack = true;
        playPressureSfx('crack');
      }
      if (tick.progress >= 93 && !audioMarks.current.warning) {
        audioMarks.current.warning = true;
        playPressureSfx('warning');
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [beginFreeze]);

  const endHold = useCallback((event?: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== null && event && event.pointerId !== pointerIdRef.current) {
      return;
    }
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // * Capture may already be released.
      }
    }
    pointerIdRef.current = null;
    heldRef.current = false;
    setHeld(false);
  }, []);

  const startHold = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (phaseRef.current === 'freeze' || phaseRef.current === 'black'
      || phaseRef.current === 'scare' || phaseRef.current === 'result') {
      return;
    }
    event.preventDefault();
    unlockPressureAudio();
    pointerIdRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // * Some browsers reject capture on certain pointers.
    }

    heldRef.current = true;
    setHeld(true);
    lastFrameAt.current = 0;
    setHeadline('');
    if (progressRef.current < 1) {
      setStatus('Testing...');
      phaseRef.current = 'discover';
      setPhase('discover');
    }

    if (navigator.vibrate) {
      navigator.vibrate(8);
    }
  }, []);

  const percent = formatPower(progress);
  const showMeter = phase !== 'idle' && phase !== 'result' && phase !== 'black' && phase !== 'scare';
  const showButton = phase !== 'result' && phase !== 'black' && phase !== 'scare';
  const stressed = phase === 'stress';
  const freezing = phase === 'freeze';
  const onResult = phase === 'result';
  const crackPersist = onResult || freezing || photoReveal > 0.55;
  const showCrack = phase !== 'black' && phase !== 'scare';
  const distortContent = photoReveal > 0.35 || onResult || freezing;

  return (
    <div
      className={[
        styles.shell,
        stressed ? styles.stressed : '',
        freezing ? styles.freezing : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {onResult && result ? (
        <ResultScreen result={result} onRetry={resetRun} distort={distortContent} />
      ) : (
        <div
          className={styles.content}
          style={distortContent ? { filter: 'url(#pressure-glass-distort)' } : undefined}
        >
          {headline && <h1 className={styles.headline}>{headline}</h1>}

          <ProgressMeter percent={percent} visible={showMeter} />

          {status && (
            <p className={[styles.status, phase === 'stress' ? styles.statusWarn : ''].filter(Boolean).join(' ')}>
              {status}
            </p>
          )}

          {showButton && (
            <div className={styles.buttonWrap}>
              <PressureButton
                pressed={held}
                stage={phase}
                disabled={freezing}
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerCancel={endHold}
              />
            </div>
          )}

          {phase === 'idle' && (
            <p className={styles.hint}>Press and hold</p>
          )}

          {freezing && (
            <p className={styles.freezePercent}>{pressureConfig.freezeAt}%</p>
          )}
        </div>
      )}

      {showCrack && (
        <CrackOverlay
          intensity={crackIntensity}
          photoReveal={photoReveal}
          persist={crackPersist}
        />
      )}

      <JumpscareTrigger active={scareActive} onComplete={onScareComplete} />
    </div>
  );
}
