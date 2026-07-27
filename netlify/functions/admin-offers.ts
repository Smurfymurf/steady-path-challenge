import {
  emptyAssignments,
  OFFER_GEOS,
  WHEEL_SLOT_COUNT,
  type AssignedCampaign,
  type OfferAssignments,
  type OfferGeo,
} from './_lib/offerTypes';
import { readAssignments, writeAssignments } from './_lib/assignments';
import { json, requireAdmin, type Handler } from './_lib/http';
import {
  getCampaign,
  getTrackingLink,
  isMaxBountyConfigured,
} from './_lib/maxbounty';

/**
 * GET/PUT /.netlify/functions/admin-offers
 * Manage per-geo MaxBounty campaign slots for the spin wheel.
 */
export const handler: Handler = async (event) => {
  if (!requireAdmin(event)) {
    return json(401, { error: 'Unauthorized' });
  }

  if (event.httpMethod === 'GET') {
    const assignments = await readAssignments();
    return json(200, {
      success: true,
      configured: isMaxBountyConfigured(),
      assignments,
    });
  }

  if (event.httpMethod === 'PUT') {
    if (!event.body) {
      return json(400, { error: 'Missing body' });
    }

    let payload: { geos?: Record<string, Array<{ campaignId: number; label?: string }>> };
    try {
      payload = JSON.parse(event.body) as typeof payload;
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }

    if (!isMaxBountyConfigured()) {
      return json(503, { error: 'MaxBounty credentials not configured' });
    }

    try {
      const next = emptyAssignments();
      for (const geo of OFFER_GEOS) {
        const slots = payload.geos?.[geo] ?? [];
        const resolved: AssignedCampaign[] = [];
        for (const slot of slots.slice(0, WHEEL_SLOT_COUNT)) {
          const detail = await getCampaign(slot.campaignId);
          const trackingUrl = await getTrackingLink(slot.campaignId);
          resolved.push({
            campaignId: slot.campaignId,
            name: detail.details?.name ?? `Campaign ${slot.campaignId}`,
            label: slot.label,
            trackingUrl,
            rate: detail.commission?.rate,
            rateType: detail.commission?.rate_type,
            allowedCountries: detail.allowed_countries ?? [],
          });
        }
        next.geos[geo as OfferGeo] = resolved;
      }

      const saved = await writeAssignments(next);
      return json(200, { success: true, assignments: saved });
    } catch (error) {
      return json(502, {
        error: error instanceof Error ? error.message : 'Failed to save offers',
      });
    }
  }

  return json(405, { error: 'Method not allowed' });
};
