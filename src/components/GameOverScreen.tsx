import { useState } from 'react';
import { gameConfig } from '../config/game';
import {
  buildEmailShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
  getShareUrl,
  shareChallenge,
} from '../game/share';
import { playSfx } from '../game/sound';
import { FingerMascot } from './FingerMascot';
import { MenuBackdrop } from './MenuBackdrop';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
  furthestLevel: number;
  showPrizeWheel?: boolean;
  onSpin: () => void;
  onRestart: () => void;
}

export function GameOverScreen({
  furthestLevel,
  showPrizeWheel = false,
  onSpin,
  onRestart,
}: GameOverScreenProps) {
  const [shareNote, setShareNote] = useState<string | null>(null);

  const handleShare = async () => {
    playSfx('tap');
    const result = await shareChallenge();
    if (result === 'shared') {
      setShareNote('Shared!');
    } else if (result === 'copied') {
      setShareNote('Challenge link copied.');
    } else {
      setShareNote('Copy this link: ' + getShareUrl());
    }
  };

  return (
    <main className={styles.screen}>
      <MenuBackdrop />

      <div className={styles.content}>
        <div className={styles.mascotStage}>
          <FingerMascot size="end" />
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>{gameConfig.outOfLivesMessage}</p>
          <h1 className={styles.title}>So close!</h1>
          <p className={styles.body}>
            {showPrizeWheel
              ? `You reached Level ${furthestLevel}. Don’t leave empty-handed — spin for a mystery prize, then dare a friend.`
              : `You reached Level ${furthestLevel}. Challenge a friend and see if they can beat your run.`}
          </p>

          {showPrizeWheel && (
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                playSfx('go');
                onSpin();
              }}
            >
              Spin to win a prize
            </button>
          )}

          <div className={styles.shareBlock}>
            <button type="button" className={styles.secondary} onClick={handleShare}>
              Challenge a friend
            </button>
            <div className={styles.shareRow}>
              <a className={styles.shareLink} href={buildWhatsAppShareUrl()} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a className={styles.shareLink} href={buildEmailShareUrl()}>
                Email
              </a>
              <a className={styles.shareLink} href={buildXShareUrl()} target="_blank" rel="noreferrer">
                X
              </a>
              <button type="button" className={styles.shareLinkButton} onClick={handleShare}>
                Copy link
              </button>
            </div>
            {shareNote && <p className={styles.shareNote}>{shareNote}</p>}
          </div>

          <button
            type="button"
            className={styles.restart}
            onClick={() => {
              playSfx('tap');
              onRestart();
            }}
          >
            Restart game
          </button>
        </div>
      </div>
    </main>
  );
}
