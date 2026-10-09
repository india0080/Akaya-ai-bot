/**
 * FirebaseAuthProvider: Firebase Authentication (JS SDK, modular API), Email/Password sign-in.
 * Enabled automatically when the VITE_FIREBASE_* variables are set (see app/README.md → "Email sign-in").
 * The SDK is loaded lazily, so demo builds don't download it.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import { AuthError, type AuthErrorCode, type AuthProvider, type AuthUser } from './types';
import { normEmail } from './validation';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
}

const CODE_MAP: Record<string, AuthErrorCode> = {
  'auth/invalid-email': 'invalid-email',
  'auth/weak-password': 'weak-password',
  'auth/email-already-in-use': 'email-in-use',
  'auth/invalid-credential': 'wrong-credentials',
  'auth/wrong-password': 'wrong-credentials',
  'auth/user-not-found': 'wrong-credentials',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network',
};

function wrap(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? '';
  return new AuthError(CODE_MAP[code] ?? 'unknown', code || String(e));
}

const toUser = (u: User): AuthUser => ({
  uid: u.uid,
  email: u.email ?? '',
  emailVerified: u.emailVerified,
  displayName: u.displayName ?? undefined,
});

export class FirebaseAuthProvider implements AuthProvider {
  readonly id = 'firebase' as const;
  readonly isDemo = false;
  private ready: Promise<{ auth: Auth; m: typeof import('firebase/auth') }>;
  private user: AuthUser | null = null;

  constructor(config: FirebaseConfig) {
    this.ready = (async () => {
      const [{ initializeApp }, m] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
      const app: FirebaseApp = initializeApp(config);
      // indexedDB persistence works in browsers and in the Android WebView (Capacitor)
      const auth = m.initializeAuth(app, {
        persistence: [m.indexedDBLocalPersistence, m.browserLocalPersistence],
      });
      m.onAuthStateChanged(auth, (u) => {
        this.user = u ? toUser(u) : null;
      });
      return { auth, m };
    })();
  }

  currentUser() {
    return this.user;
  }

  onAuthStateChanged(cb: (u: AuthUser | null) => void) {
    let off = () => {};
    let cancelled = false;
    void this.ready.then(({ auth, m }) => {
      if (cancelled) return;
      off = m.onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null));
    });
    return () => {
      cancelled = true;
      off();
    };
  }

  async signUp(email: string, password: string, displayName?: string) {
    const { auth, m } = await this.ready;
    try {
      const cred = await m.createUserWithEmailAndPassword(auth, normEmail(email), password);
      if (displayName) await m.updateProfile(cred.user, { displayName });
      await m.sendEmailVerification(cred.user);
      return (this.user = toUser(cred.user));
    } catch (e) {
      throw wrap(e);
    }
  }

  async signIn(email: string, password: string) {
    const { auth, m } = await this.ready;
    try {
      const cred = await m.signInWithEmailAndPassword(auth, normEmail(email), password);
      return (this.user = toUser(cred.user));
    } catch (e) {
      throw wrap(e);
    }
  }

  async sendEmailVerification() {
    const { auth, m } = await this.ready;
    if (!auth.currentUser) throw new AuthError('not-signed-in');
    try {
      await m.sendEmailVerification(auth.currentUser);
    } catch (e) {
      throw wrap(e);
    }
  }

  async reload() {
    const { auth, m } = await this.ready;
    if (!auth.currentUser) return null;
    try {
      await m.reload(auth.currentUser);
      return (this.user = toUser(auth.currentUser));
    } catch (e) {
      throw wrap(e);
    }
  }

  async sendPasswordResetEmail(email: string) {
    const { auth, m } = await this.ready;
    try {
      await m.sendPasswordResetEmail(auth, normEmail(email));
    } catch (e) {
      const err = wrap(e);
      // don't reveal whether an account exists
      if (err.code === 'wrong-credentials') return;
      throw err;
    }
  }

  async signOut() {
    const { auth, m } = await this.ready;
    await m.signOut(auth);
    this.user = null;
  }
}
