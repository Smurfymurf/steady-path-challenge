/**
 * Persist offer assignments in Netlify Blobs (prod) with an in-memory fallback for local.
 */

import { getStore, type Store } from '@netlify/blobs';
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
}

export interface AssignmentWriteResult extends AssignmentReadResult {
  persisted: boolean;
}

function getOfferStore(): Store | null {
  try {
    return getStore({
      name: STORE_NAME,
      consistency: 'strong',
    });
  } catch (error) {
    console.error('[assignments] Netlify Blobs unavailable:', error);
    return null;
  }
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

export async function readAssignments(): Promise<AssignmentReadResult> {
  const store = getOfferStore();
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
    } catch (error) {
      console.error('[assignments] Blobs read failed:', error);
    }
  }

  return {
    assignments: memoryFallback ?? emptyAssignments(),
    storage: 'memory',
  };
}

export async function writeAssignments(
  next: OfferAssignments,
): Promise<AssignmentWriteResult> {
  const normalised: OfferAssignments = {
    ...normaliseAssignments(next),
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  memoryFallback = normalised;

  const store = getOfferStore();
  if (!store) {
    return {
      assignments: normalised,
      storage: 'memory',
      persisted: false,
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
    };
  } catch (error) {
    console.error('[assignments] Blobs write failed:', error);
    return {
      assignments: normalised,
      storage: 'memory',
      persisted: false,
    };
  }
}

/** Count assigned slots across all geos (for admin/status). */
export function countAssignedSlots(assignments: OfferAssignments): number {
  return OFFER_GEOS.reduce((sum, geo) => sum + (assignments.geos[geo]?.length ?? 0), 0);
}
