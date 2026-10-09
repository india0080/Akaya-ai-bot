# Providers: keys, partnerships, legal notes

Every data source implements `ShoppingProvider` (`backend/src/providers/types.ts`):

```ts
interface ShoppingProvider {
  id: string; label: string; kind: 'mock' | 'api' | 'browser'; stores: StoreId[];
  configured(): boolean;          // keys present?
  setupHint: string;              // shown in /api/providers and the Settings screen
  search(q, { limit, signal, onProgress }): Promise<Offer[]>;
  priceHistory?(offer, days): Promise<PricePoint[]>;
  refreshPrice?(offer): Promise<number | null>;   // used by the watchlist price checker
}
```

Enable with `PROVIDERS=mock,amazon,flipkart,serpapi` in `.env`. Providers without keys are skipped.
If none are usable, Mock is used and reported as sample data. **Status in this build: only Mock is
active. Amazon, Flipkart and SerpApi adapters are implemented against their public docs and
unit-tested with stubbed HTTP, but were not run against live accounts.**

| Provider | Status | Keys | Stores |
| --- | --- | --- | --- |
| Mock | active, **sample data** | none | Amazon, Flipkart, Myntra, Meesho, Croma, AJIO, Reliance Digital, Tata CLiQ, Nykaa (simulated) |
| Amazon Creators API | not connected | `AMAZON_CREDENTIAL_ID`, `AMAZON_CREDENTIAL_SECRET`, `AMAZON_TAG_IN` | Amazon.in |
| Flipkart Affiliate API | not connected | `FLIPKART_AFFILIATE_ID`, `FLIPKART_AFFILIATE_TOKEN` | Flipkart |
| SerpApi (Google Shopping) | not connected | `SERPAPI_KEY` | many Indian stores via Google Shopping |
| Browser fallback (Playwright) | off by default | `ENABLE_BROWSER_FALLBACK=true` + `npm i playwright` | any (risky, see below) |

## Amazon.in: Creators API (Amazon Associates)

PA-API 5.0 was **deprecated on 30 Apr 2026 and retired on 15 May 2026**. Calls now return
`403 AccessDenied`, and old AWS access/secret keys don't work. The adapter uses the **Creators API**:

1. Join **Amazon Associates India** (affiliate-program.amazon.in) and get your **partner tag** (e.g. `yourtag-21`).
2. Meet the API eligibility requirement. Per Amazon's docs at the time of writing, that's **10 qualifying sales in the last 30 days**.
3. Associates Central → Tools → **Creators API** → Create application → Create credential. Copy the
   Credential ID, the Credential Secret (shown once) and the version (India = EU, **3.2**).
4. Set `AMAZON_CREDENTIAL_ID`, `AMAZON_CREDENTIAL_SECRET`, `AMAZON_TAG_IN`. The defaults
   `AMAZON_TOKEN_URL=https://api.amazon.co.uk/auth/o2/token` and `AMAZON_MARKETPLACE=www.amazon.in` fit India.

How it works: OAuth 2.0 client-credentials token (cached ~1 h) → `POST https://creatorsapi.amazon/catalog/v1/searchItems`
with `x-marketplace: www.amazon.in`. `detailPageURL` already carries your tag.

Notes:
- Follow the Associates Program Operating Agreement and policies. For example: show prices with the
  "as of" time, refresh them often, don't cache past the allowed window, disclose affiliate links,
  and don't use the data to build a competing shopping site.
- TODO(amazon) in code: verify `offersV2` field names against a live response, use `getItems` for
  watchlist price refreshes, and add quota-aware throttling.

## Flipkart Affiliate API

1. Register at **affiliate.flipkart.com** and get your **Affiliate Tracking ID**.
2. API → API Token → *Generate API Token* (one token per account; regenerating revokes the old one).
3. Set `FLIPKART_AFFILIATE_ID` and `FLIPKART_AFFILIATE_TOKEN`.

