# Affiliate links, deep links and UTM

Akaya opens stores, travel sites, food and grocery apps, rides and messaging apps for the user. Every one of those
links comes from **one place**: [`@akaya/affiliate`](../packages/affiliate/README.md). It builds the link, opens the native
app when it is installed (deep link) and otherwise the website, adds an affiliate ID when one is configured, and always
adds UTM tags. The app, the shopping and grocery agents and [`services/link-redirect`](../services/link-redirect/README.md)
all call the same `buildLink()`; none of them keeps its own copy of a store URL format.

> **Status:** no affiliate account is connected. Every ID below is empty in the repo, so all links are plain links
> with UTM tags only. Earnings shown in the app are **sample data**. Nothing here is legal advice; read each
> programme's current terms before going live, because they change.

## How a link is built

```
buildLink({ platform: 'booking', intent: 'search', params: { q: 'Goa', checkin, checkout }, campaign: 'travel', env })
  → { webUrl, appUrl?, androidPackage?, trackedUrl, affiliate: { active, via, param }, utm }
```

1. **Platform registry** (`packages/affiliate/src/platforms.ts`): web URL templates per intent (search, product,
   hotel, flight, restaurant, ride, chat…), the Android package and app scheme, and the affiliate programme.
2. **Affiliate**: a direct programme parameter (`tag=` for Amazon, `affid=` for Flipkart, `aid=` for Booking.com,
   `cid=` for Agoda…) or, when the platform has no direct programme, a network wrapper (Cuelinks, Admitad,
   EarnKaro, CJ, Travelpayouts, Impact) from `networks.ts`. Direct programme wins. If nothing is configured the
   link is left untouched and `affiliate.active` is `false`.
3. **UTM** (`utm.ts`): `utm_source=akaya`, `utm_medium=app`, `utm_campaign` (e.g. `travel`, `deals`, `chat`) and an
   optional `utm_content`. Non-http links (`uber:`, `sgnl:`, `sms:`) are never modified.
4. **Disclosure** (`disclosure.ts`): when `needsDisclosure(links)` is true the UI must show the short line
   *"Akaya may earn a commission"* next to the buttons (Hindi copy included), and the long copy on the screen.
   Amazon links add the Associates statement automatically.
5. **Messaging** (`message.ts`): WhatsApp, Signal and SMS links are pre-filled send links. They never carry
   affiliate or UTM parameters.

Where it is used:

| Caller | What it does |
|---|---|
| `app/src/commerce/links.ts` | Reads `VITE_AFF_*` into the shared env once; `LinkCard` / `LinkParts` render buttons + disclosure |
| `app/src/commerce/chatIntent.ts` | Chat intent card ("order biryani on Swiggy", "hotels in Goa") via `detectIntent()` |
| `app/src/screens/Travel.tsx`, `Shopping.tsx` (Deals), `Earnings.tsx` | Travel & Stays, Deals, sample earnings dashboard |
| `agents/shopping-agent/backend/src/engine/affiliate.ts` | "Buy on X" links in shopping results |
| `agents/grocery-agent` | Store hand-off links (cart is filled, the user pays in the store app) |
| `services/link-redirect` | Short links `go.akaya.one/go/:id` with click logging, report imports, `/reports` |

## Programmes and how to sign up

| Platform(s) | Programme | Env var(s) | Sign up |
|---|---|---|---|
| Amazon (IN, US, UK, DE, CA, AE, JP), Amazon Fresh | Amazon Associates, one account **per marketplace** | `AMAZON_TAG_IN`, `AMAZON_TAG_US`, … | affiliate-program.amazon.in (and the other marketplaces) |
| Flipkart | Flipkart Affiliate | `FLIPKART_AFFILIATE_ID` | affiliate.flipkart.com (check it is accepting new sign-ups) |
| Booking.com | Booking.com Affiliate Partner Programme | `BOOKING_AID` | booking.com/affiliate-program |
| Agoda | Agoda Partners | `AGODA_CID` | partners.agoda.com |
| Klook | Klook Affiliate (or via Travelpayouts) | `KLOOK_AID` | affiliate.klook.com |
| GetYourGuide | GetYourGuide Partner (or via Travelpayouts) | `GETYOURGUIDE_PARTNER_ID` | partner.getyourguide.com |
| Expedia, Hotels.com | Expedia Group (via CJ or Impact) | `CJ_PID`, `IMPACT_BASE_EXPEDIA`, `IMPACT_BASE_HOTELS_COM` | cj.com / impact.com |
| Skyscanner | Impact or Travelpayouts | `IMPACT_BASE_SKYSCANNER`, `TRAVELPAYOUTS_P_SKYSCANNER` | impact.com / travelpayouts.com |
| Aviasales, Tripadvisor | Travelpayouts (Tripadvisor also CJ) | `TRAVELPAYOUTS_MARKER`, `TRAVELPAYOUTS_TRS`, `TRAVELPAYOUTS_P_<PLATFORM>` | travelpayouts.com |
| MakeMyTrip, Goibibo, Cleartrip | Via Cuelinks / Admitad | `CUELINKS_CID`, `ADMITAD_CODE_<PLATFORM>` | cuelinks.com / admitad.com |
| Myntra, AJIO, Nykaa, Croma, Tata CLiQ, Meesho, Reliance Digital, BigBasket | Via Cuelinks / Admitad / EarnKaro | `CUELINKS_CID`, `ADMITAD_CODE_<PLATFORM>`, `EARNKARO_LINK_TEMPLATE` | cuelinks.com / admitad.com / earnkaro.com |
| Swiggy, Zomato, Instamart, Blinkit, Zepto, Uber, Ola | No public programme wired; links get UTM only | none | — |
| WhatsApp, Signal, SMS | Messaging; never tagged | none | — |

