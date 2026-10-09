import { useEffect, useState } from 'react';

const FRAME_MQ = '(min-width: 600px) and (min-height: 760px)';

/** Fake iOS-style status bar. Shown only inside the desktop phone frame (or with ?statusbar=1). */
export function useShowStatusBar() {
  const force = new URLSearchParams(window.location.search).get('statusbar') === '1';
  const [framed, setFramed] = useState(() => window.matchMedia(FRAME_MQ).matches);
  useEffect(() => {
    const m = window.matchMedia(FRAME_MQ);
    const on = (e: MediaQueryListEvent) => setFramed(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return force || framed;
}
