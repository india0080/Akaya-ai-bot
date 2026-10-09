import type { ParsedItem, StoreQuote } from '../api/types';
import { inr } from '../lib/format';
import { Sheet } from '@akaya/ui';
import { FeeTable } from './FeeTable';
import { StoreMark } from './bits';

export function StoreSheet({
  quote,
  items,
  onClose,
}: {
  quote: StoreQuote | null;
  items: ParsedItem[];
  onClose: () => void;
}) {
  return (
    <Sheet
      open={!!quote}
      onClose={onClose}
      title={
        quote && (
          <span className="sheet-store">
            <StoreMark store={quote.store} size={26} /> {quote.storeName}
          </span>
        )
      }
      height={84}
    >
      {quote && (
        <div className="store-detail">
          <p className="muted small">
            {quote.etaLabel} · {quote.lines.length} lines · sample prices
          </p>
          <div className="lines">
            {quote.lines.map((l, i) => (
              <div key={l.sku.id + i} className="line">
                <span className="item-em">{l.sku.emoji}</span>
                <span className="grow">
                  <b>{l.sku.name}</b>
                  <small>
                    {l.packs} × {l.sku.sizeLabel}
                    {l.sku.mrp > l.sku.price && <s> {inr(l.sku.mrp * l.packs)}</s>}
                  </small>
                  {l.substitution && <span className="sub-note">{l.substitution.reason}</span>}
                </span>
                <b>{inr(l.price)}</b>
              </div>
            ))}
            {quote.missing.map((m) => (
              <div key={m} className="line missing">
                <span className="item-em">{items.find((i) => i.id === m)?.emoji ?? '❔'}</span>
                <span className="grow">
                  <b>{items.find((i) => i.id === m)?.name ?? m}</b>
                  <small>Out of stock here</small>
                </span>
              </div>
            ))}
          </div>
          <FeeTable subtotal={quote.subtotal} fees={quote.fees} total={quote.total} />
        </div>
      )}
    </Sheet>
  );
}
