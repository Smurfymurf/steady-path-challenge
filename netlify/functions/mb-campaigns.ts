import { json, adminGate, type Handler } from './_lib/http';
import { isMaxBountyConfigured, listCampaigns } from './_lib/maxbounty';

/**
 * GET /.netlify/functions/mb-campaigns?list=popular&page=1
 * Admin-only catalog from MaxBounty.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }
  const denied = adminGate(event);
  if (denied) {
    return denied;
  }
  if (!isMaxBountyConfigured()) {
    return json(503, {
      error: 'MaxBounty credentials not configured',
      hint: 'Set MAXBOUNTY_EMAIL and MAXBOUNTY_PASSWORD in Netlify env.',
    });
  }

  try {
    const params = event.queryStringParameters ?? {};
    const list = params.list ?? 'popular';
    const page = Number.parseInt(params.page ?? '1', 10) || 1;
    const limit = Math.min(100, Number.parseInt(params.limit ?? '50', 10) || 50);
    const campaigns = await listCampaigns(list, page, limit);
    return json(200, {
      success: true,
      list,
      campaigns: campaigns.map((c) => ({
        campaignId: c.campaign_id,
        name: c.name,
        defaultRate: c.default_rate,
        status: c.status,
        rateType: c.rate_type,
        thumbnail: c.thumbnail,
      })),
    });
  } catch (error) {
    return json(502, {
      error: error instanceof Error ? error.message : 'MaxBounty request failed',
    });
  }
};
