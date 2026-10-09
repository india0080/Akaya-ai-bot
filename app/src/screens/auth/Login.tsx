import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@akaya/ui';
import { useApp } from '../../state/store';
import { auth, authMessage, emailError } from '../../auth';
import { Field, FormError, PasswordField } from './AuthBits';
import { AuthLayout } from './AuthLayout';

export function Login() {
  const { signIn } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const errs = { email: emailError(email), pw: pw ? null : 'Enter your password' };

  const submit = async () => {
    setTouched(true);
    setErr(null);
    if (errs.email || errs.pw || busy) return;
    setBusy(true);
    try {
      const u = await auth.signIn(email, pw);
      if (!u.emailVerified) {
        nav('/verify-email', { replace: true });
        return;
      }
      signIn('email', u.email);
      nav('/', { replace: true });
    } catch (e) {
      setErr(authMessage(e));
      setBusy(false);
    }
  };

  return (
    <AuthLayout icon="user" title="Welcome back" sub="Log in with your email and password.">
      <form
        className="au-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormError msg={err} />
        <Field
          icon="mail"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={touched ? errs.email : null}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={pw}
          onChange={setPw}
          error={touched ? errs.pw : null}
          onEnter={() => void submit()}
        />
        <div className="au-right">
          <button
            type="button"
            className="link"
            onClick={() => nav(`/forgot?email=${encodeURIComponent(email.trim())}`)}
          >
            Forgot password?
          </button>
        </div>
        <button type="submit" className="btn btn-primary btn-block su-cta" disabled={busy}>
          {busy ? <span className="spinner light" /> : null}
          {busy ? 'Logging in…' : 'Log in'}
          {!busy && <Icon name="chev" size={16} strokeWidth={2.6} />}
        </button>
        <p className="au-alt">
          New to Akaya?{' '}
          <button type="button" className="link" onClick={() => nav('/signup?tab=email', { replace: true })}>
            Create an account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
