import { json, requireAdmin, type Handler } from './_lib/http';
import { getCampaign, isMaxBountyConfigured } from './_lib/maxbounty';

/**
 * GET /.netlify/functions/mb-campaign?id=12345
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }
  if (!requireAdmin(event)) {
    return json(401, { error: 'Unauthorized' });
  }
  if (!isMaxBountyConfigured()) {
    return json(503, { error: 'MaxBounty credentials not configured' });
  }

  const id = Number.parseInt(event.queryStringParameters?.id ?? '', 10);
  if (!Number.isFinite(id)) {
    return json(400, { error: 'Missing campaign id' });
  }

  try {
    const detail = await getCampaign(id);
    return json(200, {
      success: true,
      campaign: {
        campaignId: detail.campaign_id,
        name: detail.details?.name ?? `Campaign ${id}`,
        description: detail.details?.description,
        status: detail.details?.status,
        affiliateStatus: detail.details?.affiliate_campaign_status,
        epc: detail.details?.epc,
        thumbnail: detail.details?.thumbnail,
        allowedCountries: detail.allowed_countries ?? [],
        rate: detail.commission?.rate,
        rateType: detail.commission?.rate_type,
      },
    });
  } catch (error) {
    return json(502, {
      error: error instanceof Error ? error.message : 'MaxBounty request failed',
    });
  }
};
