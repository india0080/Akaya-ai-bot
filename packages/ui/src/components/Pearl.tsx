/**
 * <Pearl/>: the live Akaya v1 pearl bubble.
 * Animated on a canvas: blink, idle float, gaze wander, tap squash + happy eyes,
 * moods (idle | happy | listening | thinking | sleeping) and an optional orbit scene.
 */
import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { drawPearl, ring, star4, type Ring } from '../lib/pearl';

export type Mood = 'idle' | 'happy' | 'listening' | 'thinking' | 'sleeping';

export interface PearlProps {
  /** canvas size in CSS px */
  width: number;
  height: number;
  /** pearl radius in CSS px */
  r: number;
  cx?: number;
  cy?: number;
  mood?: Mood;
  /** live 0..1 audio level (e.g. from the mic); read every frame */
  levelRef?: RefObject<number>;
  /** draw orbit rings, mini pearls and sparkles */
  scene?: boolean;
  glow?: number;
  shadow?: boolean;
  /** react to taps (squash + smile) */
  interactive?: boolean;
  onTap?: () => void;
  /** eyes look towards this (−1..1) instead of wandering */
  gaze?: { x: number; y: number };
  className?: string;
  style?: CSSProperties;
  label?: string;
}

const RINGS: Ring[] = [
  { rot: -0.3, a: 1.62, b: 0.34, alpha: 1 },
  { rot: 0.38, a: 1.42, b: 0.27, alpha: 0.6 },
];
const MINIS = [
  { a0: 3.6, ra: 1.5, rb: 0.5, rot: -0.3, s: 0.13, sp: 0.16 },
  { a0: 5.4, ra: 1.25, rb: 0.75, rot: 0.38, s: 0.085, sp: -0.12 },
  { a0: 0.6, ra: 1.42, rb: 0.42, rot: -0.3, s: 0.15, sp: 0.16 },
  { a0: 2.1, ra: 1.2, rb: 0.6, rot: 0.38, s: 0.07, sp: -0.12 },
];
const STARS = [
  [-1.55, -0.15, 0.07],
  [1.6, -0.45, 0.055],
  [1.05, -1.1, 0.045],
  [-1.15, -1.05, 0.04],
  [1.3, 1.0, 0.045],
];

const isDark = () => document.documentElement.dataset.theme === 'dark';

