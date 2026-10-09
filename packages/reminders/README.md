# @akaya/reminders

Pure TypeScript domain logic for Akaya reminders. No React and no I/O, so it is unit-tested here and reused by the app
(and by any service that needs it). IST (`Asia/Kolkata`) by default; time-zone maths comes from [`@akaya/tz`](../tz).

| File | What |
|---|---|
| `src/types.ts` | `Reminder`, `Priority` (urgent / high / normal / low), `CategoryId`, `Repeat`, `ReminderStatus`, `ReminderView` |
| `src/categories.ts` | 7 categories + General (icon, tone, keywords, 4 quick-add templates each), priority colours and rank, alert presets, `SNOOZE_MINUTES` (5 / 10 / 15 / 30) |
| `src/parse.ts` | `parseReminder(text, { now, tz })`: Hindi (Devanagari), Hinglish and English natural language → title, due time, repeat, priority, category. `isReminderRequest(text)` for chat/voice routing |
| `src/logic.ts` | Views (upcoming / completed / missed), sorting, next occurrence for repeats (daily, weekly + weekdays, monthly, yearly, every N days), alert times, snooze, reschedule, complete (rolls repeats), missed + smart follow-up suggestion, fuzzy duplicate detection + merge, filters/search, streaks, template due times |
| `src/dates.ts` | Small calendar helpers on `YYYY-MM-DD` strings |

```ts
import { parseReminder } from '@akaya/reminders';
parseReminder('Hey Akaya, कल सुबह 10 बजे मीटिंग याद दिलाना', { now: Date.now() });
// → { title: 'Meeting', due: <tomorrow 10:00 IST>, repeat: { kind: 'none' }, priority: 'normal', category: 'work', … }
parseReminder('har mahine 5 tarikh ko credit card bill, urgent', { now: Date.now() });
// → monthly on the 5th, priority 'urgent', category 'finance'
```

Parser rules worth knowing: a bare number is only a time when it is marked (`at`, `am/pm`, `baje`, `बजे`, `:`) or next
to a part of day (`subah`, `शाम`, `raat`, `tonight`); 1–6 o'clock without a part of day means PM; `raat 2 baje` is 2 AM;
`sadhe / sava / paune / dedh / dhai` fractions are understood; a time that has already passed today rolls to tomorrow
unless a day was given.

```bash
npm run build -w @akaya/reminders   # dist/ (also run by the root postinstall)
npm test -w @akaya/reminders        # vitest: parser + logic
```

The UI, state actions and Android notifications live in [`app/src/features/reminders`](../../app/src/features/reminders);
see [`features/reminders/README.md`](../../features/reminders/README.md).
