/**
 * MaxBounty Affiliate API client (server-side only).
 * Docs: https://mb1-cdn.com/resources/docs_affiliate_api_v1.html
 */

const MB_BASE = 'https://api.maxbounty.com/affiliates/api';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

export function isMaxBountyConfigured(): boolean {
  return Boolean(process.env.MAXBOUNTY_EMAIL && process.env.MAXBOUNTY_PASSWORD);
}

async function authenticate(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const response = await fetch(`${MB_BASE}/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: requireEnv('MAXBOUNTY_EMAIL'),
      password: requireEnv('MAXBOUNTY_PASSWORD'),
    }),
  });

  if (!response.ok) {
    throw new Error(`MaxBounty auth failed (${response.status})`);
  }

  const data = (await response.json()) as {
    success?: boolean;
    'mb-api-token'?: string;
  };

  if (!data.success || !data['mb-api-token']) {
    throw new Error('MaxBounty auth response missing token');
  }

  // * Tokens expire every 2 hours — refresh a bit early.
  tokenCache = {
    token: data['mb-api-token'],
    expiresAt: now + 100 * 60 * 1000,
  };
  return tokenCache.token;
}

async function mbFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await authenticate();
  const response = await fetch(`${MB_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MaxBounty ${path} failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return (await response.json()) as T;
}

export interface MbListCampaign {
  campaign_id: number;
  name: string;
  default_rate?: number;
  status?: string;
  rate_type?: string;
  thumbnail?: string;
  highlight?: string;
}

export interface MbCampaignDetailPayload {
  campaign_id: number;
  details?: {
    name?: string;
    description?: string;
    status?: string;
    epc?: number;
    affiliate_campaign_status?: string;
    thumbnail?: string;
    geo_filtering?: string;
  };
  allowed_countries?: string[];
  commission?: {
    rate?: number;
    rate_type?: string;
    default_rate?: string;
  };
}

export async function listCampaigns(
  list: string = 'popular',
  page = 1,
  limit = 50,
): Promise<MbListCampaign[]> {
  const data = await mbFetch<{
    success: boolean;
    campaigns?: MbListCampaign[];
  }>(`/campaigns/${encodeURIComponent(list)}?page=${page}&limit=${limit}`);
  return data.campaigns ?? [];
}

export async function getCampaign(campaignId: number): Promise<MbCampaignDetailPayload> {
  return mbFetch(`/campaign/${campaignId}`);
}

/** Country codes that should match a wheel geo tab. */
export function geoCountryCodes(geo: string): string[] {
  switch (geo.toUpperCase()) {
    case 'US':
      return ['US', 'USA'];
    case 'GB':
    case 'UK':
      return ['GB', 'UK'];
    case 'AU':
      return ['AU'];
    case 'NZ':
      return ['NZ'];
    default:
      return [geo.toUpperCase()];
  }
}

export function campaignMatchesGeo(
  allowedCountries: string[] | undefined,
  geo: string,
): boolean {
  if (geo.toUpperCase() === 'FALLBACK' || geo.toUpperCase() === 'ALL') {
    return true;
  }
  const countries = (allowedCountries ?? []).map((code) => code.toUpperCase());
  if (countries.length === 0) {
    // * Unknown / unrestricted — keep visible so admins can still pick it.
    return true;
  }
  if (countries.includes('ALL') || countries.includes('WW') || countries.includes('GLOBAL')) {
    return true;
  }
  const targets = geoCountryCodes(geo);
  return targets.some((code) => countries.includes(code));
}

export function isAffiliateApproved(status: string | undefined): boolean {
  if (!status) {
    return false;
  }
  const normalised = status.trim().toLowerCase();
  return normalised === 'approved' || normalised === 'active';
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export interface EnrichedCampaign {
  campaignId: number;
  name: string;
  defaultRate?: number;
  status?: string;
  rateType?: string;
  thumbnail?: string;
  affiliateStatus?: string;
  allowedCountries: string[];
  epc?: number;
}

/**
 * List campaigns then hydrate details so we can filter by geo + approval.
 */
export async function listEnrichedCampaigns(options: {
  list?: string;
  page?: number;
  limit?: number;
  geo?: string;
  approvedOnly?: boolean;
}): Promise<{ campaigns: EnrichedCampaign[]; scanned: number }> {
  const list = options.list ?? 'popular';
  const page = options.page ?? 1;
  const limit = Math.min(100, options.limit ?? 50);
  const approvedOnly = options.approvedOnly !== false;
  const geo = options.geo?.toUpperCase() || '';

  const listed = await listCampaigns(list, page, limit);
  const enriched = await mapPool(listed, 6, async (campaign) => {
    try {
      const detail = await getCampaign(campaign.campaign_id);
      return {
        campaignId: campaign.campaign_id,
        name: detail.details?.name ?? campaign.name,
        defaultRate: detail.commission?.rate ?? campaign.default_rate,
        status: detail.details?.status ?? campaign.status,
        rateType: detail.commission?.rate_type ?? campaign.rate_type,
        thumbnail: detail.details?.thumbnail ?? campaign.thumbnail,
        affiliateStatus: detail.details?.affiliate_campaign_status,
        allowedCountries: detail.allowed_countries ?? [],
        epc: detail.details?.epc,
      } satisfies EnrichedCampaign;
    } catch {
      return {
        campaignId: campaign.campaign_id,
        name: campaign.name,
        defaultRate: campaign.default_rate,
        status: campaign.status,
        rateType: campaign.rate_type,
        thumbnail: campaign.thumbnail,
        affiliateStatus: undefined,
        allowedCountries: [],
      } satisfies EnrichedCampaign;
    }
  });

  const filtered = enriched.filter((campaign) => {
    if (approvedOnly && !isAffiliateApproved(campaign.affiliateStatus)) {
      // * List endpoint "Active" often means runnable without extra approval.
      if ((campaign.affiliateStatus ?? '').trim() === '' && campaign.status?.toLowerCase() === 'active') {
        // keep — Active with blank affiliate status
      } else {
        return false;
      }
    }
    if (geo && geo !== 'FALLBACK' && geo !== 'ALL') {
      return campaignMatchesGeo(campaign.allowedCountries, geo);
    }
    return true;
  });

  return { campaigns: filtered, scanned: listed.length };
}

export async function getTrackingLink(
  campaignId: number,
  extras: { sub1?: string; sub2?: string; creativeId?: number } = {},
): Promise<string> {
  const data = await mbFetch<{
    success: boolean;
    'tracking-link'?: string;
  }>('/trackinglink', {
    method: 'POST',
    body: JSON.stringify({
      campaign_id: campaignId,
      creative_id: extras.creativeId,
      sub1: extras.sub1 ?? process.env.MAXBOUNTY_SUB1 ?? 'finger-challenge',
      sub2: extras.sub2,
    }),
  });

  const link = data['tracking-link'];
  if (!link) {
    throw new Error(`No tracking link for campaign ${campaignId}`);
  }
  return link;
}
