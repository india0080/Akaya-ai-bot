/**
 * Akaya v1 pearl renderer (stateless).
 * Ported from the v1 AkayaBubble engine: superellipse body, iridescent light stack,
 * glossy black bead eyes on a sphere. Draws one frame into a 2D canvas context.
 */
export interface PearlOpts {
  cx: number;
  cy: number;
  r: number;
  /** animation time in seconds (drives the slow swirl) */
  t?: number;
  /** 0..1 eye openness (blink) */
  open?: number;
  /** happy ^ ^ eyes */
  happy?: boolean;
  /** closed / sleeping eyes */
  closed?: boolean;
  /** 0..1 listening amount (sound rings + larger glow) */
  listen?: number;
  /** 0..1 audio level */
  level?: number;
  /** squash / stretch */
  sx?: number;
  sy?: number;
  /** gaze -1..1 */
  gx?: number;
  gy?: number;
  /** upper lid position 0..1 (thinking) and lid tilt */
  lid?: number;
  lidA?: number;
  glow?: number;
  alpha?: number;
  shadow?: boolean;
  noEyes?: boolean;
  /** thin-film band strength */
  film?: number;
  blend?: GlobalCompositeOperation;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const N = 2.08;
const RY = 0.97;

function superPath(c: CanvasRenderingContext2D, rx: number, ry: number, n: number, M = 96) {
  c.beginPath();
  for (let i = 0; i <= M; i++) {
    const th = (i / M) * Math.PI * 2;
    const co = Math.cos(th);
    const si = Math.sin(th);
    const e = 2 / n;
    const x = rx * Math.sign(co) * Math.pow(Math.abs(co), e);
    const y = ry * Math.sign(si) * Math.pow(Math.abs(si), e);
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.closePath();
}

function blob(
  c: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  R: number,
  x: number,
  y: number,
  r: number,
  col: string,
  a: number,
) {
  const g = c.createRadialGradient(x * rx, y * ry, 0, x * rx, y * ry, r * rx);
  g.addColorStop(0, col.replace('A', String(a)));
  g.addColorStop(1, col.replace('A', '0'));
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
}

/** ctx.filter is not supported everywhere (older Safari); degrade gracefully */
const setFilter = (c: CanvasRenderingContext2D, f: string) => {
  if ('filter' in c) c.filter = f;
};

export function drawPearl(c: CanvasRenderingContext2D, o: PearlOpts) {
  const rx = o.r;
  const ry = o.r * RY;
  const t = o.t ?? 0;
  const R = rx * 1.3;
  const lvl = clamp(o.level ?? 0, 0, 1);
  const L = clamp(o.listen ?? 0, 0, 1);
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.translate(o.cx, o.cy);

  // ambient glow
  const ga = (o.glow ?? 0.35) + L * 0.45 + lvl * 0.25;
  if (ga > 0.01) {
    c.save();
    c.globalCompositeOperation = o.blend ?? 'source-over';
    const gr = rx * (1.75 + L * 0.35 + lvl * 0.25);
    const g = c.createRadialGradient(0, ry * 0.05, rx * 0.3, 0, ry * 0.05, gr);
    g.addColorStop(0, `rgba(170,150,255,${clamp(ga * 0.8, 0, 1)})`);
    g.addColorStop(0.45, `rgba(120,190,255,${clamp(ga * 0.35, 0, 1)})`);
    g.addColorStop(1, 'rgba(120,190,255,0)');
    c.fillStyle = g;
    c.fillRect(-gr, -gr, gr * 2, gr * 2);
    c.restore();
  }

  // sound rings while listening
  if (L > 0.01) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.85 + i / 3) % 1;
      const k = 1.06 + ph * (0.7 + lvl * 0.45);
      c.save();
      c.strokeStyle = `rgba(190,170,255,${(1 - ph) * (0.35 + lvl * 0.55) * L})`;
      c.lineWidth = rx * (0.022 + lvl * 0.03);
      superPath(c, rx * k, ry * k, N);
      c.stroke();
      c.restore();
    }
  }

  // soft drop shadow
  if (o.shadow !== false) {
    c.save();
    c.translate(0, ry * 1.12);
    c.scale(1, 0.22);
    const sw = rx * 0.9;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, sw);
    g.addColorStop(0, 'rgba(20,20,50,.28)');
    g.addColorStop(1, 'rgba(20,20,50,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, sw, 0, 7);
    c.fill();
    c.restore();
  }

  // body transform (squash with pivot near the bottom)
  const piv = ry * 0.85;
  c.translate(0, piv);
  c.scale(o.sx ?? 1, o.sy ?? 1);
  c.translate(0, -piv);

  c.save();
  superPath(c, rx, ry, N);
  c.clip();
  let g: CanvasGradient = c.createLinearGradient(-rx, -ry, rx, ry);
  g.addColorStop(0, '#d7c6ff');
  g.addColorStop(0.5, '#bba2ff');
  g.addColorStop(1, '#b08cff');
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  const sw = Math.sin(t * 0.7) * 0.07;
  const sw2 = Math.cos(t * 0.55) * 0.06;
  blob(c, rx, ry, R, -0.22 + sw, 0.12 + sw2, 0.72, 'rgba(60,185,255,A)', 0.92);
  blob(c, rx, ry, R, -0.72, 0.28, 0.5, 'rgba(90,120,255,A)', 0.55);
  blob(c, rx, ry, R, 0.56 + sw2, -0.42, 0.56, 'rgba(255,95,200,A)', 0.88);
  blob(c, rx, ry, R, 0.58, 0.55 - sw, 0.56, 'rgba(220,80,255,A)', 0.8);
  blob(c, rx, ry, R, 0.02, 0.84, 0.5, 'rgba(150,100,255,A)', 0.55);
  blob(c, rx, ry, R, -0.58, 0.72, 0.36, 'rgba(255,150,220,A)', 0.5);
  blob(c, rx, ry, R, 0.12, -0.12 - sw, 0.36, 'rgba(235,225,255,A)', 0.35);
  blob(c, rx, ry, R, -0.48, -0.55, 0.3, 'rgba(255,255,255,A)', 0.5);

  // thin-film swirl bands
  c.save();
  setFilter(c, `blur(${rx * 0.07}px)`);
  c.lineCap = 'round';
  const bands: [number[], number[], number[], number[], string, number][] = [
    [[-0.85, -0.1], [-0.4, -0.75], [0.35, -0.55], [0.8, 0.05], 'rgba(255,120,215,.55)', 0.16],
    [[-0.75, 0.45], [-0.2, 0.05], [0.3, 0.55], [0.75, 0.6], 'rgba(90,210,255,.55)', 0.14],
    [[-0.3, 0.85], [0.1, 0.55], [0.55, 0.2], [0.85, -0.3], 'rgba(170,120,255,.45)', 0.12],
  ];
  bands.forEach(([p0, p1, p2, p3, col, lw], i) => {
    const d = Math.sin(t * 0.6 + i) * 0.05;
    c.globalAlpha = o.film ?? 0.25;
    c.strokeStyle = col;
    c.lineWidth = rx * lw;
    c.beginPath();
    c.moveTo(p0[0] * rx, (p0[1] + d) * ry);
    c.bezierCurveTo(p1[0] * rx, (p1[1] - d) * ry, p2[0] * rx, (p2[1] + d) * ry, p3[0] * rx, p3[1] * ry);
    c.stroke();
  });
  c.restore();

  if ('createConicGradient' in c) {
    const cg = c.createConicGradient(t * 0.3, -rx * 0.08, -ry * 0.05);
    (
      [
        [0, '#7fe3ff'],
        [0.18, '#a77bff'],
        [0.4, '#ff79d2'],
        [0.6, '#6f9cff'],
        [0.8, '#c2fff0'],
        [1, '#7fe3ff'],
      ] as [number, string][]
    ).forEach(([a, k]) => cg.addColorStop(a, k));
    c.globalAlpha = 0.5;
    c.globalCompositeOperation = 'soft-light';
    c.fillStyle = cg;
    c.fillRect(-R, -R, 2 * R, 2 * R);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  // gentle form shading
  g = c.createRadialGradient(-rx * 0.35, -ry * 0.45, 0, -rx * 0.35, -ry * 0.45, rx * 1.8);
  g.addColorStop(0, 'rgba(255,255,255,.16)');
  g.addColorStop(0.55, 'rgba(120,90,220,0)');
  g.addColorStop(1, 'rgba(80,50,190,.22)');
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  // thin-film bright edge
  g = c.createRadialGradient(0, 0, rx * 0.78, 0, 0, rx * 1.02);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.75, 'rgba(255,225,250,.35)');
  g.addColorStop(1, 'rgba(255,255,255,.85)');
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  // fresnel rim + highlights
  setFilter(c, `blur(${rx * 0.05}px)`);
  c.lineWidth = rx * 0.1;
  c.strokeStyle = 'rgba(255,255,255,.45)';
  superPath(c, rx, ry, N);
  c.stroke();
  setFilter(c, `blur(${rx * 0.045}px)`);
  c.fillStyle = 'rgba(255,255,255,.14)';
  c.beginPath();
  c.ellipse(-rx * 0.3, -ry * 0.42, rx * 0.45, ry * 0.26, -0.5, 0, 7);
  c.fill();
  setFilter(c, 'none');
  c.save();
  c.translate(-0.42 * rx, -0.55 * ry);
  c.rotate(-0.6);
  g = c.createRadialGradient(0, 0, 0, 0, 0, 0.27 * rx);
  g.addColorStop(0, 'rgba(255,255,255,.98)');
  g.addColorStop(0.7, 'rgba(255,255,255,.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.scale(1, 0.42);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, 0.27 * rx, 0, 7);
  c.fill();
  c.restore();
  c.restore();

  c.lineWidth = Math.max(1, rx * 0.012);
  c.strokeStyle = 'rgba(255,255,255,.55)';
  superPath(c, rx, ry, N);
  c.stroke();

  // eyes: black glossy beads on a sphere
  if (!o.noEyes) {
    const open = clamp(o.open ?? 1, 0, 1);
    const es = 1 + L * 0.1;
    for (const side of [-1, 1]) {
      const yaw = side * 0.29 + (o.gx ?? 0) * 0.36;
      const pitch = -0.06 + (o.gy ?? 0) * 0.3;
      const x = rx * 0.96 * Math.sin(yaw);
      const y = ry * 0.96 * Math.sin(pitch);
      const fw = Math.pow(Math.cos(yaw), 0.7);
      const fh = Math.pow(Math.cos(pitch), 0.7);
      const w = rx * 0.3 * es * fw;
      const h = rx * 0.36 * es * fh;
      c.save();
      c.translate(x, y);
      if (o.closed) {
        c.strokeStyle = '#08080d';
        c.lineWidth = w * 0.26;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-w * 0.52, -h * 0.02);
        c.quadraticCurveTo(0, h * 0.42, w * 0.52, -h * 0.02);
        c.stroke();
      } else if (o.happy) {
        c.strokeStyle = '#08080d';
        c.lineWidth = w * 0.3;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-w * 0.52, h * 0.12);
        c.quadraticCurveTo(0, -h * 0.62, w * 0.52, h * 0.12);
        c.stroke();
      } else {
        const hh = Math.max(h * open, h * 0.08);
        if (o.lid) {
          const ly = -hh / 2 + o.lid * hh;
          const inner = -side;
          const la = o.lidA ?? 0;
          c.beginPath();
          c.moveTo(-w, ly + la * inner * w * 0.5);
          c.lineTo(w, ly - la * inner * w * 0.5);
          c.lineTo(w, hh);
          c.lineTo(-w, hh);
          c.closePath();
          c.clip();
        }
        c.save();
        c.shadowColor = 'rgba(30,10,80,.35)';
        c.shadowBlur = w * 0.25;
        c.shadowOffsetY = w * 0.08;
        g = c.createRadialGradient(-w * 0.15, -hh * 0.2, w * 0.05, 0, 0, Math.max(w, hh) * 0.62);
        g.addColorStop(0, '#3b3b4a');
        g.addColorStop(0.55, '#111117');
        g.addColorStop(1, '#020203');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(0, 0, w / 2, hh / 2, 0, 0, 7);
        c.fill();
        c.restore();
        if (open > 0.35) {
          const hg = c.createRadialGradient(-w * 0.14, -hh * 0.22, 0, -w * 0.14, -hh * 0.22, w * 0.22);
          hg.addColorStop(0, 'rgba(255,255,255,.95)');
          hg.addColorStop(0.5, 'rgba(255,255,255,.55)');
          hg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = hg;
          c.beginPath();
          c.ellipse(-w * 0.14, -hh * 0.22, w * 0.2, w * 0.24 * open, -0.4, 0, 7);
          c.fill();
          c.strokeStyle = 'rgba(200,190,255,.35)';
          c.lineWidth = w * 0.05;
          c.beginPath();
          c.ellipse(0, 0, w * 0.38, hh * 0.4, 0, 0.6, 1.9);
          c.stroke();
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.beginPath();
          c.arc(w * 0.16, hh * 0.2, w * 0.06, 0, 7);
          c.fill();
        }
      }
      c.restore();
    }
  }
  c.restore();
}