`<PLATFORM>` is the upper-snake platform id (`ADMITAD_CODE_MAKEMYTRIP`, `TRAVELPAYOUTS_P_AVIASALES`).
`EARNKARO_LINK_TEMPLATE` is the link template EarnKaro gives you, with `{url}` (encoded) or `{rawurl}` where the
merchant URL goes. `IMPACT_BASE_*` is the per-brand tracking base Impact gives you (`https://brand.pxf.io/c/…`).
Network link formats follow each network's documented deep-link syntax; confirm them in your dashboard before launch.

## Programme rules to plan for

- **Amazon Associates: 3 qualifying sales in 180 days.** A new Associates account is reviewed after it refers its
  first qualifying sales and is **closed if it does not make 3 qualifying sales within 180 days** of sign-up. Apply
  close to launch, not months before.
- **Amazon: links and statements.** Show *"As an Amazon Associate, Akaya earns from qualifying purchases."* (done by
  `disclosureText({ style: 'long', platforms })`). Do not hide that a link goes to Amazon: send Amazon buttons straight
  to the tagged Amazon URL rather than through a third-party short link, and do not show Amazon prices unless they
  come from Amazon's Product Advertising API / Creators API. Amazon's Operating Agreement restricts Special Links in some
  places (for example emails and offline); get Amazon's written confirmation that in-app links are allowed.
- **Never fake prices or urgency.** Deal cards in the app are sample data and labelled `Sample`. Real prices must come from
  the store or network feed, with a timestamp.
- **No incentivised clicks.** Programmes forbid rewarding users for clicking or buying through a link, and forbid
  self-purchases through your own links.
- **Network approval is per merchant.** Being accepted by Cuelinks, Admitad or Travelpayouts does not approve you for
  every brand on it; each brand (`ADMITAD_CODE_<PLATFORM>`, `TRAVELPAYOUTS_P_<PLATFORM>`) is a separate application.
- **Cookie windows are short** (often 24 hours for retail) and some categories pay nothing. Check each programme's
  commission table; the app never promises the user anything about them.

## Disclosure (FTC and ASCI)

- **USA, FTC** (Guides Concerning the Use of Endorsements and Testimonials in Advertising, 16 CFR Part 255): a material
  connection, such as earning a commission, must be disclosed clearly and conspicuously, close to the recommendation,
  before the click. A link in a footer or a separate page is not enough.
- **India, ASCI** (Guidelines for Influencer Advertising in Digital Media) and the Department of Consumer Affairs
  endorsement guidelines: disclose material connections in a way the user cannot miss, in the language of the content.
- **What Akaya does:** every button whose platform can earn shows the short line next to it (`hasProgramme()` /
  `needsDisclosure()`). In the app the chat intent card, Travel & Stays and Deals all render the one `Disclosure`
  component in `app/src/commerce/LinkParts.tsx`; the shopping agent uses the same `disclosureText()` (short line on
  the product, long copy with the Amazon statement in More). Hindi copy exists (`disclosureText({ lang: 'hi' })`) but
  the UI shows English today. Akaya never auto-pays: the store app handles prices, availability and payment.

## Environment variables

All IDs are optional. Empty = plain link + UTM. Never commit real values; `.env` files are git-ignored.

| Where | Prefix | Example |
|---|---|---|
| `app/.env` (Vite build, IDs end up in the client bundle; they are public anyway once a link is clicked) | `VITE_AFF_` | `VITE_AFF_BOOKING_AID=1234567` |
| `agents/shopping-agent/.env` | none | `AMAZON_TAG_IN=yourtag-21` |
| `services/link-redirect/.env` | none | `CUELINKS_CID=12345` |

The full list is generated from the registry, so `.env.example` files cannot drift:

```bash
node packages/affiliate/scripts/env-block.mjs            # plain names (agents, services)
node packages/affiliate/scripts/env-block.mjs VITE_AFF_   # app
```

`services/link-redirect` also needs `ADMIN_TOKEN` and `ANON_SALT` (16+ characters each), `PUBLIC_BASE_URL`
(`https://go.akaya.one` is a placeholder domain) and, for report sync, the network API keys listed by `GET /imports`
(`ADMITAD_CLIENT_ID`, `ADMITAD_CLIENT_SECRET`, `CUELINKS_API_KEY`, `TRAVELPAYOUTS_API_TOKEN`, `BOOKING_API_USERNAME`,
`BOOKING_API_PASSWORD`). The API sync adapters are stubs that answer 501; CSV import works.

## Adding a platform

1. Add it to `PLATFORMS` in `packages/affiliate/src/platforms.ts` (URL templates, Android package / scheme, programme).
2. Add a test case in `packages/affiliate/test/build.test.ts`.
3. Regenerate the `.env.example` blocks with `env-block.mjs`.
4. `npm run build -w @akaya/affiliate && npm test -w @akaya/affiliate`.

Nothing else changes: the app, agents and redirect service pick it up from the registry.
