/**
 * LiveRecorder: microphone capture (getUserMedia + MediaRecorder), a live input level from an
 * AnalyserNode, and live transcription with the Web Speech API where the browser supports it.
 * Recognition auto-restarts (browsers end it after silence) until stop() is called.
 */
import { createRecognizer, type SpeechRec } from '../lib/speech';
import type { SpeechLang } from './types';

export interface RecorderEvents {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (msg: string) => void;
}

export const speechSupported = () =>
  typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export class LiveRecorder {
  level = 0;
  private stream?: MediaStream;
  private ctx?: AudioContext;
  private raf = 0;
  private rec: SpeechRec | null = null;
  private media?: MediaRecorder;
  private chunks: Blob[] = [];
  private listening = false;
  private lang: SpeechLang;
  private ev: RecorderEvents;

  constructor(lang: SpeechLang, ev: RecorderEvents) {
    this.lang = lang;
    this.ev = ev;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    const an = this.ctx.createAnalyser();
    an.fftSize = 1024;
    this.ctx.createMediaStreamSource(this.stream).connect(an);
    const data = new Uint8Array(an.fftSize);
    const loop = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      this.level = Math.min(1, Math.sqrt(sum / data.length) * 4.5);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
    if ('MediaRecorder' in window) {
      this.media = new MediaRecorder(this.stream);
      this.media.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
      this.media.start(1000);
    }
    this.listening = true;
    this.listen();
  }

  private listen() {
    this.rec?.abort();
    this.rec = createRecognizer(this.lang);
    if (!this.rec) return;
    // results only grow within one recognition session, so count the finals already emitted
    let emitted = 0;
    this.rec.onresult = (e) => {
      let interim = '';
      let finals = 0;
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          if (finals++ >= emitted) {
            emitted++;
            const t = r[0].transcript.trim();
            if (t) this.ev.onFinal(t);
          }
        } else interim += r[0].transcript;
      }
      this.ev.onInterim(interim.trim());
    };
    this.rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.listening = false;
        this.ev.onError('Live transcription is blocked in this browser. Audio is still recording.');
      }
    };
    this.rec.onend = () => {
      if (this.listening) window.setTimeout(() => this.listening && this.listen(), 250);
    };
    try {
      this.rec.start();
    } catch {
      /* already started */
    }
  }

  setLang(lang: SpeechLang) {
    this.lang = lang;
    if (this.listening) this.listen();
  }

  pause() {
    this.listening = false;
    this.rec?.stop();
    if (this.media?.state === 'recording') this.media.pause();
  }

  resume() {
    if (this.media?.state === 'paused') this.media.resume();
    this.listening = true;
    this.listen();
  }

  /** Stops everything and resolves with the recorded audio (or null). */
  stop(): Promise<Blob | null> {
    this.listening = false;
    this.rec?.abort();
    cancelAnimationFrame(this.raf);
    const done = () => {
      this.stream?.getTracks().forEach((t) => t.stop());
      this.ctx?.close().catch(() => {});
      this.level = 0;
    };
    const m = this.media;
    if (!m || m.state === 'inactive') {
      done();
      return Promise.resolve(this.chunks.length ? new Blob(this.chunks, { type: m?.mimeType || 'audio/webm' }) : null);
    }
    return new Promise((resolve) => {
      m.onstop = () => {
        done();
        resolve(this.chunks.length ? new Blob(this.chunks, { type: m.mimeType || 'audio/webm' }) : null);
      };
      m.stop();
    });
  }
}
