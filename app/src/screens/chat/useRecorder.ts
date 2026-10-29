import { useEffect, useRef, useState } from 'react';
import { classifyMicError, micCaptureSupported, type MicBlock } from '../../lib/mic';
import { uid } from '../../lib/time';
import type { Attachment } from '../../state/types';

const MAX_INLINE = 450 * 1024; // keep short notes playable from localStorage

/** Minimal voice-note recorder (MediaRecorder). The APK asks for the microphone permission. */
export function useRecorder(onDone: (a: Attachment) => void, onError: (msg: string) => void) {
  const [secs, setSecs] = useState<number | null>(null);
  const [block, setBlock] = useState<MicBlock | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef(0);
  const started = useRef(0);
  const keep = useRef(true);
  const cbs = useRef({ onDone, onError });
  useEffect(() => {
    cbs.current = { onDone, onError };
  });
  useEffect(
    () => () => {
      clearInterval(timer.current);
      keep.current = false;
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const start = async () => {
    if (!micCaptureSupported() || typeof MediaRecorder === 'undefined') {
      setBlock('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setBlock(null);
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) =>
        MediaRecorder.isTypeSupported?.(m),
      );
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current);
        setSecs(null);
        if (!keep.current) return;
        const dur = Math.max(1, Math.round((Date.now() - started.current) / 1000));
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
        const label = `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`;
        const done = (thumb?: string) =>
          cbs.current.onDone({
            id: uid(),
            kind: 'audio',
            name: `Voice note ${label}`,
            mime: blob.type,
            size: blob.size,
            meta: label,
            thumb,
          });
        if (blob.size > MAX_INLINE) return done();
        const fr = new FileReader();
        fr.onload = () => done(String(fr.result));
        fr.onerror = () => done();
        fr.readAsDataURL(blob);
      };
      rec.current = r;
      keep.current = true;
      started.current = Date.now();
      r.start();
      setSecs(0);
      timer.current = window.setInterval(() => setSecs(Math.round((Date.now() - started.current) / 1000)), 250);
    } catch (error) {
      const kind = classifyMicError(error);
      setBlock(kind);
      cbs.current.onError(
        kind === 'unsupported'
          ? 'This device has no microphone for voice notes.'
          : 'Microphone permission is needed for voice notes.',
      );
    }
  };
  const stop = (save = true) => {
    keep.current = save;
    if (rec.current?.state === 'recording') rec.current.stop();
  };
  return { recording: secs !== null, secs: secs ?? 0, start, stop, block, clearBlock: () => setBlock(null) };
}
