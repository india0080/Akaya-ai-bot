# Akaya Future Message service

Schedules a message or social post and **sends it automatically** at the chosen time on one or more channels:
WhatsApp, Telegram, Gmail, Outlook, Slack, Teams, Messenger, Instagram DM, Discord, Instagram, Facebook Pages, X,
LinkedIn, YouTube/Shorts, TikTok, Threads and Pinterest. Personal WhatsApp, Signal and SMS fall back to a one-tap reminder.

> **Status: reference implementation.** Mock sending is the default. The live adapters build the documented API
> requests and are covered by request-shape tests. They have **not** been run against production accounts, and each
> platform needs its own app review, scopes and business verification (see [docs/CHANNELS.md](docs/CHANNELS.md)).

## Honest limits (read this first)

- **Personal WhatsApp has no API.** No official way exists to send from a personal WhatsApp account. At send time the
  service pushes a reminder, and tapping it opens WhatsApp with the text pre-filled (`https://wa.me/<number>?text=…`).
  The user still taps **Send**. The message status becomes `needs-tap`. Signal and SMS work the same way.
- **WhatsApp Business (Cloud API)** sends automatically, but outside the 24-hour customer-service window only an
  **approved template** may be sent. The adapter uses the template `akaya_scheduled_message`, with the text as `{{1}}`.
- **Messenger / Instagram DM / Facebook / Instagram** need a Facebook Page or Instagram professional account; personal
  profiles can't be posted to.
- **TikTok:** apps that haven't passed TikTok's audit can only post `SELF_ONLY` (private) videos. That is the default.
- **X** needs a paid API tier. Video upload isn't implemented in the X or LinkedIn adapters (images are).
- **Slack** messages are handed to Slack's own `chat.scheduleMessage` at schedule time (up to 120 days ahead), so they
  send even if this service is down. Cancelling removes them from Slack too.

## Architecture

```
POST /v1/messages ─► Scheduler.validate ─► MessageStore (Postgres in prod; MemoryStore in dev)
                                         └─► JobQueue.enqueue(id, sendAt)   (BullMQ delayed job | in-memory timers)
            due ─► Scheduler.process(id) ─► per channel: SenderAdapter.send(msg, {creds, fetch})
                                              ├─ ok → sent / needs-tap
                                              ├─ retryable (429/5xx/network) → backoff 1 m, 5 m, 15 m (3 attempts)
                                              └─ permanent (401/400/not connected) → failed (manual retry)
                     message status = rollup: sent | partial | failed | needs-tap
                     repeat (daily/weekly/monthly/yearly) → next instance at the same wall-clock time in the user's zone
```

- `src/adapters/types.ts` defines the `SenderAdapter` interface: `send()`, optional `scheduleNative()` / `cancelNative()`.
- `src/adapters/chat.ts` and `social.ts` hold the real adapters. `mock.ts` logs only: text containing `#fail` fails once,
  which exercises the retry path. `reminder.ts` is the tap fallback.
- `src/credentials.ts` provides `EnvCredentials` (dev only). In production, implement `CredentialProvider` over per-user
  OAuth tokens stored encrypted (`schema.sql` → `channel_credentials`) and refresh them before expiry.
- Time zones: `src/tz.ts` is pure `Intl`, DST-safe. Monthly on the 31st clamps to the end of the month. A yearly
  message on 29 Feb goes out on 28 Feb in non-leap years.

## Run

```bash
cp .env.example .env    # set API_TOKEN; keep SENDER_MODE=mock until channels are configured
npm install
npm test                # 35 tests: scheduler, adapters (request shapes), HTTP API, time zones
npm run dev             # http://localhost:8789  (QUEUE=bullmq + REDIS_URL for Redis)
```

```bash
curl -X POST localhost:8789/v1/messages \
  -H "Authorization: Bearer $API_TOKEN" -H "X-User-Id: demo" -H "Content-Type: application/json" \
  -d '{"channels":["gmail","whatsapp"],"to":"Priya","targets":{"whatsapp":"+919800000001"},
       "text":"Happy birthday Priya! 🎂","sendAt":"2026-10-10T00:00:00+05:30","timezone":"Asia/Kolkata","repeat":"yearly"}'
```

API: [openapi.yaml](openapi.yaml) (also served at `GET /openapi.yaml`). Endpoints: `POST/GET /v1/messages`,
`GET/PATCH/DELETE /v1/messages/{id}`, `POST /v1/messages/{id}/retry`, `POST /v1/messages/{id}/send-now`,
`GET /v1/channels`, `GET /healthz`.

`X-User-Id` is trusted as given. Put the service behind your gateway, which verifies the user's session and sets the header.

## The app (APK) today

The Akaya app's Future Message screen currently runs in **demo mode**. It schedules on the device, shows the
Scheduled → Sending → Sent / Failed flow with simulated sending, and fires Android local notifications. Nothing leaves the
phone. To go live, the app should call this service and register an FCM token for the `needs-tap` reminders.
