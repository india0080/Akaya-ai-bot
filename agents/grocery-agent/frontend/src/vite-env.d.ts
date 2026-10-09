/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** Backend origin for static deploys, e.g. https://agents.example.com (dev uses the Vite proxy) */
  readonly VITE_API_URL?: string;
}
