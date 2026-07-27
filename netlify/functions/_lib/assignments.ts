/**
 * Persist offer assignments in Netlify Blobs (prod) with an in-memory fallback for local.
 */

import { getStore } from '@netlify/blobs';
import {
  emptyAssignments,
  OFFER_GEOS,
  WHEEL_SLOT_COUNT,
  type OfferAssignments,
  type OfferGeo,
} from '../../src/config/offerTypes';

const STORE_NAME = 'finger-challenge';
const KEY = 'offer-assignments';

let memoryFallback: OfferAssignments | null = null;

function getOfferStore() {
  try {
    return getStore({
      name: STORE_NAME,
      consistency: 'strong',
    });
  } catch {
    return null;
  }
}

export async function readAssignments(): Promise<OfferAssignments> {
  const store = getOfferStore();
  if (store) {
    const value = await store.get(KEY, { type: 'json' });
    if (value && typeof value === 'object') {
      return normaliseAssignments(value as OfferAssignments);
    }
  }
  if (memoryFallback) {
    return memoryFallback;
  }
  return emptyAssignments();
}

export async function writeAssignments(
  next: OfferAssignments,
): Promise<OfferAssignments> {
  const normalised: OfferAssignments = {
    ...normaliseAssignments(next),
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  const store = getOfferStore();
  if (store) {
    await store.setJSON(KEY, normalised);
  } else {
    memoryFallback = normalised;
  }
  return normalised;
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
