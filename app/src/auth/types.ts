/** Email + password auth contract. Firebase implements it in production; LocalDemo implements it for demos. */
export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
}

export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'email-in-use'
  | 'wrong-credentials'
  | 'user-not-found'
  | 'too-many-requests'
  | 'network'
  | 'not-signed-in'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AuthError';
  }
}

export interface AuthProvider {
  readonly id: 'firebase' | 'local-demo';
  /** true when no real backend is configured (UI shows a "Demo mode" badge) */
  readonly isDemo: boolean;
  /** Subscribes to sign-in state; fires once with the current user. Returns an unsubscribe function. */
  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void;
  currentUser(): AuthUser | null;
  signUp(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  sendEmailVerification(): Promise<void>;
  /** Re-reads the user from the backend (to pick up emailVerified after the link was clicked). */
  reload(): Promise<AuthUser | null>;
  sendPasswordResetEmail(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** Demo only: simulates clicking the verification link. */
  demoVerify?(): Promise<void>;
}
