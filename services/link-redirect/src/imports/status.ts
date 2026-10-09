import type { EarningStatus } from '@akaya/affiliate';

/** network status words → our three states */
export function status(v: string, fallback: EarningStatus = 'pending'): EarningStatus {
  const s = v.toLowerCase();
  if (/(reject|declin|cancel|void|invalid|return)/.test(s)) return 'rejected';
  if (/(approv|confirm|validat|paid|complet|stayed|shipped|accept)/.test(s)) return 'approved';
  if (/(pend|process|booked|hold|open|new)/.test(s)) return 'pending';
  return fallback;
}