/** 4-point sparkle star */
export function star4(c: CanvasRenderingContext2D, x: number, y: number, r: number, a = 1) {
  c.save();
  c.translate(x, y);
  c.globalAlpha = a;
  c.shadowColor = 'rgba(255,255,255,.9)';
  c.shadowBlur = r * 2.2;
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(r, 0);
  for (let i = 1; i <= 4; i++) {
    const an = (i * Math.PI) / 2;
    const m = an - Math.PI / 4;
    c.quadraticCurveTo(Math.cos(m) * r * 0.18, Math.sin(m) * r * 0.18, Math.cos(an) * r, Math.sin(an) * r);
  }
  c.fill();
  c.restore();
}

export interface Ring {
  rot: number;
  a: number;
  b: number;
  alpha: number;
}

/** orbit ring half (back half behind the pearl, front half over it) */
export function ring(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  R: Ring,
  front: boolean,
  dark: boolean,
  spin = 0,
) {
  c.save();
  c.translate(cx, cy + r * 0.05);
  c.rotate(R.rot);
  const g = c.createLinearGradient(-R.a * r, 0, R.a * r, 0);
  const al = R.alpha;
  g.addColorStop(0, `rgba(150,200,255,${0.15 * al})`);
  g.addColorStop(0.3 + 0.1 * Math.sin(spin), `rgba(255,255,255,${0.95 * al})`);
  g.addColorStop(0.6, `rgba(205,170,255,${0.8 * al})`);
  g.addColorStop(1, `rgba(140,215,255,${0.25 * al})`);
  c.strokeStyle = g;
  c.lineWidth = r * 0.022;
  c.shadowColor = dark ? 'rgba(170,150,255,.9)' : 'rgba(160,130,255,.6)';
  c.shadowBlur = r * 0.1;
  c.beginPath();
  if (front) c.ellipse(0, 0, R.a * r, R.b * r, 0, 0, Math.PI);
  else c.ellipse(0, 0, R.a * r, R.b * r, 0, Math.PI, Math.PI * 2);
  c.stroke();
  c.restore();
}
