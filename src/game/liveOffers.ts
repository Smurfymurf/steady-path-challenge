import {
  getWheelForGeo,
  type CpaOffer,
  type OfferGeo,
  type WheelConfig,
} from '../config/offers';

/**
 * Load live wheel offers from the Netlify function when available,
 * otherwise fall back to the static placeholder config.
 */
export async function fetchWheelForGeo(geo: OfferGeo): Promise<WheelConfig> {
  try {
    const response = await fetch(`/.netlify/functions/offers?geo=${encodeURIComponent(geo)}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return getWheelForGeo(geo);
    }
    const data = (await response.json()) as {
      success?: boolean;
      geo?: OfferGeo;
      title?: string;
      offers?: CpaOffer[];
      source?: string;
    };
    if (!data.success || !data.offers || data.offers.length === 0) {
      return getWheelForGeo(geo);
    }
    return {
      geo: data.geo ?? geo,
      title: data.title ?? getWheelForGeo(geo).title,
      offers: data.offers,
    };
  } catch {
    return getWheelForGeo(geo);
  }
}
