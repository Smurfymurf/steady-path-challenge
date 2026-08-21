/**
 * Shared challenge platform types.
 * Future modes (finger-stability, finger-speed, …) plug into this contract.
 */

export type ChallengeId =
  | 'pressure-test'
  | 'maze'
  | 'finger-stability'
  | 'finger-speed'
  | 'finger-reaction';

export interface ChallengeMeta {
  id: ChallengeId;
  path: `/${string}` | '/';
  /** Extra paths that resolve to this challenge (legacy links). */
  aliases?: readonly string[];
  title: string;
  tagline: string;
}

export const challengeCatalog: readonly ChallengeMeta[] = [
  {
    id: 'pressure-test',
    path: '/',
    aliases: ['/pressure-test'],
    title: 'Pressure Test',
    tagline: 'Can you break it?',
  },
  {
    id: 'maze',
    path: '/maze',
    title: 'Steady Path',
    tagline: 'Don’t touch the walls.',
  },
] as const;

export function cleanPathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function matchChallengePath(pathname: string): ChallengeMeta | null {
  const clean = cleanPathname(pathname);
  for (const item of challengeCatalog) {
    if (item.path === clean) {
      return item;
    }
    if (item.aliases?.includes(clean)) {
      return item;
    }
  }
  return null;
}

export function isPressureHomePath(pathname: string): boolean {
  return matchChallengePath(pathname)?.id === 'pressure-test';
}

export function isMazePath(pathname: string): boolean {
  return matchChallengePath(pathname)?.id === 'maze';
}
