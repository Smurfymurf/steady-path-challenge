import {
  WHEEL_COLOURS,
  WHEEL_SLOT_COUNT,
  type OfferGeo,
} from './_lib/offerTypes';
import { readAssignments } from './_lib/assignments';
import { json, type Handler } from './_lib/http';

/**
 * Public GET /.netlify/functions/offers?geo=US
 * Returns the spin-wheel config for a geo (or FALLBACK).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const requested = (event.queryStringParameters?.geo ?? 'FALLBACK').toUpperCase();
  const geo = (requested === 'UK' ? 'GB' : requested) as OfferGeo;
  const { assignments, storage } = await readAssignments();

  const primary = assignments.geos[geo] ?? [];
  const fallback = assignments.geos.FALLBACK ?? [];
  const usingFallback = primary.length === 0 && fallback.length > 0;
  const slots = (primary.length > 0 ? primary : fallback).slice(0, WHEEL_SLOT_COUNT);

  if (slots.length === 0) {
    return json(200, {
      success: true,
      source: 'empty',
      storage,
      geo,
      title: 'Spin to Win!',
      offers: [],
      updatedAt: assignments.updatedAt,
      hint: 'No offers assigned for this geo or FALLBACK in /admin.',
    });
  }

  return json(200, {
    success: true,
    source: 'assignments',
    storage,
    geo: usingFallback ? 'FALLBACK' : geo,
    requestedGeo: geo,
    usingFallback,
    title: 'Spin to Win!',
    updatedAt: assignments.updatedAt,
    offers: slots.map((slot, index) => ({
      id: `mb-${slot.campaignId}`,
      label: (slot.label?.trim() || slot.name),
      url: slot.trackingUrl,
      colour: WHEEL_COLOURS[index % WHEEL_COLOURS.length],
      campaignId: slot.campaignId,
    })),
  });
};
