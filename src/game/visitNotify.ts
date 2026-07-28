/**
 * Notify Discord when a new visitor lands (best-effort, deduped client-side).
 */

import type { OfferGeo } from '../config/offers';

const VISITOR_KEY = 'fc-visitor-id';
const NOTIFY_COOLDOWN_KEY = 'fc-visit-notified-at';
const NOTIFY_COOLDOWN_MS = 6 * 60 * 60 * 1000;

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) {
      return existing;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return 'anonymous';
  }
}

function shouldNotifyClient(): boolean {
  try {
    const raw = localStorage.getItem(NOTIFY_COOLDOWN_KEY);
    if (!raw) {
      return true;
    }
    const last = Number.parseInt(raw, 10);
    return !Number.isFinite(last) || Date.now() - last > NOTIFY_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markNotifiedClient(): void {
  try {
    localStorage.setItem(NOTIFY_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export interface VisitNotifyPayload {
  countryCode: string | null;
  offerGeo: OfferGeo;
  prizeWheel: boolean;
}

export function notifyNewVisitor(payload: VisitNotifyPayload): void {
  if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
    return;
  }
  if (!shouldNotifyClient()) {
    return;
  }

  markNotifiedClient();

  void fetch('/api/visit-notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      countryCode: payload.countryCode,
      offerGeo: payload.offerGeo,
      prizeWheel: payload.prizeWheel,
      referrer: document.referrer || 'direct',
      path: window.location.pathname || '/',
      visitorKey: getOrCreateVisitorId(),
    }),
    keepalive: true,
  }).catch(() => {
    // * Traffic alerts are best-effort.
  });
}
