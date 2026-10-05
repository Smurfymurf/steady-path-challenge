/**
 * Analytics tracking abstraction.
 * Provider-agnostic interface for tracking game events.
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

/**
 * Track an analytics event.
 */
export function trackEvent(event: AnalyticsEvent): void {
  // * TODO: Integrate with analytics provider (e.g., PostHog, Plausible, GA4).
  
  if (typeof window === 'undefined') {
    return;
  }
  
  // * Log to console in development.
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event.name, event.properties);
  }
  
  // * Provider integration placeholder.
  // * Example: window.analytics?.track(event.name, event.properties);
}

/**
 * Track landing page view.
 */
export function trackLandingViewed(): void {
  trackEvent({ name: 'landing_viewed' });
}

/**
 * Track duration selection.
 */
export function trackDurationSelected(duration: number): void {
  trackEvent({
    name: 'duration_selected',
    properties: { duration },
  });
}

/**
 * Track round start.
 */
export function trackRoundStarted(duration: number, seed: string | number): void {
  trackEvent({
    name: 'round_started',
    properties: { duration, seed },
  });
}

/**
 * Track round completion.
 */
export function trackRoundCompleted(data: {
  duration: number;
  actualMs: number;
  errorMs: number;
  direction: string;
  roundNumber: number;
}): void {
  trackEvent({
    name: 'round_completed',
    properties: data,
  });
}

/**
 * Track personal best achieved.
 */
export function trackPersonalBest(duration: number, errorMs: number): void {
  trackEvent({
    name: 'personal_best',
    properties: { duration, errorMs },
  });
}

/**
 * Track retry clicked.
 */
export function trackRetryClicked(): void {
  trackEvent({ name: 'retry_clicked' });
}

/**
 * Track share clicked.
 */
export function trackShareClicked(): void {
  trackEvent({ name: 'share_clicked' });
}

/**
 * Track share completed (if detectable).
 */
export function trackShareCompleted(): void {
  trackEvent({ name: 'share_completed' });
}

/**
 * Track challenge created.
 */
export function trackChallengeCreated(): void {
  trackEvent({ name: 'challenge_created' });
}

/**
 * Track jump scare scheduled.
 */
export function trackJumpScareScheduled(scareId: string, duration: number): void {
  trackEvent({
    name: 'jump_scare_scheduled',
    properties: { scareId, duration },
  });
}

/**
 * Track jump scare triggered.
 */
export function trackJumpScareTriggered(scareId: string, elapsedMs: number): void {
  trackEvent({
    name: 'jump_scare_triggered',
    properties: { scareId, elapsedMs },
  });
}

/**
 * Track round ended within 1 second of jump scare.
 */
export function trackJumpScareImpact(scareId: string, delayMs: number): void {
  trackEvent({
    name: 'jump_scare_impact',
    properties: { scareId, delayMs },
  });
}
