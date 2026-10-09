import { useEffect, useState } from 'react';
import './StatusBar.css';

export function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  const fixed = new URLSearchParams(window.location.search).get('clock');
  const time = fixed ?? now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="statusbar" aria-hidden="true">
      <span>{time}</span>
      <div className="sb-r">
        <svg width="17" height="11" viewBox="0 0 17 11">
          <g fill="currentColor">
            <rect x="0" y="7" width="3" height="4" rx="1" />
            <rect x="4.6" y="5" width="3" height="6" rx="1" />
            <rect x="9.2" y="2.6" width="3" height="8.4" rx="1" />
            <rect x="13.8" y="0" width="3" height="11" rx="1" />
          </g>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11">
          <path
            fill="currentColor"
            d="M7.5 10.2 5.3 7.9a3.2 3.2 0 0 1 4.4 0zM3.4 6a5.9 5.9 0 0 1 8.2 0l1.4-1.4a7.9 7.9 0 0 0-11 0zM.6 3.2a9.9 9.9 0 0 1 13.8 0L15.8 1.8a11.9 11.9 0 0 0-16.6 0z"
          />
        </svg>
        <span className="bat">99</span>
      </div>
    </div>
  );
}
