/**
 * Back handlers for the Android hardware back button. Open overlays (sheets) register a close handler;
 * the newest one runs first. When the stack is empty, the router goes back.
 */
const stack: Array<() => void> = [];

export function pushBackHandler(fn: () => void): () => void {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Runs the newest handler. Returns false when there was none. */
export function runBackHandler(): boolean {
  const fn = stack[stack.length - 1];
  if (!fn) return false;
  fn();
  return true;
}
