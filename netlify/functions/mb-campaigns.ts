import { json, adminGate, type Handler } from './_lib/http';
import {
  isMaxBountyConfigured,
  listEnrichedCampaigns,
  searchEnrichedCampaigns,
} from './_lib/maxbounty';

/**
 * GET /.netlify/functions/mb-campaigns
 * ?list=popular&page=1&limit=40&geo=US&approvedOnly=1
 * ?q=loan   → name search across MaxBounty catalogs
 * ?q=12345  → direct campaign ID lookup
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
    const list = params.list ?? 'recentlyApproved';
    const page = Number.parseInt(params.page ?? '1', 10) || 1;
    const limit = Math.min(60, Number.parseInt(params.limit ?? '40', 10) || 40);
    const geo = (params.geo ?? '').toUpperCase();
    const approvedOnly = params.approvedOnly !== '0' && params.approvedOnly !== 'false';
    const query = (params.q ?? params.search ?? '').trim();

    if (query) {
      const { campaigns, scanned, mode } = await searchEnrichedCampaigns({
        query,
        geo: geo || undefined,
        approvedOnly,
        maxResults: limit,
      });
      return json(200, {
        success: true,
        list: mode === 'id' ? 'id' : 'search',
        mode,
        query,
        geo: geo || null,
        approvedOnly,
        scanned,
        campaigns,
      });
    }

    const { campaigns, scanned } = await listEnrichedCampaigns({
      list,
      page,
      limit,
      geo: geo || undefined,
      approvedOnly,
    });

    return json(200, {
      success: true,
      list,
      mode: 'list',
      geo: geo || null,
      approvedOnly,
      scanned,
      campaigns,
    });
  } catch (error) {
    return json(502, {
      error: error instanceof Error ? error.message : 'MaxBounty request failed',
    });
  }
};
