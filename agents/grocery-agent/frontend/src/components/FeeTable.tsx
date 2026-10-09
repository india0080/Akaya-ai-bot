import type { Fees } from '../api/types';
import { inr } from '../lib/format';

export function FeeTable({ subtotal, fees, total, note }: { subtotal: number; fees: Fees; total: number; note?: string }) {
  const rows: [string, number][] = [
    ['Delivery fee', fees.delivery],
    ['Handling fee', fees.handling],
    ['Small-cart fee', fees.smallCart],
    ['Platform fee', fees.platform],
  ];
  return (
    <div className="fees">
      <div className="fee">
        <span>Item total</span>
        <b>{inr(subtotal)}</b>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className={`fee${v ? '' : ' zero'}`}>
          <span>{k}</span>
          <b>{v ? inr(v) : 'FREE'}</b>
        </div>
      ))}
      <div className="fee total">
        <span>To pay in store app</span>
        <b>{inr(total)}</b>
      </div>
      {note && <p className="fine">{note}</p>}
    </div>
  );
}
