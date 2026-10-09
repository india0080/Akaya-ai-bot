import { buildRegistry } from '../src/adapters/registry.js';
import type { SenderAdapter } from '../src/adapters/types.js';
import { MemoryQueue } from '../src/queue/memory.js';
import { Scheduler } from '../src/scheduler.js';
import { MemoryStore } from '../src/store/memory.js';
import type { ChannelId } from '../src/types.js';

export function setup(overrides: Partial<Record<ChannelId, SenderAdapter>> = {}) {
  const pushes: { userId: string; title: string; deeplink: string }[] = [];
  const notifier = { push: async (userId: string, n: { title: string; deeplink: string }) => void pushes.push({ userId, ...n }) };
  const adapters = { ...buildRegistry('mock', notifier), ...overrides };
  const store = new MemoryStore();
  const queue = new MemoryQueue();
  const scheduler = new Scheduler({ store, queue, adapters, creds: { get: async () => ({}) } });
  queue.start((id) => scheduler.process(id));
  return { store, queue, scheduler, pushes };
}

/** a fetch double that records calls and answers from a queue of responses */
export function fakeFetch(responses: { status?: number; body?: unknown; headers?: Record<string, string> }[]) {
  const calls: { url: string; method: string; headers: Record<string, string>; body: unknown }[] = [];
  const fn = (async (url: string | URL, init: RequestInit = {}) => {
    let body: unknown = init.body;
    if (typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    calls.push({ url: String(url), method: init.method ?? 'GET', headers: (init.headers ?? {}) as Record<string, string>, body });
    const r = responses.shift() ?? { status: 200, body: {} };
    return new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {}), {
      status: r.status ?? 200,
      headers: r.headers,
    });
  }) as typeof fetch;
  return { fn, calls };
}
