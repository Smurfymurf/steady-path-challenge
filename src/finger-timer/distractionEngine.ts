/**
 * Core Distraction Engine for Finger Challenge.
 * 
 * Generates semi-random sequences of distractions based on:
 * - Target duration
 * - Progress percentage
 * - Event intensity
 * - Random seed (for deterministic challenges)
 * - Device capabilities
 */

import type {
  ChallengeDuration,
  DistractionEvent,
  GameConfig,
  JumpScareEvent,
  ScheduledDistraction,
} from './types';
import { SeededRandom } from './seededRandom';
import { allDistractionEvents } from './distractionCatalogue';

/**
 * Configuration for distraction scheduling by duration.
 */
const DISTRACTION_CONFIG = {
  10: { min: 2, max: 4, maxIntensity: 2 },
  20: { min: 4, max: 6, maxIntensity: 2 },
  30: { min: 5, max: 8, maxIntensity: 3 },
  60: { min: 8, max: 12, maxIntensity: 3 },
} as const;

/**
 * Generate a sequence of scheduled distractions for a challenge.
 */
export function generateDistractionSequence(
  targetSeconds: ChallengeDuration,
  seed: string | number,
  config: GameConfig,
): ScheduledDistraction[] {
  const rng = new SeededRandom(seed);
  const targetMs = targetSeconds * 1000;
  const scheduleConfig = DISTRACTION_CONFIG[targetSeconds];
  
  // * Determine if jump scare should appear this round.
  const includeJumpScare = 
    config.jumpScaresEnabled && 
    rng.chance(config.jumpScareProbability[targetSeconds]);
  
  // * Filter eligible events.
  let eligibleEvents = allDistractionEvents.filter(event => {
    // * Check minimum duration.
    if (event.minTargetSeconds > targetSeconds) return false;
    
    // * Exclude jump scares if disabled or not selected this round.
    if ('type' in event && event.type === 'jumpscare') {
      return includeJumpScare;
    }
    
    // * Respect reduced motion preferences.
    if (config.respectReducedMotion && !event.safeForReducedMotion) {
      return false;
    }
    
    // * Check intensity limits.
    if (event.intensity > scheduleConfig.maxIntensity) return false;
    
    return true;
  });
  
  // * Determine number of distractions.
  const count = rng.int(scheduleConfig.min, scheduleConfig.max);
  
  // * Select events using weighted random selection.
  const selectedEvents: DistractionEvent[] = [];
  const usedIds = new Set<string>();
  const incompatibleIds = new Set<string>();
  
  for (let i = 0; i < count && eligibleEvents.length > 0; i++) {
    // * Filter out incompatible events.
    const available = eligibleEvents.filter(
      event => !usedIds.has(event.id) && !incompatibleIds.has(event.id),
    );
    
    if (available.length === 0) break;
    
    // * Weighted random selection.
    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
    let roll = rng.range(0, totalWeight);
    
    let selected: DistractionEvent | null = null;
    for (const event of available) {
      roll -= event.weight;
      if (roll <= 0) {
        selected = event;
        break;
      }
    }
    
    if (!selected) selected = available[available.length - 1]!;
    
    selectedEvents.push(selected);
    usedIds.add(selected.id);
    
    // * Mark incompatible events.
    if (selected.incompatibleWith) {
      selected.incompatibleWith.forEach(id => incompatibleIds.add(id));
    }
  }
  
  // * Schedule events at random times within their eligible windows.
  const scheduled: ScheduledDistraction[] = selectedEvents.map(event => {
    const progress = rng.range(event.earliestProgress, event.latestProgress);
    const triggerTimeMs = progress * targetMs;
    
    return {
      event,
      triggerProgress: progress,
      triggerTimeMs,
      triggered: false,
    };
  });
  
  // * Sort by trigger time.
  scheduled.sort((a, b) => a.triggerTimeMs - b.triggerTimeMs);
  
  return scheduled;
}

/**
 * Check if viewport is landscape (desktop/wide).
 */
export function isWideViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-aspect-ratio: 1/1)').matches;
}

/**
 * Get appropriate jump scare image for current viewport.
 */
export function getJumpScareImage(event: JumpScareEvent): string {
  return isWideViewport() ? event.assetLandscape : event.assetPortrait;
}

/**
 * Preload assets for a distraction sequence.
 */
export function preloadDistractionAssets(sequence: ScheduledDistraction[]): void {
  sequence.forEach(({ event }) => {
    if ('type' in event && event.type === 'jumpscare') {
      const jumpScare = event as JumpScareEvent;
      
      // * Preload images.
      const portrait = new Image();
      portrait.src = jumpScare.assetPortrait;
      const landscape = new Image();
      landscape.src = jumpScare.assetLandscape;
      
      // * Preload audio.
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = jumpScare.audio;
    }
  });
}

/**
 * Get result message for a jump scare if available.
 */
export function getJumpScareResultMessage(
  event: JumpScareEvent,
  direction: 'early' | 'late' | 'perfect',
): string | null {
  if (!event.resultMessages) return null;
  
  if (direction === 'early' && event.resultMessages.early) {
    const messages = event.resultMessages.early;
    return messages[Math.floor(Math.random() * messages.length)]!;
  }
  
  if (direction === 'perfect' || direction === 'late') {
    if (event.resultMessages.survived) {
      const messages = event.resultMessages.survived;
      return messages[Math.floor(Math.random() * messages.length)]!;
    }
  }
  
  return null;
}
