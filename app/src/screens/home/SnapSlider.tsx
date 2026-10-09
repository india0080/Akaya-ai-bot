import { useRef, useState, type ReactNode } from 'react';

/** Horizontal scroll-snap slider with synced dots (Home: Today cards, feature cards). Cards are the direct children. */
export function SnapSlider({
  labels,
  className = '',
  children,
}: {
  labels: string[];
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  /** distance between card starts (card width + gap), measured so any card size works */
  const step = () => {
    const kids = ref.current?.children;
    return kids && kids.length > 1 ? (kids[1] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft : 262;
  };
  return (
    <>
      <div
        className={`slider ${className}`}
        ref={ref}
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / step()))}
      >
        {children}
      </div>
      <div className="dots">
        {labels.map((l, i) => (
          <button
            key={l}
            className={i === idx ? 'a' : ''}
            aria-label={`Show ${l}`}
            onClick={() => ref.current?.scrollTo({ left: i * step(), behavior: 'smooth' })}
          />
        ))}
      </div>
    </>
  );
}
