/**
 * Notify Discord (via Netlify function) when a wheel spin lands.
 * Never call Discord webhooks directly from the browser.
 */

export interface SpinNotifyPayload {
  geo: string;
  countryCode?: string | null;
  offerLabel: string;
  offerId: string;
  campaignId?: number | null;
  source?: string;
}

export function notifyWheelSpin(payload: SpinNotifyPayload): void {
  void fetch('/api/spin-notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // * Notification is best-effort — never block the prize UI.
  });
}
