import { buildApp } from './app.js';
import { buildRegistry } from './adapters/registry.js';
import { EnvCredentials } from './credentials.js';
import { MemoryQueue } from './queue/memory.js';
import type { JobQueue } from './queue/types.js';
import { Scheduler } from './scheduler.js';
import { MemoryStore } from './store/memory.js';

const env = process.env;
const apiToken = env.API_TOKEN;
if (!apiToken || apiToken === 'change-me') {
  console.error('Set API_TOKEN (see .env.example)');
  process.exit(1);
}

let queue: JobQueue;
if (env.QUEUE === 'bullmq') {
  const { BullQueue } = await import('./queue/bullmq.js');
  const url = new URL(env.REDIS_URL ?? 'redis://localhost:6379');
  queue = new BullQueue({ host: url.hostname, port: Number(url.port || 6379), password: url.password || undefined });
} else queue = new MemoryQueue();

const log = (s: string) => console.log(s);
// Notifier: replace with FCM/APNs. Here it logs the one-tap reminder.
const notifier = { push: async (userId: string, n: { title: string; deeplink: string }) => log(`[push] ${userId}: ${n.title} → ${n.deeplink}`) };
const store = new MemoryStore(); // swap for a Postgres store in production (schema.sql)
const scheduler = new Scheduler({
  store,
  queue,
  adapters: buildRegistry(env.SENDER_MODE === 'live' ? 'live' : 'mock', notifier, log),
  creds: new EnvCredentials(),
  log,
});
queue.start((id) => scheduler.process(id));

const app = buildApp({ scheduler, store, apiToken, logger: true });
await app.listen({ port: Number(env.PORT ?? 8789), host: '0.0.0.0' });
