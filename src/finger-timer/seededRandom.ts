/**
 * Seeded random number generator for deterministic challenge sequences.
 */

/**
 * Simple seeded RNG using mulberry32 algorithm.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    if (typeof seed === 'string') {
      // * Convert string seed to number.
      this.state = 0;
      for (let i = 0; i < seed.length; i++) {
        this.state = (this.state << 5) - this.state + seed.charCodeAt(i);
        this.state = this.state & this.state;
      }
    } else {
      this.state = seed;
    }
    
    // * Ensure positive integer.
    this.state = Math.abs(this.state) || 1;
  }

  /**
   * Get next random number between 0 and 1.
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Get random number between min and max (inclusive).
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Get random integer between min and max (inclusive).
   */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Pick random item from array.
   */
  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }

  /**
   * Return true with given probability (0-1).
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

/**
 * Create seed from date string for daily challenges.
 */
export function createDailySeed(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `daily-${year}-${month}-${day}`;
}
