# Akaya Shopping Agent

Finds the best place to buy something in India. It searches several stores, ranks every offer on
price, adjusted rating, review volume, seller trust, delivery time and fake-review risk, and lets
you compare products, see price history and set price alerts. Input can be English, Hindi or
Hinglish, typed or spoken ("1500 se kam ka basta, jaldi chahiye").

**The agent never checks out or pays.** "Buy on X" opens the store (with your affiliate tag when
configured) and you complete the purchase there yourself.

> **Data notice:** out of the box the agent runs on the **Mock provider**: realistic, clearly labelled
> **sample data** (prices in ₹, ratings, sellers, 90-day histories). **No real store API is connected**
> until you add keys (see [docs/PROVIDERS.md](docs/PROVIDERS.md)). The UI and API mark mock results with
> `sample: true` / a "SAMPLE DATA" tag.

## Quick start (Mock providers, no keys)

```bash
cd shopping-agent
npm install        # installs backend/ and frontend/ (postinstall)
npm run dev        # API http://localhost:8787 (Swagger at /docs) + UI http://localhost:5174
```

Or each part on its own: `cd backend && npm install && npm run dev`, then `cd frontend && npm install && npm run dev`.

Docker: `docker compose up --build` (UI on :5174, API on :8787). *Not tested in this build environment (no Docker available there).*

Requirements: Node 20+.

## What's inside

```
shopping-agent/
├─ backend/                 Fastify + TypeScript API
│  ├─ src/
│  │  ├─ app.ts             app factory: zod type provider, Swagger, CORS, rate limit, routes
│  │  ├─ index.ts           server entry
│  │  ├─ config.ts          typed .env (zod); every key optional
│  │  ├─ types.ts           zod schemas: Offer, RankedOffer, ProductResult, Filters, ParsedQuery…
│  │  ├─ routes/index.ts    REST + SSE endpoints (documented in OpenAPI)
│  │  ├─ engine/            queryParser (EN/HI/Hinglish), ranking, fakeReview, affiliate links
│  │  ├─ providers/         adapter interface + mock, amazon (Creators API), flipkart, serpapi, browser fallback
│  │  └─ services/          search orchestration, job queue, TTL cache, watchlist + price checker, notifications, JSON store
│  ├─ test/                 vitest: parser, ranking, fake-review, cache, queue, providers, API (inject)
│  └─ scripts/export-openapi.ts
├─ frontend/                React 19 + TS + Vite, Akaya UI (pearl bubble, brand colours, Comfortaa/Manrope, light/dark)
│  └─ src/{screens,components,api,ui,theme}
├─ docs/                    ARCHITECTURE.md · API.md · PROVIDERS.md · openapi.json
├─ .env.example
└─ docker-compose.yml
```

## Features

| Area | What it does |
| --- | --- |
| Natural-language search | Parses price caps/ranges (`under 1500`, `15k`, `1500 se kam`, `२ हज़ार तक`, `१५०० से कम`), ratings (`4 star`), urgency (`jaldi`, `kal tak` → fast delivery), stores (`on flipkart`), intent (`sabse sasta`, `best quality`) and Hindi/Hinglish product words (`basta` → school bag, `joote` → shoes, `ghadi` → watch…). |
| Voice | Web Speech API (`en-IN` / `hi-IN`) in the orb sheet; demo phrases are labelled "simulated voice". |
| Multi-store search | Providers fan out in a job queue; the UI streams per-store progress over SSE. Results are cached (TTL) and rate-limited. |
| Ranking | Weighted score: price, Bayesian-adjusted rating, review volume, seller trust, delivery; minus fake-review penalty. Presets: Balanced / Cheapest / Fastest / Quality. |
| Badges | Best price · Best rated · Best value · Fastest (never awarded to high fake-review-risk or out-of-stock offers). |
| Fake-review signals | J-shaped rating histogram, near-perfect rating with few ratings, review bursts, low verified share, high review/rating ratio, new seller with many reviews, low seller rating. Shown as explained signals, not verdicts. |
| Filters & sort | Price, rating, delivery, stores, hide fake-review risk, in stock; sort by rank/price/rating/delivery/discount. |
| Compare | 2–4 products side by side, with the best value in each row highlighted and an "Akaya pick". |
| Product detail | All store offers, multi-store price-history chart (30/90/180 days) with a "good time to buy?" verdict, score breakdown, review check, specs. |
| Buy link | Opens the store's product/search page with affiliate tag when configured. No checkout by the agent. |
| Watchlist & alerts | Target price and/or "any 5% drop"; a periodic price checker fires notifications (in-app SSE live; Web Push/FCM stubs). |

## Scripts (agent root)

| Command | |
| --- | --- |
| `npm run dev` | backend + frontend with prefixed logs |
| `npm test` | backend unit + API tests (vitest) |
| `npm run build` | `tsc` backend → `backend/dist`, Vite frontend → `frontend/dist` |
| `npm run openapi` | regenerate `docs/openapi.json` |

## Configuration

Copy `.env.example` to `.env` (agent root or `backend/`). `PROVIDERS=mock,amazon,flipkart,serpapi`
selects sources; unconfigured providers are skipped and if none are configured the Mock provider is
used (and reported as sample data at `GET /api/providers`). The frontend uses the Vite proxy in dev;
for a static deploy set `VITE_API_URL` to the API origin.

## Limitations

- Mock data only until keys are added; real adapters (Creators API, Flipkart, SerpApi) are written to
  the documented APIs and unit-tested with stubbed HTTP, but were **not** run against live accounts.
- Price history for real providers needs your own price snapshots (store APIs don't return history):
  the checker records prices for watched items; a production deployment should snapshot on a schedule.
- In-memory queue/cache and a JSON file store: swap in Redis/BullMQ and Postgres for multi-instance deploys.
- Push delivery (Web Push / FCM) is a stub; in-app SSE alerts are live.
- Single demo user (`x-user-id` header, default `demo`); add real auth before production.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md), [docs/PROVIDERS.md](docs/PROVIDERS.md).
