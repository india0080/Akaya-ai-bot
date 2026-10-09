# Future messages

Write a message or post now and have it sent automatically later on one or more channels (birthday wishes, follow-ups,
social posts), with repeat, time zone, per-platform preview and a Scheduled/Sending/Sent/Failed queue.

## Code

| Path | What |
|---|---|
| `app/src/screens/FutureMessages.tsx`, `app/src/screens/future/` | Queue, composer, per-platform preview |
| `app/src/future/` | Channels, time zones, simulated send engine, scheduler hook |
| `app/src/native/notify.ts` | Capacitor Local Notifications |
| `services/future-message/` | Backend scheduler service: queue (BullMQ or in-memory), channel adapters, OpenAPI, tests |
| `app/src/state/store.tsx` | `scheduleMessage`, `cancelMessage`; `state.future` |
| `app/src/state/types.ts` | `FutureMessage` type |
| `app/src/screens/onboarding/Slides.tsx` | `SlideFuture` |
| `app/src/App.tsx` | Route `/future` |

## Status

In the app, sending is simulated (demo mode) and a local notification fires at the time. The backend service has real
API adapters (WhatsApp Cloud, Telegram, Gmail, Graph, Slack, Meta, X, LinkedIn, YouTube, TikTok…), but they have not been run
against live accounts. Personal WhatsApp, Signal and SMS have no API, so they use a reminder plus a one-tap pre-filled send.
See `services/future-message/docs/CHANNELS.md`.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
