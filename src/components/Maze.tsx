import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type PointerEvent,
} from 'react';
import { brandConfig } from '../config/brand';
import type { LevelDefinition } from '../config/levels';
import type { Point } from '../game/collision';

export interface MazeHandle {
  getSvg: () => SVGSVGElement | null;
  getPath: () => SVGPathElement | null;
}

interface MazeProps {
  level: LevelDefinition;
  showCollisionDebug: boolean;
  pointerPosition: Point | null;
  progress: number;
  isTracking: boolean;
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (event: PointerEvent<SVGSVGElement>) => void;
}

export const Maze = forwardRef<MazeHandle, MazeProps>(function Maze(
  {
    level,
    showCollisionDebug,
    pointerPosition,
    progress,
    isTracking,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useImperativeHandle(ref, () => ({
    getSvg: () => svgRef.current,
    getPath: () => pathRef.current,
  }));

  return (
    <svg
      ref={svgRef}
      className="maze-svg"
      viewBox={`0 0 ${level.width} ${level.height}`}
      role="img"
      aria-label={`${level.name} maze. Drag from Start to Finish without touching the walls.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <rect
        x={0}
        y={0}
        width={level.width}
        height={level.height}
        fill={brandConfig.wallColour}
      />

      {/* Visible corridor */}
      <path
        d={level.pathD}
        fill="none"
        stroke={brandConfig.pathStrokeColour}
        strokeWidth={level.visualWidth + 8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={level.pathD}
        fill="none"
        stroke={brandConfig.pathColour}
        strokeWidth={level.visualWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* * Debug: interaction corridor edge sits inside the visual walls. */}
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

      {/* Hidden geometry used for collision / progress */}
      <path
        ref={pathRef}
        d={level.pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx={level.start.x}
        cy={level.start.y}
        r={level.start.radius}
        fill={brandConfig.startColour}
      />
      <text
        className="maze-label"
        x={level.start.x}
        y={level.start.y + 5}
        textAnchor="middle"
      >
        START
      </text>

      <circle
        cx={level.finish.x}
        cy={level.finish.y}
        r={level.finish.radius}
        fill={brandConfig.finishColour}
      />
      <text
        className="maze-label"
        x={level.finish.x}
        y={level.finish.y + 5}
        textAnchor="middle"
      >
        FINISH
      </text>

      {showCollisionDebug && pointerPosition && (
        <circle
          cx={pointerPosition.x}
          cy={pointerPosition.y}
          r={6}
          fill={isTracking ? '#FFB020' : '#fff'}
          stroke="#1A1F36"
          strokeWidth={2}
          pointerEvents="none"
        />
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
