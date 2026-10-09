/** Illustrated sample avatar (no real photo). */
export function Avatar({ size = 42 }: { size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <div>
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 34 34" aria-hidden="true">
          <circle cx="17" cy="13" r="7" fill="#7a4a2f" />
          <circle cx="17" cy="14.5" r="5.6" fill="#f2c4a2" />
          <path d="M10.5 13c.5-5 3.5-7 6.5-7s6 2 6.5 7c-1.5-2.5-4-3.4-6.5-3.4s-5 .9-6.5 3.4z" fill="#3a2418" />
          <path d="M5 34c1.5-7 6-10 12-10s10.5 3 12 10z" fill="#7625ef" />
        </svg>
      </div>
    </div>
  );
}
