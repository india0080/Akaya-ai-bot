import { useMemo, useState } from 'react';
import { PLATFORM_IDS } from '@akaya/affiliate';
import { Icon, Screen, ScreenHeader, Segmented } from '@akaya/ui';
import { AFF_CONFIGURED, inr } from '../commerce/links';
import { PlatformTile, SampleTag } from '../commerce/LinkParts';
import { sampleEarnings, type Period } from '../commerce/sample/earnings';

/** Admin view of affiliate performance. SAMPLE data in the app; real numbers come from link-redirect /reports. */
export function Earnings() {
  const [period, setPeriod] = useState<Period>(30);
  const r = useMemo(() => sampleEarnings(period), [period]);
  const max = Math.max(...r.platforms.map((p) => p.commission), 1);
  const stats: [string, string, string][] = [
    ['Clicks', r.totals.clicks.toLocaleString('en-IN'), 'blue'],
    ['Orders', String(r.totals.orders), 'violet'],
    ['Commission', inr(r.totals.commission), 'green'],
    ['Pending', inr(r.totals.pending), 'orange'],
  ];
  return (
    <Screen className="cm earnings">
      <ScreenHeader title="Earnings" sub="Affiliate clicks, orders and commission" />
      <div className="card ea-banner">
        <Icon name="help" size={16} />
        <span>
          <b>Sample data.</b> Live numbers come from the link-redirect service (<code>GET /reports</code>, admin only).
          This build has {AFF_CONFIGURED} of {PLATFORM_IDS.length}+ affiliate IDs set.
        </span>
      </div>
      <div className="pad-x">
        <Segmented<string>
          className="full"
          value={String(period)}
          onChange={(v) => setPeriod(Number(v) as Period)}
          options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
        />
      </div>
      <div className="ea-stats">
        {stats.map(([label, value, tone]) => (
          <div key={label} className={`card ea-stat t-${tone}`}>
            <small>{label}</small>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <div className="sec-head">
        <h3>By platform</h3>
        <SampleTag />
      </div>
      <div className="card list ea-list">
        {r.platforms.map((p) => (
          <div key={p.platform} className="list-row">
            <PlatformTile id={p.platform} size={34} />
            <span className="grow">
              <b>{p.name}</b>
              <small>
                {p.clicks.toLocaleString('en-IN')} clicks · {p.orders} orders · {(p.conversion * 100).toFixed(1)}% conv.
              </small>
              <i className="ea-bar" style={{ width: `${(p.commission / max) * 100}%` }} />
            </span>
            <b className="ea-amt">{p.commission ? inr(p.commission) : '—'}</b>
          </div>
        ))}
      </div>
      <p className="fine pad-x">
        Food, grocery and ride apps are deep links only (no affiliate programme yet), so they show clicks without
        commission. Amounts in ₹, IST.
      </p>
    </Screen>
  );
}
