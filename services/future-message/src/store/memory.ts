import type { ScheduledMessage } from '../types.js';
import type { MessageStore } from './types.js';

export class MemoryStore implements MessageStore {
  private rows = new Map<string, ScheduledMessage>();
  async get(id: string) {
    const m = this.rows.get(id);
    return m ? structuredClone(m) : null;
  }
  async put(msg: ScheduledMessage) {
    this.rows.set(msg.id, structuredClone(msg));
  }
  async delete(id: string) {
    this.rows.delete(id);
  }
  async list(userId: string, opts: { status?: string } = {}) {
    return [...this.rows.values()]
      .filter((m) => m.userId === userId && (!opts.status || m.status === opts.status))
      .sort((a, b) => a.sendAt - b.sendAt)
      .map((m) => structuredClone(m));
  }
}
