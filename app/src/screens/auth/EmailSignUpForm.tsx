import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { auth, authMessage, confirmError, emailError, passwordError } from '../../auth';
import { Field, FormError, PasswordField, StrengthMeter } from './AuthBits';

/** Email + password sign-up (inside the Email tab of the sign-up screen). */
export function EmailSignUpForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const errs = { email: emailError(email), pw: passwordError(pw), confirm: confirmError(pw, confirm) };
  const ok = !errs.email && !errs.pw && !errs.confirm;

  const submit = async () => {
    setTouched(true);
    setErr(null);
    if (!ok || busy) return;
    setBusy(true);
    try {
      await auth.signUp(email, pw); // Firebase also sends the verification email here
      nav('/verify-email', { replace: true });
    } catch (e) {
      setErr(authMessage(e));
      setBusy(false);
    }
  };

  return (
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
        autoComplete="new-password"
        placeholder="Create a password"
        value={pw}
        onChange={setPw}
        error={touched ? errs.pw : null}
      />
      <StrengthMeter password={pw} />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Type it again"
        value={confirm}
        onChange={setConfirm}
        error={touched || (confirm.length > 0 && confirm.length >= pw.length) ? errs.confirm : null}
        onEnter={() => void submit()}
      />
      <button type="submit" className="btn btn-primary btn-block su-cta" disabled={busy}>
        {busy ? <span className="spinner light" /> : null}
        {busy ? 'Creating account…' : 'Create account'}
        {!busy && <Icon name="chev" size={16} strokeWidth={2.6} />}
      </button>
      <p className="au-alt">
        Already have an account?{' '}
        <button type="button" className="link" onClick={() => nav('/login')}>
          Log in
        </button>
      </p>
    </form>
  );
}
