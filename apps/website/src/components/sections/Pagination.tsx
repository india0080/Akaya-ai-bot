export function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages < 2) return null;
  const href = (n: number) => (n === 1 ? base : `${base}/page/${n}`);
  return (
    <nav className="pager" aria-label="Pagination">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <a key={n} href={href(n)} aria-current={n === page ? 'page' : undefined}>{n}</a>
      ))}
    </nav>
  );
}
