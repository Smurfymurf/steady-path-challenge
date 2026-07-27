import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { gameConfig } from '../config/game';
import {
  getInteractionWidth,
  getLevel,
  getTotalLevels,
  hasNextLevel,
} from '../config/levels';
import {
  evaluatePointerSample,
  isInsideCircle,
  type Point,
} from '../game/collision';
import {
  clientPointToSvgPoint,
  tryCapturePointer,
  tryReleasePointer,
} from '../game/pointerControls';
import { hasReachedFinish } from '../game/progress';
import {
  buildLevelScore,
  type LevelScoreResult,
} from '../game/scoring';
import { pickScareFace, pickScareScream, preloadScareAssets } from '../config/scares';
import { getSceneTheme } from '../config/scenes';
import { playScream, stopScream } from '../game/sound';
import { FailureOverlay } from './FailureOverlay';
import { JumpScare } from './JumpScare';
import { LevelHeader } from './LevelHeader';
import { LevelIntro } from './LevelIntro';
import { Maze, type MazeHandle } from './Maze';
import { ScenicBackdrop } from './ScenicBackdrop';
import { ScoreBreakdown } from './ScoreBreakdown';

interface GameScreenProps {
  levelId: number;
  lives: number;
  /** Wall hits already recorded for this level in the session. */
  levelFailures: number;
  onFailure: (progress: number, kind: FailKind) => void;
  onLevelComplete: (score: LevelScoreResult) => void;
  onContinueFromScore: () => void;
  onProgress: (progress: number) => void;
  onHome: () => void;
  showScoreCard?: boolean;
  pendingScore?: LevelScoreResult | null;
}

type AttemptPhase = 'idle' | 'tracking' | 'failed' | 'completed';
export type FailKind = 'wall' | 'timeout';

const START_HIT_PADDING = 10;
const MAX_FREEHAND_POINTS = 240;

function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    total += Math.hypot(next.x - prev.x, next.y - prev.y);
  }
  return total;
}

