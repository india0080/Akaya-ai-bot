/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** mock | composio | nango (default: mock) */
  readonly VITE_INTEGRATIONS_PROVIDER?: string;
  /** Backend base URL for real integrations, e.g. https://api.akaya.example */
  readonly VITE_AKAYA_API?: string;
  readonly VITE_NOTES_PROVIDER?: string;
  /** Shopping / Grocery agent UIs (default: local dev servers 5174 / 5175) */
  readonly VITE_SHOPPING_AGENT_URL?: string;
  readonly VITE_GROCERY_AGENT_URL?: string;
  /** Firebase Auth (Email/Password). All four required to enable Firebase; otherwise Demo mode. */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
}
