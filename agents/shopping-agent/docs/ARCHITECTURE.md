# Architecture: Akaya Shopping Agent

## Overview

```mermaid
flowchart LR
  subgraph UI["frontend (React + Vite)"]
    Home[Search / voice] --> Results
    Results --> Product
    Product --> Watch[Watchlist]
    Alerts
  end
  subgraph API["backend (Fastify + zod)"]
    R[routes] --> S[SearchService]
    S --> Q[JobQueue]
    S --> C[(TTL cache)]
    Q --> P{Provider adapters}
    P --> M[Mock · sample data]
    P --> A[Amazon Creators API]
    P --> F[Flipkart Affiliate API]
    P --> G[SerpApi Google Shopping]
    P -.off by default.-> B[Browser fallback · Playwright]
    S --> E[Engine: parse → rank → group → badge → filter → sort]
    R --> W[WatchlistService]
    W --> N[NotificationService]
    N --> SSE[(SSE in-app)]
    N -.stub.-> Push[Web Push / FCM]
    W & N --> DB[(JSON store)]
  end
  UI -- REST /api --> R
  UI -- SSE /api/jobs/:id/events --> R
  UI -- SSE /api/notifications/stream --> N
  Product -- "Buy on X (affiliate link)" --> Store[(Store website / app)]
```

The agent **never** places orders: the only path to a purchase is the user opening the store link.

## Search flow

```mermaid
sequenceDiagram
  participant U as UI
  participant API as /api/search
  participant S as SearchService
  participant Q as JobQueue
  participant P as Providers
  U->>API: POST {query:"1500 se kam ka basta", filters?, sort?, preset?}
  API->>S: parseQuery → {q:"school bag", maxPrice:1500, hints:[fastest]}
  alt cache hit (same providers + q)
    S-->>API: finished job (cached: true)
  else miss
    S->>Q: enqueue("search")
    API-->>U: 202 {jobId}
    U->>API: GET /api/jobs/:id/events (SSE)
    Q->>P: fan out (Promise.allSettled)
    P-->>U: progress {store, status, count} …
    P-->>S: offers
    S->>S: cache raw offers (TTL)
  end
  S->>S: rankOffers → groupProducts → assignBadges → applyFilters → sortProducts
  S-->>U: done {products, providers, sample}
```

Raw offers are cached rather than ranked results, so changing filters, sort or preset re-ranks
instantly without calling paid APIs again.

## Ranking

For each offer (weights per preset, Balanced shown):

| Signal | Normalisation | Balanced weight |
| --- | --- | --- |
| Price | `(minPrice / price)^0.7` across all offers | 0.30 |
| Rating | Bayesian average (prior 3.8, C = 200), mapped 3–5 → 0–1 | 0.24 |
| Delivery | 1 day → 1.0, 10 days → 0 | 0.18 |
| Seller trust | seller rating, fulfilled-by-store, years active | 0.16 |
| Review volume | log10(count) / log10(max count) | 0.12 |
| Fake-review risk | penalty `0.3 × risk` | − |
| Out of stock | penalty 0.5 | − |

Products are grouped across stores by product key. A product's score is its best offer's score plus
a small multi-store bonus. Badges go to in-stock offers that aren't high fake-review risk.

## Price alerts

```mermaid
sequenceDiagram
  participant T as Timer (PRICE_CHECK_INTERVAL_MS)
  participant W as WatchlistService
  participant P as Provider.refreshPrice
  participant N as NotificationService
  participant U as UI (SSE)
  T->>W: checkPrices()
  W->>P: current price for each watched offer
  alt price ≤ target, or ≥5% drop with "any drop" on
    W->>N: notify(price_drop)
    N-->>U: event: notification (heads-up banner + Alerts list)
    N-->>N: Web Push / FCM (stub → logs "stub")
  end
```

## Production swaps

| Demo component | Production replacement |
| --- | --- |
| `JobQueue` (in-process) | BullMQ on Redis (`REDIS_URL`), same `enqueue / get / on(jobId)` surface |
| `TtlCache` | Redis with TTL |
| `JsonDb` file | Postgres (users, watch_items, price_snapshots, notifications, push_subscriptions) |
| `x-user-id` header | real auth (Akaya session / JWT) |
| Push stubs | `web-push` with VAPID keys; FCM HTTP v1 with a service account |
| Mock price history | nightly price snapshots for watched + popular products |
