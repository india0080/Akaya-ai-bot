import { describe, expect, it, vi } from 'vitest';
import { hash, indianPrice, JobQueue, rng, TtlCache } from '../src/index.js';

describe('TtlCache', () => {
  it('expires entries after the TTL and counts hits/misses', () => {
    vi.useFakeTimers();
    const c = new TtlCache<number>(1000);
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    vi.advanceTimersByTime(1001);
    expect(c.get('a')).toBeUndefined();
    expect(c.stats()).toMatchObject({ hits: 1, misses: 1, size: 0 });
    vi.useRealTimers();
  });

  it('evicts the least recently used entry beyond max', () => {
    const c = new TtlCache<number>(60_000, 2);
    c.set('a', 1);
    c.set('b', 2);
    c.get('a'); // a is now most recent
    c.set('c', 3);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
    expect(c.get('c')).toBe(3);
  });
});

describe('JobQueue', () => {
  it('runs jobs with progress and records the result', async () => {
    const q = new JobQueue(1);
    const job = q.enqueue<string, number>('t', async (report) => {
      report(50);
      return 'ok';
    });
    expect(job.status).toBe('queued');
    await vi.waitFor(() => expect(q.get(job.id)?.status).toBe('done'));
    expect(q.get(job.id)).toMatchObject({ result: 'ok', progress: [50] });
  });

  it('marks failed jobs with the error message', async () => {
    const q = new JobQueue();
    const job = q.enqueue('t', async () => {
      throw new Error('boom');
    });
    await vi.waitFor(() => expect(q.get(job.id)?.status).toBe('failed'));
    expect(q.get(job.id)?.error).toBe('boom');
  });
});

describe('rng helpers', () => {
  it('is deterministic per seed', () => {
    const a = rng('seed');
    const b = rng('seed');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(hash('x')).toBe(hash('x'));
    expect(hash('x')).not.toBe(hash('y'));
  });

  it('rounds to Indian price endings', () => {
    expect(indianPrice(312)).toBe(309);
    expect(indianPrice(1312)).toBe(1299);
  });
});
