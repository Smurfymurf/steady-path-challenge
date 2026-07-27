/**
 * Shared offer-assignment types used by the game + admin + Netlify functions.
 */

export type OfferGeo = 'US' | 'GB' | 'AU' | 'NZ' | 'FALLBACK';

export const OFFER_GEOS: OfferGeo[] = ['US', 'GB', 'AU', 'NZ', 'FALLBACK'];

export const WHEEL_SLOT_COUNT = 5;

export const WHEEL_COLOURS = [
  '#FF3D7F',
  '#FFC107',
  '#00D4AA',
  '#5B8CFF',
  '#FF8A3D',
] as const;

export interface AssignedCampaign {
  campaignId: number;
  name: string;
  /** Cached MaxBounty tracking URL (filled when assignments are saved). */
  trackingUrl: string;
  /** Optional override for the wheel label. */
  label?: string;
  rate?: number;
  rateType?: string;
  allowedCountries?: string[];
}

export interface OfferAssignments {
  version: 1;
  updatedAt: string;
  geos: Record<OfferGeo, AssignedCampaign[]>;
}

export function emptyAssignments(): OfferAssignments {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    geos: {
      US: [],
      GB: [],
      AU: [],
      NZ: [],
      FALLBACK: [],
    },
  };
}

export interface MbCampaignSummary {
  campaignId: number;
  name: string;
  defaultRate?: number;
  status?: string;
  rateType?: string;
  thumbnail?: string;
}

export interface MbCampaignDetail extends MbCampaignSummary {
  description?: string;
  allowedCountries: string[];
  epc?: number;
  affiliateStatus?: string;
}
