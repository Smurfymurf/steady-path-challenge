/**
 * Crack video helpers (preload kept separate so CrackVideo.tsx stays a component module).
 */

import { pressureConfig } from './config';

/** Warm the crack clip early so it starts instantly at 99%. */
export function preloadCrackVideo(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.src = pressureConfig.crackVideoSrc;
  video.load();
}
