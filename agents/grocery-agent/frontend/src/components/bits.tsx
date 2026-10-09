import type { StoreId } from '../api/types';
import { STORES } from '../lib/format';
import { Icon } from '@akaya/ui';

export function StoreMark({ store, size = 30 }: { store: StoreId; size?: number }) {
  const s = STORES[store];
  return (
    <span
      className="store-mark"
      style={{
        width: size,
        height: size,
        background: s.color,
        color: s.ink,
        fontSize: size * (s.mono.length > 1 ? 0.36 : 0.5),
      }}
      aria-label={s.name}
    >
      {s.mono}
    </span>
  );
}
export function SampleTag({ text = 'SAMPLE DATA' }: { text?: string }) {
  return (
    <span className="sample-tag" title="Mock provider: realistic sample prices, not live store data">
      <Icon name="box" size={11} /> {text}
    </span>
  );
}
export function PayNotice({ store }: { store?: string }) {
  return (
    <div className="notice pay-notice">
      <Icon name="lock" size={16} />
      <span>
        Akaya only fills the cart. You review and pay in {store ? `the ${store} app` : 'the store app'} with UPI or
        card, approving the OTP / UPI PIN yourself. <b>Akaya never pays for you.</b>
      </span>
    </div>
  );
}
