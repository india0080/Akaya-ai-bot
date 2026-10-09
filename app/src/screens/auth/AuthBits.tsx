import { useId, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { auth, passwordStrength } from '../../auth';

/** Shown on every auth screen when no Firebase config is present. */
export function DemoBadge() {
  if (!auth.isDemo) return null;
  return (
    <div className="au-demo" role="note">
      <span className="tag">DEMO MODE</span>
      Accounts stay on this device. No emails are sent.
    </div>
  );
}

interface FieldProps {
  icon: IconName;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  autoComplete?: string;
  placeholder?: string;
  onEnter?: () => void;
  right?: ReactNode;
  autoFocus?: boolean;
}

export function Field({
  icon,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  onEnter,
  right,
  autoFocus,
}: FieldProps) {
  const id = useId();
  return (
    <div className={`au-field${error ? ' bad' : ''}`}>
      <label htmlFor={id} className="au-label">
        {label}
      </label>
      <div className="su-in au-in">
        <Icon name={icon} size={18} className="faint" />
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          autoCapitalize="off"
          spellCheck={false}
        />
        {right}
      </div>
      {error && (
        <p className="au-err" id={`${id}-err`} role="alert">
          <Icon name="alert" size={13} strokeWidth={2.2} /> {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField(props: Omit<FieldProps, 'icon' | 'type' | 'right'>) {
  const [show, setShow] = useState(false);
  return (
    <Field
      {...props}
      icon="lock"
      type={show ? 'text' : 'password'}
      right={
        <button
          type="button"
          className="au-eye"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      }
    />
  );
}

export function StrengthMeter({ password }: { password: string }) {
  const s = passwordStrength(password);
  if (!password) return <p className="au-help">Use 8+ characters with a letter and a number.</p>;
  return (
    <div className={`au-meter s${s.score}`} aria-live="polite">
      <div className="bars">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= s.score ? 'on' : ''} />
        ))}
      </div>
      <span>
        {s.label}
        {s.missing.length > 0 && ` · needs ${s.missing.join(', ')}`}
      </span>
    </div>
  );
}

export function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="au-banner" role="alert">
      <Icon name="alert" size={16} strokeWidth={2.2} />
      {msg}
    </div>
  );
}
