/**
 * Share helpers for the pressure challenge (virality).
 */

import { gameConfig } from '../config/game';
import { pressureConfig } from './config';

export function getPressureShareUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const url = new URL(window.location.origin);
    url.searchParams.set('ref', 'share');
    return url.toString();
  }
  return `${gameConfig.shareUrl}?ref=share`;
}

export async function sharePressureChallenge(): Promise<'shared' | 'copied' | 'failed'> {
  const url = getPressureShareUrl();
  const text = pressureConfig.shareText;

  if (navigator.share) {
    try {
      await navigator.share({
        title: pressureConfig.challengeName,
        text,
        url,
      });
      return 'shared';
    } catch {
      // Fall through to clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
