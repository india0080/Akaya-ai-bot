/** Persistence: short links, click log and imported earnings (JSON file via @akaya/server-kit; Postgres in production). */
import type { BuildLinkInput, EarningRow } from '@akaya/affiliate';
import { JsonDb } from '@akaya/server-kit';

export interface ShortLink {
  id: string;
  /** normalised builder input; the target is rebuilt from it, so IDs never change behaviour silently */
  input: Required<Pick<BuildLinkInput, 'platform' | 'intent'>> &
    Pick<BuildLinkInput, 'params' | 'campaign' | 'content'>;
  targetUrl: string;
  affiliate: { active: boolean; via: string | null };
  createdAt: number;
}

export interface Click {
  linkId: string;
  platform: string;
  campaign: string | null;
  /** HMAC of the client's anonymous install id (never the raw id, never an IP) */
  anon: string | null;
  ts: number;
}

interface Data {
  links: Record<string, ShortLink>;
  /** dedupe: input key → link id */
  byInput: Record<string, string>;
  clicks: Click[];
  earnings: EarningRow[];
}

export class Store {
  private db: JsonDb<Data>;
  constructor(file: string | null) {
    this.db = new JsonDb<Data>(file || null, { links: {}, byInput: {}, clicks: [], earnings: [] });
  }
  get data() {
    return this.db.data;
  }
  addLink(key: string, link: ShortLink) {
    this.db.data.links[link.id] = link;
    this.db.data.byInput[key] = link.id;
    this.db.save();
  }
  linkByInput(key: string) {
    const id = this.db.data.byInput[key];
    return id ? this.db.data.links[id] : undefined;
  }
  addClick(c: Click) {
    this.db.data.clicks.push(c);
    this.db.save();
  }
  /** upsert by (source, externalId); returns how many rows were new */
  addEarnings(rows: EarningRow[]): { added: number; updated: number } {
    const index = new Map(this.db.data.earnings.map((r, i) => [`${r.source}|${r.externalId}`, i]));
    let added = 0;
    let updated = 0;
    for (const r of rows) {
      const i = index.get(`${r.source}|${r.externalId}`);
      if (i === undefined) {
        index.set(`${r.source}|${r.externalId}`, this.db.data.earnings.push(r) - 1);
        added++;
      } else {
        this.db.data.earnings[i] = r;
        updated++;
      }
    }
    this.db.save();
    return { added, updated };
  }
}
