/** Typed access to build-time env vars (see .env.example). Empty string = integration disabled. */
const env = import.meta.env;

export const config = {
  siteUrl: (env.VITE_SITE_URL || 'https://akaya.one').replace(/\/$/, ''),
  googleSiteVerification: env.VITE_GOOGLE_SITE_VERIFICATION || '',
  bingSiteVerification: env.VITE_BING_SITE_VERIFICATION || '',
  ga4Id: env.VITE_GA4_ID || '',
  gtmId: env.VITE_GTM_ID || '',
  clarityId: env.VITE_CLARITY_ID || '',
  apiBaseUrl: env.VITE_API_BASE_URL || '',
} as const;

export const hasTracking = () => Boolean(config.ga4Id || config.gtmId || config.clarityId);
