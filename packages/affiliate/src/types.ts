/** Public types for @akaya/affiliate. */

export type Category = 'shopping' | 'travel' | 'food' | 'grocery' | 'ride' | 'messaging';
export type Region = 'in' | 'global';

/** What the user wants to do on the platform. Each platform supports a subset. */
export type Intent =
  'home' | 'search' | 'product' | 'hotel' | 'flight' | 'experience' | 'food' | 'grocery' | 'cart' | 'ride' | 'message';

export type NetworkId = 'cuelinks' | 'admitad' | 'earnkaro' | 'cj' | 'travelpayouts' | 'impact';

/** Link parameters. Every value is validated and URL-encoded by the builder; unknown keys are ignored. */
export interface LinkParams {
  /** free-text search: "boAt headphones", "biryani" */
  q?: string;
  /** product id on the platform (Amazon ASIN, Myntra style id) */
  id?: string;
  /** full product URL from a feed/API; must be HTTPS on one of the platform's own hosts */
  url?: string;
  /** Amazon marketplace: in (default), us, uk, de, ca, ae, jp */
  market?: string;
  /** hotel / experience destination, or the city for food delivery */
  city?: string;
  /** YYYY-MM-DD */
  checkin?: string;
  /** YYYY-MM-DD */
  checkout?: string;
  adults?: number;
  /** IATA airport/city codes, e.g. DEL, BOM */
  from?: string;
  to?: string;
  /** YYYY-MM-DD (flight departure) */
  date?: string;
  /** ride drop-off label, e.g. "Kempegowda Airport" */
  dropoff?: string;
  lat?: number;
  lng?: number;
  /** messaging: phone number (any format; digits are kept) */
  phone?: string;
  /** messaging: pre-filled text */
  text?: string;
}

/** Environment / config bag with affiliate IDs. IDs are never hard-coded; see docs/AFFILIATE.md. */
export type AffiliateEnv = Readonly<Record<string, string | undefined>>;

export interface AffiliateProgram {
  /** direct programme: the platform's own tracking query parameter */
  param?: {
    name: string;
    /** env var holding the ID; a function when it depends on params (Amazon marketplace) */
    env: string | ((p: LinkParams) => string);
    /** per-link sub-id parameter (gets utm_content / campaign) */
    sub?: string;
  };
  /** affiliate networks that carry this merchant, in order of preference */
  networks?: NetworkId[];
  /** set when there is no affiliate programme: deep link only */
  none?: string;
  /** where to apply */
  signup?: string;
  notes?: string;
}

export interface PlatformDef {
  id: string;
  name: string;
  category: Category;
  regions: Region[];
  /** brand colour (hex) for chips and fallbacks */
  color: string;
  /** 1–3 letter monogram for logo tiles */
  mono: string;
  /** compact name for tight UI (defaults to name) */
  short?: string;
  /** text colour on a brand-colour tile (default white) */
  ink?: string;
  /** grocery: quick commerce (minutes) or scheduled slot delivery */
  delivery?: 'quick' | 'slot';
  /** hosts a supplied product URL may point to (open-redirect guard) */
  hosts: string[];
  /** Android package, for "open in app" checks (also listed in the APK's <queries>) */
  android?: string;
  /** lower-case names users type ("swiggy", "mmt", "booking.com") */
  aliases: string[];
  /** web URL builders per intent; return null when params are insufficient */
  intents: Partial<Record<Intent, (p: LinkParams) => string | null>>;
  /** custom-scheme app URI per intent. Only for platforms whose https links don't open the app. */
  scheme?: Partial<Record<Intent, (p: LinkParams) => string | null>>;
  affiliate: AffiliateProgram;
}

export interface BuildLinkInput {
  platform: string;
  intent: Intent;
  params?: LinkParams;
  /** utm_campaign, e.g. "travel-goa", "chat-intent" */
  campaign?: string;
  /** utm_content: where in the UI (e.g. "card-book-button") */
  content?: string;
  /** affiliate IDs (process.env, import.meta.env, or a config object). Omit for plain links. */
  env?: AffiliateEnv;
  /** utm_medium (default "app") */
  medium?: string;
}

export interface BuiltLink {
  platform: string;
  intent: Intent;
  /** custom-scheme URI to open the native app, or null when the https URL opens the app (App/Universal Links) */
  appUri: string | null;
  /** clean public URL: no affiliate tag, no UTM */
  webUrl: string;
  /** URL to open: affiliate tag (or network wrapper) + UTM. Equals webUrl+UTM when no affiliate ID is configured. */
  trackedUrl: string;
  androidPackage: string | null;
  affiliate: {
    /** true when an affiliate ID was applied, so the UI must show a disclosure */
    active: boolean;
    /** "param:tag", "network:cuelinks" or null */
    via: string | null;
  };
}

export class LinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LinkError';
  }
}
