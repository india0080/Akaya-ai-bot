import { describe, expect, it } from 'vitest';
import { nextRun, type Schedule } from '../src/services/lists.js';
import { buildProviders } from '../src/providers/registry.js';
import { loadConfig } from '../src/config.js';

const IST = (iso: string) => new Date(iso + '+05:30').getTime();
const sched = (p: Partial<Schedule> = {}): Schedule => ({ enabled: true, days: [6], time: '09:00', strategy: 'cheapest', autoFill: false, ...p });

describe('weekly schedule (IST)', () => {
  it('next Saturday 09:00 IST from a Friday', () => {
    expect(nextRun(sched(), IST('2026-10-09T13:00:00'))).toBe(IST('2026-10-10T09:00:00'));
  });
  it('same day if the time is still ahead, next week if passed', () => {
    expect(nextRun(sched({ days: [5], time: '18:30' }), IST('2026-10-09T13:00:00'))).toBe(IST('2026-10-09T18:30:00'));
    expect(nextRun(sched({ days: [5], time: '08:00' }), IST('2026-10-09T13:00:00'))).toBe(IST('2026-10-16T08:00:00'));
  });
  it('IST date boundary (late night UTC)', () => {
    // 2026-10-09 23:00 UTC = Sat 04:30 IST → Saturday 09:00 IST is the same IST day
    expect(nextRun(sched(), Date.parse('2026-10-09T23:00:00Z'))).toBe(IST('2026-10-10T09:00:00'));
  });
  it('disabled → undefined', () => expect(nextRun(sched({ enabled: false }))).toBeUndefined());
});

describe('provider registry', () => {
  it('uses Mock (sample) everywhere by default', () => {
    const { byStore } = buildProviders(loadConfig({}));
    expect([...byStore.values()].every((p) => p.kind === 'mock')).toBe(true);
  });
  it('falls back to Mock when Playwright is requested but not configured', () => {
    const { byStore, wanted } = buildProviders(loadConfig({ PROVIDERS: 'mock,blinkit' }));
    expect(wanted.has('blinkit')).toBe(true);
    expect(byStore.get('blinkit')!.kind).toBe('mock');
  });
  it('no provider exposes a payment method', () => {
    const { byStore, real } = buildProviders(loadConfig({}));
    for (const p of [...byStore.values(), ...real]) {
      for (const m of ['pay', 'checkout', 'placeOrder', 'submitPayment']) expect((p as unknown as Record<string, unknown>)[m]).toBeUndefined();
    }
  });
});

describe('official MCP (partner) adapters', () => {
  it('never call checkout / payment tools, even if allowlisted by mistake', async () => {
    const { McpStoreProvider, instamartMcp, ToolNotAllowedError } = await import('../src/providers/mcp/base.js');
    const p = new McpStoreProvider({ ...instamartMcp, allow: [...instamartMcp.allow, 'checkout', 'confirm_order', 'get_payment_options'] }, loadConfig({ INSTAMART_MCP_TOKEN: 'x' }));
    for (const t of ['checkout', 'confirm_order', 'get_payment_options', 'check_payment_status', 'apply_coupon']) expect(() => p.assertAllowed(t)).toThrow(ToolNotAllowedError);
    for (const t of ['search_products', 'update_cart', 'get_cart', 'track_order']) expect(() => p.assertAllowed(t)).not.toThrow();
  });
  it('Instamart uses the official MCP only when requested AND a token is set', () => {
    expect(buildProviders(loadConfig({ INSTAMART_MCP_TOKEN: 't' })).byStore.get('instamart')!.kind).toBe('mock');
    expect(buildProviders(loadConfig({ PROVIDERS: 'mock,instamart', INSTAMART_MCP_TOKEN: 't' })).byStore.get('instamart')!.kind).toBe('partner');
  });
});
