import type { LevelDefinition } from '../config/levels';
import { isInsideCircle, type Point } from './collision';

export function hasReachedFinish(options: {
  point: Point;
  level: LevelDefinition;
  progress: number;
  finishProgressThreshold: number;
}): boolean {
  const inFinishZone = isInsideCircle(
    options.point,
    options.level.finish,
    options.level.finish.radius,
  );

  return (
    inFinishZone && options.progress >= options.finishProgressThreshold
  );
}

export function formatProgressPercent(progress: number): string {
  return `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;
}
