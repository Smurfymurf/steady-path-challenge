/**
 * Persist offer assignments in Netlify Blobs.
 *
 * Classic Functions (export const handler) run in Lambda compatibility mode,
 * so Blobs needs connectLambda(event) before getStore() — otherwise saves
 * silently fail and the game never sees admin offers.
 */

import { connectLambda, getStore, type Store } from '@netlify/blobs';
import type { HandlerEvent } from '@netlify/functions';
import {
  emptyAssignments,
  OFFER_GEOS,
  WHEEL_SLOT_COUNT,
  type OfferAssignments,
  type OfferGeo,
} from './offerTypes';

const STORE_NAME = 'finger-challenge';
const KEY = 'offer-assignments';

let memoryFallback: OfferAssignments | null = null;

export type AssignmentStorage = 'blobs' | 'memory';

export interface AssignmentReadResult {
  assignments: OfferAssignments;
  storage: AssignmentStorage;
  error?: string;
}

export interface AssignmentWriteResult extends AssignmentReadResult {
  persisted: boolean;
}

function normaliseAssignments(raw: OfferAssignments): OfferAssignments {
  const geos = { ...emptyAssignments().geos };
  for (const geo of OFFER_GEOS) {
    const list = raw.geos?.[geo];
    geos[geo as OfferGeo] = Array.isArray(list) ? list.slice(0, WHEEL_SLOT_COUNT) : [];
  }
  return {
    version: 1,
    updatedAt: raw.updatedAt ?? new Date(0).toISOString(),
    geos,
  };
}

/**
 * Open the site Blobs store. Pass the Lambda event so connectLambda can
 * attach Netlify's automatic Blobs credentials for Functions v1.
 */
function getOfferStore(event?: HandlerEvent): { store: Store | null; error?: string } {
  if (event) {
    try {
      connectLambda(event);
    } catch (error) {
      console.error('[assignments] connectLambda failed:', error);
    }
  }

  try {
    return {
      store: getStore({
        name: STORE_NAME,
        consistency: 'strong',
      }),
    };
  } catch (autoError) {
    const siteID = process.env.SITE_ID
      || process.env.NETLIFY_SITE_ID
      || process.env.BLOBS_SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN
      || process.env.BLOBS_TOKEN
      || process.env.NETLIFY_AUTH_TOKEN;

    if (siteID && token) {
      try {
        return {
          store: getStore({
            name: STORE_NAME,
            siteID,
            token,
            consistency: 'strong',
          }),
        };
      } catch (manualError) {
        const message = manualError instanceof Error ? manualError.message : String(manualError);
        console.error('[assignments] Manual Blobs config failed:', manualError);
        return { store: null, error: message };
      }
    }

    const message = autoError instanceof Error ? autoError.message : String(autoError);
    console.error('[assignments] Netlify Blobs unavailable:', autoError);
    return {
      store: null,
      error: `${message} (set BLOBS_SITE_ID + NETLIFY_BLOBS_TOKEN if this keeps failing)`,
    };
  }
}

export async function readAssignments(
  event?: HandlerEvent,
): Promise<AssignmentReadResult> {
  const { store, error } = getOfferStore(event);
  if (store) {
    try {
      const value = await store.get(KEY, { type: 'json' });
      if (value && typeof value === 'object') {
        return {
          assignments: normaliseAssignments(value as OfferAssignments),
          storage: 'blobs',
        };
      }
      return {
        assignments: memoryFallback ?? emptyAssignments(),
        storage: 'blobs',
      };
    } catch (readError) {
      const message = readError instanceof Error ? readError.message : String(readError);
      console.error('[assignments] Blobs read failed:', readError);
      return {
        assignments: memoryFallback ?? emptyAssignments(),
        storage: 'memory',
        error: message,
      };
    }
  }

  return {
    assignments: memoryFallback ?? emptyAssignments(),
    storage: 'memory',
    error,
  };
}

export async function writeAssignments(
  next: OfferAssignments,
  event?: HandlerEvent,
): Promise<AssignmentWriteResult> {
  const normalised: OfferAssignments = {
    ...normaliseAssignments(next),
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  memoryFallback = normalised;

  const { store, error } = getOfferStore(event);
  if (!store) {
    return {
      assignments: normalised,
      storage: 'memory',
      persisted: false,
      error,
    };
  }

  try {
    await store.setJSON(KEY, normalised);
    const verify = await store.get(KEY, { type: 'json' });
    const ok = Boolean(verify && typeof verify === 'object');
    return {
      assignments: normalised,
      storage: 'blobs',
      persisted: ok,
      error: ok ? undefined : 'Blobs write did not verify',
    };
  } catch (writeError) {
    const message = writeError instanceof Error ? writeError.message : String(writeError);
    console.error('[assignments] Blobs write failed:', writeError);
    return {
      assignments: normalised,
      storage: 'memory',
      persisted: false,
      error: message,
    };
  }
}

/** Count assigned slots across all geos (for admin/status). */
export function countAssignedSlots(assignments: OfferAssignments): number {
  return OFFER_GEOS.reduce((sum, geo) => sum + (assignments.geos[geo]?.length ?? 0), 0);
}
