import { useEffect, useState } from 'react';

/** current time (epoch ms) that re-renders every `everyMs`; keeps components pure (no Date.now() during render) */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(t);
  }, [everyMs]);
  return now;
}
