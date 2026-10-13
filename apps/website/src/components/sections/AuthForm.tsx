import { useState, type FormEvent } from 'react';
import { authService } from '../../services/auth';

export type AuthMode = 'login' | 'signup' | 'forgot-password';

const FIELDS: Record<AuthMode, { name: string; label: string; type: string; auto: string }[]> = {
  login: [
    { name: 'email', label: 'Email', type: 'email', auto: 'email' },
    { name: 'password', label: 'Password', type: 'password', auto: 'current-password' },
  ],
  signup: [
    { name: 'name', label: 'Full name', type: 'text', auto: 'name' },
    { name: 'email', label: 'Email', type: 'email', auto: 'email' },
    { name: 'password', label: 'Password (min. 8 characters)', type: 'password', auto: 'new-password' },
  ],
  'forgot-password': [{ name: 'email', label: 'Email', type: 'email', auto: 'email' }],
};
const SUBMIT: Record<AuthMode, string> = { login: 'Log in', signup: 'Create account', 'forgot-password': 'Send reset link' };

/** UI-only auth form wired to the AuthService interface (src/services/auth). */
export function AuthForm({ mode }: { mode: AuthMode }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setMsg(null);
    if (mode === 'forgot-password') {
      const r = await authService.sendPasswordReset(f.email);
      setMsg(r.ok ? { ok: true, text: 'If an account exists, a reset link is on its way.' } : { ok: false, text: r.error ?? 'Something went wrong.' });
    } else {
      const r = mode === 'login' ? await authService.signIn({ email: f.email, password: f.password }) : await authService.signUp({ name: f.name, email: f.email, password: f.password });
      setMsg(r.ok ? { ok: true, text: `Welcome, ${r.user.name ?? r.user.email}!` } : { ok: false, text: r.error });
    }
    setBusy(false);
  }

  async function google() {
    const r = await authService.signInWithGoogle();
    if (!r.ok) setMsg({ ok: false, text: r.error });
  }

  return (
    <form className="card auth-form" onSubmit={onSubmit} noValidate={false}>
      {mode !== 'forgot-password' && (
        <>
          <button type="button" className="btn wide" onClick={google}><span className="g" aria-hidden="true">G</span>Continue with Google</button>
          <p className="or"><span>or</span></p>
        </>
      )}
      {FIELDS[mode].map((fl) => (
        <label key={fl.name} className="field">
          <span>{fl.label}</span>
          <input name={fl.name} type={fl.type} autoComplete={fl.auto} required minLength={fl.type === 'password' ? 8 : undefined} />
        </label>
      ))}
      {mode === 'login' && <a className="small link" href="/forgot-password">Forgot password?</a>}
      <button type="submit" className="btn primary wide" disabled={busy}>{busy ? 'Please wait…' : SUBMIT[mode]}</button>
      {msg && <p className={`form-msg ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.text}</p>}
      <p className="small muted center">
        {mode === 'signup' ? <>Already have an account? <a className="link" href="/login">Log in</a></> : <>New to Akaya? <a className="link" href="/signup">Create an account</a></>}
      </p>
    </form>
  );
}
