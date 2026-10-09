/**
 * In-memory TTL + LRU cache. Swap for Redis in production (same get/set interface; see
 * ARCHITECTURE.md). Keeps paid or quota-limited API calls (SerpApi, Creators API) down and results snappy.
 */
export class TtlCache<V> {
  private map = new Map<string, { v: V; exp: number }>();
  hits = 0;
  misses = 0;
  constructor(
    private ttlMs: number,
    private max = 500,
  ) {}

  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e || e.exp < Date.now()) {
      if (e) this.map.delete(key);
      this.misses++;
      return undefined;
    }
    // refresh LRU position
    this.map.delete(key);
    this.map.set(key, e);
    this.hits++;
    return e.v;
  }

  set(key: string, v: V, ttlMs = this.ttlMs) {
    this.map.delete(key);
    this.map.set(key, { v, exp: Date.now() + ttlMs });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }

  stats() {
    return { size: this.map.size, hits: this.hits, misses: this.misses };
  }
}
