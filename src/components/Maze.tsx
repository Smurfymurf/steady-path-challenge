import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { brandConfig } from '../config/brand';
import {
  getVisualWidth,
  type LevelDefinition,
} from '../config/levels';
import { getSceneTheme, type SceneTheme } from '../config/scenes';
import type { Point } from '../game/collision';

export interface MazeHandle {
  getSvg: () => SVGSVGElement | null;
  getPath: () => SVGPathElement | null;
}

interface MazeProps {
  level: LevelDefinition;
  scene?: SceneTheme;
  showCollisionDebug: boolean;
  pointerPosition: Point | null;
  freehandTrail: Point[];
  progress: number;
  isTracking: boolean;
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (event: PointerEvent<SVGSVGElement>) => void;
  onLostPointerCapture: (event: PointerEvent<SVGSVGElement>) => void;
}

interface TaperDot {
  x: number;
  y: number;
  r: number;
}

function trailToPolyline(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function buildTaperDots(
  pathElement: SVGGeometryElement,
  level: LevelDefinition,
): TaperDot[] {
  const totalLength = pathElement.getTotalLength();
  if (totalLength <= 0) {
    return [];
  }

  const step = 0.85;
  const count = Math.max(60, Math.ceil(totalLength / step));
  const dots: TaperDot[] = [];

  for (let i = 0; i <= count; i += 1) {
    const progress = i / count;
    const point = pathElement.getPointAtLength(progress * totalLength);
    const width = getVisualWidth(level, progress);
    dots.push({
      x: point.x,
      y: point.y,
      r: width / 2,
    });
  }

  return dots;
}

export const Maze = forwardRef<MazeHandle, MazeProps>(function Maze(
  {
    level,
    scene,
    showCollisionDebug,
    pointerPosition,
    freehandTrail,
    progress,
    isTracking,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [taperDots, setTaperDots] = useState<TaperDot[]>([]);
  const palette = scene ?? getSceneTheme(level.id);

  useImperativeHandle(ref, () => ({
    getSvg: () => svgRef.current,
    getPath: () => pathRef.current,
  }));

  useLayoutEffect(() => {
    const pathElement = pathRef.current;
    if (!pathElement || !level.narrowing) {
      setTaperDots([]);
      return;
    }
    setTaperDots(buildTaperDots(pathElement, level));
  }, [level]);

  const trailProgress = Math.min(1, Math.max(0, progress));
  const showPlayer = Boolean(pointerPosition && isTracking);
  const freehandPoints = trailToPolyline(freehandTrail);
  const usesTaper = Boolean(level.narrowing);
  const markerScale = Math.min(1, level.visualWidth / 40);
  const markerOuter = Math.max(9, 18 * markerScale);
  const markerInner = Math.max(6, 11 * markerScale);
  const trailStroke = Math.max(2.5, Math.min(7, level.visualWidth * 0.28));
  const rimWidth = level.visualWidth + 14;

  return (
    <svg
      ref={svgRef}
      className={`maze-svg ${isTracking ? 'is-tracking' : ''}`}
      viewBox={`0 0 ${level.width} ${level.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="application"
      aria-label={`${level.name} maze. Press and drag from Start to Finish without touching the walls.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
      onContextMenu={(event) => event.preventDefault()}
    >
      <defs>
        <filter id="path-depth" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.2"
            floodColor="#1a1208"
            floodOpacity="0.45"
          />
        </filter>
        <filter id="trench-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="3.5"
            floodColor="#0d1a0c"
            floodOpacity="0.55"
          />
        </filter>
        <linearGradient id="dirt-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.pathColour} />
          <stop offset="55%" stopColor={palette.pathColourDark} />
          <stop offset="100%" stopColor={palette.pathColour} stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="start-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFAB91" />
          <stop offset="100%" stopColor={brandConfig.startColour} />
        </linearGradient>
        <linearGradient id="finish-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B39DDB" />
          <stop offset="100%" stopColor={brandConfig.finishColour} />
        </linearGradient>
      </defs>

      {/*
        Dug trench into the meadow: dark outer walls, recessed dirt floor,
        soft inner lip so the corridor reads as carved from the ground.
      */}
      <path
        ref={pathRef}
        d={level.pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      <g className="path-ground" pointerEvents="none">
        {/* Outer earth banks */}
        <path
          d={level.pathD}
          fill="none"
          stroke="#1b2e14"
          strokeWidth={rimWidth + 10}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.38}
          filter="url(#trench-shadow)"
        />
        <path
          d={level.pathD}
          fill="none"
          stroke={palette.rimColour}
          strokeWidth={rimWidth + 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
        {/* Recessed lip */}
        <path
          d={level.pathD}
          fill="none"
          stroke="#0f1a0c"
          strokeWidth={level.visualWidth + 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.35}
        />
        <path
          d={level.pathD}
          fill="none"
          stroke={palette.rimHighlight}
          strokeWidth={level.visualWidth + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.22}
        />

        {usesTaper ? (
          <g aria-hidden="true" filter="url(#path-depth)">
            <path
              d={level.pathD}
              fill="none"
              stroke="url(#dirt-floor)"
              strokeWidth={level.narrowing?.endVisualWidth ?? level.visualWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {taperDots.map((dot, index) => (
              <circle
                key={`taper-${index}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={palette.pathColour}
              />
            ))}
          </g>
        ) : (
          <path
            d={level.pathD}
            fill="none"
            stroke="url(#dirt-floor)"
            strokeWidth={level.visualWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#path-depth)"
          />
        )}

        {/* Inner packed dirt grain */}
        <path
          d={level.pathD}
          fill="none"
          stroke={palette.pathColourDark}
          strokeWidth={Math.max(2.5, level.visualWidth * 0.12)}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="0.01 0.028"
          opacity={0.4}
        />
        {/* Catch-light on the trench edge */}
        <path
          d={level.pathD}
          fill="none"
          stroke="rgba(255,255,240,0.28)"
          strokeWidth={Math.max(1.2, level.visualWidth * 0.04)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.65}
          transform="translate(0.6 -0.8)"
        />
      </g>

      <path
        d={level.pathD}
        fill="none"
        stroke={brandConfig.trailColour}
        strokeWidth={trailStroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - trailProgress}
        opacity={0.75}
        pointerEvents="none"
      />

      {freehandPoints && (
        <polyline
          points={freehandPoints}
          fill="none"
          stroke={brandConfig.playerColour}
          strokeWidth={Math.max(2, trailStroke * 0.7)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
          pointerEvents="none"
        />
      )}

      {showCollisionDebug && (
        <path
          d={level.pathD}
          fill="none"
          stroke="rgba(255, 59, 74, 0.9)"
          strokeWidth={level.interactionWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
          opacity={0.35}
        />
      )}

      <circle
        cx={level.start.x}
        cy={level.start.y}
        r={level.start.radius + 3}
        fill={palette.rimColour}
        opacity={0.25}
      />
      <circle
        cx={level.start.x}
        cy={level.start.y}
        r={level.start.radius}
        fill="url(#start-gloss)"
      />
      {!isTracking && trailProgress === 0 && (
        <circle
          className="start-pulse"
          cx={level.start.x}
          cy={level.start.y}
          r={level.start.radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3}
          pointerEvents="none"
        />
      )}
      <text
        className="maze-label"
        x={level.start.x}
        y={level.start.y + 4}
        textAnchor="middle"
        fontSize={level.start.radius > 20 ? 13 : 10}
      >
        START
      </text>

      <circle
        cx={level.finish.x}
        cy={level.finish.y}
        r={level.finish.radius + 3}
        fill={palette.rimColour}
        opacity={0.25}
      />
      <circle
        cx={level.finish.x}
        cy={level.finish.y}
        r={level.finish.radius}
        fill="url(#finish-gloss)"
      />
      <text
        className="maze-label"
        x={level.finish.x}
        y={level.finish.y + 4}
        textAnchor="middle"
        fontSize={level.finish.radius > 18 ? 13 : 10}
      >
        FINISH
      </text>

      {showPlayer && pointerPosition && (
        <g
          className="player-marker is-tracking"
          transform={`translate(${pointerPosition.x} ${pointerPosition.y})`}
          pointerEvents="none"
        >
          <circle r={markerOuter} fill="rgba(255, 138, 61, 0.25)" />
          <circle
            r={markerInner}
            fill={brandConfig.playerColour}
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />
          <circle r={Math.max(2, markerInner * 0.35)} fill="#FFFFFF" />
        </g>
      )}

      {showCollisionDebug && (
        <text
          x={12}
          y={24}
          fill="#1A1F36"
          fontSize={12}
          fontFamily="monospace"
          pointerEvents="none"
        >
          progress {(progress * 100).toFixed(1)}%
        </text>
      )}
    </svg>
  );
});
