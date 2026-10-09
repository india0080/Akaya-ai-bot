# Providers: access routes, partnerships, legal notes

Every store sits behind one interface, `GroceryProvider` (`backend/src/providers/types.ts`):
`serviceability · findSkus · fees · getSku · fillCart`. There is deliberately **no** `pay`, `checkout` or `placeOrder`.
The registry (`providers/registry.ts`) picks, per store listed in `PROVIDERS`: **official MCP** (if a token is set) →
**Playwright own-session** (if set up) → **Mock**. Stores not listed always use Mock.

**Nothing here has been run against a live store.** Mock is the only working provider; the others are skeletons with TODOs.

## Where each store stands (checked 9 Oct 2026)

| Store | Public price/cart API | Official agent route | Route in this repo | Status |
|---|---|---|---|---|
| Swiggy Instamart | No | **Instamart MCP** `https://mcp.swiggy.com/im` (OAuth 2.1 + PKCE) | `providers/mcp/base.ts` (`instamartMcp`) | skeleton: transport + tool guard written, result mapping TODO |
| Zepto | No | **Zepto MCP** `https://mcp.zepto.co.in/mcp` (consumer OAuth) | `providers/mcp/base.ts` (`zeptoMcp`) | skeleton: tool names TODO (discover with `tools/list`) |
| Blinkit | No | None found (community MCPs are unofficial) | `providers/playwright/blinkit.ts` | skeleton: selectors TODO |
| BigBasket | No | None found | `providers/playwright/bigbasket.ts` | skeleton: selectors TODO |
| Amazon Fresh | No grocery cart/slot API | None found (the Associates Creators API covers product links/offers, not Fresh carts or slots) | `providers/playwright/amazonfresh.ts` | skeleton: selectors TODO |

Re-check before building: these programmes change quickly.

## 1. Official MCP servers (preferred)

**Swiggy Instamart** (docs: `https://mcp.swiggy.com/builders/docs/`)
- 19 tools including `search_products`, `get_addresses`, `update_cart` (replaces the whole cart), `get_cart` (with bill
  breakdown), `track_order`, and also `checkout`, `get_payment_options`, `check_payment_status`, `confirm_order`.
- Auth: OAuth 2.1 + PKCE per user (dynamic client registration). Access tokens last about 5 days; v1 has no refresh tokens,
  so the user re-authorises when a call returns 401.
- Access: you can build against `http://localhost` without approval. Production is invite/review based: you apply with your
  integration name, exact HTTPS redirect URIs, servers used, expected volume and a demo video. Staging (seeded data, no real
  orders) comes first; production follows after staging has been green for 48 hours. Platform operators brokering Swiggy for
  their own users go through an enterprise path (commercial terms, typically 4+ weeks).

**Zepto** (repo: `github.com/zeptonow/mcp`)
- Consumer MCP for product search, cart, orders and order history, connected with the user's Zepto OAuth login.
- Orders placed through it are **real orders**; its README states payments were cash-on-delivery only at the time of writing.
- No developer programme is documented; ask Zepto for written terms before shipping an integration to Akaya users.

**How Akaya uses them**
- Only search and cart tools. `McpStoreProvider.assertAllowed()` permits an explicit allowlist and **always** blocks tool names
  matching `checkout|place|confirm|pay|coupon`, even if allowlisted by mistake (unit test: `test/services.test.ts`).
- After `fillCart`, the user pays in the store app as with every other route. Akaya never calls `checkout`.
- Setup (dev): `npm --prefix backend i @modelcontextprotocol/sdk`, run the OAuth flow for your user, then set
  `PROVIDERS=mock,instamart` and `INSTAMART_MCP_TOKEN=<access token>` (Zepto: `ZEPTO_MCP_TOKEN`). In production, run OAuth from
  the Akaya app and store tokens per user in a secrets vault, not in `.env`.
