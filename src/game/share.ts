import { gameConfig } from '../config/game';

export function getShareUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const url = new URL(window.location.href);
    url.searchParams.set('ref', 'share');
    url.searchParams.delete('level');
    url.searchParams.delete('demo');
    return url.toString();
  }
  return `${gameConfig.shareUrl}?ref=share`;
}

export function getShareText(): string {
  return gameConfig.shareText;
}

export async function shareChallenge(): Promise<'shared' | 'copied' | 'failed'> {
  const url = getShareUrl();
  const text = getShareText();

  if (navigator.share) {
    try {
      await navigator.share({
        title: gameConfig.gameName,
        text,
        url,
      });
      return 'shared';
    } catch {
      // Fall through to clipboard / fail.
    }
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function buildWhatsAppShareUrl(): string {
  const payload = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
  return `https://wa.me/?text=${payload}`;
}

export function buildEmailShareUrl(): string {
  const subject = encodeURIComponent(`Try ${gameConfig.gameName}`);
  const body = encodeURIComponent(`${getShareText()}\n\n${getShareUrl()}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

export function buildXShareUrl(): string {
  const text = encodeURIComponent(getShareText());
  const url = encodeURIComponent(getShareUrl());
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}
