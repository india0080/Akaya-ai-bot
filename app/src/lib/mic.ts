/** Microphone capture helpers shared by Home, Chat, and Voice. */

export type MicBlock = 'denied' | 'unsupported';

export function micCaptureSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

export function speechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/** Map a getUserMedia failure to a state the UI can explain. */
export function classifyMicError(error: unknown): MicBlock {
  if (!micCaptureSupported()) return 'unsupported';
  const name = error instanceof DOMException || error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError') return 'unsupported';
  return 'denied';
}

/** Ask for the mic, then release the stream. Returns `ready` when a track was opened. */
export async function requestMic(): Promise<MicBlock | 'ready'> {
  if (!micCaptureSupported()) return 'unsupported';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return 'ready';
  } catch (error) {
    return classifyMicError(error);
  }
}
