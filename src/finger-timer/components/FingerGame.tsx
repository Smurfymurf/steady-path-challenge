/**
 * Main Finger Challenge game component.
 * 
 * Coordinates:
 * - High-precision timing
 * - Distraction engine
 * - Touch/pointer handling
 * - Result calculation
 * - Personal best tracking
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ChallengeDuration, GamePhase, PersonalBest, ScheduledDistraction, TimerResult } from '../types';
import { calculateResult } from '../timer';
import { generateDistractionSequence, preloadDistractionAssets } from '../distractionEngine';
import { getGameConfig, getPersonalBest, savePersonalBest, recordRound, getAllPersonalBests } from '../storage';
import {
  trackLandingViewed,
  trackDurationSelected,
  trackRoundStarted,
  trackRoundCompleted,
  trackPersonalBest,
  trackRetryClicked,
} from '../analytics';
import { DurationSelector } from './DurationSelector';
import { HoldZone } from './HoldZone';
import { ResultScreen } from './ResultScreen';
import { DistractionRenderer } from './DistractionRenderer';
import { Settings } from './Settings';
import styles from './FingerGame.module.css';

export function FingerGame() {
  const [phase, setPhase] = useState<GamePhase>('landing');
  const [selectedDuration, setSelectedDuration] = useState<ChallengeDuration | null>(null);
  const [held, setHeld] = useState(false);
  const [result, setResult] = useState<TimerResult | null>(null);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [currentDistraction, setCurrentDistraction] = useState<ScheduledDistraction | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [allPBs, setAllPBs] = useState<Record<ChallengeDuration, PersonalBest | null>>({
    10: null,
    20: null,
    30: null,
    60: null,
  });
  
  const startTimeRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);
  const scheduledDistractionsRef = useRef<ScheduledDistraction[]>([]);
  const triggeredDistractionsRef = useRef<ScheduledDistraction[]>([]);
  const animationFrameRef = useRef<number>(0);
  const config = useRef(getGameConfig());
  const roundCountRef = useRef(0);
  
  // * Track landing view on mount.
  useEffect(() => {
    trackLandingViewed();
  }, []);
  
  // * Load all personal bests on mount.
  useEffect(() => {
    const pbs = getAllPersonalBests();
    const pbMap: Record<ChallengeDuration, PersonalBest | null> = {
      10: null,
      20: null,
      30: null,
      60: null,
    };
    pbs.forEach(pb => {
      pbMap[pb.duration] = pb;
    });
    setAllPBs(pbMap);
  }, []);
  
  // * Handle page visibility changes - cancel round if page is hidden.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && phase === 'holding') {
        // * Cancel the round if page is backgrounded.
        cancelRound('Round cancelled. Nice try.');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase]);
  
  // * Distraction trigger loop.
  useEffect(() => {
    if (phase !== 'holding' || !selectedDuration) {
      return;
    }
    
    const checkDistractions = () => {
      const elapsed = performance.now() - startTimeRef.current;
      
      scheduledDistractionsRef.current.forEach(scheduled => {
        if (!scheduled.triggered && elapsed >= scheduled.triggerTimeMs) {
          scheduled.triggered = true;
          triggeredDistractionsRef.current.push(scheduled);
          setCurrentDistraction(scheduled);
          
          // * Auto-clear distraction after its duration.
          setTimeout(() => {
            setCurrentDistraction(null);
          }, scheduled.event.durationMs);
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(checkDistractions);
    };
    
    animationFrameRef.current = requestAnimationFrame(checkDistractions);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, selectedDuration]);
  
  const startHold = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!selectedDuration || phase !== 'landing') {
      return;
    }
    
    event.preventDefault();
    
    // * Capture pointer.
    pointerIdRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // * Capture may fail on some browsers/pointers.
    }
    
    // * Generate distraction sequence.
    const seed = Date.now() + Math.random();
    const sequence = generateDistractionSequence(selectedDuration, seed, config.current);
    scheduledDistractionsRef.current = sequence;
    triggeredDistractionsRef.current = [];
    
    // * Preload assets.
    preloadDistractionAssets(sequence);
    
    // * Start timing.
    startTimeRef.current = performance.now();
    setHeld(true);
    setPhase('holding');
    
    // * Track round start.
    trackRoundStarted(selectedDuration, seed);
  }, [selectedDuration, phase]);
  
  const endHold = useCallback((event?: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== 'holding' || !selectedDuration) {
      return;
    }
    
    // * Verify pointer ID if event provided.
    if (pointerIdRef.current !== null && event && event.pointerId !== pointerIdRef.current) {
      return;
    }
    
    // * Release pointer capture.
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // * May already be released.
      }
    }
    
    pointerIdRef.current = null;
    
    // * Calculate result.
    const endTime = performance.now();
    const timerResult = calculateResult(
      selectedDuration,
      startTimeRef.current,
      endTime,
      scheduledDistractionsRef.current,
      triggeredDistractionsRef.current,
    );
    
    // * Record round.
    recordRound(selectedDuration);
    roundCountRef.current += 1;
    
    // * Check personal best.
    const pb = getPersonalBest(selectedDuration);
    const { isNewRecord: newRecord, previous } = savePersonalBest(
      selectedDuration,
      timerResult.errorMs,
    );
    
    // * Track analytics.
    trackRoundCompleted({
      duration: selectedDuration,
      actualMs: timerResult.actualMs,
      errorMs: timerResult.errorMs,
      direction: timerResult.direction,
      roundNumber: roundCountRef.current,
    });
    
    if (newRecord) {
      trackPersonalBest(selectedDuration, timerResult.errorMs);
    }
    
    setResult(timerResult);
    setPersonalBest(pb || previous);
    setIsNewRecord(newRecord);
    setHeld(false);
    setCurrentDistraction(null);
    setPhase('result');
    
    // * Refresh PBs.
    const updatedPB = getPersonalBest(selectedDuration);
    setAllPBs(prev => ({ ...prev, [selectedDuration]: updatedPB }));
  }, [phase, selectedDuration]);
  
  const cancelRound = useCallback((message: string) => {
    setHeld(false);
    setCurrentDistraction(null);
    setPhase('landing');
    pointerIdRef.current = null;
    alert(message);
  }, []);
  
  const handleTryAgain = useCallback(() => {
    trackRetryClicked();
    setResult(null);
    setIsNewRecord(false);
    setCurrentDistraction(null);
    scheduledDistractionsRef.current = [];
    triggeredDistractionsRef.current = [];
    setPhase('landing');
  }, []);
  
  const handleChallengeFrend = useCallback(() => {
    if (!result || !selectedDuration) return;
    
    // * TODO: Implement challenge creation.
    alert('Challenge friend feature coming soon!');
  }, [result, selectedDuration]);
  
  const handleChangeDuration = useCallback(() => {
    setSelectedDuration(null);
    setResult(null);
    setIsNewRecord(false);
    setPhase('landing');
  }, []);
  
  const handleSelectDuration = useCallback((duration: ChallengeDuration) => {
    trackDurationSelected(duration);
    setSelectedDuration(duration);
    const pb = getPersonalBest(duration);
    setPersonalBest(pb);
  }, []);
  
  const handleSettingsClose = useCallback(() => {
    setShowSettings(false);
    // * Reload config after settings change.
    config.current = getGameConfig();
  }, []);
  
  return (
    <div className={styles.container}>
      {phase === 'landing' && !selectedDuration && (
        <DurationSelector
          personalBests={allPBs}
          onSelectDuration={handleSelectDuration}
          onSettings={() => setShowSettings(true)}
        />
      )}
      
      {phase === 'landing' && selectedDuration && (
        <HoldZone
          held={held}
          disabled={false}
          targetSeconds={selectedDuration}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerCancel={endHold}
        />
      )}
      
      {phase === 'holding' && selectedDuration && (
        <HoldZone
          held={held}
          disabled={false}
          targetSeconds={selectedDuration}
          onPointerDown={() => {}}
          onPointerUp={endHold}
          onPointerCancel={endHold}
        />
      )}
      
      {phase === 'result' && result && selectedDuration && (
        <ResultScreen
          result={result}
          duration={selectedDuration}
          personalBest={personalBest}
          isNewRecord={isNewRecord}
          onTryAgain={handleTryAgain}
          onChallengeFrend={handleChallengeFrend}
          onChangeDuration={handleChangeDuration}
        />
      )}
      
      {phase === 'holding' && (
        <DistractionRenderer
          distraction={currentDistraction}
          soundEnabled={config.current.soundEnabled}
        />
      )}
      
      <Settings visible={showSettings} onClose={handleSettingsClose} />
    </div>
  );
}
