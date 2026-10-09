import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sheet, Icon, Pearl, useToast } from '@akaya/ui';
import { useApp } from '../../state/store';
import { draftFromText, useReminders } from '../../features/reminders';

const SUMMARY = 'Electricity bill for September: ₹1,240 is due on 15 Oct. Usage is 12% lower than last month.';

/** Read Screen demo: "captures" a sample screen, scans it, then explains it with actions. */
export function ReadScreenSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<'ready' | 'scan' | 'done'>('ready');
  const { state } = useApp();
  const reminders = useReminders();
  const toast = useToast();
  const nav = useNavigate();
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setStage('ready');
  }
  useEffect(() => {
    if (stage !== 'scan') return;
    const id = setTimeout(() => setStage('done'), 1700);
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <Sheet open={open} onClose={onClose} title="Read Screen" height={90}>
      <p className="muted rs-sub">Akaya reads what's on your screen and explains it. Demo uses a sample bill.</p>
      <div className="rs-shot">
        <div className="rs-bill">
          <div className="rs-brand">
            <span className="gi gi-orange" style={{ width: 26, height: 26, borderRadius: 8 }}>
              <Icon name="bolt" size={15} />
            </span>
            <b>City Power Ltd.</b>
          </div>
          <div className="rs-l">
            <span>Bill month</span>
            <b>Sep 2026</b>
          </div>
          <div className="rs-l">
            <span>Units used</span>
            <b>212 kWh</b>
          </div>
          <div className={`rs-l${stage === 'done' ? ' hl' : ''}`}>
            <span>Due date</span>
            <b>15 Oct 2026</b>
          </div>
          <div className={`rs-total${stage === 'done' ? ' hl' : ''}`}>
            <span>Amount due</span>
            <b>₹1,240</b>
          </div>
        </div>
        {stage === 'scan' && (
          <motion.div
            className="rs-scan"
            initial={{ top: '4%' }}
            animate={{ top: ['4%', '92%', '4%'] }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        )}
      </div>
      {stage !== 'done' ? (
        <button
          className="btn btn-brand btn-block"
          style={{ marginTop: 14 }}
          disabled={stage === 'scan'}
          onClick={() => setStage('scan')}
        >
          {stage === 'scan' ? <span className="spinner light" /> : <Icon name="read" size={18} />}
          {stage === 'scan' ? 'Reading screen…' : 'Read this screen'}
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rs-answer card">
            <div className="rs-ah">
              <Pearl width={40} height={40} r={15} shadow={false} glow={0.1} mood="happy" />
              <b>Akaya explains</b>
            </div>
            <p>{SUMMARY}</p>
          </div>
          <div className="rs-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                const { draft } = draftFromText(
                  'Pay electricity bill ₹1,240 tomorrow at 7 pm, important',
                  state.settings.reminderLead,
                  'form',
                );
                if (draft) void reminders.add({ ...draft, category: 'finance', alerts: [1440, 60, 0] });
              }}
            >
              <Icon name="alarm" size={14} /> Remind me
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(SUMMARY).catch(() => {});
                toast('Summary copied', 'copy');
              }}
            >
              <Icon name="copy" size={14} /> Copy
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => nav(`/chat?new=1&q=${encodeURIComponent('How can I reduce my electricity bill?')}`)}
            >
              <Icon name="ask" size={14} /> Ask more
            </button>
          </div>
        </motion.div>
      )}
    </Sheet>
  );
}
