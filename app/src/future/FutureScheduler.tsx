import { useFutureScheduler } from './useScheduler';

/** Mount once inside ToastProvider: runs the in-app (demo) Future Message sender. */
export function FutureScheduler() {
  useFutureScheduler();
  return null;
}
