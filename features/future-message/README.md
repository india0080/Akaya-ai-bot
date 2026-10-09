# Future messages

Write a message now and schedule it to send later (birthday wishes, follow-ups).

## Code

| Path | What |
|---|---|
| `app/src/screens/FutureMessages.tsx` | Compose, schedule and cancel UI (sample contacts) |
| `app/src/state/store.tsx` | `scheduleMessage`, `cancelMessage`; `state.future` |
| `app/src/state/types.ts` | `FutureMessage` type |
| `app/src/screens/onboarding/Slides.tsx` | `SlideFuture` |
| `app/src/App.tsx` | Route `/future` |

## Status

Scheduling is local to the device and nothing is actually sent. Real sending needs the backend scheduler plus the integrations (WhatsApp, SMS or email), with explicit user confirmation.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