The adapter calls `GET https://affiliate-api.flipkart.net/affiliate/1.0/search.json?query=…&resultCount=10`
with headers `Fk-Affiliate-Id` / `Fk-Affiliate-Token`. Keyword search returns ≤ 10 items, and returned
product URLs already include your `affid`. Feed URLs expire (about 10 h), so don't store them long-term.
TODO(flipkart): confirm current response fields with a live token; Flipkart has paused or limited
affiliate API access for some accounts in the past.

## SerpApi: Google Shopping India

1. Create an account at **serpapi.com** (paid plans; small free tier) and copy the API key.
2. Set `SERPAPI_KEY`.

The adapter calls `engine=google_shopping&gl=in&hl=en&q=…` and maps each result's `source` to a store
(Amazon, Flipkart, Croma, Reliance Digital, Tata CLiQ, Myntra…). Google Shopping prices can lag the
store. Links go to Google/the store **without** affiliate tags unless you add a network (below).

## Browser fallback (Playwright): off by default

`ENABLE_BROWSER_FALLBACK=true` turns on a headless-browser adapter skeleton for stores without an API.
**Risks:** most store terms of service forbid automated access and scraping. Stores actively block bots
(CAPTCHAs, IP bans), and page layouts change without notice. Use it only with written permission
(a partnership) or for personal, low-volume use where the user accepts the risk. The skeleton has
TODOs. Until per-store extraction is implemented, it fails with a clear "not implemented" error, which the search reports per provider without breaking other results. Prefer official APIs and affiliate feeds.

## Affiliate setup

Store links come from the shared **@akaya/affiliate** package (`packages/affiliate`), the single registry used by
the app, this agent, the grocery agent and services/link-redirect. `engine/affiliate.ts` only maps offers to it.

- **Amazon**: `AMAZON_TAG_IN` is both the Creators API `partnerTag` and the `tag=` on every Amazon link.
- **Flipkart**: `FLIPKART_AFFILIATE_ID` adds `affid=` (the API also needs `FLIPKART_AFFILIATE_TOKEN`).
- **Other stores** (Myntra, AJIO, Croma, Tata CLiQ, Nykaa, Meesho, Reliance Digital): set a network ID
  (`CUELINKS_CID`, `ADMITAD_CODE_<STORE>` or `EARNKARO_LINK_TEMPLATE`) and links are wrapped automatically.
- Every link also carries `utm_source=akaya&utm_medium=app&utm_campaign=shopping-agent`.
- **Disclosure**: the product screen shows "Akaya may earn a commission" next to the buy button.

Programmes, sign-up steps, rules and the full env-var list: [docs/AFFILIATE.md](../../../docs/AFFILIATE.md).

## Notifications

- In-app: Server-Sent Events, live now (`/api/notifications/stream`).
- Web Push: generate VAPID keys (`npx web-push generate-vapid-keys`), set `VAPID_PUBLIC_KEY` and
  `VAPID_PRIVATE_KEY`, add a service worker in the frontend, and implement `sendWebPush()` with the
  `web-push` package (TODO in `packages/server-kit/src/notifications.ts`).
- FCM (Android app): Firebase project → service account JSON → `FCM_PROJECT_ID` and
  `FCM_SERVICE_ACCOUNT_JSON`; send through the FCM HTTP v1 API (TODO).

## Production checklist

- Keys: Amazon Creators API (with eligible Associates account), Flipkart affiliate token, SerpApi key,
  an affiliate network account, VAPID/FCM.
- Partnerships: direct data partnerships (or approved affiliate feeds) for stores without public APIs.
- Store real price snapshots for history; Mock history is synthetic sample data.
- Auth, per-user rate limits, Redis/BullMQ, Postgres; a privacy policy and consent flow suited to
  Indian law (DPDP Act 2023) for watchlists and push tokens; legal review of each store's terms.
