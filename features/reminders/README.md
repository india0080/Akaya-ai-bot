# Reminders and Today

Reminders, events and follow-ups on Home, with a lead-time setting and routines run by agents.

## Code

| Path | What |
|---|---|
| `app/src/screens/home/TodayRow.tsx` | Today row on Home |
| `app/src/screens/sheets/TodaySheet.tsx` | Today sheet: filter, add and complete reminders, events and follow-ups |
| `app/src/state/store.tsx` | `toggleToday`, `addToday` |
| `app/src/state/types.ts` | `TodayItem` (`reminder`, `calendar`, `followup`); `settings.reminderLead` |
| `app/src/screens/sheets/FeatureSheets.tsx` | Agents sheet: Routines, plus the Shopping & grocery tiles |
| `app/src/lib/time.ts` | Time helpers |
| `marketing/videos/reminders-ad.mp4, bubble-alarm-10s.mp4` | Videos |

## Status

Reminders are in-app only. Real alerts need push notifications (FCM) and calendar integration.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
