/*!
 * akaya-bubble.js: the Akaya iridescent bubble mascot as a 2D canvas character.
 * No dependencies and no build step. Works as a classic <script> (window.AkayaBubbleKit) or via CommonJS require.
 *
 *   const bubble = new AkayaBubbleKit.AkayaBubble(canvas, { size: 0.28 });
 *   bubble.setState('listening');   bubble.setLevel(0.6);   bubble.setAccessory('santa');
 *
 * Techniques: superellipse body |x/rx|^n + |y/ry|^n = 1, fake 3D lighting (body gradient, shading,
 * fresnel rim, bounce light, sharp top-left specular, drop shadow, mood glow), under-damped springs
 * for every move (anticipation → travel → overshoot → settle), squash & stretch, breathing,
 * blinking and eyes on a sphere that follow the pointer.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AkayaBubbleKit = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ tokens */
  const BRAND = { blue: '#0269f8', violet: '#7625ef', cyan: '#0dabf4', green: '#08da73', orange: '#E8743B', navy: '#121733' };
  // Our construction: n = 2.2 (a soft bubble, rounder than a squircle), height = 0.94 × width.
  const SHAPE = {
    n: 2.2, ryRatio: 0.94,
    eye: { yaw: 0.33, pitch: 0.0, w: 0.19, h: 0.23 },          // eyes on a sphere (radians, ×rx)
    specular: { x: -0.42, y: -0.52, rx: 0.26, ry: 0.11, rot: -0.6 }, // ×rx / ×ry
    badgeAngle: -Math.PI / 4, badgeR: 0.25,                        // on the rim at −45°
    glowR: 1.9, floor: 1.22,                                       // ×rx, ×ry
  };
  // Spring presets (unit mass): k = stiffness, z = damping ratio ζ (<1 = under-damped, overshoots)
  const SPRINGS = {
    travel: { k: 170, z: 0.42 }, squash: { k: 380, z: 0.30 }, tilt: { k: 200, z: 0.36 },
    gaze: { k: 240, z: 0.62 }, drop: { k: 260, z: 0.38 }, badge: { k: 500, z: 0.35 },
    shake: { k: 900, z: 0.12 }, glow: { k: 60, z: 1.0 }, level: { k: 300, z: 0.8 },
  };

  /* ------------------------------------------------------------------ states */
  const STATES = {
    idle:        { label: 'Idle', note: 'breathes · blinks · follows your pointer', glow: BRAND.violet, glowAmt: 0.55, eyes: 'open', badge: 'presence', breath: [0.018, 4.2], float: 0.04, gaze: 'pointer' },
    listening:   { label: 'Listening', note: 'voice input · reacts to mic level', glow: BRAND.cyan, glowAmt: 0.85, eyes: 'open', eyeScale: 1.14, badge: 'mic', breath: [0.008, 2.2], float: 0.025, gaze: 'pointer', pose: [0, -0.12, 0], rings: true },
    thinking:    { label: 'Thinking', note: 'eyes up-right · typing dots', glow: '#8b5cf6', glowAmt: 0.7, eyes: 'open', lid: [0.22, 0], badge: 'dots', breath: [0.014, 3.2], float: 0.035, gaze: 'upRight', pose: [-0.07, -0.12, -0.05], sway: true },
    reply:       { label: 'Reply ready', note: 'draft written · tap Send', glow: BRAND.blue, glowAmt: 0.8, eyes: 'happy', badge: 'send', blush: 0.55, breath: [0.016, 3.6], float: 0.035, gaze: 'downRight', pose: [0.08, 0, 0.04], enter: 'hop1' },
    reminder:    { label: 'Reminder', note: 'bell drops in · bounce', glow: BRAND.orange, glowAmt: 0.85, eyes: 'open', eyeScale: 1.1, badge: 'bell', breath: [0.014, 3.0], float: 0.025, gaze: 'pointer', enter: 'bounce', badgeDrop: true },
    offline:     { label: 'Offline', note: 'on-device mode · calm & dim', glow: '#4a6fa8', glowAmt: 0.32, eyes: 'open', lid: [0.34, 0], badge: 'offline', dim: 0.32, breath: [0.012, 6.0], float: 0.018, gaze: 'soft', speed: 0.6 },
    translating: { label: 'Translating', note: '99+ languages · eyes scan', glow: BRAND.cyan, glow2: BRAND.green, glowAmt: 0.8, eyes: 'open', badge: 'lang', breath: [0.014, 3.4], float: 0.035, gaze: 'scan', glyphs: true },
    error:       { label: 'Error', note: 'worried eyes · quick shake', glow: '#ff4d6a', glowAmt: 0.75, eyes: 'open', eyeScale: 0.88, lid: [0.12, 0.62], badge: 'alert', breath: [0.010, 2.6], float: 0.015, gaze: 'center', enter: 'shake' },
    success:     { label: 'Success', note: 'jump · sparkles', glow: BRAND.green, glowAmt: 0.85, eyes: 'happy', badge: 'check', blush: 0.65, breath: [0.016, 3.4], float: 0.035, gaze: 'center', enter: 'jump', sparkles: true },
    sleeping:    { label: 'Sleeping', note: 'eyes closed · zzz · deep breath', glow: '#3a3fb0', glowAmt: 0.28, eyes: 'closed', badge: 'moon', dim: 0.38, breath: [0.032, 5.6], float: 0.01, gaze: 'center', pose: [0, 0.15, 0], zzz: true, speed: 0.55 },
  };
  const STATE_ORDER = ['idle', 'listening', 'thinking', 'reply', 'reminder', 'offline', 'translating', 'error', 'success', 'sleeping'];
  const ALIASES = { replyReady: 'reply', 'reply-ready': 'reply', reply_ready: 'reply', sleep: 'sleeping', translate: 'translating' };
  const ACCESSORIES = {
    diya: { label: 'Diwali diya' }, holi: { label: 'Holi colours' },
    santa: { label: 'Santa hat' }, gradcap: { label: 'Graduation cap' },
  };
  const GLYPHS = ['A', 'अ', 'あ', 'ع', 'த', 'Ñ', '文', 'ক'];
  const GREETINGS = ['नमस्ते', 'Hola', 'Bonjour', 'こんにちは', 'مرحبا', 'வணக்கம்', 'Hello', 'Ciao'];
  const FONT_STACK = '"Manrope","Noto Sans","Noto Sans Devanagari","Noto Sans CJK JP","Noto Sans JP","Noto Sans Arabic","Noto Sans Tamil","Noto Sans Bengali",sans-serif';

  /* ------------------------------------------------------------------ helpers */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /** Damped harmonic spring, unit mass. a = −k(x − target) − c·v, c = 2ζ√k. */
  class Spring {
    constructor(v = 0, { k = 200, z = 0.45 } = {}) { this.v = v; this.target = v; this.vel = 0; this.k = k; this.z = z; }
    set(t) { this.target = t; return this; }
    snap(v) { this.v = this.target = v; this.vel = 0; return this; }
    kick(dv) { this.vel += dv; return this; }
    step(dt) { const c = 2 * this.z * Math.sqrt(this.k); const a = -this.k * (this.v - this.target) - c * this.vel; this.vel += a * dt; this.v += this.vel * dt; }
    get settled() { return Math.abs(this.vel) < 1e-3 && Math.abs(this.v - this.target) < 1e-3; }
  }

  /** Superellipse point at angle th: |x/rx|^n + |y/ry|^n = 1 */
  function superPoint(th, rx, ry, n) {
    const c = Math.cos(th), s = Math.sin(th), e = 2 / n;
    return [rx * Math.sign(c) * Math.pow(Math.abs(c), e), ry * Math.sign(s) * Math.pow(Math.abs(s), e)];
  }
  function superPath(ctx, rx, ry, n, wob = 0, phase = 0, N = 120) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const [x, y] = superPoint(th, rx, ry, n);
      const k = 1 + wob * Math.sin(th * 3 + phase) + wob * 0.5 * Math.sin(th * 5 - phase * 1.3);
      if (i === 0) ctx.moveTo(x * k, y * k); else ctx.lineTo(x * k, y * k);
    }
    ctx.closePath();
  }
  function star4(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.closePath(); }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ------------------------------------------------------------------ the bubble */
  class AkayaBubble {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} opts  size (rx as a fraction of min(w,h)), n, ryRatio, center [fx,fy], autoStart,
     *                       glow, shadow, glowBlend, interactive, seed, width/height (CSS px override)
     */
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.o = Object.assign({ n: SHAPE.n, ryRatio: SHAPE.ryRatio, size: 0.28, center: [0.5, 0.5], autoStart: true,
        glow: true, shadow: true, glowBlend: 'screen', interactive: true, seed: 7, dpr: (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1) }, opts);
      this.rand = mulberry32(this.o.seed);
      this.t = 0; this._timers = []; this._tid = 1; this._ls = {};
      const S = SPRINGS;
      this.px = new Spring(0, S.travel); this.py = new Spring(0, S.travel); this.rot = new Spring(0, S.tilt);
      this.sq = new Spring(0, S.squash); this.shake = new Spring(0, S.shake);
      this.gx = new Spring(0, S.gaze); this.gy = new Spring(0, S.gaze);
      this.badgeS = new Spring(0, S.badge); this.badgeY = new Spring(0, S.drop); this.bellRot = new Spring(0, { k: 120, z: 0.14 });
      this.level = new Spring(0, S.level); this.levelIn = 0;
      this.glowC = [0, 1, 2].map(() => new Spring(0, S.glow)); this.glowA = new Spring(0.5, S.glow); this.dim = new Spring(0, S.glow);
      this.eyeScale = new Spring(1, { k: 260, z: 0.45 }); this.lidY = new Spring(0, { k: 200, z: 0.75 }); this.lidA = new Spring(0, { k: 200, z: 0.75 });
      this.blush = new Spring(0, S.glow);
      this.accY = new Spring(0, S.drop); this.accTilt = new Spring(0, { k: 90, z: 0.25 }); this.tassel = new Spring(0, { k: 60, z: 0.18 });
      this.holiA = new Spring(0, { k: 80, z: 0.9 }); this.accOld = null; this.acc = null;
      this.eyeMode = 'open'; this.blinkT = -1; this.nextBlink = 1.2; this.squeezeUntil = -1;
      this.saccX = 0; this.saccY = 0; this.nextSacc = 0.5; this.nextBell = 0; this.nextEmit = 0;
      this.hopping = false; this.hopY = 0; this.hopV = 0; this.hopBounces = 0;
      this.userOff = [0, 0]; this.particles = []; this.pointer = null; this.state = null; this._cx = 0; this._cy = 0;
      this.resize();
      this.setState(opts.state || 'idle', { instant: true });
      if (opts.accessory) this.setAccessory(opts.accessory, { instant: true });
      if (this.o.interactive) this._bindPointer();
      if (this.o.autoStart) this.start();
    }

    /* ---------- events & clock ---------- */
    on(ev, fn) { (this._ls[ev] = this._ls[ev] || []).push(fn); return () => this.off(ev, fn); }
    off(ev, fn) { this._ls[ev] = (this._ls[ev] || []).filter(f => f !== fn); }
    emit(ev, data) { (this._ls[ev] || []).forEach(f => f(data)); }
    /** Run fn after `sec` seconds of bubble time (deterministic, pauses with the bubble). Returns an id. */
    after(sec, fn) { const id = this._tid++; this._timers.push({ id, at: this.t + sec, fn }); return id; }
    cancel(id) { this._timers = this._timers.filter(x => x.id !== id); }
    /** Scheduler adapter for the state machine: {set(fn, ms), clear(id)} */
    get scheduler() { return { set: (fn, ms) => this.after(ms / 1000, fn), clear: id => this.cancel(id) }; }
    start() { if (this._raf) return; let last = performance.now(); const loop = (now) => { this.tick(Math.min(0.05, (now - last) / 1000)); last = now; this._raf = requestAnimationFrame(loop); }; this._raf = requestAnimationFrame(loop); }
    stop() { cancelAnimationFrame(this._raf); this._raf = null; }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.w = this.o.width || r.width || this.canvas.width; this.h = this.o.height || r.height || this.canvas.height;
      const d = this.o.dpr; this.canvas.width = Math.round(this.w * d); this.canvas.height = Math.round(this.h * d);
      this.rx = Math.min(this.w, this.h) * this.o.size; this.ry = this.rx * this.o.ryRatio;
      this.hx = this.w * this.o.center[0]; this.hy = this.h * this.o.center[1]; this._cx = this.hx; this._cy = this.hy;
    }

    /* ---------- public API ---------- */
    get states() { return STATE_ORDER.slice(); }
    setState(name, { instant = false, force = false } = {}) {
      name = ALIASES[name] || name;
      const st = STATES[name]; if (!st) throw new Error('Unknown Akaya state: ' + name);
      if (name === this.state && !force) return this;
      const prev = this.state; this.state = name; this.enterT = this.t;
      const g = hexToRgb(st.glow);
      this.glowC.forEach((s, i) => instant ? s.snap(g[i]) : s.set(g[i]));
      const setS = (s, v) => instant ? s.snap(v) : s.set(v);
      setS(this.glowA, st.glowAmt); setS(this.dim, st.dim || 0); setS(this.eyeScale, st.eyeScale || 1);
      setS(this.lidY, st.lid ? st.lid[0] : 0); setS(this.lidA, st.lid ? st.lid[1] : 0); setS(this.blush, st.blush || 0);
      this.badge = st.badge;
      if (instant) { this.eyeMode = st.eyes; this.badgeS.snap(1); this.badgeY.snap(0); this._retarget(false, true); }
      else {
        this.blink(() => { this.eyeMode = st.eyes; }, 0.3);           // blink-swap: close, swap eyes, open
        this.badgeS.snap(0.0).set(1);                                  // badge pops in with overshoot
        if (st.badgeDrop) { this.badgeY.snap(-2.4).set(0); this._badgeLanded = false; }
        this._retarget(true);
        switch (st.enter) {
          case 'hop1': this.hop(3.0, 0); break;
          case 'bounce': this.after(0.32, () => this.hop(4.0, 2)); break;
          case 'jump': this.hop(5.2, 1); break;
          case 'shake': this.after(0.06, () => { this.shake.kick(8); this.sq.kick(2); }); this.after(0.7, () => this.shake.kick(-4)); break;
        }
        if (st.sparkles) for (let i = 0; i < 10; i++) this.after(0.12 + i * 0.03, () => this._emitSpark(true));
      }
      this.nextEmit = this.t + 0.2;
      this.emit('statechange', { state: name, prev });
      return this;
    }
    /** Mic level 0..1 (feed analyser RMS). Drives listening rings, glow and body pulse. */
    setLevel(v) { this.levelIn = clamp(v, 0, 1); return this; }
    /** Eyes follow this point (canvas CSS px). null = idle glances. */
    lookAt(x, y) { this.pointer = (x == null) ? null : { x, y }; return this; }
    /** Travel to an offset from home (in rx units) with anticipation → travel → overshoot → settle. */
    moveTo(ox, oy, { anticipate = true } = {}) { this.userOff = [ox, oy]; this._retarget(anticipate); return this; }
    /** Travel so the bubble centre ends at canvas point (x,y). */
    moveToPoint(x, y, o) { const st = STATES[this.state], p = st.pose || [0, 0]; return this.moveTo((x - this.hx) / this.rx - p[0], (y - this.hy) / this.rx - p[1], o); }
    hitTest(x, y) { const dx = (x - this._cx) / (this.rx * 1.05), dy = (y - this._cy) / (this.ry * 1.05); return Math.pow(Math.abs(dx), this.o.n) + Math.pow(Math.abs(dy), this.o.n) <= 1; }
    /** Tap at canvas point: flinch away from it (squash, squeeze eyes, spring back). */
    tapAt(x, y) {
      let dx = (this._cx - x) / this.rx, dy = (this._cy - y) / this.rx; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      this.px.kick(dx * 4.2); this.py.kick(dy * 3.2 - 0.6); this.rot.kick(dx * 5.5); this.sq.kick(5);
      this.squeezeUntil = this.t + 0.36;
      this.emit('tap', { x, y }); return this;
    }
    /** Put on / swap an accessory: 'diya' | 'holi' | 'santa' | 'gradcap' | null. It drops in with a bounce. */
    setAccessory(type, { instant = false } = {}) {
      if (type && !ACCESSORIES[type]) throw new Error('Unknown accessory: ' + type);
      if (this.acc && this.acc.type === type) return this;
      if (this.acc && !instant) this.accOld = { type: this.acc.type, y: new Spring(0, { k: 120, z: 0.9 }).set(-3), a: 1, holi: this.holiA.v };
      this.acc = type ? { type, landed: instant } : null;
      this.holiA.snap(instant && type === 'holi' ? 1 : 0); if (type !== 'holi') this.holiA.set(0);
      if (type) { if (instant) this.accY.snap(0); else this.accY.snap(-2.8).set(0); this.accTilt.snap(0); }
      this.emit('accessory', { accessory: type }); return this;
    }
    blink(swap, dur = 0.2) { this.blinkT = 0; this.blinkDur = dur; this._swap = swap || null; }
    hop(v0 = 4, bounces = 0) {
      this.sq.kick(3.2);                                   // anticipation: crouch
      this.after(0.11, () => { this.hopping = true; this.hopV = -v0; this.hopBounces = bounces; this.sq.kick(-4.5); });
    }

    /* ---------- internals ---------- */
    _retarget(anticipate, instant) {
      const st = STATES[this.state], p = st.pose || [0, 0, 0];
      const tx = this.userOff[0] + p[0], ty = this.userOff[1] + p[1]; this.baseRot = p[2] || 0;
      if (instant) { this.px.snap(tx); this.py.snap(ty); this.rot.snap(this.baseRot); return; }
      const dx = tx - this.px.target, dy = ty - this.py.target, d = Math.hypot(dx, dy);
      if (!anticipate || d < 0.04) { this.px.set(tx); this.py.set(ty); return; }
      const a = Math.min(0.12, d * 0.18);
      this.px.set(this.px.v - dx / d * a); this.py.set(this.py.v - dy / d * a);   // wind up, opposite way
      this.sq.kick(2.4);
      clearTimeout(this._antT); this.cancel(this._antId);
      this._antId = this.after(0.12, () => { this.px.set(tx); this.py.set(ty); this.sq.kick(-2.8); });
    }
    _bindPointer() {
      const el = this.canvas;
      const pos = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      window.addEventListener('pointermove', e => { const [x, y] = pos(e); this.lookAt(x, y); });
      el.addEventListener('pointerdown', e => { const [x, y] = pos(e); if (this.hitTest(x, y)) this.tapAt(x, y); else this.emit('stageclick', { x, y }); });
    }
    _emitSpark(burst) {
      const a = this.rand() * Math.PI * 2, r = this.rx * (burst ? 1.0 : 1.05 + this.rand() * 0.4);
      const sp = burst ? this.rx * (1.4 + this.rand() * 1.2) : this.rx * 0.25;
      const cols = ['#ffffff', '#b9ffdf', BRAND.green, '#9be7ff', '#ffe27a'];
      this.particles.push({ type: 'spark', x: this._cx + Math.cos(a) * r * 0.8, y: this._cy + Math.sin(a) * r * 0.75, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - this.rx * 0.2, drag: 2.2, g: 0,
        life: 0, max: 0.9 + this.rand() * 0.5, size: this.rx * (0.07 + this.rand() * 0.07), color: cols[(this.rand() * cols.length) | 0], rot: this.rand() * 3, vr: (this.rand() - 0.5) * 6 });
    }
    _emit(st) {
      const R = this.rx, rnd = this.rand;
      if (st.zzz) { this.particles.push({ type: 'text', text: 'z', font: `700 ${R * (0.2 + rnd() * 0.12)}px Comfortaa, ${FONT_STACK}`, color: '#c9d0ff', x: this._cx + R * 0.55, y: this._cy - R * 0.55, vx: R * 0.28, vy: -R * 0.42, drag: 0, g: 0, wob: R * 0.12, life: 0, max: 2.4, rot: -0.2, vr: 0.15 }); return 1.0; }
      if (st.glyphs) { const side = rnd() < 0.5 ? -1 : 1; const word = rnd() < 0.5 ? GREETINGS[(rnd() * GREETINGS.length) | 0] : GLYPHS[(rnd() * GLYPHS.length) | 0];
        this.particles.push({ type: 'text', text: word, font: `700 ${Math.max(11, R * 0.17)}px ${FONT_STACK}`, color: 'rgba(235,250,255,1)', x: this._cx + side * R * 0.9, y: this._cy + R * (rnd() * 0.6 - 0.4), vx: side * R * 0.55, vy: -R * 0.25, drag: 0.4, g: 0, life: 0, max: 1.7, rot: 0, vr: 0 }); return 0.5; }
      if (st.sparkles) { this._emitSpark(false); return 0.35; }
      return 0;
    }
    _holiBurst() {
      const cols = ['#ff3fa4', '#ffd23f', BRAND.green, BRAND.cyan, BRAND.orange, BRAND.violet];
      for (let i = 0; i < 46; i++) { const a = -Math.PI * (0.05 + this.rand() * 0.9), sp = this.rx * (1 + this.rand() * 2.6);
        this.particles.push({ type: 'dot', x: this._cx + (this.rand() - 0.5) * this.rx * 0.6, y: this._cy - this.ry * 0.9, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 2.4, g: this.rx * 3.5,
          life: 0, max: 0.8 + this.rand() * 0.7, size: this.rx * (0.025 + this.rand() * 0.05), color: cols[i % cols.length] }); }
    }

    /** Advance the simulation by dt seconds (sub-stepped) and draw one frame. */
    tick(dt) { this.update(dt); this.render(); }
    update(dt) {
      let rem = dt; while (rem > 1e-6) { const h = Math.min(rem, 1 / 240); this._step(h); rem -= h; }
    }
    _step(dt) {
      const st = STATES[this.state], spd = st.speed || 1;
      this.t += dt;
      if (this._timers.length) { const due = this._timers.filter(x => x.at <= this.t); if (due.length) { this._timers = this._timers.filter(x => x.at > this.t); due.forEach(x => x.fn()); } }
      // blink: close 40% · hold 15% · open 45%
      if (this.blinkT >= 0) { this.blinkT += dt; if (this._swap && this.blinkT >= this.blinkDur * 0.45) { this._swap(); this._swap = null; } if (this.blinkT >= this.blinkDur) this.blinkT = -1; }
      else if (this.t >= this.nextBlink) { if (this.eyeMode === 'open') this.blink(null, 0.17); this.nextBlink = this.t + (2.4 + this.rand() * 2.8) / spd; }
      // gaze
      let tx = 0, ty = 0;
      switch (st.gaze) {
        case 'pointer':
          if (this.pointer) { const dx = this.pointer.x - this._cx, dy = this.pointer.y - this._cy, d = Math.hypot(dx, dy) + 1e-3, m = Math.min(1, d / (this.rx * 2.6)); tx = dx / d * m; ty = dy / d * m; }
          else { if (this.t > this.nextSacc) { this.saccX = (this.rand() - 0.5) * 0.9; this.saccY = (this.rand() - 0.5) * 0.4; this.nextSacc = this.t + 1.1 + this.rand() * 2; } tx = this.saccX; ty = this.saccY; }
          break;
        case 'upRight': tx = 0.55 + 0.12 * Math.sin(this.t * 1.3); ty = -0.7; break;
        case 'downRight': tx = 0.62; ty = 0.45; break;
        case 'scan': { const f = (this.t * 0.85) % 1; tx = f < 0.82 ? lerp(-0.7, 0.7, f / 0.82) : lerp(0.7, -0.7, (f - 0.82) / 0.18); ty = 0.12; break; }
        case 'soft': tx = Math.sin(this.t * 0.5) * 0.25; ty = 0.18; break;
      }
      this.gx.set(clamp(tx, -1, 1)); this.gy.set(clamp(ty, -1, 1));
      // glow colour (translating alternates cyan ↔ green)
      if (st.glow2) { const m = (Math.sin(this.t * 1.6) + 1) / 2, a = hexToRgb(st.glow), b = hexToRgb(st.glow2); this.glowC.forEach((s, i) => s.set(lerp(a[i], b[i], m))); }
      this.level.set(this.state === 'listening' ? this.levelIn : 0);
      // continuous motion per state
      const lean = clamp(this.px.vel * 0.05, -0.3, 0.3);
      this.rot.set((this.baseRot || 0) + lean + (st.sway ? Math.sin(this.t * 1.1) * 0.05 : 0));
      this.sq.set(this.state === 'listening' ? -this.level.v * 0.07 : 0);
      if (this.state === 'reminder' && this._badgeLanded !== false && this.t > this.nextBell) { this.bellRot.kick(5); this.nextBell = this.t + 1.5; }
      if (this.t >= this.nextEmit) { const gap = this._emit(st); this.nextEmit = this.t + (gap ? gap * (0.8 + this.rand() * 0.4) : 0.5); }
      // hop: ballistic (rx units), squash on every landing
      if (this.hopping) {
        this.hopV += 22 * dt; this.hopY += this.hopV * dt;
        if (this.hopY >= 0) { const v = this.hopV; this.hopY = 0; this.sq.kick(clamp(v * 1.1, 0, 7));
          if (this.hopBounces > 0 && v > 1.6) { this.hopV = -v * 0.45; this.hopBounces--; this.emit('bounce', { v }); } else { this.hopping = false; this.hopV = 0; this.emit('land', { by: 'hop', v }); } }
      }
      // accessory drop: spring towards the head, collide with it (bounce + squash the body)
      this.accY.step(dt);
      if (this.acc && this.accY.v > 0) { const v = this.accY.vel; this.accY.v = 0;
        if (v > 0.6) { this.accY.vel = -v * 0.32; this.sq.kick(clamp(v * 0.28, 0, 6.5)); this.tassel.kick(-v * 0.25);
          if (!this.acc.landed) { this.acc.landed = true; if (this.acc.type === 'holi') { this.holiA.set(1); this._holiBurst(); } this.emit('land', { by: 'accessory', accessory: this.acc.type }); } }
        else this.accY.vel = 0; }
      // notification badge drop (reminder)
      this.badgeY.step(dt);
      if (this.badgeY.v > 0) { const v = this.badgeY.vel; this.badgeY.v = 0;
        if (v > 0.6) { this.badgeY.vel = -v * 0.3; this.sq.kick(clamp(v * 0.24, 0, 5.5)); this.bellRot.kick(6); if (this._badgeLanded === false) { this._badgeLanded = true; this.nextBell = this.t + 0.9; this.emit('land', { by: 'badge' }); } }
        else this.badgeY.vel = 0; }
      this.accTilt.set(-this.rot.v * 0.5 - this.px.vel * 0.04);
      this.tassel.set(-this.px.vel * 0.12 - this.rot.v * 0.8);
      if (this.accOld) { this.accOld.y.step(dt); this.accOld.a -= dt * 3.2; if (this.accOld.a <= 0) this.accOld = null; }
      [this.px, this.py, this.rot, this.sq, this.shake, this.gx, this.gy, this.badgeS, this.bellRot, this.level, this.glowA, this.dim,
        this.eyeScale, this.lidY, this.lidA, this.blush, this.accTilt, this.tassel, this.holiA, ...this.glowC].forEach(s => s.step(dt));
      this.sq.v = clamp(this.sq.v, -0.32, 0.32);
      // particles
      for (const p of this.particles) { p.life += dt; p.vx *= Math.exp(-(p.drag || 0) * dt); p.vy *= Math.exp(-(p.drag || 0) * dt); p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt; }
      this.particles = this.particles.filter(p => p.life < p.max);
    }

    /* ---------- drawing ---------- */
    render() {
      const c = this.ctx, d = this.o.dpr, st = STATES[this.state], rx = this.rx, ry = this.ry, n = this.o.n, t = this.t;
      c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, this.w, this.h);
      const spd = st.speed || 1;
      const breath = Math.sin(t * 2 * Math.PI / st.breath[1]);
      const fl = Math.sin(t * 2 * Math.PI / (st.breath[1] * 1.15) + 0.6) * st.float * rx;
      const cx = this.hx + (this.px.v + this.shake.v) * rx, cy = this.hy + (this.py.v + this.hopY) * rx + fl;
      this._cx = cx; this._cy = cy;
      const glowRGB = this.glowC.map(s => clamp(s.v, 0, 255)), dim = clamp(this.dim.v, 0, 1), lvl = clamp(this.level.v, 0, 1);
      let sy = (1 - this.sq.v) * (1 + st.breath[0] * breath) * (1 + lvl * 0.05), sx = 1 / Math.sqrt(sy) / (1 + st.breath[0] * breath * 0.4);
      sx = 1 / sy * (1 - st.breath[0] * breath * 0.5); // area-preserving squash
      // directional stretch from velocity
      const vx = this.px.vel + this.shake.vel * 0.15, vy = this.py.vel + this.hopV; const speed = Math.hypot(vx, vy);
      const stretch = clamp(speed * 0.014, 0, 0.12), ang = Math.atan2(vy, vx);

      // 1) ambient mood glow
      if (this.o.glow) {
        c.save(); c.globalCompositeOperation = this.o.glowBlend;
        const gr = rx * SHAPE.glowR * (1 + lvl * 0.22 + 0.03 * breath), ga = this.glowA.v * (1 + 0.06 * breath + lvl * 0.25);
        const g = c.createRadialGradient(cx, cy + ry * 0.1, rx * 0.2, cx, cy + ry * 0.1, gr);
        g.addColorStop(0, rgba(glowRGB, clamp(ga, 0, 1))); g.addColorStop(0.42, rgba(glowRGB, clamp(ga * 0.42, 0, 1))); g.addColorStop(1, rgba(glowRGB, 0));
        c.fillStyle = g; c.fillRect(cx - gr, cy - gr, gr * 2, gr * 2); c.restore();
      }
      // 2) listening rings (follow mic level)
      if (st.rings || this.state === 'listening') {
        for (let i = 0; i < 3; i++) { const ph = ((t * 0.9 + i / 3) % 1), k = 1.08 + ph * (0.75 + lvl * 0.5);
          c.save(); c.translate(cx, cy); c.strokeStyle = rgba(glowRGB, (1 - ph) * (0.18 + lvl * 0.6)); c.lineWidth = rx * (0.025 + lvl * 0.03);
          superPath(c, rx * k, ry * k, n); c.stroke(); c.restore(); }
      }
      // 3) contact shadow on the floor
      if (this.o.shadow) {
        const floorY = this.hy + ry * SHAPE.floor + (this.userOff[1]) * rx, bottom = cy + ry * sy;
        const hgt = Math.max(0, (floorY - bottom) / rx), sw = rx * 1.05 * (1 - Math.min(0.5, hgt * 0.35)) * sx, a = 0.5 * (1 - Math.min(0.65, hgt * 0.45)) * (1 - dim * 0.3);
        c.save(); c.translate(cx, floorY); c.scale(1, 0.2);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, sw); g.addColorStop(0, `rgba(4,6,20,${a})`); g.addColorStop(0.6, `rgba(4,6,20,${a * 0.45})`); g.addColorStop(1, 'rgba(4,6,20,0)');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, sw, 0, Math.PI * 2); c.fill();
        c.globalCompositeOperation = this.o.glowBlend; const g2 = c.createRadialGradient(0, 0, 0, 0, 0, sw * 1.3); g2.addColorStop(0, rgba(glowRGB, 0.25 * this.glowA.v)); g2.addColorStop(1, rgba(glowRGB, 0));
        c.fillStyle = g2; c.beginPath(); c.arc(0, 0, sw * 1.3, 0, Math.PI * 2); c.fill(); c.restore();
      }
      // body local transform: pivot near the bottom so squash flattens onto the floor
      const piv = ry * 0.85;
      c.save(); c.translate(cx, cy + piv); c.rotate(this.rot.v);
      c.rotate(ang); c.scale(1 + stretch, 1 / (1 + stretch)); c.rotate(-ang);
      c.scale(sx, sy); c.translate(0, -piv);
      const wob = clamp(Math.abs(this.sq.vel) * 0.004, 0, 0.025);
      this._drawBody(c, rx, ry, n, dim, t, wob);
      if (this.holiA.v > 0.01 || (this.accOld && this.accOld.type === 'holi')) this._drawHoli(c, rx, ry, n, Math.max(this.holiA.v, this.accOld && this.accOld.type === 'holi' ? this.accOld.a : 0));
      this._drawFace(c, rx, ry, st);
      if (this.accOld && this.accOld.type !== 'holi') { c.save(); c.globalAlpha = clamp(this.accOld.a, 0, 1); this._drawAccessory(c, this.accOld.type, rx, ry, this.accOld.y.v, 0); c.restore(); }
      if (this.acc) this._drawAccessory(c, this.acc.type, rx, ry, this.accY.v, this.accTilt.v);
      this._drawBadge(c, rx, ry, n, st, glowRGB, lvl);
      c.restore();
      // 4) particles
      this._drawParticles(c);
    }

    _drawBody(c, rx, ry, n, dim, t, wob) {
      const filt = dim > 0.01 ? `saturate(${1 - dim * 0.75}) brightness(${1 - dim * 0.42})` : 'none';
      const F = (extra) => (filt === 'none' ? (extra || 'none') : filt + (extra ? ' ' + extra : ''));
      c.save(); c.filter = F();
      superPath(c, rx, ry, n, wob, t * 9); c.save(); c.clip();
      const R = Math.max(rx, ry) * 1.25;
      const P = this.o.palette;   // optional multicolour blend (null = the original v1 glass)
      let g = P && P.gradDir === 'v' ? c.createLinearGradient(-rx * 0.15, -ry, rx * 0.15, ry) : c.createLinearGradient(-rx, -ry, rx, ry);
      if (P) P.stops.forEach(([o, col]) => g.addColorStop(o, col));
      else { g.addColorStop(0, '#b4ecff'); g.addColorStop(0.36, '#82a9ff'); g.addColorStop(0.68, '#9d7cff'); g.addColorStop(1, '#d68aff'); }
      c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
      const blob = (x, y, r, col, a) => { const gg = c.createRadialGradient(x * rx, y * ry, 0, x * rx, y * ry, r * rx); gg.addColorStop(0, rgba(hexToRgb(col), a)); gg.addColorStop(1, rgba(hexToRgb(col), 0)); c.fillStyle = gg; c.fillRect(-R, -R, R * 2, R * 2); };
      const sw = Math.sin(t * 0.7) * 0.06;
      if (P) {
        P.blobs.forEach(([x, y, r, col, a], i) => blob(x + (i % 2 ? -sw : sw), y, r, col, a));
        if (P.speck) { const r0 = mulberry32(77), cols = ['#ff3fa4', '#ffd23f', '#08da73', '#0dabf4', '#ffffff']; for (let i = 0; i < 55; i++) { c.fillStyle = rgba(hexToRgb(cols[i % 5]), 0.6 + r0() * 0.35); c.beginPath(); c.arc((r0() - 0.5) * 2.1 * rx, (r0() - 0.5) * 2.1 * ry, rx * (0.012 + r0() * 0.028), 0, Math.PI * 2); c.fill(); } }
        if (P.swirls) P.swirls.forEach(w => { c.save(); c.filter = F(`blur(${rx * (w.blur || 0.09)}px)`); c.lineCap = 'round'; c.lineWidth = rx * w.w; const p = w.pts.map(([x, y]) => [x * rx, y * ry]);
          if (w.grad) { const gg = c.createLinearGradient(p[0][0], p[0][1], p[3][0], p[3][1]); w.grad.forEach(([o, k]) => gg.addColorStop(o, k)); c.strokeStyle = gg; } else c.strokeStyle = w.col;
          c.globalAlpha = w.a; c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]); c.stroke(); c.restore(); });
      } else {
      blob(-0.58 + sw, 0.66, 0.78, BRAND.green, 0.42); blob(0.52, 0.36 - sw, 0.82, '#ff86d8', 0.45);
      blob(-0.38, -0.36 + sw, 0.72, BRAND.cyan, 0.4); blob(0.46 + sw, -0.58, 0.62, '#d9ccff', 0.45);
      }
      if (c.createConicGradient && !(P && P.conic === false)) {
        const cg = c.createConicGradient(t * 0.35, -rx * 0.1, -ry * 0.05);
        ((P && P.conic) || [[0, BRAND.cyan], [0.2, BRAND.violet], [0.42, '#ff7ad1'], [0.6, BRAND.blue], [0.8, BRAND.green], [1, BRAND.cyan]]).forEach(([o, col]) => cg.addColorStop(o, col));
        c.globalAlpha = P && P.conicA != null ? P.conicA : 0.3; c.globalCompositeOperation = (P && P.conicMode) || 'soft-light'; c.fillStyle = cg; c.fillRect(-R, -R, R * 2, R * 2);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // form shading: light from the top-left, core shadow bottom-right
      g = c.createRadialGradient(-rx * 0.35, -ry * 0.45, 0, -rx * 0.35, -ry * 0.45, rx * 1.75);
      g.addColorStop(0, 'rgba(255,255,255,0.20)'); g.addColorStop(0.45, 'rgba(70,30,150,0)'); g.addColorStop(1, P && P.shade ? rgba(P.shade, P.shadeA || 0.55) : 'rgba(36,10,100,0.55)');
      c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
      if (P && P.iris) { const I = P.iris, an = I.angle || -0.6, dx = Math.cos(an) * rx * 1.1, dy = Math.sin(an) * ry * 1.1;
        c.save(); c.globalCompositeOperation = I.mode || 'soft-light'; c.globalAlpha = I.a; g = c.createLinearGradient(-dx, -dy, dx, dy);
        I.stops.forEach((k, i) => g.addColorStop(i / (I.stops.length - 1), k)); c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2); c.restore(); }
      // bounce light from the floor
      c.filter = F(`blur(${rx * 0.08}px)`); c.fillStyle = (P && P.bounce) || 'rgba(120,255,214,0.42)';
      c.beginPath(); c.ellipse(rx * 0.12, ry * 0.98, rx * 0.72, ry * 0.2, 0, 0, Math.PI * 2); c.fill();
      // fresnel rim (inner glow following the superellipse)
      c.filter = F(`blur(${rx * 0.06}px)`); c.lineWidth = rx * 0.16; c.strokeStyle = 'rgba(255,255,255,0.34)';
      superPath(c, rx, ry, n, wob, t * 9); c.stroke();
      // soft broad highlight + sharp specular
      c.filter = F(`blur(${rx * 0.05}px)`); c.fillStyle = 'rgba(255,255,255,0.22)';
      c.beginPath(); c.ellipse(-rx * 0.3, -ry * 0.42, rx * 0.5, ry * 0.32, -0.5, 0, Math.PI * 2); c.fill();
      c.filter = F();
      const S = SHAPE.specular; c.save(); c.translate(S.x * rx, S.y * ry); c.rotate(S.rot);
      g = c.createRadialGradient(0, 0, 0, 0, 0, S.rx * rx); g.addColorStop(0, 'rgba(255,255,255,0.97)'); g.addColorStop(0.72, 'rgba(255,255,255,0.88)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.scale(1, S.ry / S.rx * ry / rx); c.fillStyle = g; c.beginPath(); c.arc(0, 0, S.rx * rx, 0, Math.PI * 2); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.arc(-rx * 0.13, -ry * 0.71, rx * 0.04, 0, Math.PI * 2); c.fill();
      c.restore(); // unclip
      c.lineWidth = Math.max(1, rx * 0.014); c.strokeStyle = 'rgba(255,255,255,0.5)'; superPath(c, rx, ry, n, wob, t * 9); c.stroke();
      c.restore();
    }

    _drawHoli(c, rx, ry, n, a) {
      const spots = [[-0.62, 0.3, 0.22, '#ff3fa4'], [0.55, 0.42, 0.2, '#ffd23f'], [0.12, -0.66, 0.17, BRAND.green], [-0.22, 0.62, 0.17, BRAND.cyan], [0.66, -0.12, 0.13, BRAND.orange], [-0.5, -0.5, 0.12, BRAND.violet]];
      c.save(); superPath(c, rx, ry, n); c.clip(); c.globalAlpha = clamp(a, 0, 1) * 0.6;
      spots.forEach(([x, y, r, col], i) => { const rr = mulberry32(i * 31 + 5); c.fillStyle = col;
        for (let k = 0; k < 7; k++) { const ox = (rr() - 0.5) * r * 1.3, oy = (rr() - 0.5) * r * 1.1, s = r * (0.35 + rr() * 0.5); c.beginPath(); c.arc((x + ox) * rx, (y + oy) * ry, s * rx, 0, Math.PI * 2); c.fill(); }
        for (let k = 0; k < 5; k++) { const ox = (rr() - 0.5) * r * 2.4, oy = (rr() - 0.5) * r * 3; c.beginPath(); c.arc((x + ox) * rx, (y + oy) * ry, rx * 0.012 * (1 + rr() * 2), 0, Math.PI * 2); c.fill(); } });
      c.restore();
    }

    _eyeGeom(rx, ry) {
      const E = SHAPE.eye, gx = this.gx.v, gy = this.gy.v, out = [];
      for (const side of [-1, 1]) {
        const yaw = side * E.yaw + gx * 0.36, pitch = E.pitch + gy * 0.3;
        out.push({ side, x: rx * 0.96 * Math.sin(yaw), y: ry * 0.96 * Math.sin(pitch) + ry * 0.02, fw: Math.pow(Math.cos(yaw), 0.7), fh: Math.pow(Math.cos(pitch), 0.7) });
      }
      return out;
    }
    _drawFace(c, rx, ry, st) {
      const E = SHAPE.eye, es = this.eyeScale.v;
      let open = 1; if (this.blinkT >= 0) { const f = this.blinkT / this.blinkDur; open = f < 0.4 ? 1 - f / 0.4 : f < 0.55 ? 0 : (f - 0.55) / 0.45; open = clamp(open, 0, 1); }
      const squeeze = this.t < this.squeezeUntil;
      const eyes = this._eyeGeom(rx, ry);
      // blush
      if (this.blush.v > 0.02) { c.save(); c.filter = `blur(${rx * 0.04}px)`; c.fillStyle = `rgba(255,105,170,${0.5 * this.blush.v})`;
        eyes.forEach(e => { c.beginPath(); c.ellipse(e.x + e.side * rx * 0.1, e.y + rx * 0.2, rx * 0.11, rx * 0.06, 0, 0, Math.PI * 2); c.fill(); }); c.restore(); }
      for (const e of eyes) {
        const w = rx * E.w * es * e.fw, h = rx * E.h * es * e.fh; c.save(); c.translate(e.x, e.y);
        const ink = '#0e1336';
        if (squeeze) { c.strokeStyle = ink; c.lineWidth = w * 0.3; c.lineCap = 'round'; c.lineJoin = 'round'; const s = -e.side;
          c.beginPath(); c.moveTo(-s * w * 0.42, -h * 0.34); c.lineTo(s * w * 0.42, 0); c.lineTo(-s * w * 0.42, h * 0.34); c.stroke(); }
        else if (this.eyeMode === 'happy') { c.strokeStyle = ink; c.lineWidth = w * 0.32; c.lineCap = 'round'; const k = Math.max(0.15, open);
          c.beginPath(); c.moveTo(-w * 0.55, h * 0.12); c.quadraticCurveTo(0, -h * 0.62 * k, w * 0.55, h * 0.12); c.stroke(); }
        else if (this.eyeMode === 'closed') { c.strokeStyle = ink; c.lineWidth = w * 0.26; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-w * 0.58, -h * 0.02); c.quadraticCurveTo(0, h * 0.42, w * 0.58, -h * 0.02); c.stroke(); }
        else {
          const hh = Math.max(h * open, h * 0.07), inner = -e.side, ly = this.lidY.v, la = this.lidA.v;
          if (ly > 0.005 || Math.abs(la) > 0.005) { const yAt = x => -h / 2 + ly * h - la * inner * x * 0.9;
            c.beginPath(); c.moveTo(-w * 2, yAt(-w * 2)); c.lineTo(w * 2, yAt(w * 2)); c.lineTo(w * 2, h * 2); c.lineTo(-w * 2, h * 2); c.closePath(); c.clip(); }
          const EH = this.o.palette && this.o.palette.eyeHalo;   // optional soft light halo so beads stay readable on darker blends
          if (EH) { c.save(); c.filter = `blur(${w * 0.18}px)`; c.fillStyle = EH; c.beginPath(); c.ellipse(0, 0, w * 0.68, hh * 0.62, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
          const g = c.createLinearGradient(0, -hh / 2, 0, hh / 2); g.addColorStop(0, '#0b0f2c'); g.addColorStop(1, '#27347a');
          c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, w / 2, hh / 2, 0, 0, Math.PI * 2); c.fill();
          if (open > 0.35) { c.fillStyle = 'rgba(255,255,255,0.96)'; c.beginPath(); c.ellipse(-w * 0.16, -hh * 0.2, w * 0.16, w * 0.19 * open, -0.3, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(160,220,255,0.6)'; c.beginPath(); c.arc(w * 0.17, hh * 0.22, w * 0.07, 0, Math.PI * 2); c.fill(); }
        }
        c.restore();
      }
    }

    _drawBadge(c, rx, ry, n, st, glowRGB, lvl) {
      if (!this.badge) return;
      const s = Math.max(0, this.badgeS.v); if (s < 0.01) return;
      const [bx0, by0] = superPoint(SHAPE.badgeAngle, rx, ry, n);
      const small = this.badge === 'presence';
      const br = rx * (small ? 0.1 : SHAPE.badgeR), bx = bx0 * (small ? 0.93 : 0.98), by = by0 * (small ? 0.93 : 0.98) + this.badgeY.v * rx;
      const col = hexToRgb(STATES[this.state].glow), t = this.t;
      c.save(); c.translate(bx, by); c.scale(s, s);
      if (this.badge === 'bell') c.rotate(this.bellRot.v * 0.12 + Math.sin(t * 2) * 0.03);
      c.shadowColor = 'rgba(5,8,30,0.45)'; c.shadowBlur = br * 0.6; c.shadowOffsetY = br * 0.18;
      const g = c.createLinearGradient(0, -br, 0, br); g.addColorStop(0, rgba(col.map(v => Math.min(255, v + 60)), 1)); g.addColorStop(1, rgba(col, 1));
      c.fillStyle = small ? BRAND.green : g; c.beginPath(); c.arc(0, 0, br, 0, Math.PI * 2); c.fill();
      c.shadowColor = 'transparent'; c.lineWidth = br * (small ? 0.32 : 0.14); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
      if (small) { c.restore(); return; }
      const b = br, W = '#ffffff'; c.strokeStyle = W; c.fillStyle = W; c.lineWidth = b * 0.13; c.lineCap = 'round'; c.lineJoin = 'round';
      switch (this.badge) {
        case 'mic': roundRect(c, -b * 0.18, -b * 0.52, b * 0.36, b * 0.62, b * 0.18); c.fill();
          c.beginPath(); c.arc(0, -b * 0.06, b * 0.33, 0.15, Math.PI - 0.15); c.stroke(); c.beginPath(); c.moveTo(0, b * 0.28); c.lineTo(0, b * 0.48); c.stroke();
          c.globalAlpha = 0.85; c.lineWidth = b * 0.09; for (let i = 1; i <= 2; i++) { const a = clamp(lvl * 1.6 - (i - 1) * 0.4, 0, 1); if (a > 0.05) { c.globalAlpha = a; c.beginPath(); c.arc(0, -b * 0.15, b * (0.45 + i * 0.17), -0.7, 0.7); c.stroke(); c.beginPath(); c.arc(0, -b * 0.15, b * (0.45 + i * 0.17), Math.PI - 0.7, Math.PI + 0.7); c.stroke(); } } c.globalAlpha = 1; break;
        case 'dots': for (let i = 0; i < 3; i++) { const yy = -Math.max(0, Math.sin(t * 7 - i * 0.9)) * b * 0.2; c.beginPath(); c.arc((i - 1) * b * 0.36, yy + b * 0.04, b * 0.13, 0, Math.PI * 2); c.fill(); } break;
        case 'send': c.beginPath(); c.moveTo(-b * 0.5, -b * 0.08); c.lineTo(b * 0.52, -b * 0.46); c.lineTo(b * 0.14, b * 0.52); c.lineTo(-b * 0.02, b * 0.1); c.closePath(); c.fill();
          c.strokeStyle = rgba(col, 1); c.lineWidth = b * 0.08; c.beginPath(); c.moveTo(-b * 0.02, b * 0.1); c.lineTo(b * 0.5, -b * 0.44); c.stroke(); break;
        case 'bell': c.beginPath(); c.moveTo(-b * 0.42, b * 0.26); c.quadraticCurveTo(-b * 0.3, b * 0.12, -b * 0.3, -b * 0.08); c.quadraticCurveTo(-b * 0.28, -b * 0.46, 0, -b * 0.48);
          c.quadraticCurveTo(b * 0.28, -b * 0.46, b * 0.3, -b * 0.08); c.quadraticCurveTo(b * 0.3, b * 0.12, b * 0.42, b * 0.26); c.closePath(); c.fill();
          c.beginPath(); c.arc(0, b * 0.36, b * 0.11, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(0, -b * 0.52, b * 0.07, 0, Math.PI * 2); c.fill(); break;
        case 'offline': // cloud with a slash
          c.lineWidth = b * 0.11; c.beginPath(); c.moveTo(-b * 0.36, b * 0.26); c.arc(-b * 0.28, b * 0.06, b * 0.2, Math.PI * 0.6, Math.PI * 1.45); c.arc(0, -b * 0.08, b * 0.27, Math.PI * 1.1, Math.PI * 1.95);
          c.arc(b * 0.3, b * 0.08, b * 0.18, Math.PI * 1.5, Math.PI * 0.5); c.closePath(); c.stroke();
          c.lineWidth = b * 0.12; c.beginPath(); c.moveTo(-b * 0.46, -b * 0.46); c.lineTo(b * 0.46, b * 0.46); c.stroke(); break;
        case 'lang': { const f = (t - this.enterT) / 0.75, i = Math.floor(f) % GLYPHS.length, ph = f % 1, k = ph < 0.14 ? ph / 0.14 : 1;
          c.save(); c.scale(k, 1); c.font = `800 ${b * 0.95}px ${FONT_STACK}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(GLYPHS[i], 0, b * 0.04); c.restore(); break; }
        case 'alert': roundRect(c, -b * 0.09, -b * 0.5, b * 0.18, b * 0.62, b * 0.09); c.fill(); c.beginPath(); c.arc(0, b * 0.36, b * 0.11, 0, Math.PI * 2); c.fill(); break;
        case 'check': c.lineWidth = b * 0.17; c.beginPath(); c.moveTo(-b * 0.38, b * 0.02); c.lineTo(-b * 0.1, b * 0.3); c.lineTo(b * 0.4, -b * 0.28); c.stroke(); break;
        case 'moon': c.beginPath(); c.arc(0, 0, b * 0.42, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(b * 0.22, -b * 0.16, b * 0.36, 0, Math.PI * 2); c.fill(); break;
      }
      c.restore();
    }

    _drawAccessory(c, type, rx, ry, dropY, tilt) {
      const u = rx, t = this.t;
      c.save(); c.translate(0, -ry * 0.8 + dropY * rx); c.rotate(tilt);
      const P = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * u, y * u) : c.moveTo(x * u, y * u)); c.closePath(); };
      if (type === 'santa') {
        c.save(); c.shadowColor = 'rgba(30,0,10,0.35)'; c.shadowBlur = u * 0.1; c.shadowOffsetY = u * 0.04;
        let g = c.createLinearGradient(-0.6 * u, -0.9 * u, 0.5 * u, 0); g.addColorStop(0, '#ff5a52'); g.addColorStop(1, '#b3172b');
        c.fillStyle = g; c.beginPath(); c.moveTo(0.56 * u, -0.04 * u);
        c.bezierCurveTo(0.5 * u, -0.62 * u, 0.12 * u, -0.98 * u, -0.22 * u, -0.92 * u);
        c.bezierCurveTo(-0.52 * u, -0.86 * u, -0.7 * u, -0.62 * u, -0.78 * u, -0.38 * u);
        c.bezierCurveTo(-0.62 * u, -0.48 * u, -0.44 * u, -0.56 * u, -0.32 * u, -0.48 * u);
        c.bezierCurveTo(-0.44 * u, -0.34 * u, -0.54 * u, -0.2 * u, -0.56 * u, -0.04 * u); c.closePath(); c.fill(); c.restore();
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-0.08 * u, -0.6 * u, 0.16 * u, 0.06 * u, -0.6, 0, Math.PI * 2); c.fill();
        g = c.createLinearGradient(0, -0.16 * u, 0, 0.12 * u); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe4f2');
        c.fillStyle = g; roundRect(c, -0.68 * u, -0.15 * u, 1.36 * u, 0.26 * u, 0.13 * u); c.fill();
        c.fillStyle = 'rgba(190,200,225,0.55)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc((-0.56 + i * 0.14) * u, (-0.02 + (i % 2) * 0.05) * u, 0.025 * u, 0, Math.PI * 2); c.fill(); }
        const pg = c.createRadialGradient(-0.82 * u, -0.42 * u, 0, -0.78 * u, -0.38 * u, 0.15 * u); pg.addColorStop(0, '#fff'); pg.addColorStop(1, '#d9deee');
        c.fillStyle = pg; c.beginPath(); c.arc(-0.79 * u, -0.37 * u, 0.14 * u, 0, Math.PI * 2); c.fill();
      } else if (type === 'gradcap') {
        c.fillStyle = '#1c2246'; c.beginPath(); c.moveTo(-0.46 * u, 0.04 * u); c.lineTo(-0.42 * u, -0.3 * u); c.quadraticCurveTo(0, -0.4 * u, 0.42 * u, -0.3 * u); c.lineTo(0.46 * u, 0.04 * u); c.quadraticCurveTo(0, 0.14 * u, -0.46 * u, 0.04 * u); c.fill();
        c.fillStyle = '#10142e'; P([[-0.88, -0.32], [0, -0.55], [0.88, -0.32], [0, -0.09]]); c.fill();
        const g = c.createLinearGradient(0, -0.62 * u, 0, -0.14 * u); g.addColorStop(0, '#3a4380'); g.addColorStop(1, '#232a58');
        c.fillStyle = g; P([[-0.88, -0.38], [0, -0.61], [0.88, -0.38], [0, -0.15]]); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = u * 0.015; c.stroke();
        c.fillStyle = '#f5b82e'; c.beginPath(); c.arc(0, -0.38 * u, 0.05 * u, 0, Math.PI * 2); c.fill();
        const a = this.tassel.v * 0.6 + Math.sin(t * 1.7) * 0.05, ex = -0.66 * u + Math.sin(a) * 0.4 * u, ey = -0.4 * u + Math.cos(a) * 0.4 * u;
        c.strokeStyle = '#f5b82e'; c.lineWidth = u * 0.03; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -0.38 * u); c.lineTo(-0.66 * u, -0.4 * u); c.lineTo(ex, ey); c.stroke();
        c.save(); c.translate(ex, ey); c.rotate(-a); c.fillStyle = '#f5b82e'; P([[-0.06, 0], [0.06, 0], [0.08, 0.2], [-0.08, 0.2]]); c.fill(); c.restore();
      } else if (type === 'diya') {
        // flame glow
        c.save(); c.globalCompositeOperation = 'screen'; const fl = 1 + Math.sin(t * 17) * 0.05 + Math.sin(t * 29 + 1) * 0.04;
        const gg = c.createRadialGradient(0.33 * u, -0.36 * u, 0, 0.33 * u, -0.36 * u, 0.75 * u * fl); gg.addColorStop(0, 'rgba(255,190,80,0.55)'); gg.addColorStop(1, 'rgba(255,140,40,0)');
        c.fillStyle = gg; c.beginPath(); c.arc(0.33 * u, -0.36 * u, 0.75 * u * fl, 0, Math.PI * 2); c.fill(); c.restore();
        // bowl
        let g = c.createLinearGradient(0, -0.12 * u, 0, 0.2 * u); g.addColorStop(0, '#e07a3a'); g.addColorStop(1, '#8e3a15');
        c.fillStyle = g; c.beginPath(); c.moveTo(-0.44 * u, -0.1 * u); c.quadraticCurveTo(-0.36 * u, 0.2 * u, 0, 0.2 * u); c.quadraticCurveTo(0.36 * u, 0.2 * u, 0.44 * u, -0.1 * u);
        c.lineTo(0.56 * u, -0.17 * u); c.lineTo(0.4 * u, -0.17 * u); c.closePath(); c.fill();
        c.fillStyle = '#f3a55c'; c.beginPath(); c.ellipse(-0.02 * u, -0.12 * u, 0.44 * u, 0.075 * u, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#5a2208'; c.beginPath(); c.ellipse(-0.04 * u, -0.12 * u, 0.36 * u, 0.045 * u, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffd34d'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc((-0.28 + i * 0.14) * u, 0.06 * u + Math.abs(i - 2) * -0.015 * u, 0.028 * u, 0, Math.PI * 2); c.fill(); }
        c.strokeStyle = '#ffd34d'; c.lineWidth = u * 0.018; c.beginPath(); c.moveTo(-0.36 * u, -0.02 * u); c.quadraticCurveTo(0, 0.08 * u, 0.36 * u, -0.02 * u); c.stroke();
        // flame (flickers)
        c.save(); c.translate(0.4 * u, -0.18 * u); c.rotate(Math.sin(t * 6) * 0.08 - this.px.vel * 0.05); c.scale(1, fl);
        g = c.createRadialGradient(0, -0.1 * u, 0, 0, -0.12 * u, 0.24 * u); g.addColorStop(0, '#fffbe6'); g.addColorStop(0.35, '#ffd34d'); g.addColorStop(0.8, '#ff7a1a'); g.addColorStop(1, 'rgba(255,90,20,0.0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(0, -0.36 * u); c.bezierCurveTo(0.12 * u, -0.18 * u, 0.12 * u, 0, 0, 0.01 * u); c.bezierCurveTo(-0.12 * u, 0, -0.12 * u, -0.18 * u, 0, -0.36 * u); c.fill(); c.restore();
      } else if (type === 'holi') {
        if (this.acc && this.acc.type === 'holi' && !this.acc.landed) { // gulal puff falling
          const cols = ['#ff3fa4', '#ffd23f', BRAND.green, BRAND.cyan, BRAND.orange];
          cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(Math.cos(i * 1.3 + t * 3) * 0.12 * u, -0.25 * u + Math.sin(i * 1.3 + t * 3) * 0.1 * u, 0.13 * u, 0, Math.PI * 2); c.fill(); });
        }
      }
      c.restore();
    }

    _drawParticles(c) {
      for (const p of this.particles) {
        const f = p.life / p.max, a = f < 0.15 ? f / 0.15 : f > 0.7 ? (1 - f) / 0.3 : 1;
        c.save(); c.globalAlpha = clamp(a, 0, 1); c.translate(p.x + (p.wob ? Math.sin(p.life * 3) * p.wob : 0), p.y);
        if (p.rot) c.rotate(p.rot);
        if (p.type === 'spark') { const s = p.size * (0.6 + Math.sin(f * Math.PI) * 0.6); c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = s; star4(c, s); c.fill(); }
        else if (p.type === 'text') { c.font = p.font; c.fillStyle = p.color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 6; c.fillText(p.text, 0, 0); }
        else if (p.type === 'dot') { c.fillStyle = p.color; c.beginPath(); c.arc(0, 0, p.size, 0, Math.PI * 2); c.fill(); }
        c.restore();
      }
    }
  }

  return { AkayaBubble, Spring, STATES, STATE_ORDER, ACCESSORIES, SHAPE, SPRINGS, BRAND, superPath, superPoint, GREETINGS, GLYPHS, FONT_STACK };
});
