import { useId } from 'react';
import './Logo.css';

/** akaya wordmark: "aka" + arc glyph (blue→violet cup, green→cyan cap, voice bars) + "a" */
export function Logo({ size = 24 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <span className="logo" style={{ fontSize: size }} aria-label="akaya">
      aka
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <defs>
          <linearGradient id={`lt${id}`} x1="0" x2="1">
            <stop offset="0" stopColor="#0269f8" />
            <stop offset="1" stopColor="#7625ef" />
          </linearGradient>
          <linearGradient id={`lb${id}`} x1="0" x2="1">
            <stop offset="0" stopColor="#08da73" />
            <stop offset="1" stopColor="#0dabf4" />
          </linearGradient>
        </defs>
        <path d="M6 9 Q20 25 34 9" stroke={`url(#lt${id})`} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M6 39 Q20 23 34 39" stroke={`url(#lb${id})`} strokeWidth="6" fill="none" strokeLinecap="round" />
        <g strokeLinecap="round" strokeWidth="2.6">
          <path d="M15.5 21.5v5" stroke="#1d8cf8" />
          <path d="M20 19.5v9" stroke="#5a4cf2" />
          <path d="M24.5 21.5v5" stroke="#1d8cf8" />
        </g>
      </svg>
      a
    </span>
  );
}