export function Pearl(props: PearlProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  const tapAt = useRef(-10);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let visible = true;
    let nextBlink = 1.5;
    let blinkStart = -10;
    let listen = 0;
    let level = 0;
    let lastW = 0;
    let lastH = 0;

    const frame = (now: number) => {
      const p = propsRef.current;
      const t = now / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      if (lastW !== p.width || lastH !== p.height || cv.width !== Math.round(p.width * dpr)) {
        cv.width = Math.round(p.width * dpr);
        cv.height = Math.round(p.height * dpr);
        lastW = p.width;
        lastH = p.height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, p.width, p.height);
      const dark = isDark();
      const blend: GlobalCompositeOperation = dark ? 'screen' : 'source-over';
      const mood = p.mood ?? 'idle';
      const r = p.r;

      // blink
      if (t > nextBlink) {
        blinkStart = t;
        nextBlink = t + 2.4 + Math.random() * 3.6;
      }
      const bt = (t - blinkStart) / 0.18;
      const open = bt >= 0 && bt < 1 ? Math.abs(1 - 2 * bt) : 1;

      // tap reaction
      const age = t - tapAt.current;
      const s = age < 1 ? Math.exp(-age * 6) * Math.sin(age * 22) : 0;
      const happy = mood === 'happy' || age < 1.4;

      // listening amount + level (smoothed)
      listen += ((mood === 'listening' ? 1 : 0) - listen) * 0.12;
      const target =
        p.levelRef?.current ?? (mood === 'listening' ? 0.3 + 0.25 * Math.sin(t * 3.1) * Math.sin(t * 1.7) : 0);
      level += (target - level) * 0.25;

      // gaze
      let gx = 0.32 * Math.sin(t * 0.31) * Math.sin(t * 0.17 + 1);
      let gy = 0.12 * Math.sin(t * 0.23) + 0.05;
      let lid = 0;
      let lidA = 0;
      if (p.gaze) {
        gx = p.gaze.x;
        gy = p.gaze.y;
      }
      if (mood === 'thinking') {
        gx = -0.35 + 0.15 * Math.sin(t * 0.8);
        gy = -0.45;
        lid = 0.38;
        lidA = 0.6;
      }
      const sleeping = mood === 'sleeping';
      const float = sleeping ? 0 : Math.sin(t * 1.5) * r * 0.035;
      const breathe = sleeping ? 1 + 0.025 * Math.sin(t * 1.4) : 1;
      const cx = p.cx ?? p.width / 2;
      const cy = (p.cy ?? p.height / 2) + float;

      const miniDraw = (front: boolean) => {
        MINIS.forEach((m, i) => {
          const a = m.a0 + t * m.sp;
          const isFront = Math.sin(a) > 0;
          if (isFront !== front) return;
          const x0 = Math.cos(a) * m.ra * r;
          const y0 = Math.sin(a) * m.rb * r;
          const x = cx + x0 * Math.cos(m.rot) - y0 * Math.sin(m.rot);
          const y = cy + x0 * Math.sin(m.rot) + y0 * Math.cos(m.rot);
          drawPearl(ctx, {
            cx: x,
            cy: y,
            r: m.s * r * (front ? 1.08 : 0.92),
            t: t + i,
            noEyes: true,
            shadow: false,
            glow: 0.12,
            film: 0.3,
            blend,
          });
        });
      };

      if (p.scene) {
        RINGS.forEach((R) =>
          ring(ctx, cx, cy - float, r, { ...R, rot: R.rot + 0.03 * Math.sin(t * 0.4) }, false, dark, t),
        );
        miniDraw(false);
      }
      drawPearl(ctx, {
        cx,
        cy,
        r,
        t: t * 0.6 + 3,
        open: sleeping ? 1 : open,
        closed: sleeping,
        happy,
        listen,
        level,
        sx: (1 + 0.1 * s) / Math.sqrt(breathe),
        sy: (1 - 0.12 * s) * breathe,
        gx,
        gy,
        lid,
        lidA,
        glow: (p.glow ?? (p.scene ? (dark ? 0.6 : 0.5) : 0.35)) * (sleeping ? 0.6 : 1),
        shadow: p.shadow,
        film: 0.25,
        blend,
      });
      if (p.scene) {
        RINGS.forEach((R) =>
          ring(ctx, cx, cy - float, r, { ...R, rot: R.rot + 0.03 * Math.sin(t * 0.4) }, true, dark, t),
        );
        miniDraw(true);
        STARS.forEach(([x, y, k], i) =>
          star4(ctx, cx + x * r, cy - float + y * r, k * r, 0.45 + 0.45 * Math.sin(t * 2 + i * 1.7)),
        );
      }
      if (sleeping) {
        ctx.save();
        ctx.fillStyle = dark ? 'rgba(220,210,255,.8)' : 'rgba(90,70,180,.7)';
        ctx.font = `700 ${r * 0.28}px Comfortaa, sans-serif`;
        const zt = (t * 0.5) % 1;
        ctx.globalAlpha = 1 - zt;
        ctx.fillText('z', cx + r * (0.85 + zt * 0.3), cy - r * (0.7 + zt * 0.4));
        ctx.restore();
      }
    };

    const loop = (now: number) => {
      if (visible && !document.hidden) frame(now);
      raf = requestAnimationFrame(loop);
    };
    if (reduce) frame(1200);
    else raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const interactive = props.interactive ?? !!props.onTap;
  return (
    <canvas
      ref={ref}
      className={props.className}
      role={interactive ? 'button' : 'img'}
      aria-label={props.label ?? 'Akaya pearl'}
      tabIndex={interactive ? 0 : -1}
      style={{
        width: props.width,
        height: props.height,
        display: 'block',
        cursor: interactive ? 'pointer' : 'default',
        ...props.style,
      }}
      onPointerDown={() => {
        if (!interactive) return;
        tapAt.current = performance.now() / 1000;
        if (navigator.vibrate) navigator.vibrate(8);
        props.onTap?.();
      }}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          tapAt.current = performance.now() / 1000;
          props.onTap?.();
        }
      }}
    />
  );
}
