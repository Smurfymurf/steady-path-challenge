/**
 * Challenge creation and sharing flow.
 * Makes challenging friends clever and viral.
 */

import { useState } from 'react';
import type { ChallengeDuration, TimerResult } from '../types';
import { formatError } from '../timer';
import { trackChallengeCreated } from '../analytics';
import styles from './ChallengeFlow.module.css';

interface ChallengeFlowProps {
  visible: boolean;
  duration: ChallengeDuration;
  result: TimerResult;
  onClose: () => void;
}

export function ChallengeFlow({ visible, duration, result, onClose }: ChallengeFlowProps) {
  const [trashTalk, setTrashTalk] = useState('');
  const [mode, setMode] = useState<'compose' | 'sharing'>('compose');
  const [copied, setCopied] = useState(false);
  
  if (!visible) return null;
  
  const error = formatError(result.errorMs);
  
  const suggestedTrashTalk = [
    "Beat that if you can.",
    "Your turn. Don't embarrass yourself.",
    "I dare you to do better.",
    "Bet you can't beat this.",
    "Easy. Your turn.",
    "Can your finger handle this?",
  ];
  
  const handleSelectTrashTalk = (text: string) => {
    setTrashTalk(text);
  };
  
  const handleShare = async () => {
    const challengeText = trashTalk || suggestedTrashTalk[0];
    const fullText = `${challengeText}\n\nI was ${error.value} seconds ${error.direction === 'early' ? 'early' : 'late'} on the ${duration}-second Finger Challenge.\n\nThink you can beat me?\n\n${window.location.origin}`;
    
    // * Try Web Share API first.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Finger Challenge',
          text: fullText,
        });
        trackChallengeCreated();
        onClose();
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }
    
    // * Fallback to clipboard.
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      trackChallengeCreated();
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    } catch {
      // * Manual copy fallback.
      setMode('sharing');
    }
  };
  
  if (mode === 'sharing') {
    const challengeText = trashTalk || suggestedTrashTalk[0];
    const fullText = `${challengeText}\n\nI was ${error.value} seconds ${error.direction === 'early' ? 'early' : 'late'} on the ${duration}-second Finger Challenge.\n\nThink you can beat me?\n\n${window.location.origin}`;
    
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panel} onClick={e => e.stopPropagation()}>
          <h2 className={styles.title}>Copy & Send</h2>
          <textarea
            className={styles.textArea}
            value={fullText}
            readOnly
            onClick={e => {
              e.currentTarget.select();
              document.execCommand('copy');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          />
          {copied && <p className={styles.copiedMessage}>Copied to clipboard!</p>}
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Challenge A Friend</h2>
        
        <div className={styles.yourScore}>
          <div className={styles.scoreLabel}>Your Score</div>
          <div className={styles.scoreValue}>
            {error.value}s {error.direction === 'early' ? 'early' : 'late'}
          </div>
          <div className={styles.scoreDuration}>{duration} second challenge</div>
        </div>
        
        <div className={styles.trashTalkSection}>
          <label className={styles.label}>Add some trash talk (optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Say something..."
            value={trashTalk}
            onChange={e => setTrashTalk(e.target.value)}
            maxLength={100}
          />
          
          <div className={styles.suggestions}>
            <p className={styles.suggestionsLabel}>Or pick one:</p>
            <div className={styles.suggestionButtons}>
              {suggestedTrashTalk.map(text => (
                <button
                  key={text}
                  type="button"
                  className={styles.suggestionButton}
                  onClick={() => handleSelectTrashTalk(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.shareButton}
            onClick={handleShare}
          >
            {copied ? '✓ Copied!' : 'Send Challenge'}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
