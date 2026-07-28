import {
  getWheelForGeo,
  type CpaOffer,
  type OfferGeo,
  type WheelConfig,
} from '../config/offers';

export interface LiveWheelConfig extends WheelConfig {
  source: 'assignments' | 'placeholder' | 'empty';
  storage?: string;
  usingFallback?: boolean;
}

/**
 * Load live wheel offers from the Netlify function when available,
 * otherwise fall back to the static placeholder config.
 */
export async function fetchWheelForGeo(geo: OfferGeo): Promise<LiveWheelConfig> {
  try {
    const response = await fetch(`/api/offers?geo=${encodeURIComponent(geo)}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { ...getWheelForGeo(geo), source: 'placeholder' };
    }
    const data = (await response.json()) as {
      success?: boolean;
      geo?: OfferGeo;
      title?: string;
      offers?: CpaOffer[];
      source?: string;
      storage?: string;
      usingFallback?: boolean;
    };

    if (data.success && data.source === 'assignments' && data.offers && data.offers.length > 0) {
      return {
        geo: data.geo ?? geo,
        title: data.title ?? getWheelForGeo(geo).title,
        offers: data.offers,
        source: 'assignments',
        storage: data.storage,
        usingFallback: data.usingFallback,
      };
    }

    if (data.success && data.source === 'empty') {
      // * Prefer placeholders only when nothing is assigned yet.
      return {
        ...getWheelForGeo(geo),
        source: 'empty',
        storage: data.storage,
      };
    }

    return { ...getWheelForGeo(geo), source: 'placeholder' };
  } catch {
    return { ...getWheelForGeo(geo), source: 'placeholder' };
  }
}
