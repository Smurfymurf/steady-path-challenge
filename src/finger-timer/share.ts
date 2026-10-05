/**
 * Share functionality using Web Share API.
 */

import type { ChallengeDuration, TimerResult } from './types';

/**
 * Check if Web Share API is available.
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Generate share text for a result.
 */
export function generateShareText(duration: ChallengeDuration, errorSeconds: number): string {
  return `I was ${errorSeconds.toFixed(3)} seconds away from exactly ${duration} seconds. Beat me at Finger Challenge!`;
}

/**
 * Share result using Web Share API.
 */
export async function shareResult(
  duration: ChallengeDuration,
  result: TimerResult,
): Promise<boolean> {
  if (!canShare()) {
    return false;
  }
  
  const text = generateShareText(duration, result.errorSeconds);
  const url = window.location.origin;
  
  try {
    await navigator.share({
      title: 'Finger Challenge',
      text,
      url,
    });
    return true;
  } catch (error) {
    // * User cancelled or error occurred.
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // * Fallback for older browsers.
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Share result with fallback to clipboard.
 */
export async function shareOrCopy(
  duration: ChallengeDuration,
  result: TimerResult,
): Promise<'shared' | 'copied' | 'failed'> {
  // * Try Web Share API first.
  if (canShare()) {
    const shared = await shareResult(duration, result);
    if (shared) {
      return 'shared';
    }
  }
  
  // * Fallback to clipboard.
  const text = `${generateShareText(duration, result.errorSeconds)}\n\n${window.location.origin}`;
  const copied = await copyToClipboard(text);
  
  return copied ? 'copied' : 'failed';
}
