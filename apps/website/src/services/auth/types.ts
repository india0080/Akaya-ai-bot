/** Auth service contract. The website only talks to this interface; plug Firebase/Supabase/your API behind it. */
export interface AuthUser { id: string; email: string; name?: string }
export interface Credentials { email: string; password: string }
export interface SignUpInput extends Credentials { name: string }
export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

export interface AuthService {
  signIn(input: Credentials): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<void>;
}
