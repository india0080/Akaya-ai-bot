import { useEffect, useRef, useState } from 'react';

/**
 * Simple timeline: returns the current stage index, advancing at the given ms marks.
 * e.g. useStages([300, 900, 1600]) -> 0, then 1 at 300ms, 2 at 900ms, 3 at 1600ms.
 * With `loopMs` the timeline restarts.
 */
export function useStages(marks: number[], loopMs?: number): number {
  const [stage, setStage] = useState(0);
  const key = marks.join(',');
  useEffect(() => {
    let timers: number[] = [];
    const run = () => {
      setStage(0);
      timers = key.split(',').map((m, i) => window.setTimeout(() => setStage(i + 1), Number(m)));
      if (loopMs) timers.push(window.setTimeout(run, loopMs));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [key, loopMs]);
  return stage;
}

/** Animation clock in seconds (re-renders every frame while mounted). */
export function useClock(): number {
  const [t, setT] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (!start.current) start.current = now;
      setT((now - start.current) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/** Typewriter text. Starts when `run` becomes true. */
export function useTyped(text: string, run: boolean, cps = 32): string {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 1000 / cps);
    return () => {
      clearInterval(id);
      setN(0);
    };
  }, [text, run, cps]);
  return run ? text.slice(0, n) : '';
}
