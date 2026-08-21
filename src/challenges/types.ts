/**
 * Shared challenge platform types.
 * Future modes (finger-stability, finger-speed, …) plug into this contract.
 */

export type ChallengeId =
  | 'pressure-test'
  | 'finger-stability'
  | 'finger-speed'
  | 'finger-reaction';

export interface ChallengeMeta {
  id: ChallengeId;
  path: `/${string}`;
  title: string;
  tagline: string;
}

export const challengeCatalog: readonly ChallengeMeta[] = [
  {
    id: 'pressure-test',
    path: '/pressure-test',
    title: 'Pressure Test',
    tagline: 'Can you break it?',
  },
] as const;

export function matchChallengePath(pathname: string): ChallengeMeta | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return challengeCatalog.find((item) => item.path === clean) ?? null;
}
