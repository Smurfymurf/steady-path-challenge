import { useEffect } from 'react';
import type { LevelScoreResult } from '../game/scoring';
import { playSfx } from '../game/sound';
import styles from './ScoreBreakdown.module.css';

interface ScoreBreakdownProps {
  score: LevelScoreResult;
  isFinalLevel: boolean;
  onContinue: () => void;
}

const LINE_EMOJI = ['⚡', '🎯', '🛤️', '😅', '❤️'] as const;

/** Funny post-level scorecard with a continue CTA. */
export function ScoreBreakdown({
  score,
  isFinalLevel,
  onContinue,
}: ScoreBreakdownProps) {
  useEffect(() => {
    playSfx('success');
  }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-label="Level score">
      <div className={styles.confetti} aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className={styles.card}>
        <p className={styles.eyebrow}>Level {score.levelId} cleared!</p>

        <div className={styles.gradeRow}>
          <span className={styles.grade} aria-label={`Grade ${score.grade}`}>
            {score.grade}
          </span>
          <div>
            <h3 className={styles.title}>{score.title}</h3>
            <p className={styles.total}>
              <span>{score.totalPoints}</span> pts
            </p>
          </div>
        </div>

        <ul className={styles.lines}>
          {score.lines.map((line, index) => (
            <li
              key={line.label}
              className={styles.line}
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <span className={styles.emoji} aria-hidden="true">
                {LINE_EMOJI[index % LINE_EMOJI.length]}
              </span>
              <div className={styles.lineCopy}>
                <strong>{line.label}</strong>
                <span>{line.detail}</span>
              </div>
              <em className={line.points < 0 ? styles.neg : styles.pos}>
                {line.points > 0 ? '+' : ''}
                {line.points}
              </em>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={styles.continue}
          onClick={() => {
            playSfx('tap');
            onContinue();
          }}
        >
          {isFinalLevel ? 'See final score 🏆' : 'Next level →'}
        </button>
      </div>
    </div>
  );
}
