import { useEffect, useState } from 'react';
import { micCaptureSupported, type MicBlock } from './mic';

export type MicAccess = 'checking' | 'prompt' | 'ready' | MicBlock;

/**
 * Read microphone permission without prompting.
 * `prompt` means the browser can still ask. `checking` is only the first lookup.
 */
export function useMicAccess(): MicAccess {
  const [access, setAccess] = useState<MicAccess>('checking');

  useEffect(() => {
    let cancel = false;
    const set = (next: MicAccess) => {
      if (!cancel) setAccess(next);
    };
    if (!micCaptureSupported()) {
      set('unsupported');
      return () => {
        cancel = true;
      };
    }
    const perms = navigator.permissions;
    if (!perms?.query) {
      set('prompt');
      return () => {
        cancel = true;
      };
    }
    let status: PermissionStatus | undefined;
    const apply = () => {
      if (!status || cancel) return;
      set(status.state === 'granted' ? 'ready' : status.state === 'denied' ? 'denied' : 'prompt');
    };
    perms
      .query({ name: 'microphone' as PermissionName })
      .then((next) => {
        status = next;
        apply();
        status.onchange = apply;
      })
      .catch(() => set('prompt'));
    return () => {
      cancel = true;
      if (status) status.onchange = null;
    };
  }, []);

  return access;
}
