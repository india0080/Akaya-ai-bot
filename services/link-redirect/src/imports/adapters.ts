/**
 * Earnings import adapters. Each programme is a declarative column spec run through one CSV mapper, so
 * adding a network is a data change. Header names vary between export versions: every field lists the
 * aliases seen in real exports (lower-case, punctuation-free). Verify against your own export before relying on it.
 */
import { createHash } from 'node:crypto';
import { findPlatform, type EarningRow } from '@akaya/affiliate';
import { ImportError, num, pick, readTable, ymd, type Record_ } from './csv.js';
import { status } from './status.js';
import { apiStub, type ImportAdapter } from './types.js';

interface Spec {
  source: string;
  label: string;
  csvHelp: string;
  apiEnv: string[];
  /** reporting API docs; null when the programme has no public earnings API (CSV only) */
  apiDocs: string | null;
  /** columns that identify the header row */
  required: string[][];
  id?: string[];
  date: string[];
  /** fixed platform, or columns holding the advertiser / programme name */
  platform: string | string[];
  campaign?: string[];
  orders?: string[];
  /** subtract (e.g. returned items) */
  returns?: string[];
  sales: string[];
  commission: string[];
  currency?: string[];
  defaultCurrency: string;
  status?: string[];
  defaultStatus: EarningRow['status'];
}

function mapper(spec: Spec) {
  return (csv: string): EarningRow[] =>
    readTable(csv, spec.required).flatMap((rec: Record_, i) => {
      const commission = num(pick(rec, spec.commission));
      const sales = num(pick(rec, spec.sales));
      if (!commission && !sales) return []; // totals / blank lines
      const platform =
        typeof spec.platform === 'string' ? spec.platform : (findPlatform(pick(rec, spec.platform))?.id ?? 'other');
      const date = ymd(pick(rec, spec.date));
      const ordersRaw = spec.orders ? num(pick(rec, spec.orders)) : 1;
      const orders = Math.max(0, (ordersRaw || 1) - (spec.returns ? num(pick(rec, spec.returns)) : 0));
      const ext = spec.id ? pick(rec, spec.id) : '';
      const externalId =
        ext ||
        createHash('sha1')
          .update(`${i}|${Object.values(rec).join('|')}`)
          .digest('hex')
          .slice(0, 16);
      return [
        {
          source: spec.source,
          externalId,
          platform,
          date,
          campaign: spec.campaign ? pick(rec, spec.campaign) || undefined : undefined,
          orders,
          sales,
          commission,
          currency: ((spec.currency && pick(rec, spec.currency)) || spec.defaultCurrency).toUpperCase(),
          status: spec.status ? status(pick(rec, spec.status), spec.defaultStatus) : spec.defaultStatus,
        },
      ];
    });
}

const adapter = (spec: Spec): ImportAdapter => ({
  source: spec.source,
  label: spec.label,
  csvHelp: spec.csvHelp,
  apiEnv: spec.apiEnv,
  parseCsv: mapper(spec),
  fetchApi: apiStub(spec.source, spec.apiEnv, spec.apiDocs),
});

export const ADAPTERS: Record<string, ImportAdapter> = Object.fromEntries(
  [
    adapter({
      source: 'amazon-associates',
      label: 'Amazon Associates (amazon.in)',
      csvHelp: 'Associates Central → Reports → Earnings → Download report (CSV).',
      apiEnv: [],
      apiDocs: null,
      required: [['asin'], ['ad fees', 'earnings']],
      date: ['date shipped', 'date'],
      platform: 'amazon',
      campaign: ['tracking id'],
      orders: ['items shipped', 'qty'],
      returns: ['returns'],
      sales: ['revenue', 'price'],
      commission: ['ad fees', 'earnings'],
      defaultCurrency: 'INR',
      defaultStatus: 'approved',
    }),
    adapter({
      source: 'admitad',
      label: 'Admitad',
      csvHelp: 'Publisher dashboard → Reports → Actions → Export (CSV).',
      apiEnv: ['ADMITAD_CLIENT_ID', 'ADMITAD_CLIENT_SECRET'],
      apiDocs: 'https://developers.admitad.com/',
      required: [
        ['action id', 'action'],
        ['payment', 'reward'],
      ],
      id: ['action id', 'action'],
      date: ['action date', 'date'],
      platform: ['advcampaign name', 'program', 'advertiser'],
      campaign: ['subid', 'sub id'],
      sales: ['cart', 'order sum'],
      commission: ['payment', 'reward'],
      currency: ['currency'],
      defaultCurrency: 'INR',
      status: ['status'],
      defaultStatus: 'pending',
    }),
    adapter({
      source: 'cuelinks',
      label: 'Cuelinks',
      csvHelp: 'Cuelinks dashboard → Reports → Transactions → Export.',
      apiEnv: ['CUELINKS_API_KEY'],
      apiDocs: 'https://www.cuelinks.com/',
      required: [
        ['transaction id', 'id'],
        ['commission', 'user commission'],
      ],
      id: ['transaction id', 'id'],
      date: ['transaction date', 'sale date', 'date'],
      platform: ['store', 'campaign name', 'merchant'],
      campaign: ['sub id', 'subid'],
      sales: ['sale amount', 'order amount'],
      commission: ['commission', 'user commission'],
      defaultCurrency: 'INR',
      status: ['status'],
      defaultStatus: 'pending',
    }),
    adapter({
      source: 'travelpayouts',
      label: 'Travelpayouts',
      csvHelp: 'Travelpayouts → Statistics → Actions → Export to CSV.',
      apiEnv: ['TRAVELPAYOUTS_API_TOKEN'],
      apiDocs: 'https://support.travelpayouts.com/',
      required: [
        ['program', 'brand'],
        ['profit', 'reward', 'commission'],
      ],
      id: ['action id', 'id', 'booking id'],
      date: ['action date', 'booked at', 'date'],
      platform: ['program', 'brand'],
      campaign: ['sub id', 'subid', 'marker'],
      sales: ['price', 'order price', 'amount'],
      commission: ['profit', 'reward', 'commission'],
      currency: ['currency'],
      defaultCurrency: 'USD',
      status: ['state', 'status'],
      defaultStatus: 'pending',
    }),
    adapter({
      source: 'booking',
      label: 'Booking.com Affiliate Partner',
      csvHelp: 'Partner Centre → Reports → Reservations → Download CSV.',
      apiEnv: ['BOOKING_API_USERNAME', 'BOOKING_API_PASSWORD'],
      apiDocs: 'https://partner.booking.com/',
      required: [
        ['reservation id', 'booking number'],
        ['commission', 'your commission'],
      ],
      id: ['reservation id', 'booking number'],
      date: ['booking date', 'booked on', 'date'],
      platform: 'booking',
      campaign: ['label'],
      sales: ['price', 'booking value', 'room price'],
      commission: ['commission', 'your commission'],
      currency: ['currency'],
      defaultCurrency: 'EUR',
      status: ['status'],
      defaultStatus: 'pending',
    }),
  ].map((a) => [a.source, a]),
);

export function getAdapter(source: string): ImportAdapter {
  const a = ADAPTERS[source];
  if (!a) throw new ImportError(`unknown source "${source}" (known: ${Object.keys(ADAPTERS).join(', ')})`);
  return a;
}
