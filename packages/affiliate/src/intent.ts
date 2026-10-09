/**
 * Chat intent → link: "Swiggy se biryani", "order paneer on Zomato", "Uber to airport",
 * "Amazon pe headphones", "hotels in Goa on Booking", "MMT flight DEL to BOM on 2026-10-20".
 * Deterministic keyword rules (English + Hinglish); the LLM path can call buildLink directly.
 */
import { PLATFORMS } from './platforms.js';
import type { Intent, LinkParams, PlatformDef } from './types.js';

export interface DetectedIntent {
  platform: string;
  intent: Intent;
  params: LinkParams;
}

/** aliases too ambiguous to match inside a sentence */
const UNSAFE_ALIASES = new Set(['bb', 'fk', 'wa', 'cliq', 'reliance', 'booking', 'sms', 'signal', 'text message']);
const FILLER = new Set(
  'se pe par on from via in mein me order karo kar kardo do mangao mangwa mangwao book khareedo buy get search find open chahiye please plz ek the a an for jana hai hain ko tak to app wala wali ka ki ke mujhe i want need some'.split(
    ' ',
  ),
);

const ALIASES = Object.values(PLATFORMS as Record<string, PlatformDef>)
  .filter((p) => p.category !== 'messaging')
  .flatMap((p) => p.aliases.filter((a) => !UNSAFE_ALIASES.has(a)).map((a) => ({ alias: a, plat: p })))
  .concat([{ alias: 'booking.com', plat: PLATFORMS.booking }])
  .sort((a, b) => b.alias.length - a.alias.length);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rest(text: string, alias: string): string[] {
  return text
    .replace(new RegExp(`\\b${escape(alias)}\\b`, 'i'), ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
const words = (ws: string[]) =>
  ws
    .filter((w) => !FILLER.has(w))
    .join(' ')
    .trim();

export function detectIntent(input: string): DetectedIntent | null {
  const text = input.slice(0, 300);
  const lower = text.toLowerCase();
  const hit = ALIASES.find(({ alias }) => new RegExp(`(^|[^a-z0-9.])${escape(alias)}($|[^a-z0-9])`, 'i').test(lower));
  if (!hit) return null;
  const plat = hit.plat;
  const ws = rest(text, hit.alias);

  switch (plat.category) {
    case 'food': {
      const q = words(ws);
      return q
        ? { platform: plat.id, intent: 'food', params: { q } }
        : { platform: plat.id, intent: 'home', params: {} };
    }
    case 'grocery': {
      const q = words(ws);
      return q
        ? { platform: plat.id, intent: 'grocery', params: { q } }
        : { platform: plat.id, intent: 'home', params: {} };
    }
    case 'shopping': {
      const q = words(ws);
      return q
        ? { platform: plat.id, intent: 'search', params: { q } }
        : { platform: plat.id, intent: 'home', params: {} };
    }
    case 'ride': {
      const dropoff = words(ws.filter((w) => !['cab', 'ride', 'taxi', 'auto', 'book'].includes(w)));
      return { platform: plat.id, intent: 'ride', params: dropoff ? { dropoff } : {} };
    }
    case 'travel': {
      const codes = text.match(/\b([A-Z]{3})\b\s*(?:to|-|→|se)\s*\b([A-Z]{3})\b/);
      const date = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
      if (codes && plat.intents.flight)
        return { platform: plat.id, intent: 'flight', params: { from: codes[1], to: codes[2], date } };
      const cityMatch = lower.match(/\b(?:in|at|for|mein)\s+([a-z][a-z\s]{1,30}?)(?:\s+(?:on|from|par|pe|se|for)\b|$)/);
      const city =
        cityMatch?.[1]?.trim() ||
        words(
          ws.filter(
            (w) =>
              ![
                'hotel',
                'hotels',
                'stay',
                'stays',
                'room',
                'rooms',
                'flight',
                'flights',
                'tour',
                'tours',
                'things',
                'do',
              ].includes(w),
          ),
        );
      const wantsExp = /\b(tour|tours|things to do|activity|activities|experience|tickets?)\b/.test(lower);
      if (wantsExp && plat.intents.experience && city)
        return { platform: plat.id, intent: 'experience', params: { q: city } };
      if (plat.intents.hotel && city) return { platform: plat.id, intent: 'hotel', params: { city } };
      if (plat.intents.experience && city) return { platform: plat.id, intent: 'experience', params: { q: city } };
      return { platform: plat.id, intent: 'home', params: {} };
    }
    default:
      return null;
  }
}
