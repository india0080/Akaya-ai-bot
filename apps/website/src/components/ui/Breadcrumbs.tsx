import type { Crumb } from '../../content/types';

export function Breadcrumbs({ items }: { items?: Crumb[] }) {
  if (!items || items.length < 2) return null;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) => (
          <li key={c.path}>{i < items.length - 1 ? <a href={c.path}>{c.name}</a> : <span aria-current="page">{c.name}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
