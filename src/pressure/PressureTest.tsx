import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { SpinWheel } from '../components/SpinWheel';
import { getWheelForGeo, isPrizeWheelGeo, type OfferGeo, type WheelConfig } from '../config/offers';
import { detectVisitorGeo } from '../game/geo';
import { fetchWheelForGeo, type LiveWheelConfig } from '../game/liveOffers';
import { playSfx } from '../game/sound';
import { playPressureSfx, setPressureAudioEnabled, unlockPressureAudio } from './audio';
import { pressureConfig, type PressureStage } from './config';
import { CrackVideo } from './CrackVideo';
import { progressToBleed } from './progressToBleed';
import { preloadCrackVideo } from './preloadCrackVideo';
import { formatPower, tickPressure } from './fakePressure';
import {
  hapticBump,
  hapticStop,
  hapticTick,
  markHapticGesture,
} from './haptics';
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
  const [status, setStatus] = useState(defaultStatusForStage('idle'));
  const [headline, setHeadline] = useState(idleHeadline());
  const [held, setHeld] = useState(false);
  const [result, setResult] = useState<PressureResult | null>(null);
  const [scareActive, setScareActive] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [wheel, setWheel] = useState<WheelConfig>(() => getWheelForGeo('FALLBACK'));
  const [wheelSource, setWheelSource] = useState<LiveWheelConfig['source']>('placeholder');
  const [offerGeo, setOfferGeo] = useState<OfferGeo>('FALLBACK');
  const [countryCode, setCountryCode] = useState<string | null>(null);

  const heldRef = useRef(false);
  const progressRef = useRef(0);
  const phaseRef = useRef<UiPhase>('idle');
  const holdElapsedRef = useRef(0);
  const lastFrameAt = useRef(0);
  const lastTauntAt = useRef(0);
  const lastStageForTaunt = useRef<UiPhase>('idle');
  const audioMarks = useRef({ tick: false, creak: false, crack: false, warning: false });
  const statusMarks = useRef({ pressureDetected: false, increaseForce: false });
  const hapticMarks = useRef({ bleed30: false, bleed60: false, bleed90: false });
  const freezeTimer = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setPressureAudioEnabled(true);
    preloadCrackVideo();
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectVisitorGeo().then(async (geoResult) => {
      if (cancelled) {
        return;
      }
      setOfferGeo(geoResult.offerGeo);
      setCountryCode(geoResult.countryCode);
      const liveWheel = await fetchWheelForGeo(geoResult.offerGeo);
      if (!cancelled) {
        setWheel(liveWheel);
        setWheelSource(liveWheel.source);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshWheel = useCallback(async (geo: OfferGeo) => {
    const liveWheel = await fetchWheelForGeo(geo);
    setWheel(liveWheel);
    setWheelSource(liveWheel.source);
    return liveWheel;
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
    hapticMarks.current = { bleed30: false, bleed60: false, bleed90: false };
    lastStageForTaunt.current = 'idle';
    setHeld(false);
    setProgress(0);
    setPhase('idle');
    setStatus(defaultStatusForStage('idle'));
    setHeadline(idleHeadline());
    setResult(null);
    setScareActive(false);
    setShowSpinWheel(false);
    pointerIdRef.current = null;
  }, []);

  const beginFreeze = useCallback(() => {
    if (
      phaseRef.current === 'freeze'
      || phaseRef.current === 'crackVideo'
      || phaseRef.current === 'black'
      || phaseRef.current === 'scare'
      || phaseRef.current === 'result'
    ) {
      return;
    }
    heldRef.current = false;
    setHeld(false);
    phaseRef.current = 'freeze';
    setPhase('freeze');
    setProgress(pressureConfig.freezeAt);
    setStatus('');
    setHeadline('');
    hapticStop();

    // * Brief 99% beat, then play the cracked-screen video.
    freezeTimer.current = window.setTimeout(() => {
      phaseRef.current = 'crackVideo';
      setPhase('crackVideo');
      playPressureSfx('crack');
      hapticBump();
    }, pressureConfig.freezeHoldMs);
  }, []);

  const onCrackVideoComplete = useCallback(() => {
    if (phaseRef.current !== 'crackVideo') {
      return;
    }
    phaseRef.current = 'black';
    setPhase('black');
    setScareActive(true);
  }, []);

  const onScareComplete = useCallback(() => {
    setScareActive(false);
    phaseRef.current = 'result';
    setPhase('result');
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
      if (
        phaseRef.current === 'freeze'
        || phaseRef.current === 'crackVideo'
        || phaseRef.current === 'black'
        || phaseRef.current === 'scare'
        || phaseRef.current === 'result'
      ) {
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
          if (nextStage === 'challenge') {
            hapticTick();
          }
          if (nextStage === 'cracks' || nextStage === 'stress') {
            hapticBump();
          }
        }
      } else if (heldRef.current && nextStage !== 'idle') {
        const gap = nextStage === 'stress' || nextStage === 'cracks' ? 2200 : 4200;
        const chance = nextStage === 'stress' ? 0.03 : 0.014;
        if (now - lastTauntAt.current > gap && Math.random() < chance) {
          const taunt = pickStageTaunt(nextStage);
          if (taunt) {
            setStatus(taunt);
            lastTauntAt.current = now;
          }
        }
      }

      // * Patchy-bleed haptic milestones while the finger is still down.
      if (heldRef.current) {
        markHapticGesture();
        const bleedNow = progressToBleed(tick.progress);
        if (bleedNow >= 0.3 && !hapticMarks.current.bleed30) {
          hapticMarks.current.bleed30 = true;
          hapticTick();
        }
        if (bleedNow >= 0.6 && !hapticMarks.current.bleed60) {
          hapticMarks.current.bleed60 = true;
          hapticBump();
        }
        if (bleedNow >= 0.9 && !hapticMarks.current.bleed90) {
          hapticMarks.current.bleed90 = true;
          hapticBump();
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
      if (tick.progress >= 93 && !audioMarks.current.warning) {
        audioMarks.current.warning = true;
        playPressureSfx('tick');
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
    if (
      phaseRef.current === 'freeze'
      || phaseRef.current === 'crackVideo'
      || phaseRef.current === 'black'
      || phaseRef.current === 'scare'
      || phaseRef.current === 'result'
    ) {
      return;
    }
    event.preventDefault();
    unlockPressureAudio();
    markHapticGesture();
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

    hapticTick();
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!heldRef.current || event.pointerId !== pointerIdRef.current) {
      return;
    }
    // * Keep the iOS haptic gesture window alive while dragging on the button.
    markHapticGesture();
  }, []);

  const percent = formatPower(progress);
  const bleed = progressToBleed(progress);
  const showMeter = phase !== 'idle' && phase !== 'result' && phase !== 'black'
    && phase !== 'scare' && phase !== 'crackVideo';
  const showButton = phase !== 'result' && phase !== 'black' && phase !== 'scare'
    && phase !== 'crackVideo';
  const freezing = phase === 'freeze';
  const onResult = phase === 'result';
  const showPrizeWheel = isPrizeWheelGeo(offerGeo) || isPrizeWheelGeo(countryCode);
  const showCrackPlay = phase === 'crackVideo';
  const showCrackBleed = !showCrackPlay
    && phase !== 'black' && phase !== 'scare' && phase !== 'result'
    && bleed > 0.01;
  const crackActive = showCrackPlay || showCrackBleed;
  const crackMode = showCrackPlay ? 'play' : 'bleed';

  const handleSpin = useCallback(() => {
    if (!showPrizeWheel) {
      return;
    }
    void refreshWheel(offerGeo).finally(() => {
      setShowSpinWheel(true);
    });
  }, [offerGeo, refreshWheel, showPrizeWheel]);

  if (showSpinWheel && showPrizeWheel) {
    return (
      <SpinWheel
        wheel={wheel}
        countryCode={countryCode}
        wheelSource={wheelSource}
        onClose={() => {
          playSfx('tap');
          setShowSpinWheel(false);
        }}
      />
    );
  }

  return (
    <div
      className={[
        styles.shell,
        freezing ? styles.freezing : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {onResult && result ? (
        <ResultScreen
          result={result}
          onRetry={resetRun}
          showPrizeWheel={showPrizeWheel}
          onSpin={handleSpin}
        />
      ) : (
        <div className={styles.content}>
          {headline && <h1 className={styles.headline}>{headline}</h1>}

          <ProgressMeter percent={percent} visible={showMeter} />

          {status && (
            <p className={styles.status}>
              {status}
            </p>
          )}

          {showButton && (
            <div className={styles.buttonWrap}>
              <PressureButton
                pressed={held}
                disabled={freezing}
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerCancel={endHold}
                onPointerMove={onPointerMove}
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

      {crackActive && (
        <CrackVideo
          active
          mode={crackMode}
          bleed={showCrackPlay ? 1 : bleed}
          onPlayComplete={showCrackPlay ? onCrackVideoComplete : undefined}
        />
      )}

      <JumpscareTrigger active={scareActive} onComplete={onScareComplete} />
    </div>
  );
}
