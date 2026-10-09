# Features

Each feature has a README that maps it to its code in `app/`. **Reminders** is a self-contained feature module
(`app/src/features/reminders/` + the `@akaya/reminders` package). The others are still spread across shared state,
routes and onboarding; moving them into `app/src/features/` the same way is a refactor for later (see each README).

| Feature | README |
|---|---|
| Floating | [floating/README.md](floating/README.md) |
| Voice notes | [voice-notes/README.md](voice-notes/README.md) |
| Integrations | [integrations/README.md](integrations/README.md) |
| Future messages | [future-message/README.md](future-message/README.md) |
| Translate | [translate/README.md](translate/README.md) |
| Reminders and Today | [reminders/README.md](reminders/README.md) |

The shopping and grocery agents are separate apps in [`../agents/`](../agents/README.md).
