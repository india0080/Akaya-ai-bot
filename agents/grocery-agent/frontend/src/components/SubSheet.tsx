import type { Alt, Line, ParsedItem } from '../api/types';
import { inr } from '../lib/format';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';

export function SubSheet({
  group,
  current,
  onClose,
  onPick,
}: {
  group: { itemId: string; item?: ParsedItem; lines: Line[]; price: number } | null;
  current?: Alt;
  onClose: () => void;
  onPick: (a: Alt | null) => void;
}) {
  const base = group?.price ?? 0;
  return (
    <Sheet open={!!group} onClose={onClose} title={group ? `Swap ${group.item?.name.toLowerCase() ?? 'item'}` : ''} height={78}>
      {group && (
        <div className="subs">
          <p className="muted small">
            You asked for {group.item?.display} {group.item?.brand ?? ''} {group.item?.name.toLowerCase()}. Pick what goes in the cart.
          </p>
          <button className={`sub-opt${!current ? ' on' : ''}`} onClick={() => onPick(null)}>
            <span className="item-em">{group.lines[0].sku.emoji}</span>
            <span className="grow">
              <b>{group.lines.map((l) => l.sku.name).join(' + ')}</b>
              <small>
                {group.lines.map((l) => `${l.packs} × ${l.sku.sizeLabel}`).join(' + ')} · Akaya's pick
              </small>
            </span>
            <span className="so-r">
              <b>{inr(base)}</b>
              {!current && <Icon name="check" size={16} />}
            </span>
          </button>
          {group.lines[0].alternatives.map((a) => {
            const d = a.price - base;
            const on = current?.sku.id === a.sku.id;
            return (
              <button key={a.sku.id} className={`sub-opt${on ? ' on' : ''}`} onClick={() => onPick(a)}>
                <span className="item-em">{a.sku.emoji}</span>
                <span className="grow">
                  <b>{a.sku.name}</b>
                  <small>
                    {a.packs} × {a.sku.sizeLabel} · {a.sku.brand}
                  </small>
                </span>
                <span className="so-r">
                  <b>{inr(a.price)}</b>
                  <em className={d < 0 ? 'cheaper' : 'dearer'}>{d === 0 ? 'same' : `${d < 0 ? '−' : '+'}${inr(Math.abs(d))}`}</em>
                  {on && <Icon name="check" size={16} />}
                </span>
              </button>
            );
          })}
          <p className="fine">Prices are re-checked on the server when the cart is filled.</p>
        </div>
      )}
    </Sheet>
  );
}
