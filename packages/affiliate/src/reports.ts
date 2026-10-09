/**
 * Earnings report model shared by services/link-redirect (GET /reports) and the app's Earnings screen.
 * Networks report in their own formats; importers normalise every row to EarningRow.
 */
import { getPlatform } from './platforms.js';

export type EarningStatus = 'pending' | 'approved' | 'rejected';

export interface EarningRow {
  /** programme / network the row came from: amazon-associates, admitad, cuelinks, travelpayouts, booking, … */
  source: string;
  /** network's own transaction id (dedupe key together with source) */
  externalId: string;
  /** platform id from the registry, or "other" */
  platform: string;
  /** YYYY-MM-DD (IST for Indian programmes; as reported otherwise) */
  date: string;
  /** sub-id / tracking id / label we sent (our campaign), when the network reports it */
  campaign?: string;
  orders: number;
  /** order value */
  sales: number;
  commission: number;
  /** ISO 4217 */
  currency: string;
  status: EarningStatus;
}

export interface PlatformSummary {
  platform: string;
  name: string;
  clicks: number;
  orders: number;
  sales: number;
  commission: number;
  /** orders ÷ clicks (0 when there are no clicks) */
  conversion: number;
}

export interface EarningsSummary {
  currency: string;
  from?: string;
  to?: string;
  totals: { clicks: number; orders: number; sales: number; commission: number; pending: number };
  platforms: PlatformSummary[];
  /** rows skipped because they are in another currency */
  otherCurrencyRows: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Roll clicks (per platform) and earning rows up into a per-platform summary for one currency.
 * Rejected rows are excluded; pending commission is counted and also reported separately.
 */
export function summarize(
  clicks: Record<string, number>,
  rows: EarningRow[],
  opts: { currency?: string; from?: string; to?: string } = {},
): EarningsSummary {
  const currency = opts.currency ?? 'INR';
  const by = new Map<string, PlatformSummary>();
  const get = (id: string) => {
    let s = by.get(id);
    if (!s)
      by.set(
        id,
        (s = {
          platform: id,
          name: getPlatform(id)?.name ?? 'Other',
          clicks: 0,
          orders: 0,
          sales: 0,
          commission: 0,
          conversion: 0,
        }),
      );
    return s;
  };
  for (const [id, n] of Object.entries(clicks)) get(id).clicks += n;
  let pending = 0;
  let otherCurrencyRows = 0;
  for (const row of rows) {
    if (row.status === 'rejected') continue;
    if (row.currency !== currency) {
      otherCurrencyRows++;
      continue;
    }
    const s = get(row.platform);
    s.orders += row.orders;
    s.sales += row.sales;
    s.commission += row.commission;
    if (row.status === 'pending') pending += row.commission;
  }
  const platforms = [...by.values()]
    .map((s) => ({
      ...s,
      sales: r2(s.sales),
      commission: r2(s.commission),
      conversion: s.clicks ? r2(s.orders / s.clicks) : 0,
    }))
    .sort((a, b) => b.commission - a.commission || b.clicks - a.clicks);
  const sum = (k: 'clicks' | 'orders' | 'sales' | 'commission') => r2(platforms.reduce((t, p) => t + p[k], 0));
  return {
    currency,
    from: opts.from,
    to: opts.to,
    totals: {
      clicks: sum('clicks'),
      orders: sum('orders'),
      sales: sum('sales'),
      commission: sum('commission'),
      pending: r2(pending),
    },
    platforms,
    otherCurrencyRows,
  };
}
