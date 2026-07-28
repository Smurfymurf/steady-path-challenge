import type { OfferGeo } from './offerTypes';
import { WHEEL_COLOURS } from './offerTypes';

export type { OfferGeo } from './offerTypes';
export { OFFER_GEOS, WHEEL_SLOT_COUNT } from './offerTypes';

export interface CpaOffer {
  id: string;
  label: string;
  /** CPA / tracking URL. */
  url: string;
  colour: string;
  campaignId?: number;
}

export interface WheelConfig {
  geo: OfferGeo;
  title: string;
  offers: CpaOffer[];
}

function placeholderOffers(prefix: string, path: string): CpaOffer[] {
  const labels = [
    'Mystery Gift',
    'Bonus Bundle',
    'Cash Drop',
    'Free Trial',
    'VIP Deal',
  ];
  return labels.map((label, index) => ({
    id: `${prefix}-${index + 1}`,
    label,
    url: `https://example.com/${path}/offer-${index + 1}`,
    colour: WHEEL_COLOURS[index % WHEEL_COLOURS.length]!,
  }));
}

/**
 * Static placeholder CPA wheels — used until MaxBounty admin assignments exist.
 */
export const wheelsByGeo: Record<OfferGeo, WheelConfig> = {
  US: {
    geo: 'US',
    title: 'Spin to Win!',
    offers: placeholderOffers('us', 'us'),
  },
  GB: {
    geo: 'GB',
    title: 'Spin to Win!',
    offers: placeholderOffers('gb', 'uk'),
  },
  AU: {
    geo: 'AU',
    title: 'Spin to Win!',
    offers: placeholderOffers('au', 'au'),
  },
  NZ: {
    geo: 'NZ',
    title: 'Spin to Win!',
    offers: placeholderOffers('nz', 'nz'),
  },
  FALLBACK: {
    geo: 'FALLBACK',
    title: 'Spin to Win!',
    offers: placeholderOffers('fb', 'global'),
  },
};

const targetedGeos: OfferGeo[] = ['US', 'GB', 'AU', 'NZ'];

/** Prize wheel is only offered to US + UK visitors for now. */
export const PRIZE_WHEEL_GEOS: OfferGeo[] = ['US', 'GB'];

export function isPrizeWheelGeo(geo: OfferGeo | string | null | undefined): boolean {
  if (!geo) {
    return false;
  }
  const normalised = geo.toUpperCase() === 'UK' ? 'GB' : geo.toUpperCase();
  return PRIZE_WHEEL_GEOS.includes(normalised as OfferGeo);
}

export function resolveOfferGeo(countryCode: string | null): OfferGeo {
  if (!countryCode) {
    return 'FALLBACK';
  }
  const normalised = countryCode.toUpperCase();
  // * UK sometimes reported as UK instead of GB.
  const mapped = normalised === 'UK' ? 'GB' : normalised;
  if (targetedGeos.includes(mapped as OfferGeo)) {
    return mapped as OfferGeo;
  }
  return 'FALLBACK';
}

export function getWheelForGeo(geo: OfferGeo): WheelConfig {
  return wheelsByGeo[geo] ?? wheelsByGeo.FALLBACK;
}
