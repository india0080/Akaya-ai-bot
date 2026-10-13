import { useEffect, useState } from 'react';
import { hasTracking } from '../../config/env';

type Choice = 'granted' | 'denied';
const KEY = 'akaya-consent';

declare global { interface Window { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] } }

/** Google Consent Mode v2 banner. Defaults are "denied" (set in <head>); this updates them on user choice. */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!hasTracking()) return;
    const saved = localStorage.getItem(KEY) as Choice | null;
    if (saved) apply(saved);
    // Deferred so the first paint never waits on this.
    else setTimeout(() => setOpen(true), 0);
    const reopen = (e: Event) => { if ((e.target as HTMLElement).closest('[data-consent-open]')) setOpen(true); };
    document.addEventListener('click', reopen);
    return () => document.removeEventListener('click', reopen);
  }, []);
  if (!open) return null;
  const choose = (c: Choice) => { localStorage.setItem(KEY, c); apply(c); setOpen(false); };
  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>We use cookies for analytics to improve Akaya. You can accept or reject non-essential cookies.</p>
      <div className="ctas">
        <button type="button" className="btn sm" onClick={() => choose('denied')}>Reject</button>
        <button type="button" className="btn sm primary" onClick={() => choose('granted')}>Accept</button>
      </div>
    </div>
  );
}

function apply(c: Choice) {
  window.gtag?.('consent', 'update', { ad_storage: c, ad_user_data: c, ad_personalization: c, analytics_storage: c });
}
