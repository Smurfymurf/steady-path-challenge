import { useEffect, useState } from 'react';
import { playSfx } from '../game/sound';
import { LivesDisplay } from './LivesDisplay';

interface LevelHeaderProps {
  levelName: string;
  levelNumber: number;
  totalLevels: number;
  progress: number;
  lives: number;
  /** Remaining countdown seconds (fractional ok). */
  timeRemainingSec: number;
  timeLimitSec: number;
  timerActive: boolean;
  /** False while the center intro timer is flying into place. */
  timerVisible?: boolean;
  onHome: () => void;
}

export function LevelHeader({
  levelName,
  levelNumber,
  totalLevels,
  progress,
  lives,
  timeRemainingSec,
  timeLimitSec,
  timerActive,
  timerVisible = true,
  onHome,
}: LevelHeaderProps) {
  const [hideProgressBanner, setHideProgressBanner] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const sync = () => setHideProgressBanner(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const display = Math.max(0, timeRemainingSec);
  const ratio = timeLimitSec > 0 ? display / timeLimitSec : 0;
  const urgent = display <= Math.min(3, timeLimitSec * 0.4);
  const whole = Math.ceil(display);
  const ring = Math.max(0, Math.min(1, ratio));

  return (
    <header className={`level-header${hideProgressBanner ? ' is-compact' : ''}`}>
      <div className="level-header__top">
        <button
          type="button"
          className="home-button"
          onClick={() => {
            playSfx('tap');
            onHome();
          }}
          aria-label="Back to start screen"
          title="Start screen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <div
          className={[
            'level-timer',
            timerVisible ? 'is-visible' : 'is-hidden',
            timerActive ? 'is-active' : '',
            urgent ? 'is-urgent' : '',
          ].filter(Boolean).join(' ')}
          aria-label={`${whole} seconds remaining`}
          aria-hidden={!timerVisible}
        >
          <svg className="level-timer__ring" viewBox="0 0 36 36" aria-hidden="true">
            <circle className="level-timer__track" cx="18" cy="18" r="15.5" />
            <circle
              className="level-timer__progress"
              cx="18"
              cy="18"
              r="15.5"
              style={{
                strokeDasharray: `${ring * 97.4} 97.4`,
              }}
            />
          </svg>
          <div className="level-timer__copy">
            <span className="level-timer__label">TIME LEFT</span>
            <strong className="level-timer__value">{whole}</strong>
            <span className="level-timer__unit">sec</span>
          </div>
        </div>

        <LivesDisplay lives={lives} />
      </div>

      {!hideProgressBanner && (
        <div className="level-header__banner">
          <h2 className="level-header__title">{levelName}</h2>
          <div className="level-header__bar" aria-hidden="true">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="level-header__hint">
            {levelNumber}/{totalLevels} · Hold START · Beat the clock
          </p>
        </div>
      )}
    </header>
  );
}
