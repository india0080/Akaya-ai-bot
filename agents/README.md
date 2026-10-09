# Akaya Agents

Two agents for Akaya, each with its own backend, frontend, docs and tests. They are npm workspaces of the root repo and
share code through `packages/` (`@akaya/ui`, `@akaya/affiliate` for store links, `@akaya/server-kit` for the store, cache,
queue and SSE) and the Dockerfiles in `/docker`, instead of carrying their own copies.

| Agent | Folder | UI | API (Swagger at `/docs`) | What it does |
|---|---|---|---|---|
| **Shopping** | [`shopping-agent/`](shopping-agent/README.md) | http://localhost:5174 | http://localhost:8787 | Search in English/Hindi/Hinglish (text or voice), rank offers across stores by price, rating, reviews, seller trust, delivery and fake-review signals, compare, price history, watchlist + price-drop alerts, "Buy on X" store links (no checkout) |
| **Grocery** | [`grocery-agent/`](grocery-agent/README.md) | http://localhost:5175 | http://localhost:8788 | Parse a grocery list (text or voice), compare Instamart / Blinkit / Zepto / BigBasket / Amazon Fresh with fees, cheapest / fastest / split basket, substitutions, budget, saved lists with weekly schedule, fill the cart → **notify to confirm & pay** → hand off to the store app → order tracking |

**Both run on Mock providers out of the box** with realistic INR sample data, labelled `SAMPLE` in the UI and `sample: true`
in the API. No real store or affiliate API is connected; real adapters are written as documented, tested-with-stubs skeletons.
**Neither agent ever pays**: the user buys or pays in the store's own app or site.

## Run

```bash
cd shopping-agent && npm install && npm run dev     # UI :5174 · API :8787
cd grocery-agent  && npm install && npm run dev     # UI :5175 · API :8788
# or, in either folder: docker compose up --build   (written, not run here: no Docker in the build environment)
npm test   # backend tests      npm run lint   # frontend lint + backend typecheck      npm run build
```

Node 20+. Copy `.env.example` → `.env` only when adding real keys or sessions.

## Shared design

- **Frontend:** React 19 + TypeScript + Vite 8, framer-motion, the Akaya UI kit (pearl, brand colours `#0269f8 #7625ef #0dabf4
  #08da73`, orange `#E8743B`, Comfortaa + Manrope, light/dark/system theme, phone frame, Akaya bottom nav with the voice orb).
  The kit is copied into each agent (`src/ui`, `src/theme`) to keep folders independent.
- **Backend:** Fastify 5 + zod (`fastify-type-provider-zod`) → OpenAPI 3 / Swagger UI, `@fastify/rate-limit`, CORS, TTL cache,
  in-process job queue with SSE progress, JSON-file store, notification service (in-app SSE works; Web Push / FCM stubs).
- **Provider adapters** behind one interface per agent, chosen by `.env`; Mock is the default and the fallback.
- **Tests:** vitest (shopping 34, grocery 30): parsers, ranking/optimizer, services, provider adapters with stubbed HTTP, API flows.

## Integrating with the main Akaya app

Done in the main Akaya app (`akaya-app`; `app/` in the akaya-ai-bot monorepo):
- **Agents sheet** (`#/home?sheet=agents`) now has a **Shopping & grocery** section with two tiles that open the agent UIs
  (`src/lib/agentApps.ts`, `src/screens/sheets/FeatureSheets.tsx`, styles in `Sheets.css`). Screenshot: `main-app-agents-sheet.png`.
- URLs come from build-time env vars (defaults are the local dev servers):

  ```bash
  VITE_SHOPPING_AGENT_URL=https://shop.akaya.example   # default http://localhost:5174
  VITE_GROCERY_AGENT_URL=https://grocery.akaya.example  # default http://localhost:5175
  ```

Deeper integration options, in order of effort:
1. **Link out (current):** deploy each agent's UI + API; the tile opens it. No shared code.
2. **Same origin:** serve the agent UIs under `/agents/shopping/` and `/agents/grocery/` (both build with `base: './'`) and
   reverse-proxy `/api` to each backend, so one login and one domain.
3. **Native screens:** call the agent APIs from Akaya's own screens (typed clients in each `frontend/src/api/client.ts`;
   OpenAPI in each `docs/openapi.json`) and subscribe to `/api/notifications/stream` for "price dropped" or "cart ready: confirm
   & pay" banners, or forward them to FCM for the Android app.
4. **Chat/voice:** Akaya's assistant can route intents ("find earbuds under 3000", "order this week's groceries") to
   `POST /api/search` and `POST /api/quotes`; the Hindi/Hinglish parsers already handle the phrasing.

Before production: real auth instead of the `x-user-id` demo header, Redis + Postgres, push keys, and the store access
described in each agent's `docs/PROVIDERS.md`.

## What production needs (keys and partnerships)

**Shopping** (see `shopping-agent/docs/PROVIDERS.md`)
- Amazon Associates **Creators API** credentials (PA-API 5 was retired in May 2026; eligibility requires qualifying sales).
- **Flipkart Affiliate** ID + token.
- **SerpApi** key (Google Shopping India) for broader coverage.
- Affiliate network accounts (Cuelinks / EarnKaro / vCommission / Admitad / Impact) for other stores; ASCI disclosure.
- The browser fallback is off by default and flagged for ToS and blocking risk.

**Grocery** (see `grocery-agent/docs/PROVIDERS.md`)
- **Swiggy Instamart MCP** production access (builders programme; OAuth 2.1 per user) and **Zepto MCP** written terms.
  Adapter skeleton in place: search/cart tools only, checkout/payment tools blocked in code.
- Partnerships for **Blinkit, BigBasket, Amazon Fresh** (no public APIs). The own-session Playwright fallback is experimental and
  carries ToS/account risk.
- VAPID keys / FCM for phone push.

## Media

| | Shopping | Grocery |
|---|---|---|
| Contact sheets (every screen) | `shopping-agent/screens-light.png`, `screens-dark.png` | `grocery-agent/screens-light.png`, `screens-dark.png` |
| Demo video (720p, SFX) | `shopping-agent/shopping-agent-demo.mp4` | `grocery-agent/grocery-agent-demo.mp4` |
