# API: Akaya Grocery Agent

Base URL `http://localhost:8788` · Swagger UI `/docs` · OpenAPI JSON `/docs/json` (also `docs/openapi.json`).
Identify the user with `x-user-id` (defaults to `demo`). All responses from Mock carry `sample: true`.
Rate limits: 600 requests/min per IP overall and 60 quotes/min (configurable).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | health, queue and cache stats |
| GET | `/api/providers` | per store: active provider (mock / partner / playwright), sample flag, setup hints |
| GET | `/api/stores` | store metadata (name, colour, app deep link, website) |
| POST | `/api/parse` | `{text}` → `{items[], unknown[], lang}` |
| POST | `/api/quotes` | `{text? , items?, budget?, pincode?, stores?, wait?}` → job (202) or finished job (200 with `wait: true`) |
| GET | `/api/quotes/{id}` | quote: items, per-store quotes, plans, recommended, splitNote, budgetTips |
| GET | `/api/jobs/{id}` | job status + progress |
| GET | `/api/jobs/{id}/events` | **SSE**: `progress` events, then `done` |
| POST | `/api/checkouts` | `{quoteId, planId, overrides?[], removed?[]}` → fills cart(s); no payment |
| GET | `/api/checkouts` · `/api/checkouts/{id}` | checkout + cart statuses |
| POST | `/api/checkouts/{id}/carts/{store}/handoff` | user confirmed → `{appUrl, webUrl, amount, steps, note}` |
| POST | `/api/checkouts/{id}/carts/{store}/paid` | `{userConfirmed: true}`; 409 unless handed off first → creates order |
| POST | `/api/checkouts/{id}/cancel` | `{store?}` |
| GET | `/api/orders` · `/api/orders/{id}` | orders with tracking stages (simulated for Mock) |
| GET/POST | `/api/lists` | saved lists (`name, text, emoji?, budget?, schedule?`) |
| PATCH/DELETE | `/api/lists/{id}` | update / delete |
| POST | `/api/lists/{id}/run` | quote now; `{autoFill?}` fills the cart (still never pays) |
| GET/PATCH | `/api/settings` | `pincode, address, budget, stores[], strategy` |
| GET | `/api/notifications` | in-app notifications |
| POST | `/api/notifications/read` | `{id?}` (all when omitted) |
| GET | `/api/notifications/stream` | **SSE**: `notification` events |
| POST | `/api/notifications/subscribe` | `{kind: webpush|fcm, token}` (delivery stub) |
| POST | `/api/notifications/test` | send a test notification |

## Examples

```bash
API=http://localhost:8788

# Parse Hinglish
curl -s -XPOST $API/api/parse -H 'content-type: application/json' \
  -d '{"text":"aadha kilo pyaz aur ek darjan ande, sarson ka tel"}'
# → {"items":[{"key":"onion","qty":500,"unit":"g","display":"500 g",…},{"key":"eggs","qty":12,"display":"1 dozen",…},
#             {"key":"oil","variant":"Mustard",…}],"unknown":[],"lang":"hinglish"}

# Compare and wait
curl -s -XPOST $API/api/quotes -H 'content-type: application/json' \
  -d '{"text":"2 kg aata, 1 L Amul milk, 6 eggs","budget":500,"wait":true}'

# Async with live progress
JOB=$(curl -s -XPOST $API/api/quotes -H 'content-type: application/json' -d '{"text":"1 kg toor dal, 200 g paneer"}' | jq -r .id)
curl -N $API/api/jobs/$JOB/events
# event: progress  data: {"store":"zepto","status":"done","found":2,"etaLabel":"10 min"}
# event: done      data: {"status":"done","result":{"id":"…","plans":[…]}}

# Fill the recommended plan, then follow the user's confirmation steps
curl -s -XPOST $API/api/checkouts -H 'content-type: application/json' -d "{\"quoteId\":\"$QUOTE_ID\",\"planId\":\"$PLAN_ID\"}"
curl -s -XPOST $API/api/checkouts/$CHECKOUT/carts/zepto/handoff          # user tapped "Confirm & pay in Zepto"
curl -s -XPOST $API/api/checkouts/$CHECKOUT/carts/zepto/paid -H 'content-type: application/json' -d '{"userConfirmed":true}'

# Saved list with a weekly schedule (Saturday 9:00 AM IST, fill cart, then ask the user to pay)
curl -s -XPOST $API/api/lists -H 'content-type: application/json' -d '{"name":"Weekly staples","text":"2 kg aata, 1 L milk",
  "budget":900,"schedule":{"enabled":true,"days":[6],"time":"09:00","strategy":"cheapest","autoFill":true}}'
```

## Key shapes

- **Plan** `{id, strategy: cheapest|fastest|split|balanced, label, parts[{store, lines[], subtotal, fees, total, etaLabel}], total, fees, etaMin, etaLabel, missing[], substitutions, savingsVsMax, overBudget, why}`
- **Line** `{itemId, store, sku{name, brand, sizeLabel, price, mrp, inStock}, packs, price, substitution?{reason, wanted}, alternatives[{sku, packs, price}]}`
- **Cart status** `filling → ready | partial → handed_off → paid_by_user`, or `cancelled` / `expired` / `failed`
- **Notification kinds** `ready_to_pay`, `order`, `list_ready`, `test`

Errors: `{error}` with 400 (validation), 404, 409 (wrong state, e.g. paid before hand-off, expired hold), 429 (rate limit).
