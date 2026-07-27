/**
 * Random start-menu taunts — each begins with “I”, picked on landing mount.
 */
export const menuTaunts = [
  'I can do it',
  'I will show you',
  'I am brave enough',
  'I will smash this challenge',
  'I don’t shake… much',
  'I laugh at walls',
  'I was born steady',
  'I got this, easy',
  'I never touch walls',
  'I am basically a laser',
  'I fear no zigzag',
  'I will not cry',
  'I eat hard levels',
  'I am built different',
  'I finish what I start',
  'I have nerves of steel',
  'I make this look easy',
  'I dare the walls',
  'I am unbothered',
  'I will not wiggle',
  'I own this path',
  'I am too good for this',
  'I blink and it’s done',
  'I came to flex',
  'I will cook Level 3',
] as const;

export function pickMenuTaunt(): string {
  const index = Math.floor(Math.random() * menuTaunts.length);
  return menuTaunts[index]!;
}
