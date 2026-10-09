/** Chat + voice: turn a request like "कल सुबह 10 बजे मीटिंग याद दिलाना" into a reminder draft and a reply line. */
import { isReminderRequest, parseReminder, repeatLabel, type ReminderSource } from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import type { CreateOutcome } from './ReminderProvider';
import type { ReminderDraft } from './state';

export { isReminderRequest };

const DEVANAGARI = /[\u0900-\u097F]/;

/** null `draft` means no date/time was found: ask, or open the composer prefilled */
export function draftFromText(
  text: string,
  lead: number,
  source: ReminderSource,
): { draft: ReminderDraft | null; title: string } {
  const p = parseReminder(text);
  if (p.due === null) return { draft: null, title: p.title };
  const early = p.due - Date.now() > lead * 60_000 + 60_000 ? [lead, 0] : [0];
  return {
    title: p.title,
    draft: {
      title: p.title,
      category: p.category,
      priority: p.priority,
      due: p.due,
      alerts: early,
      repeat: p.repeat,
      source,
    },
  };
}

export function reminderReply(text: string, title: string, draft: ReminderDraft | null, res?: CreateOutcome): string {
  const hi = DEVANAGARI.test(text);
  if (!draft)
    return hi
      ? `ज़रूर! "${title}" कब याद दिलाऊँ? मैंने फ़ॉर्म खोल दिया है।`
      : `Sure! When should I remind you about "${title}"? I've opened the reminder form.`;
  const when = `${fmtWhen(draft.due)}${draft.repeat.kind !== 'none' ? ` · ${repeatLabel(draft)}` : ''}`;
  if (res?.outcome === 'cancelled')
    return hi ? 'ठीक है, मैंने नया reminder नहीं जोड़ा।' : "Okay, I didn't add a new reminder.";
  if (res?.outcome === 'merged')
    return hi
      ? `पहले वाले reminder में जोड़ दिया: ${draft.title}, ${when}.`
      : `Merged into your existing reminder: ${draft.title}, ${when}.`;
  const urgent = draft.priority === 'urgent' ? (hi ? ' (ज़रूरी)' : ' (urgent)') : '';
  return hi
    ? `ठीक है! मैं याद दिला दूँगी: ${draft.title}${urgent}, ${when}.`
    : `Done! I'll remind you: ${draft.title}${urgent}, ${when}.`;
}
