import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen, ScreenHeader, Icon, Segmented, useToast } from '@akaya/ui';
import { AppTile } from '../components/AppTile';
import { useApp } from '../state/store';
import { APP_BY_ID } from '../integrations/catalog';
import { CHANNEL_BY_ID } from '../future/channels';
import { channelsOf } from '../future/engine';
import { fmtWhen } from '@akaya/tz';
import { cancelLocal, ensureNotifyPermission, scheduleLocal } from '../native/notify';
import type { FMStatus, FutureMessage } from '../state/types';
import { Composer, type Draft } from './future/Composer';
import './Features.css';
import './future/Future.css';
import { useNow } from '../lib/useNow';

const STATUS: Record<FMStatus, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'st-scheduled' },
  sending: { label: 'Sending…', cls: 'st-sending' },
  sent: { label: 'Sent', cls: 'st-sent' },
  failed: { label: 'Failed', cls: 'st-failed' },
  'needs-tap': { label: 'Tap to send', cls: 'st-tap' },
};
const REPEAT_LABEL = { once: '', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' } as const;

function localNote(m: Draft, id: string) {
  const tap = channelsOf({ ...m, id, status: 'scheduled' }).some((c) => CHANNEL_BY_ID[c]?.auto === 'tap');
  void scheduleLocal(
    id,
    m.when,
    tap ? `Time to send to ${m.to}` : `Sending to ${m.to} (demo)`,
    m.text.slice(0, 90) || 'Scheduled post',
  );
}

export function FutureMessages() {
  const { state, scheduleMessage, updateMessage, cancelMessage } = useApp();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const edit = params.get('edit');
  const tab = params.get('tab') === 'sent' ? 'sent' : 'queue';
  const now = useNow(5000);

  const editing = edit && edit !== 'new' ? (state.future.find((m) => m.id === edit) ?? null) : null;
  const queue = state.future.filter((m) => m.status !== 'sent').sort((a, b) => a.when - b.when);
  const sent = state.future
    .filter((m) => m.status === 'sent')
    .sort((a, b) => (b.sentAt ?? b.when) - (a.sentAt ?? a.when));
  const list = tab === 'sent' ? sent : queue;

  const openComposer = (id: string) => {
    setParams({ ...(tab === 'sent' ? { tab } : {}), edit: id });
  };
  const closeComposer = () => setParams(tab === 'sent' ? { tab } : {}, { replace: true });

  const save = async (d: Draft) => {
    await ensureNotifyPermission();
    if (editing) {
      updateMessage(editing.id, (m) => ({ ...m, ...d, status: 'scheduled', results: undefined, error: undefined }));
      void cancelLocal(editing.id).then(() => localNote(d, editing.id));
      toast('Changes saved', 'check');
    } else {
      const id = scheduleMessage({ ...d, createdAt: Date.now() });
      localNote(d, id);
      toast(`Scheduled · ${fmtWhen(d.when, d.tz)}`, 'future');
    }
    closeComposer();
  };

  const retry = (m: FutureMessage) => {
    updateMessage(m.id, (x) => ({ ...x, status: 'scheduled', when: Date.now() + 1200, error: undefined }));
    toast('Retrying now', 'retry');
  };
  const sendNow = (m: FutureMessage) => updateMessage(m.id, (x) => ({ ...x, when: Date.now() }));
  const cancel = (m: FutureMessage) => {
    cancelMessage(m.id);
    void cancelLocal(m.id);
    toast(m.status === 'sent' ? 'Removed' : 'Cancelled', 'trash');
  };
  const tapSend = (m: FutureMessage, chId: string) => {
    const ch = CHANNEL_BY_ID[chId];
    const url = ch?.deeplink?.(m.to, m.text);
    if (url) window.open(url, '_blank');
    updateMessage(m.id, (x) => {
      const results = { ...(x.results ?? {}), [chId]: 'sent' as const };
      const left = Object.values(results).some((r) => r !== 'sent');
      return { ...x, results, status: left ? x.status : 'sent', sentAt: Date.now() };
    });
  };

  return (
    <Screen className="feature fm-screen">
      <ScreenHeader title="Future Message" sub="Write now · Akaya sends it later" />

      <button className="card fm-new" onClick={() => openComposer('new')}>
        <span className="fm-new-ic">
          <Icon name="plus" size={20} strokeWidth={2.6} />
        </span>
        <span className="grow">
          <b>New message or post</b>
          <small>WhatsApp, Gmail, Slack, Instagram, LinkedIn, X and more</small>
        </span>
        <span className="fm-new-logos">
          {['whatsapp', 'gmail', 'slack', 'instagram', 'linkedin'].map((id) => (
            <AppTile key={id} app={APP_BY_ID[id]} size={22} />
          ))}
        </span>
      </button>

      <div className="fm-tabs">
        <Segmented
          value={tab}
          onChange={(v) => setParams(v === 'sent' ? { tab: 'sent' } : {}, { replace: true })}
          options={[
            { value: 'queue', label: <>Queue · {queue.length}</> },
            { value: 'sent', label: <>Sent · {sent.length}</> },
          ]}
        />
      </div>

      <div className="fm-list">
        <AnimatePresence initial={false}>
          {list.map((m) => {
            const chs = channelsOf(m);
            const st = STATUS[m.status] ?? STATUS.scheduled;
            const tapChs = chs.filter((c) => m.results?.[c] === 'needs-tap');
            return (
              <motion.div
                key={m.id}
                layout
                className={`card fm-item ${st.cls}`}
                data-status={m.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60 }}
              >
                <div className="fm-top">
                  <span className="fm-logos">
                    {chs.slice(0, 3).map((c) => {
                      const app = APP_BY_ID[CHANNEL_BY_ID[c]?.appId ?? ''];
                      return app ? <AppTile key={c} app={app} size={30} /> : null;
                    })}
                    {chs.length > 3 && <i>+{chs.length - 3}</i>}
                  </span>
                  <div className="grow">
                    <b>
                      {CHANNEL_BY_ID[chs[0]]?.kind === 'post' ? '' : 'To '}
                      {m.to}
                      {m.id.startsWith('sample-') && <em className="fm-sample">Sample</em>}
                    </b>
                    <small>
                      {fmtWhen(m.status === 'sent' ? (m.sentAt ?? m.when) : m.when, m.tz, now)}
                      {m.repeat && m.repeat !== 'once' && (
                        <>
                          {' '}
                          · <Icon name="repeat" size={11} /> {REPEAT_LABEL[m.repeat]}
                        </>
                      )}
                    </small>
                  </div>
                  <span className={`fm-st ${st.cls}`}>
                    {m.status === 'sending' && <i className="fm-spin" />}
                    {m.status === 'sent' && <Icon name="check" size={12} strokeWidth={3} />}
                    {st.label}
                  </span>
                </div>
                <div className="fm-body">
                  {m.media && (
                    <span className="fm-thumb">
                      {m.media.thumb ? (
                        <img src={m.media.thumb} alt="" />
                      ) : (
                        <Icon name={m.media.kind === 'video' ? 'video' : 'image'} size={18} />
                      )}
                      {m.media.kind === 'video' && (
                        <span className="fmc-play sm">
                          <Icon name="play" size={10} />
                        </span>
                      )}
                    </span>
                  )}
                  <p>
                    {m.subject && <b>{m.subject} · </b>}
                    {m.text}
                  </p>
                </div>
                {m.results && (
                  <div className="fm-res">
                    {chs.map((c) => (
                      <span key={c} className={`fm-r r-${m.results?.[c] ?? 'scheduled'}`}>
                        {CHANNEL_BY_ID[c]?.label ?? c}:{' '}
                        {m.results?.[c] === 'needs-tap' ? 'tap to send' : (m.results?.[c] ?? '…')}
                      </span>
                    ))}
                  </div>
                )}
                {m.error && m.status === 'failed' && (
                  <p className="fm-error">
                    <Icon name="alert" size={13} /> {m.error}
                  </p>
                )}
                <div className="fm-acts">
                  {m.status === 'needs-tap' &&
                    tapChs.map((c) => (
                      <button key={c} className="btn btn-primary btn-sm" onClick={() => tapSend(m, c)}>
                        <Icon name="send" size={14} /> Send on {CHANNEL_BY_ID[c]?.label}
                      </button>
                    ))}
                  {m.status === 'failed' && (
                    <button className="btn btn-primary btn-sm" onClick={() => retry(m)}>
                      <Icon name="retry" size={14} /> Retry
                    </button>
                  )}
                  {m.status === 'scheduled' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => sendNow(m)}>
                      <Icon name="send" size={14} /> Send now
                    </button>
                  )}
                  {m.status !== 'sending' && m.status !== 'sent' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => openComposer(m.id)}>
                      <Icon name="edit" size={14} /> Edit
                    </button>
                  )}
                  {m.status !== 'sending' && (
                    <button className="link fm-cancel" onClick={() => cancel(m)}>
                      {m.status === 'sent' ? 'Remove' : 'Cancel'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!list.length && (
          <div className="empty">
            {tab === 'sent' ? 'Nothing sent yet.' : 'No messages scheduled. Tap “New message or post”.'}
          </div>
        )}
        <p className="fm-foot">
          Demo mode: sending is simulated on this device at the scheduled time (IST unless you pick another zone). Add
          “#fail” to a message to try the retry flow.
        </p>
      </div>

      <Composer
        key={edit ?? 'closed'}
        open={!!edit}
        initial={editing}
        now={now}
        onClose={closeComposer}
        onSave={(d) => void save(d)}
      />
    </Screen>
  );
}
