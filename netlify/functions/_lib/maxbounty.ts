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

export async function getCampaign(campaignId: number): Promise<{
  campaign_id: number;
  details?: {
    name?: string;
    description?: string;
    status?: string;
    epc?: number;
    affiliate_campaign_status?: string;
    thumbnail?: string;
  };
  allowed_countries?: string[];
  commission?: {
    rate?: number;
    rate_type?: string;
    default_rate?: string;
  };
}> {
  return mbFetch(`/campaign/${campaignId}`);
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
