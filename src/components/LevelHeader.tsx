interface LevelHeaderProps {
  levelName: string;
  levelNumber: number;
  totalLevels: number;
  progress: number;
}

export function LevelHeader({
  levelName,
  levelNumber,
  totalLevels,
  progress,
}: LevelHeaderProps) {
  return (
    <header className="level-header">
      <div>
        <h2 className="level-header__title">{levelName}</h2>
        <p className="level-header__hint">Hold start, then drag to finish</p>
      </div>
      <div className="level-header__progress" aria-live="polite">
        Level {levelNumber} of {totalLevels} · {Math.round(progress * 100)}%
      </div>
    </header>
  );
}
