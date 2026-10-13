# Integrations (config-driven)

Every integration is driven by an env var (copy `.env.example` to `.env.local`, or set the vars in your host's build settings).
- **Empty means off:** nothing is injected and no IDs ship in the code.
- **Set at build time:** values are read when the site is built (`src/config/env.ts` → `src/seo/integrations.ts`), so you must rebuild after changing them.

| Service | Env var | What to do |
|---|---|---|
| Google Search Console | `VITE_GOOGLE_SITE_VERIFICATION` | In Search Console, add a URL-prefix property and choose the **HTML tag** method. Copy the `content` value only, rebuild and deploy, then click Verify and submit `/sitemap.xml`. (The DNS method works too and needs no env var.) |
| Bing Webmaster Tools | `VITE_BING_SITE_VERIFICATION` | Add the site and choose the meta tag `msvalidate.01`. Copy the content value. You can also import from Search Console. |
| Google Analytics 4 | `VITE_GA4_ID` (`G-…`) | Admin → Data streams → Web → Measurement ID. |
| Google Tag Manager | `VITE_GTM_ID` (`GTM-…`) | Create a Web container. If you use GTM to fire GA4, leave `VITE_GA4_ID` empty to avoid counting every visit twice. |
| Consent Mode v2 | automatic when GA4 or GTM is set | `<head>` sets `ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage` to **denied** before any tag loads. The `ConsentBanner` updates them on Accept/Reject (saved in `localStorage` under `akaya-consent`), and the footer's "Cookie settings" reopens it. For a certified CMP (required for EEA ads), replace `ConsentBanner` with one (Cookiebot, OneTrust, Google's CMP partners) and keep the defaults. |
| Microsoft Clarity (optional) | `VITE_CLARITY_ID` | Copy the project ID from Settings. Note: Clarity loads regardless of consent; turn on Clarity's consent API, or gate it, if you need to. |
| IndexNow | `INDEXNOW_KEY` | Generate a key with `openssl rand -hex 16`. The build writes `/<key>.txt`; after you deploy, run `INDEXNOW_KEY=… VITE_SITE_URL=… npm run indexnow`. |
| Backend API | `VITE_API_BASE_URL` | Used by future auth and content adapters (see ADMIN-INTEGRATION.md). |

Nothing here contains real IDs; developers must fill them in.
