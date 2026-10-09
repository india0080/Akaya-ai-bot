/**
 * Auth entry point. Uses Firebase when VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID and
 * VITE_FIREBASE_APP_ID are set at build time; otherwise the LocalDemoAuthProvider (labelled "Demo mode" in the UI).
 */
import { FirebaseAuthProvider } from './firebase';
import { LocalDemoAuthProvider } from './localDemo';
import type { AuthProvider } from './types';

function create(): AuthProvider {
  const env = import.meta.env;
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
    appId: env.VITE_FIREBASE_APP_ID ?? '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  };
  if (cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId) return new FirebaseAuthProvider(cfg);
  return new LocalDemoAuthProvider();
}

export const auth: AuthProvider = create();
export * from './types';
export * from './validation';
