/**
 * Demo sender: what happens when a Future Message comes due inside the app.
 * Real delivery belongs to services/future-message (server-side queue + channel adapters);
 * the APK simulates it so the full flow (scheduled → sending → sent / failed / one-tap) can be tried.
 */
import type { FMResult, FMStatus, FutureMessage } from '../state/types';
import { CHANNEL_BY_ID } from './channels';
import { fmtWhen, nextOccurrence } from '@akaya/tz';

export const DEMO_FAIL_TAG = '#fail';

export function channelsOf(m: FutureMessage): string[] {
  return m.channels?.length ? m.channels : ['whatsapp'];
}

/** per-channel outcome of one simulated attempt */
export function simulateSend(m: FutureMessage): Record<string, FMResult> {
  const forceFail = m.text.toLowerCase().includes(DEMO_FAIL_TAG) && (m.attempts ?? 0) < 1;
  const out: Record<string, FMResult> = {};
  channelsOf(m).forEach((id, i) => {
    const ch = CHANNEL_BY_ID[id];
    if (!ch) return;
    if (ch.auto === 'tap') out[id] = 'needs-tap';
    else if (forceFail && i === channelsOf(m).findIndex((c) => CHANNEL_BY_ID[c]?.auto !== 'tap')) out[id] = 'failed';
    else out[id] = 'sent';
  });
  return out;
}

export function overall(results: Record<string, FMResult>): FMStatus {
  const v = Object.values(results);
  if (v.includes('failed')) return 'failed';
  if (v.includes('needs-tap')) return 'needs-tap';
  return 'sent';
}

export function summary(m: FutureMessage): { title: string; body: string } {
  const names = channelsOf(m)
    .map((c) => CHANNEL_BY_ID[c]?.label ?? c)
    .join(', ');
  const s = m.status;
  const title =
    s === 'failed'
      ? `Couldn't send to ${m.to}`
      : s === 'needs-tap'
        ? `Ready to send to ${m.to}`
        : s === 'sent'
          ? `Sent to ${m.to}`
          : `Scheduled for ${m.to}`;
  const body =
    s === 'needs-tap'
      ? `Tap to send on ${names}: "${m.text.slice(0, 60)}"`
      : s === 'failed'
        ? `${names}: ${m.error ?? 'delivery failed'}. Open Future Message to retry. (demo)`
        : `${names} · ${fmtWhen(m.when, m.tz)} (demo)`;
  return { title, body };
}

/** next instance of a repeating message, or null */
export function nextRepeat(m: FutureMessage): FutureMessage | null {
  const next = nextOccurrence(m.when, m.repeat ?? 'once', m.tz ?? 'Asia/Kolkata');
  if (!next) return null;
  return {
    ...m,
    when: next,
    status: 'scheduled',
    results: undefined,
    attempts: 0,
    error: undefined,
    sentAt: undefined,
  };
}
