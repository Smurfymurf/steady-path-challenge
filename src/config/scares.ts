/**
 * Jump-scare faces + scream SFX cycled randomly on wall hits.
 * Portrait (9:16) for phones; landscape (16:9) for desktop / wide viewports.
 */

const scareIds = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '11',
  '12',
  '13',
  '14',
] as const;

export const scareFacesPortrait = scareIds.map(
  (id) => `/assets/scares/scare-${id}.jpg`,
);

export const scareFacesLandscape = scareIds.map(
  (id) => `/assets/scares/scare-${id}-wide.jpg`,
);

export const scareScreams = [
  '/assets/screams/scream-1.mp3',
  '/assets/screams/scream-2.mp3',
  '/assets/screams/scream-3.mp3',
  '/assets/screams/scream-4.mp3',
  '/assets/screams/scream-5.mp3',
] as const;

function pickRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[pickRandomIndex(items.length)]!;
}

/** True when the viewport is wider than tall (desktop / landscape). */
export function isWideViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(min-aspect-ratio: 1/1)').matches;
}

/** Avoid immediate repeats when the pool has more than one item. */
let lastFaceIndex = -1;
let lastScream = '';

/**
 * Pick a scare face matched to the current viewport aspect.
 * Portrait phones get 9:16; desktop/landscape get 16:9 compositions.
 */
export function pickScareFace(): string {
  const pool = isWideViewport() ? scareFacesLandscape : scareFacesPortrait;
  let index = pickRandomIndex(pool.length);
  let guard = 0;
  while (pool.length > 1 && index === lastFaceIndex && guard < 8) {
    index = pickRandomIndex(pool.length);
    guard += 1;
  }
  lastFaceIndex = index;
  return pool[index]!;
}

export function pickScareScream(): string {
  let next = pickRandom(scareScreams);
  let guard = 0;
  while (scareScreams.length > 1 && next === lastScream && guard < 8) {
    next = pickRandom(scareScreams);
    guard += 1;
  }
  lastScream = next;
  return next;
}

/** Warm the browser cache so the first wall hit is instant. */
export function preloadScareAssets(): void {
  const faces = isWideViewport() ? scareFacesLandscape : scareFacesPortrait;
  faces.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
  scareScreams.forEach((src) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = src;
  });
}
