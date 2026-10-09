# API: Akaya Shopping Agent

Base URL `http://localhost:8787`. Interactive docs (Swagger UI): **`/docs`**; raw spec: `/docs/json`
(also committed as [`openapi.json`](openapi.json); regenerate with `npm run openapi`).

- Bodies, params and queries are validated with **zod**; invalid input → `400 FST_ERR_VALIDATION`.
- User: header `x-user-id` (default `demo`). Replace with real auth in production.
- Rate limits: `RATE_LIMIT_PER_MINUTE` (default 600/min per IP) and `SEARCH_RATE_LIMIT_PER_MINUTE`
  (default 60/min) on `POST /api/search` → `429` with `retry-after`.
- Mock results carry `"sample": true`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness, active providers, queue + cache stats |
| GET | `/api/providers` | every provider: `configured`, `active`, `sampleData`, `setupHint` |
| GET | `/api/stores` | known stores (name, colour) |
| POST | `/api/parse` | parse a natural-language query → `{q, filters, hints, lang}` |
| POST | `/api/search` | start a search job → `202 {id, status}` (`200` with result on cache hit or `wait:true`) |
| GET | `/api/jobs/{id}` | job status, progress, result |
| GET | `/api/jobs/{id}/events` | **SSE** `progress` (per store) · `status` · `done` |
| GET | `/api/searches/recent` | recent searches for the user |
| GET | `/api/products/{key}` | product with ranked offers from every store |
| GET | `/api/products/{key}/history?days=90` | price series per store, stats, buy-now verdict |
| POST | `/api/compare` | `{keys:[2..4]}` → comparison rows + winner |
| GET | `/api/watchlist` | watched items |
| POST | `/api/watchlist` | `{offerId | productKey, targetPrice?, anyDrop?}` → `201` |
| PATCH | `/api/watchlist/{id}` | `{targetPrice?: number|null, anyDrop?}` |
| DELETE | `/api/watchlist/{id}` | `204` |
| POST | `/api/watchlist/check` | run the price checker now (also runs every `PRICE_CHECK_INTERVAL_MS`) |
| GET | `/api/notifications` | in-app notifications |
| POST | `/api/notifications/read` | `{id?}` (all when omitted) |
| GET | `/api/notifications/stream?user=demo` | **SSE** `notification` events |
| POST | `/api/notifications/subscribe` | `{kind:"webpush"|"fcm", token}` (delivery is a stub until keys are set) |
| POST | `/api/notifications/test` | send a test notification |

## Examples

```bash
# Parse Hinglish
curl -s localhost:8787/api/parse -H 'content-type: application/json' \
  -d '{"query":"1500 se kam ka basta, jaldi chahiye"}'
# → {"q":"school bag","filters":{"maxPrice":1500,"maxDeliveryDays":2},"hints":["fastest"],"lang":"hinglish",…}

# Search and wait for the result in one call
curl -s localhost:8787/api/search -H 'content-type: application/json' \
  -d '{"query":"wireless earbuds under 3000","preset":"balanced","sort":"relevance","wait":true}'

# Async: start, then stream progress
JOB=$(curl -s localhost:8787/api/search -H 'content-type: application/json' -d '{"query":"running shoes"}' | jq -r .id)
curl -N localhost:8787/api/jobs/$JOB/events
# event: progress  data: {"provider":"mock","store":"amazon","status":"done","count":6}
# event: done      data: {"status":"done","result":{…}}

# Filters (explicit filters override what the parser found)
curl -s localhost:8787/api/search -H 'content-type: application/json' -d '{
  "query":"earbuds","wait":true,
  "filters":{"maxPrice":2500,"minRating":4,"stores":["amazon","flipkart"],"hideHighFakeRisk":true},
  "sort":"price_asc"}'

curl -s localhost:8787/api/products/noise-buds-vs104
curl -s 'localhost:8787/api/products/noise-buds-vs104/history?days=90'
curl -s localhost:8787/api/compare -H 'content-type: application/json' -d '{"keys":["noise-buds-vs104","oneplus-nord-buds-2r"]}'

# Watch + alert
curl -s localhost:8787/api/watchlist -H 'content-type: application/json' -d '{"productKey":"noise-buds-vs104","targetPrice":849}'
curl -N localhost:8787/api/notifications/stream &      # live alerts
curl -s -X POST localhost:8787/api/watchlist/check -H 'content-type: application/json' -d '{}'
```

## Key shapes

`ProductResult`: `{ key, title, brand, category, emoji, rank, score, badges[], best: RankedOffer, offers: RankedOffer[], priceRange: [min,max], sample }`

`RankedOffer` = `Offer` + `{ score, breakdown{price,rating,reviews,trust,delivery,fakePenalty}, fakeRisk{score,level,signals[]}, discountPct, affiliateUrl }`

`Offer`: `{ id, productKey, store, storeName, title, brand, price, mrp, currency:"INR", rating, ratingCount, reviewCount, histogram?[5★..1★], verifiedShare?, recentShare?, seller{name,rating?,years?,fulfilled?}, delivery{days,free,cod?}, inStock, url, specs, source, sample }`

Full schemas are in the OpenAPI spec.
