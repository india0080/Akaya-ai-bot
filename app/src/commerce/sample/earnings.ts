/**
 * SAMPLE earnings for the Earnings screen. Real numbers come from services/link-redirect GET /reports
 * (admin token, server-side). Both go through the same summarize() from @akaya/affiliate.
 */
import { summarize, type EarningRow, type EarningsSummary } from '@akaya/affiliate';

export type Period = 7 | 30 | 90;

/** per-platform sample activity over 30 days: clicks, orders, average order value (₹), commission rate */
const BASE: [platform: string, clicks: number, orders: number, aov: number, rate: number][] = [
  ['amazon', 1840, 64, 1450, 0.035],
  ['flipkart', 1220, 41, 2100, 0.03],
  ['booking', 410, 9, 14800, 0.04],
  ['makemytrip', 360, 11, 9200, 0.025],
  ['myntra', 520, 23, 1700, 0.06],
  ['agoda', 190, 4, 11200, 0.045],
  ['nykaa', 300, 17, 900, 0.07],
  ['klook', 120, 5, 2300, 0.05],
  ['swiggy', 640, 0, 0, 0],
  ['uber', 230, 0, 0, 0],
];

const SCALE: Record<Period, number> = { 7: 0.24, 30: 1, 90: 2.9 };

export function sampleEarnings(period: Period): EarningsSummary {
  const k = SCALE[period];
  const clicks: Record<string, number> = {};
  const rows: EarningRow[] = [];
  for (const [platform, c, orders, aov, rate] of BASE) {
    clicks[platform] = Math.round(c * k);
    const n = Math.round(orders * k);
    if (!n) continue;
    // the newest ~30% of commission is still pending at the network
    const pending = Math.round(n * 0.3);
    for (const [status, count] of [
      ['approved', n - pending],
      ['pending', pending],
    ] as const)
      if (count)
        rows.push({
          source: 'sample',
          externalId: `${platform}-${status}`,
          platform,
          date: '2026-10-01',
          orders: count,
          sales: count * aov,
          commission: count * aov * rate,
          currency: 'INR',
          status,
        });
  }
  return summarize(clicks, rows);
}
