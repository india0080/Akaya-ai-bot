# link-redirect

Short-link + click-tracking service for affiliate / UTM links: `go.akaya.one/go/:id` (placeholder domain).
Links are built by [`@akaya/affiliate`](../../packages/affiliate/README.md), the same code the app and agents use.
Fastify + zod, JSON-file store (Postgres in production), OpenAPI in `openapi.yaml`.

| Route | Auth | What |
|---|---|---|
| `GET /go/:id` | public | Logs a click (platform, campaign, salted anonymous id, time) and 302s to the tracked URL |
| `POST /links` | Bearer `ADMIN_TOKEN` | Create, or reuse, a short link for `{ platform, intent, params, campaign, content }` |
| `GET /links/:id` | Bearer | Link + click count |
| `GET /imports` | Bearer | Report sources (Amazon Associates, Admitad, Cuelinks, Travelpayouts, Booking.com) and the CSV each expects |
| `POST /imports/:source` | Bearer | Upload a network CSV export (`Content-Type: text/csv`) → orders + commission |
| `POST /imports/:source/sync` | Bearer | Pull from the network's reporting API (**stubs: 501** until implemented and keyed) |
| `GET /reports?from&to&platform` | Bearer | Clicks (from the redirect log) + imported orders / commission per platform, IST dates |
| `GET /healthz`, `GET /openapi.yaml` | public | Health, spec |

```bash
cp .env.example .env      # set ADMIN_TOKEN and ANON_SALT (16+ chars each); affiliate IDs are optional
npm run dev -w @akaya/link-redirect     # http://localhost:8790
npm test -w @akaya/link-redirect
```

A click record holds the link id, platform, campaign, time and an HMAC of the `x-akaya-anon` header (or `?u=`) keyed
with `ANON_SALT`, not the raw value. Request logging is Fastify's default; review it before deploying. Programme rules, disclosure and env vars: [`docs/AFFILIATE.md`](../../docs/AFFILIATE.md).

**Status:** tested with vitest only, not deployed. The app currently opens tracked links directly and does not call this
service yet; Amazon links should stay direct (see the Amazon rules in `docs/AFFILIATE.md`).
