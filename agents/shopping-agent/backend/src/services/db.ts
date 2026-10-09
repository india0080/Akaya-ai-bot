/**
 * Tiny JSON-file store (watchlist, alerts, notifications, recent searches) so the demo keeps state
 * across restarts. Production: Postgres/SQLite with a users table. Single demo user by default;
 * pass `x-user-id` to separate users.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export class JsonDb<T extends object> {
  data: T;
  private timer: NodeJS.Timeout | null = null;
  constructor(
    private file: string | null,
    initial: T,
  ) {
    this.data = initial;
    if (file && existsSync(file)) {
      try {
        this.data = { ...initial, ...JSON.parse(readFileSync(file, 'utf8')) };
      } catch {
        /* corrupt file: start fresh */
      }
    }
  }
  save() {
    if (!this.file || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      mkdirSync(dirname(this.file!), { recursive: true });
      writeFileSync(this.file!, JSON.stringify(this.data, null, 1));
    }, 200);
    this.timer.unref?.();
  }
}
