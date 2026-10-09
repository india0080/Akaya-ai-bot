import { describe, expect, it } from 'vitest';
import { epochToZoned, nextOccurrence, zonedToEpoch } from '../src/index.js';

describe('time zones', () => {
  it('converts IST wall time to UTC', () => {
    expect(new Date(zonedToEpoch('2026-10-09', '21:00', 'Asia/Kolkata')).toISOString()).toBe('2026-10-09T15:30:00.000Z');
  });
  it('handles DST zones', () => {
    // New York is UTC-4 in July, UTC-5 in December
    expect(new Date(zonedToEpoch('2026-07-01', '09:00', 'America/New_York')).toISOString()).toBe('2026-07-01T13:00:00.000Z');
    expect(new Date(zonedToEpoch('2026-12-01', '09:00', 'America/New_York')).toISOString()).toBe('2026-12-01T14:00:00.000Z');
  });
  it('repeats keep wall-clock time across DST', () => {
    const first = zonedToEpoch('2026-10-31', '09:00', 'America/New_York');
    const next = nextOccurrence(first, 'weekly', 'America/New_York')!;
    expect(epochToZoned(next, 'America/New_York')).toEqual({ date: '2026-11-07', time: '09:00' });
  });
  it('monthly on the 31st clamps; yearly on 29 Feb clamps', () => {
    const jan31 = zonedToEpoch('2027-01-31', '10:00', 'Asia/Kolkata');
    expect(epochToZoned(nextOccurrence(jan31, 'monthly', 'Asia/Kolkata')!, 'Asia/Kolkata').date).toBe('2027-02-28');
    const leap = zonedToEpoch('2028-02-29', '00:00', 'Asia/Kolkata');
    expect(epochToZoned(nextOccurrence(leap, 'yearly', 'Asia/Kolkata')!, 'Asia/Kolkata').date).toBe('2029-02-28');
  });
  it('once does not repeat', () => {
    expect(nextOccurrence(Date.now(), 'once', 'UTC')).toBeNull();
  });
});
