import type { ScheduledMessage } from '../types.js';

/** Message persistence. MemoryStore for dev/tests; production uses Postgres (see README, schema.sql). */
export interface MessageStore {
  get(id: string): Promise<ScheduledMessage | null>;
  put(msg: ScheduledMessage): Promise<void>;
  delete(id: string): Promise<void>;
  list(userId: string, opts?: { status?: string }): Promise<ScheduledMessage[]>;
}
