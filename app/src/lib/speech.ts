/** Text-to-speech helper (Web Speech API). Silently no-ops where unsupported. */
export function speak(text: string, rate = 1, lang = 'en-IN', onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[•\n]/g, ' '));
  u.rate = rate;
  u.lang = lang;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export const stopSpeaking = () => 'speechSynthesis' in window && window.speechSynthesis.cancel();

/* Minimal typing for the (still prefixed in Chrome) SpeechRecognition API */
export interface SpeechRec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
export function createRecognizer(lang: string): SpeechRec | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = lang;
  r.interimResults = true;
  r.continuous = true;
  return r;
}
