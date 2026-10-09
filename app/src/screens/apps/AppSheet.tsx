import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sheet, Icon, Pearl, Toggle, useToast } from '@akaya/ui';
import { AppTile } from '../../components/AppTile';
import { useApp } from '../../state/store';
import { integrations, KIND_LABEL, CATEGORIES, type ConnectStage, type IntegrationApp } from '../../integrations';
import { relDay } from '../../lib/time';

export type Step = 'detail' | 'consent' | 'connecting' | 'done';

const STAGES: { key: ConnectStage; label: (n: string) => string }[] = [
  { key: 'redirect', label: (n) => `Opening ${n} sign-in` },
  { key: 'authorize', label: () => 'Waiting for your approval' },
  { key: 'sync', label: () => 'Setting up abilities' },
];

const KIND_NOTE: Record<IntegrationApp['kind'], string> = {
  oauth: 'You sign in on the app’s own page and choose what to allow. You can disconnect anytime.',
  'business-api':
    'Works only through the official WhatsApp Business Platform or click-to-chat links. Akaya never automates personal WhatsApp accounts.',
  deeplink: 'No sign-in needed. Akaya opens the app with details filled in and you finish there.',
  connector: 'Needs a small connector on your computer that links Akaya to this app.',
};

/** Detail → consent → connecting → connected flow for one app. */
export function AppSheet({
  app,
  initialStep = 'detail',
  onClose,
}: {
  app: IntegrationApp | null;
  initialStep?: Step;
  onClose: () => void;
}) {
  const { state, connectApp, disconnectApp, setAppToggle } = useApp();
  const toast = useToast();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(initialStep);
  const [stage, setStage] = useState<ConnectStage>('redirect');
  const [confirmOff, setConfirmOff] = useState(false);
  const [prevId, setPrevId] = useState(app?.id);
  if (app?.id !== prevId) {
    setPrevId(app?.id);
    setStep(initialStep);
    setConfirmOff(false);
  }
  const conn = app ? state.integrations[app.id] : undefined;
  const deep = app?.kind === 'deeplink';

  const start = async () => {
    if (!app) return;
    setStep('connecting');
    const res = await integrations.connect(app, setStage);
    if (!res.ok) {
      toast(res.error ?? 'Could not connect', 'close');
      setStep('detail');
      return;
    }
    connectApp({
      appId: app.id,
      account: res.account ?? '',
      toggles: Object.fromEntries(app.abilities.map((x) => [x.key, true])),
    });
    setStep('done');
    toast(`${app.name} ${deep ? 'enabled' : 'connected'}`, 'check');
  };

  const title =
    step === 'consent'
      ? deep
        ? 'Enable deep link'
        : 'Allow access'
      : step === 'done'
        ? ''
        : step === 'connecting'
          ? ''
          : app?.name;

  return (
    <Sheet open={!!app} onClose={onClose} title={title} height={90}>
      {app && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="as"
          >
            {step === 'detail' && (
              <>
                <div className="as-hero">
                  <AppTile app={app} size={64} />
                  <div className="grow">
                    <b>{app.name}</b>
                    <span className="as-sub">
                      {CATEGORIES.find((c) => c.id === app.category)?.label} · {KIND_LABEL[app.kind]}
                    </span>
                    {conn ? (
                      <span className="as-status on">
                        <i /> {deep ? 'Enabled' : 'Connected'} · {conn.account}
                      </span>
                    ) : (
                      <span className="as-status">Not connected</span>
                    )}
                  </div>
                </div>
                <p className="as-desc">{app.desc}</p>

                <h4 className="as-h">What Akaya can do</h4>
                <div className="card as-list">
                  {app.abilities.map((ab) => (
                    <div key={ab.key} className="as-row">
                      <span className="as-ic">
                        <Icon name="spark" size={15} />
                      </span>
                      <span className="grow">
                        <b>{ab.label}</b>
                        <small>“{ab.prompt}”</small>
                      </span>
                      {conn && (
                        <Toggle
                          on={conn.toggles[ab.key] !== false}
                          onChange={(v) => setAppToggle(app.id, ab.key, v)}
                          label={ab.label}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <h4 className="as-h">Permissions</h4>
                <ul className="as-perms">
                  {app.permissions.map((p) => (
                    <li key={p}>
                      <Icon name="check" size={14} strokeWidth={2.6} />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="as-note">
                  <Icon name="help" size={15} />
                  {KIND_NOTE[app.kind]}
                </p>

                {conn ? (
                  confirmOff ? (
                    <div className="as-confirm">
                      <span>
                        Disconnect {app.name}? Akaya will stop using it{deep ? '' : ' and remove access'}.
                      </span>
                      <div className="as-actions">
                        <button className="btn btn-ghost" onClick={() => setConfirmOff(false)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={async () => {
                            await integrations.disconnect(app.id);
                            disconnectApp(app.id);
                            setConfirmOff(false);
                            toast(`${app.name} disconnected`, 'close');
                          }}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="as-actions">
                      <button className="btn btn-ghost as-off" onClick={() => setConfirmOff(true)}>
                        <Icon name="close" size={16} /> Disconnect
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => nav(`/chat?new=1&q=${encodeURIComponent(app.abilities[0].prompt)}`)}
                      >
                        <Icon name="chat" size={16} /> Try in chat
                      </button>
                    </div>
                  )
                ) : (
                  <button className="btn btn-primary btn-block as-cta" onClick={() => setStep('consent')}>
                    <Icon name={deep ? 'link' : 'plug'} size={18} /> {deep ? 'Enable' : 'Connect'} {app.name}
                  </button>
                )}
              </>
            )}

            {step === 'consent' && (
              <>
                <div className="as-bridge">
                  <span className="as-akaya">
                    <Pearl width={64} height={64} r={24} shadow={false} glow={0.2} />
                  </span>
                  <span className="as-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <AppTile app={app} size={60} />
                </div>
                <h3 className="as-ct">
                  {deep ? `Let Akaya open ${app.name} for you` : `Akaya wants to connect to your ${app.name}`}
                </h3>
                <p className="as-cs">
                  {deep
                    ? 'Akaya will open the app with details filled in. Nothing else is shared.'
                    : `Signed in to Akaya as ${state.user.email}`}
                </p>
                <div className="card as-list">
                  <span className="as-lh">Akaya will be able to</span>
                  {app.permissions.map((p) => (
                    <div key={p} className="as-row sm">
                      <span className="as-ic ok">
                        <Icon name="check" size={13} strokeWidth={2.8} />
                      </span>
                      <span className="grow">{p}</span>
                    </div>
                  ))}
                </div>
                <p className="as-note">
                  <Icon name="shield" size={15} />
                  {app.kind === 'oauth'
                    ? `You’ll confirm on ${app.name}’s own sign-in page. Disconnect anytime in Apps & Integrations.`
                    : KIND_NOTE[app.kind]}
                </p>
                <div className="as-actions">
                  <button className="btn btn-ghost" onClick={() => setStep('detail')}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={start}>
                    {deep ? 'Enable' : 'Allow & continue'}
                  </button>
                </div>
                <p className="as-demo">Demo: sign-in is simulated, no real account is linked.</p>
              </>
            )}

            {step === 'connecting' && (
              <div className="as-wait">
                <div className="as-bridge big">
                  <span className="as-akaya">
                    <Pearl width={72} height={72} r={27} shadow={false} glow={0.25} mood="thinking" />
                  </span>
                  <span className="as-dots run">
                    <i />
                    <i />
                    <i />
                  </span>
                  <AppTile app={app} size={64} />
                </div>
                <h3 className="as-ct">Connecting to {app.name}…</h3>
                <ol className="as-stages">
                  {STAGES.map((s, i) => {
                    const cur = STAGES.findIndex((x) => x.key === stage);
                    const st = i < cur ? 'done' : i === cur ? 'now' : '';
                    return (
                      <li key={s.key} className={st}>
                        <span>{st === 'done' ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}</span>
                        {s.label(app.name)}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {step === 'done' && (
              <div className="as-done">
                <motion.div
                  className="as-badge"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                >
                  <AppTile app={app} size={76} />
                  <span className="as-tick">
                    <Icon name="check" size={18} strokeWidth={3} />
                  </span>
                </motion.div>
                <h3 className="as-ct">
                  {app.name} {deep ? 'enabled' : 'connected'}
                </h3>
                <p className="as-cs">{conn ? `${conn.account} · ${relDay(conn.connectedAt)}` : 'Connected'}</p>
                <span className="as-lh center">Try asking</span>
                <div className="as-tries">
                  {app.abilities.map((ab) => (
                    <button
                      key={ab.key}
                      className="card"
                      onClick={() => nav(`/chat?new=1&q=${encodeURIComponent(ab.prompt)}`)}
                    >
                      <Icon name="ask" size={16} />
                      {ab.prompt}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary btn-block" onClick={() => setStep('detail')}>
                  Manage {app.name}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </Sheet>
  );
}
