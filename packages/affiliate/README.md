# @akaya/affiliate

The single source of truth for every outbound link Akaya opens: stores, travel, food, grocery, rides and messaging.
Zero runtime dependencies; works in the browser and in Node.

- `buildLink({ platform, intent, params, campaign, content, env })` → web URL, app deep link / Android package,
  tracked URL (affiliate ID + UTM), `affiliate.active`.
- `PLATFORMS` / `getPlatform()`: the registry (URL templates per intent, Android package, programme).
- `NETWORKS`: Cuelinks, Admitad, EarnKaro, CJ, Travelpayouts and Impact deep-link wrappers.
- `withUtm()`, `disclosureText()`, `needsDisclosure()`, `hasProgramme()`, `detectIntent()` (chat → platform + intent),
  `messageLink()` (WhatsApp / Signal / SMS, never tagged), `summarize()` (earnings reports).
- `affiliateEnvFrom(env, prefix)` and `allEnvVars()`; `scripts/env-block.mjs` prints the `.env.example` block.

Programmes, sign-up, rules and env vars: [`docs/AFFILIATE.md`](../../docs/AFFILIATE.md).

```bash
npm run build -w @akaya/affiliate && npm test -w @akaya/affiliate
```
