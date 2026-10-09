import { useState } from 'react';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Controls';
import { Pearl } from '../components/Pearl';
import { useToast } from '../components/Toast';
import './Features.css';

const PRO = [
  'Unlimited Online mode chats',
  'Up to 20 active AI Agents',
  'Longer voice conversations',
  'Priority Read Screen & Translate',
  'Unlimited Future Messages',
];

export function Upgrade() {
  const toast = useToast();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  return (
    <Screen className="feature">
      <ScreenHeader title="Upgrade Plan" />
      <div className="up-hero">
        <Pearl width={200} height={150} r={46} scene mood="happy" />
        <h2>
          Akaya <span className="grad-text">Pro</span>
        </h2>
        <p className="muted">Do more with your intelligent assistant.</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
        <Segmented
          value={cycle}
          onChange={setCycle}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly · save 29%' },
          ]}
        />
      </div>
      <div className="card up-card">
        <div className="up-price">
          <b>{cycle === 'yearly' ? '₹1,699' : '₹199'}</b>
          <span>/{cycle === 'yearly' ? 'year' : 'month'}</span>
          <em className="tag t-orange">Sample pricing</em>
        </div>
        {PRO.map((f) => (
          <div key={f} className="up-f">
            <span className="up-ck">
              <Icon name="check" size={13} strokeWidth={3} />
            </span>
            {f}
          </div>
        ))}
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          onClick={() => toast('Demo: checkout opens via the app store', 'crown')}
        >
          <Icon name="crown" size={17} /> Upgrade to Pro
        </button>
      </div>
      <p className="faint loan-note" style={{ margin: '12px 30px' }}>
        You're on the Free plan. Cancel anytime from your store account.
      </p>
    </Screen>
  );
}
