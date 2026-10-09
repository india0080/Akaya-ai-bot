import { isMessagingPlatform, messageLink } from '@akaya/affiliate';
import type { ChannelId, ScheduledMessage } from '../types.js';
import type { SenderAdapter } from './types.js';
import { target } from './types.js';

/** Where "tap to send" reminders go (FCM/APNs push in production). */
export interface Notifier {
  push(userId: string, n: { title: string; body: string; deeplink: string; messageId: string }): Promise<void>;
}

/**
 * Honest fallback for channels with no official personal-account API (personal WhatsApp, Signal, SMS):
 * at send time we push a reminder whose tap opens the app with the message pre-filled.
 */
export function reminderAdapter(channel: ChannelId, notifier: Notifier): SenderAdapter {
  return {
    channel,
    requires: [],
    async send(msg: ScheduledMessage) {
      const deeplink = messageLink(isMessagingPlatform(channel) ? channel : 'sms', target(msg, channel), msg.text);
      await notifier.push(msg.userId, {
        title: `Time to send to ${msg.to}`,
        body: msg.text.slice(0, 120),
        deeplink,
        messageId: msg.id,
      });
      return { ok: true, needsTap: true, deeplink };
    },
  };
}
