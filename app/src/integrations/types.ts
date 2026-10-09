/** Integration domain types. UI and state only depend on these, never on a concrete provider. */

export type CategoryId =
  | 'email'
  | 'messaging'
  | 'calendar'
  | 'docs'
  | 'storage'
  | 'tasks'
  | 'crm'
  | 'finance'
  | 'social'
  | 'india'
  | 'dev'
  | 'meetings'
  | 'forms'
  | 'support'
  | 'hr'
  | 'automation';

/**
 * How Akaya talks to the app:
 * - oauth:        user signs in with the app (OAuth 2.0) and grants scopes; tokens live on the backend.
 * - business-api: official business platform only (e.g. WhatsApp Business Platform / click-to-chat).
 * - deeplink:     no account access; Akaya opens the app with details pre-filled (rides, food, shopping).
 * - connector:    a small desktop / on-prem connector the user installs (e.g. Tally, Obsidian vault).
 */
export type ConnectKind = 'oauth' | 'business-api' | 'deeplink' | 'connector';

export interface Ability {
  /** stable key; also the per-app toggle key */
  key: string;
  label: string;
  /** example prompt the user can try once connected */
  prompt: string;
}

export interface IntegrationApp {
  id: string;
  name: string;
  category: CategoryId;
  /** one-liner: what Akaya can do with it */
  desc: string;
  /** brand colour for the monogram tile (replace tiles with official logos per brand guidelines) */
  color: string;
  /** 1–2 letter monogram shown on the tile */
  mono: string;
  /** dark text on light brand colours */
  darkText?: boolean;
  kind: ConnectKind;
  abilities: Ability[];
  /** human-readable permissions shown on the consent screen */
  permissions: string[];
  popular?: boolean;
}

export interface Connection {
  appId: string;
  connectedAt: number;
  /** account label shown in the UI, e.g. the signed-in email */
  account: string;
  /** per-ability on/off switches */
  toggles: Record<string, boolean>;
}

export type ConnectStage = 'redirect' | 'authorize' | 'sync';

export interface ConnectResult {
  ok: boolean;
  account?: string;
  error?: string;
}

export interface ActionResult {
  ok: boolean;
  text: string;
}

/**
 * Provider contract. Swap MockProvider for a real one (Composio, Nango or your own backend)
 * without touching screens. Real providers must never hold OAuth secrets in the browser.
 */
export interface IntegrationProvider {
  readonly id: string;
  /** Start the connect flow. `onStage` lets the UI show progress. */
  connect(app: IntegrationApp, onStage?: (s: ConnectStage) => void): Promise<ConnectResult>;
  disconnect(appId: string): Promise<void>;
  status(appId: string): Promise<'connected' | 'disconnected' | 'expired'>;
  /** Actions the assistant may call for this app (derived from abilities). */
  actions(app: IntegrationApp): Ability[];
  runAction(app: IntegrationApp, actionKey: string, input?: string): Promise<ActionResult>;
}