export function GameScreen({
  levelId,
  lives,
  levelFailures,
  onFailure,
  onLevelComplete,
  onContinueFromScore,
  onProgress,
  onHome,
  showScoreCard = false,
  pendingScore = null,
}: GameScreenProps) {
  const level = getLevel(levelId);
  const scene = getSceneTheme(levelId);
  const timeLimitMs = level.timeLimitSec * 1000;

  const mazeRef = useRef<MazeHandle>(null);
  const activePointerId = useRef<number | null>(null);
  const progressRef = useRef(0);
  const hasStartedRef = useRef(false);
  const phaseRef = useRef<AttemptPhase>('idle');
  const attemptStartedAtRef = useRef<number | null>(null);
  const edgeRatioSumRef = useRef(0);
  const sampleCountRef = useRef(0);
  const nearMissCountRef = useRef(0);
  const freehandTrailRef = useRef<Point[]>([]);

  const [phase, setPhase] = useState<AttemptPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [pointerPosition, setPointerPosition] = useState<Point | null>(null);
  const [freehandTrail, setFreehandTrail] = useState<Point[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [failKind, setFailKind] = useState<FailKind>('wall');
  const [scareSrc, setScareSrc] = useState<string | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState(timeLimitMs);
  const [timerActive, setTimerActive] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    preloadScareAssets();
  }, []);

  const startHitRadius = level.start.radius + START_HIT_PADDING;

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  const resetAttempt = useCallback(() => {
    activePointerId.current = null;
    progressRef.current = 0;
    hasStartedRef.current = false;
    phaseRef.current = 'idle';
    attemptStartedAtRef.current = null;
    edgeRatioSumRef.current = 0;
    sampleCountRef.current = 0;
    nearMissCountRef.current = 0;
    freehandTrailRef.current = [];
    setPhase('idle');
    setProgress(0);
    setPointerPosition(null);
    setFreehandTrail([]);
    setIsFlashing(false);
    setFailKind('wall');
    setScareSrc(null);
    setTimeRemainingMs(timeLimitMs);
    setTimerActive(false);
    stopScream();
  }, [timeLimitMs]);

  useEffect(() => {
    setIntroDone(false);
    resetAttempt();
  }, [levelId, resetAttempt]);

  const triggerFailure = useCallback(
    (nextProgress: number, kind: FailKind = 'wall') => {
      if (phaseRef.current === 'failed' || phaseRef.current === 'completed') {
        return;
      }

      phaseRef.current = 'failed';
      setPhase('failed');
      setFailKind(kind);
      setIsFlashing(true);
      setTimerActive(false);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      onProgress(nextProgress);

      const isJumpScare = kind === 'wall';
      const holdMs = isJumpScare
        ? gameConfig.jumpScareHoldMs
        : gameConfig.normalFailureMessageMs;

      if (isJumpScare) {
        const face = pickScareFace();
        setScareSrc(face);
        playScream(pickScareScream());
        if (gameConfig.vibrationEnabledByDefault) {
          navigator.vibrate?.([40, 30, 80, 40, 120]);
        }
      } else {
        setScareSrc(null);
        if (gameConfig.vibrationEnabledByDefault) {
          navigator.vibrate?.(40);
        }
      }

      window.setTimeout(() => {
        setIsFlashing(false);
      }, gameConfig.normalFailureFlashMs);

      window.setTimeout(() => {
        stopScream();
        onFailure(nextProgress, kind);
        resetAttempt();
      }, holdMs);
    },
    [onFailure, onProgress, resetAttempt],
  );

  // * Countdown while the finger is tracking.
  useEffect(() => {
    if (!timerActive || phase !== 'tracking') {
      return undefined;
    }

    let frame = 0;
    const tick = () => {
      const startedAt = attemptStartedAtRef.current;
      if (startedAt == null) {
        return;
      }
      const remaining = Math.max(0, timeLimitMs - (Date.now() - startedAt));
      setTimeRemainingMs(remaining);
      if (remaining <= 0) {
        triggerFailure(progressRef.current, 'timeout');
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [phase, timeLimitMs, timerActive, triggerFailure]);

  const readPoint = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const svg = mazeRef.current?.getSvg();
      if (!svg) {
        return null;
      }
      return clientPointToSvgPoint(svg, clientX, clientY);
    },
    [],
  );

  const appendTrailPoint = useCallback((point: Point) => {
    setFreehandTrail((current) => {
      const last = current[current.length - 1];
      if (last && Math.hypot(last.x - point.x, last.y - point.y) < 1.5) {
        return current;
      }
      const next = [...current, point];
      const trimmed = next.length > MAX_FREEHAND_POINTS
        ? next.slice(next.length - MAX_FREEHAND_POINTS)
        : next;
      freehandTrailRef.current = trimmed;
      return trimmed;
    });
  }, []);

  const recordSampleQuality = useCallback(
    (distance: number, halfWidth: number) => {
      if (halfWidth <= 0) {
        return;
      }
      const edgeRatio = Math.min(1, distance / halfWidth);
      edgeRatioSumRef.current += edgeRatio;
      sampleCountRef.current += 1;
      if (edgeRatio >= gameConfig.nearMissEdgeRatio) {
        nearMissCountRef.current += 1;
      }
    },
    [],
  );

  const finishLevel = useCallback(() => {
    const pathElement = mazeRef.current?.getPath();
    const idealPathLength = pathElement?.getTotalLength() ?? 1;
    const startedAt = attemptStartedAtRef.current ?? Date.now();
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    const sampleCount = Math.max(1, sampleCountRef.current);

    const score = buildLevelScore({
      levelId: level.id,
      timeLimitMs,
      elapsedMs,
      averageEdgeRatio: edgeRatioSumRef.current / sampleCount,
      sampleCount,
      nearMissCount: nearMissCountRef.current,
      fingerPathLength: Math.max(1, polylineLength(freehandTrailRef.current)),
      idealPathLength,
      wallHitsBeforeClear: levelFailures,
    });

    onLevelComplete(score);
  }, [level.id, levelFailures, onLevelComplete, timeLimitMs]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!introDone || showScoreCard) {
        return;
      }
      if (phaseRef.current === 'failed' || phaseRef.current === 'completed') {
        return;
      }

      if (event.isPrimary === false) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const point = readPoint(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      const insideStart = isInsideCircle(point, level.start, startHitRadius);
      if (!insideStart) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      tryCapturePointer(event.currentTarget, event.pointerId);
      activePointerId.current = event.pointerId;
      hasStartedRef.current = true;
      phaseRef.current = 'tracking';
      progressRef.current = 0;
      attemptStartedAtRef.current = Date.now();
      edgeRatioSumRef.current = 0;
      sampleCountRef.current = 0;
      nearMissCountRef.current = 0;
      freehandTrailRef.current = [point];
      setPhase('tracking');
      setProgress(0);
      setPointerPosition(point);
      setFreehandTrail([point]);
      setTimeRemainingMs(timeLimitMs);
      setTimerActive(true);
      onProgress(0);
    },
    [introDone, level.start, onProgress, readPoint, showScoreCard, startHitRadius, timeLimitMs],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return;
      }
      if (phaseRef.current !== 'tracking') {
        return;
      }

      event.preventDefault();
      const pathElement = mazeRef.current?.getPath();
      const point = readPoint(event.clientX, event.clientY);
      if (!pathElement || !point) {
        return;
      }

      setPointerPosition(point);
      appendTrailPoint(point);

      const insideStart = isInsideCircle(point, level.start, startHitRadius);
      const insideFinish = isInsideCircle(
        point,
        level.finish,
        level.finish.radius + 6,
      );

      const halfWidth = getInteractionWidth(level, progressRef.current) / 2;
      const result = evaluatePointerSample({
        pathElement,
        point,
        interactionHalfWidth: halfWidth,
        previousProgress: progressRef.current,
        maxProgressSkip: gameConfig.maxProgressSkip,
        hasStarted: hasStartedRef.current,
      });

      if (result.ok || result.reason === 'wall') {
        recordSampleQuality(result.closest.distance, halfWidth);
      }

      if (insideStart && progressRef.current < 0.12) {
        if (result.ok) {
          progressRef.current = result.progress;
          setProgress(result.progress);
          onProgress(result.progress);
        }
        return;
      }

      if (
        !result.ok
        && !(insideFinish && progressRef.current >= gameConfig.finishProgressThreshold)
      ) {
        triggerFailure(Math.max(progressRef.current, result.progress), 'wall');
        return;
      }

      const nextProgress = result.ok
        ? result.progress
        : Math.max(progressRef.current, result.progress);

      progressRef.current = nextProgress;
      setProgress(nextProgress);
      onProgress(nextProgress);

      if (
        hasReachedFinish({
          point,
          level,
          progress: nextProgress,
          finishProgressThreshold: gameConfig.finishProgressThreshold,
        })
      ) {
        phaseRef.current = 'completed';
        setPhase('completed');
        setTimerActive(false);
        setProgress(1);
        onProgress(1);
        finishLevel();
      }
    },
    [
      appendTrailPoint,
      finishLevel,
      level,
      onProgress,
      readPoint,
      recordSampleQuality,
      startHitRadius,
      triggerFailure,
    ],
  );

  const endTracking = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return;
      }

      tryReleasePointer(event.currentTarget, event.pointerId);
      activePointerId.current = null;

      if (phaseRef.current === 'tracking') {
        triggerFailure(progressRef.current, 'wall');
      }
    },
    [triggerFailure],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      endTracking(event);
    },
    [endTracking],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      endTracking(event);
    },
    [endTracking],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return;
      }
      activePointerId.current = null;
      if (phaseRef.current === 'tracking') {
        triggerFailure(progressRef.current, 'wall');
      }
    },
    [triggerFailure],
  );

  useEffect(() => {
    const preventTouchScroll = (event: TouchEvent) => {
      if (phaseRef.current === 'tracking') {
        event.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventTouchScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  const failureTitle = failKind === 'timeout' ? 'Time’s up' : 'Wall hit';
  const failureMessage = failKind === 'timeout'
    ? gameConfig.timeoutMessage
    : gameConfig.failureMessage;

  return (
    <section
      className={`game-screen ${isFlashing ? 'is-failing' : ''}`}
      style={{ backgroundColor: scene.washColour }}
    >
      <div className="game-screen__content">
        <LevelHeader
          levelName={level.name}
          levelNumber={level.id}
          totalLevels={getTotalLevels()}
          progress={progress}
          lives={lives}
          timeRemainingSec={timeRemainingMs / 1000}
          timeLimitSec={level.timeLimitSec}
          timerActive={timerActive}
          timerVisible={introDone}
          onHome={onHome}
        />

        <div className="maze-stage">
          <ScenicBackdrop levelId={level.id}>
            <Maze
              ref={mazeRef}
              level={level}
              scene={scene}
              showCollisionDebug={false}
              pointerPosition={pointerPosition}
              freehandTrail={freehandTrail}
              progress={progress}
              isTracking={phase === 'tracking'}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onLostPointerCapture={handleLostPointerCapture}
            />
          </ScenicBackdrop>

          {!introDone && (
            <LevelIntro
              levelNumber={level.id}
              totalLevels={getTotalLevels()}
              timeLimitSec={level.timeLimitSec}
              taunt={level.taunt}
              onComplete={handleIntroComplete}
            />
          )}

          <FailureOverlay
            visible={phase === 'failed' && failKind === 'timeout'}
            title={failureTitle}
            message={failureMessage}
          />

          <JumpScare
            visible={phase === 'failed' && failKind === 'wall'}
            imageSrc={scareSrc}
          />

          {showScoreCard && pendingScore && (
            <ScoreBreakdown
              score={pendingScore}
              isFinalLevel={!hasNextLevel(level.id)}
              onContinue={onContinueFromScore}
            />
          )}
        </div>
      </div>
    </section>
  );
}
