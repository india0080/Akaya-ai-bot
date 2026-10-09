# Reminders and Today

Reminders you can set by typing, talking or chatting in Hindi, Hinglish or English, with priorities, repeats, several
alerts, snooze, smart follow-ups and Android notifications that work when Akaya is closed. Home's **Today** slider
summarises reminders and the rest of the day.

## What it does

- **Natural language**: "Hey Akaya, कल सुबह 10 बजे मीटिंग याद दिलाना" → *Meeting*, tomorrow 10:00 AM IST. Works from the
  composer (type or mic), the chat ("remind me to…", "…yaad dilana") and the Voice screen; Hindi input gets a Hindi reply.
- **Priority**: Urgent / High / Normal / Low with colours and sorting. Urgent uses a louder notification channel and
  stays on screen (ongoing) until you act.
- **Alerts**: several per reminder (1 week, 3 days, 1 day, 1 hour, 30/15/10 min before, at time, or custom minutes).
- **Snooze** 5 / 10 / 15 / 30 min in the app; **Snooze 10m** from the notification.
- **States**: Done, Pending, Reschedule (quick slots or a date/time picker). Repeats roll to the next occurrence when done.
- **Missed + smart follow-up**: past-due reminders move to *Missed* after 15 min, with a suggested follow-up time
  (urgent +15 min, high +1 h, otherwise later today or tomorrow 10 AM). Optional auto follow-up in the dashboard.
- **Repeat**: daily, weekly (pick weekdays), monthly, yearly or every N days.
- **Categories**: Health & Medicine, Family & Baby Care, Personal Routine, Finance, Work & Business, Important Dates,
  Maintenance, each with an icon and four quick-add templates (plus General for anything else).
- **Dashboard** (`/reminders`): Upcoming / Completed / Missed tabs with counts, category and priority filters, search,
  sort by time or priority. **Edit**, **Delete with Undo**, and **duplicate prevention** (similar title within 2 h, or same
  title the same day) with *Merge* / *Keep both*.
- **Notification demo**: More → Reminders → bell shows every notification state and can fire a real test alert in 10 s.
- **Home Today slider**: snap cards with dots for Reminders, Calendar, Follow-ups, Medicine & water, Bills & EMI,
  Birthdays & dates, Habits streak, Future Messages and Missed; each opens its filtered view.

## Code

| Path | What |
|---|---|
| `packages/reminders/` | All domain logic + parser (pure TS, unit-tested): see its [README](../../packages/reminders/README.md) |
| `app/src/features/reminders/state.ts` | Store actions (`addReminder`, `completeReminder`, `snoozeReminder`, `mergeReminder`…) + migration from the old Today items |
| `app/src/features/reminders/ReminderProvider.tsx` | `useReminders()`: compose, open detail, create with duplicate check, add with Undo; renders the sheets |
| `app/src/features/reminders/RemindersScreen.tsx` | Dashboard |
| `app/src/features/reminders/Composer.tsx`, `Detail.tsx`, `DuplicateSheet.tsx`, `AlertBanner.tsx`, `NotificationDemo.tsx`, `ChatCard.tsx` | UI pieces |
| `app/src/features/reminders/notify.ts`, `useReminderEngine.ts` | Notification channels + Done / Snooze 10m / Reschedule actions, scheduling diff, missed roll-over, in-app alerts |
| `app/src/features/reminders/fromText.ts` | Chat / voice text → draft + reply |
| `app/src/native/notify.ts` | Shared Capacitor Local Notifications wrapper (also used by Future Message) |
| `app/src/screens/home/TodaySlider.tsx`, `todayCards.ts`, `SnapSlider.tsx` | Home Today slider (SnapSlider is shared with the *Do more* slider) |
| `app/src/screens/sheets/TodaySheet.tsx` | Calendar events and follow-ups |

## Android

Capacitor Local Notifications with two channels (`reminders`, `reminders-urgent`) and action buttons **Done**,
**Snooze 10m** and **Reschedule**. Alarms are exact when the user has allowed *Alarms & reminders* (Android 12+; the demo
sheet has an *Allow exact alarms* button), otherwise inexact. Notifications fire with the app closed and survive reboot.
Tapping an action opens Akaya, which applies it (cold start included).

## Status

All seeded reminders are sample data, labelled *Sample*. Data is stored on the device only (no sync). Calendar events
and follow-ups in Today are sample data. The web build alerts while the tab is open; real background alerts need the
Android app.
