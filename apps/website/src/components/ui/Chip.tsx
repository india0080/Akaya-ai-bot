export const Eyebrow = ({ children }: { children?: string }) => (children ? <span className="chip"><i aria-hidden="true" />{children}</span> : null);

export function Pills({ items, center }: { items?: string[]; center?: boolean }) {
  if (!items?.length) return null;
  return (
    <ul className={`pills${center ? ' center' : ''}`}>
      {items.map((t) => <li className="pill" key={t}>{t}</li>)}
    </ul>
  );
}