- TODO: map `search_products` variants → `Sku` (pack size, price, MRP, stock) and `get_cart` bill → fees / `verifiedTotal`.

## 2. Playwright, the user's own session (fallback, experimental)

`providers/playwright/base.ts` drives the store website with a Playwright `storageState` saved after the user logs in
once (OTP). Off unless `ENABLE_PLAYWRIGHT=true`.

```bash
npm --prefix backend i -D playwright && npx playwright install chromium
npx playwright codegen --save-storage=secrets/blinkit.json https://blinkit.com   # log in, set address, close
# .env
ENABLE_PLAYWRIGHT=true
PROVIDERS=mock,blinkit
BLINKIT_STORAGE_STATE=secrets/blinkit.json
```

Each `playwright/<store>.ts` has `searchUrl` and `selectors` marked `TODO`. Fill them in after inspecting the logged-in site.
`findSkus` and `fillCart` stop at a filled cart and **must never** click checkout, place order or pay.

**Risks to read before enabling:**
- **Terms of service:** store terms commonly prohibit automated access. Automating them, even for the user's own account, may
  breach those terms and can get the account blocked. Get legal review; prefer an official route or partnership.
- **Fragility:** bot detection, CAPTCHAs, OTP re-login and layout changes will break flows without warning.
- **Session data is sensitive:** a storage-state file is a live login. Keep it out of git (`secrets/` is ignored), encrypt it at
  rest, scope it to one user, and delete it when the user disconnects (DPDP Act 2023: consent, purpose limitation, erasure).
- **Pace:** run only on the user's request, at human speed, one session at a time.

## 3. Partnerships to pursue for production

| Who | Ask for |
|---|---|
| Swiggy (Instamart MCP) | production access via the builders programme; enterprise terms if Akaya brokers for many users |
| Zepto | written developer terms for the consumer MCP, or a partner API |
| Blinkit (Eternal) | catalogue / cart API or MCP access |
| BigBasket (Tata Digital) | partner catalogue + cart API |
| Amazon (Fresh / Now) | grocery partner access; Associates links only cover affiliate product links |

Affiliate income: grocery quick-commerce affiliate programmes are limited and change often. Check the stores and networks
(Cuelinks, EarnKaro, vCommission, Admitad) for current campaigns, and disclose affiliate links in line with ASCI guidelines.

## Payments and consumer rules

- **Never auto-pay.** RBI requires additional-factor authentication (OTP / UPI PIN / biometrics) for digital payments. The user
  completes that in the store app. The agent has no payment fields: it never asks for card, UPI or OTP details.
- "I've paid" is the user's own confirmation and is accepted only after the hand-off step (`409` otherwise). With an official
  integration, confirm with order history / `track_order` instead.
- Show every fee before the hand-off (delivery, handling, small-cart, platform) and do not pre-tick extras: CCPA's 2023
  dark-pattern guidelines cover drip pricing and basket sneaking.
- Mock fees, slots and ETAs are illustrative samples, not any store's real fee schedule.

## Notifications

- In-app: SSE `GET /api/notifications/stream` (works now).
- Web Push: generate VAPID keys (`npx web-push generate-vapid-keys`), set `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, add the
  `web-push` package in `services/notifications.ts` (stub marked TODO).
- FCM (Android/iOS app): `FCM_PROJECT_ID` + service-account JSON, send via FCM HTTP v1 (stub marked TODO).

## Production checklist

1. Official MCP for Instamart (and Zepto with written terms): finish result mapping, per-user OAuth, token vault, re-auth UX.
2. Partnerships for Blinkit, BigBasket and Amazon Fresh, or a reviewed decision on own-session automation.
3. Redis cache/queue, Postgres store, real auth instead of `x-user-id`.
4. Real push delivery (VAPID / FCM), quiet hours for scheduled-list notifications.
5. Order confirmation from the store (order history / webhooks) instead of the user's "I've paid" tap.
6. Monitoring per store (error rate, fill success, price drift between quote and cart).
