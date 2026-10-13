/**
 * Third-party integrations, injected only when their env var is set (see docs/INTEGRATIONS.md).
 * Consent Mode v2 defaults to "denied" before any tag loads; ConsentBanner updates it.
 */
import type { config as Config } from '../config/env';

export function integrationsHead(c: typeof Config): string {
  const out: string[] = [];
  if (c.googleSiteVerification) out.push(`<meta name="google-site-verification" content="${c.googleSiteVerification}">`);
  if (c.bingSiteVerification) out.push(`<meta name="msvalidate.01" content="${c.bingSiteVerification}">`);
  if (c.ga4Id || c.gtmId) {
    out.push(`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('akaya-consent')==='granted')gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}catch(e){}</script>`);
  }
  if (c.gtmId) out.push(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${c.gtmId}');</script>`);
  if (c.ga4Id) out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${c.ga4Id}"></script><script>gtag('js',new Date());gtag('config','${c.ga4Id}');</script>`);
  if (c.clarityId) out.push(`<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${c.clarityId}");</script>`);
  return out.join('\n    ');
}

/** GTM <noscript> iframe for <body>. */
export const gtmNoscript = (gtmId: string) =>
  gtmId ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : '';
