import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { gameConfig } from '../config/game';
import { getLevel } from '../config/levels';
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
import { FailureOverlay } from './FailureOverlay';
import { LevelHeader } from './LevelHeader';
import { Maze, type MazeHandle } from './Maze';

interface GameScreenProps {
  levelId: number;
  onFailure: (progress: number) => void;
  onLevelComplete: (progress: number) => void;
  onProgress: (progress: number) => void;
  showDebugByDefault?: boolean;
}

type AttemptPhase = 'idle' | 'tracking' | 'failed' | 'completed';

export function GameScreen({
  levelId,
  onFailure,
  onLevelComplete,
  onProgress,
  showDebugByDefault = import.meta.env.DEV,
}: GameScreenProps) {
  const level = getLevel(levelId);
  const mazeRef = useRef<MazeHandle>(null);
  const activePointerId = useRef<number | null>(null);
  const progressRef = useRef(0);
  const hasStartedRef = useRef(false);
  const phaseRef = useRef<AttemptPhase>('idle');

  const [phase, setPhase] = useState<AttemptPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [pointerPosition, setPointerPosition] = useState<Point | null>(null);
  const [showCollisionDebug, setShowCollisionDebug] = useState(showDebugByDefault);
  const [isFlashing, setIsFlashing] = useState(false);

  const resetAttempt = useCallback(() => {
    activePointerId.current = null;
    progressRef.current = 0;
    hasStartedRef.current = false;
    phaseRef.current = 'idle';
    setPhase('idle');
    setProgress(0);
    setPointerPosition(null);
    setIsFlashing(false);
  }, []);

  useEffect(() => {
    resetAttempt();
  }, [levelId, resetAttempt]);

  const triggerFailure = useCallback(
    (nextProgress: number) => {
      if (phaseRef.current === 'failed' || phaseRef.current === 'completed') {
        return;
      }

      phaseRef.current = 'failed';
      setPhase('failed');
      setIsFlashing(true);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      onProgress(nextProgress);

      if (gameConfig.vibrationEnabledByDefault) {
        navigator.vibrate?.(40);
      }

      window.setTimeout(() => {
        setIsFlashing(false);
      }, gameConfig.normalFailureFlashMs);

      window.setTimeout(() => {
        onFailure(nextProgress);
        resetAttempt();
      }, gameConfig.normalFailureMessageMs);
    },
    [onFailure, onProgress, resetAttempt],
  );

  const readPoint = useCallback(
    (event: PointerEvent<SVGSVGElement>): Point | null => {
      const svg = mazeRef.current?.getSvg();
      if (!svg) {
        return null;
      }
      return clientPointToSvgPoint(svg, event.clientX, event.clientY);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (phaseRef.current === 'failed' || phaseRef.current === 'completed') {
        return;
      }

      const point = readPoint(event);
      if (!point) {
        return;
      }

      const insideStart = isInsideCircle(point, level.start, level.start.radius);
      if (!insideStart) {
        return;
      }

      event.preventDefault();
      tryCapturePointer(event.currentTarget, event.pointerId);
      activePointerId.current = event.pointerId;
      hasStartedRef.current = true;
      phaseRef.current = 'tracking';
      progressRef.current = 0;
      setPhase('tracking');
      setProgress(0);
      setPointerPosition(point);
      onProgress(0);
    },
    [level.start, onProgress, readPoint],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return;
      }
      if (phaseRef.current !== 'tracking') {
        return;
      }

      event.preventDefault();
      const pathElement = mazeRef.current?.getPath();
      const point = readPoint(event);
      if (!pathElement || !point) {
        return;
      }

      setPointerPosition(point);

      const insideStart = isInsideCircle(
        point,
        level.start,
        level.start.radius,
      );
      const insideFinish = isInsideCircle(
        point,
        level.finish,
        level.finish.radius,
      );

      // * Start/finish discs can slightly exceed the corridor; keep them valid.
      if (insideStart && progressRef.current < 0.08) {
        onProgress(progressRef.current);
        return;
      }

      const result = evaluatePointerSample({
        pathElement,
        point,
        interactionHalfWidth: level.interactionWidth / 2,
        previousProgress: progressRef.current,
        maxProgressSkip: gameConfig.maxProgressSkip,
        hasStarted: hasStartedRef.current,
      });

      if (!result.ok && !(insideFinish && progressRef.current >= gameConfig.finishProgressThreshold)) {
        triggerFailure(result.progress);
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
        setProgress(1);
        onProgress(1);
        onLevelComplete(1);
      }
    },
    [level, onLevelComplete, onProgress, readPoint, triggerFailure],
  );

  const endTracking = useCallback(
    (event: PointerEvent<SVGSVGElement>, _cancelled: boolean) => {
      if (activePointerId.current !== event.pointerId) {
        return;
      }

      tryReleasePointer(event.currentTarget, event.pointerId);
      activePointerId.current = null;

      if (phaseRef.current === 'tracking') {
        triggerFailure(progressRef.current);
      }
    },
    [triggerFailure],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      endTracking(event, false);
    },
    [endTracking],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      endTracking(event, true);
    },
    [endTracking],
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

  return (
    <section className={`game-screen ${isFlashing ? 'is-failing' : ''}`}>
      <LevelHeader
        levelName={level.name}
        levelNumber={level.id}
        totalLevels={gameConfig.levels}
        progress={progress}
      />

      <div className="maze-stage">
        <Maze
          ref={mazeRef}
          level={level}
          showCollisionDebug={showCollisionDebug}
          pointerPosition={pointerPosition}
          progress={progress}
          isTracking={phase === 'tracking'}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        <FailureOverlay visible={phase === 'failed'} />

        {phase === 'completed' && (
          <div className="complete-banner" role="status">
            Level complete
            <p>Phase 1 prototype — collision system validated.</p>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="debug-panel">
            <span>
              phase: {phase} · failures debug · path {(progress * 100).toFixed(1)}%
            </span>
            <button
              type="button"
              onClick={() => setShowCollisionDebug((value) => !value)}
            >
              {showCollisionDebug ? 'Hide collision' : 'Show collision'}
            </button>
            <button type="button" onClick={resetAttempt}>
              Reset attempt
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
