import { resolveOfferGeo, type OfferGeo } from '../config/offers';

export interface GeoResult {
  countryCode: string | null;
  offerGeo: OfferGeo;
  source: 'cloudflare' | 'ipapi' | 'unknown';
}

/**
 * Detects visitor country for geo-targeted CPA wheels.
 * Prefers Cloudflare trace (fast, no key), falls back to ipapi.co.
 */
export async function detectVisitorGeo(): Promise<GeoResult> {
  try {
    const cloudflare = await detectViaCloudflare();
    if (cloudflare) {
      return {
        countryCode: cloudflare,
        offerGeo: resolveOfferGeo(cloudflare),
        source: 'cloudflare',
      };
    }
  } catch {
    // Continue to fallback provider.
  }

  try {
    const ipapi = await detectViaIpApi();
    if (ipapi) {
      return {
        countryCode: ipapi,
        offerGeo: resolveOfferGeo(ipapi),
        source: 'ipapi',
      };
    }
  } catch {
    // Fall through to unknown.
  }

  return {
    countryCode: null,
    offerGeo: 'FALLBACK',
    source: 'unknown',
  };
}

async function detectViaCloudflare(): Promise<string | null> {
  const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const text = await response.text();
  const match = text.match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/);
  return match?.[1] ?? null;
}

async function detectViaIpApi(): Promise<string | null> {
  const response = await fetch('https://ipapi.co/json/', {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { country_code?: string };
  return data.country_code ?? null;
}
