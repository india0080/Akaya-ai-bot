import { useState } from 'react';
import { Screen, ScreenHeader, Icon, useToast } from '@akaya/ui';
import './Features.css';

const FAQ = [
  [
    'What is Floating?',
    'A small Akaya bubble that sits over other apps (Android). Tap it to draft replies, translate or read the screen without switching apps.',
  ],
  [
    'On-device vs Online?',
    'On-device AI runs on your phone and works offline. Online mode uses cloud models for longer, richer answers. Switch anytime from Home or Settings.',
  ],
  [
    'How do Future Messages work?',
    'Write a message, pick a date and time, and Akaya sends it then. You can cancel it until it is sent.',
  ],
  [
    'Which languages are supported?',
    'Akaya translates across 99+ languages, including Hindi, Tamil, Bengali, Marathi, Spanish and Japanese.',
  ],
];

export function Support() {
  const toast = useToast();
  const [msg, setMsg] = useState('');
  return (
    <Screen className="feature">
      <ScreenHeader title="Support" sub="We're here to help" />
      <h4 className="set-h">FAQs</h4>
      <div className="faq">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card">
            <summary>
              {q}
              <Icon name="chev" size={16} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <h4 className="set-h">Contact us</h4>
      <div className="card fm-form">
        <textarea
          className="input"
          placeholder="Describe your issue or idea…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          className="btn btn-brand btn-block"
          style={{ marginTop: 10 }}
          disabled={!msg.trim()}
          onClick={() => {
            setMsg('');
            toast('Thanks! Our team will get back to you (demo)', 'mail');
          }}
        >
          <Icon name="send" size={16} /> Send to support
        </button>
      </div>
    </Screen>
  );
}
