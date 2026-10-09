/** One-tap "send" links for messaging apps (Future Messages reminders, chat cards). No tracking parameters. */
import { buildLink } from './build.js';

export type MessagingPlatform = 'whatsapp' | 'signal' | 'sms';
export const MESSAGING_PLATFORMS: readonly MessagingPlatform[] = ['whatsapp', 'signal', 'sms'];

export const isMessagingPlatform = (id: string): id is MessagingPlatform =>
  (MESSAGING_PLATFORMS as readonly string[]).includes(id);

/**
 * Pre-filled compose link. `to` may be a phone number or a contact name (non-digits are dropped, so a
 * name opens the app's own contact picker). Uses the app scheme when the platform has no web compose
 * page (Signal), else the universal / web link (wa.me, sms:).
 */
export function messageLink(platform: MessagingPlatform, to: string, text: string): string {
  const l = buildLink({ platform, intent: 'message', params: { phone: to, text } });
  return l.appUri ?? l.webUrl;
}
