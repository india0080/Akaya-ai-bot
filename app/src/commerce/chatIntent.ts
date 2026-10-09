/** Chat: "Swiggy se biryani" → a reply + a link card that opens Swiggy. Detection lives in @akaya/affiliate. */
import { detectIntent, getPlatform, type DetectedIntent } from '@akaya/affiliate';

export type LinkAction = Pick<DetectedIntent, 'platform' | 'intent' | 'params'>;

export const detectLinkAction = (text: string): LinkAction | null => detectIntent(text);

/** one-line summary of what the link will open */
export function actionSummary(a: LinkAction): string {
  const p = a.params;
  switch (a.intent) {
    case 'food':
    case 'grocery':
    case 'search':
      return p.q ? `Search “${p.q}”` : 'Open the app';
    case 'ride':
      return p.dropoff ? `Drop-off: ${p.dropoff}` : 'Set your drop-off in the app';
    case 'hotel':
      return p.city ? `Stays in ${p.city}` : 'Hotel search';
    case 'flight':
      return [p.from && p.to ? `${p.from} → ${p.to}` : 'Flight search', p.date].filter(Boolean).join(' · ');
    case 'experience':
      return p.q ? `Things to do: ${p.q}` : 'Things to do';
    default:
      return 'Open the app';
  }
}

export function actionReply(a: LinkAction): string {
  const name = getPlatform(a.platform)?.name ?? a.platform;
  const pay =
    a.intent === 'ride'
      ? 'You confirm the ride'
      : a.intent === 'home'
        ? 'You take it from there'
        : 'You check out and pay';
  return `Here's ${name} with that ready. ${pay} in ${name}; Akaya never orders or pays for you.`;
}
