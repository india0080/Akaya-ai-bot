/** Small deterministic RNG so mock data is stable across restarts (and tests). */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const round = (n: number, step = 1) => Math.round(n / step) * step;
/** Indian price endings: ₹1,299 / ₹849 style */
export const indianPrice = (n: number) => (n < 500 ? Math.round(n / 10) * 10 - 1 : Math.round(n / 50) * 50 - 1);
