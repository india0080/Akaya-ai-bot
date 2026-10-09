/*!
 * akaya-sfx.js: tiny synthesized Web Audio sound effects for the Akaya bubble (no audio files).
 * Classic <script> (window.AkayaSfx) or CommonJS.
 *
 *   const sfx = AkayaSfx.create();            // enabled by default; needs one user gesture
 *   window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
 *   sfx.play('state', { state: 'listening' }); sfx.setMuted(true);
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AkayaSfx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function create({ volume = 0.55 } = {}) {
    let ctx = null, master = null, noiseBuf = null, muted = false;
    const unlock = () => {
      if (!ctx) {
        const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext); if (!AC) return false;
        ctx = new AC(); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
        master = ctx.createGain(); master.gain.value = muted ? 0 : volume; master.connect(comp); comp.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume(); return true;
    };
    const T = (w = 0) => ctx.currentTime + 0.005 + w;
    function env(g, t0, a, d, peak) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
    function tone(f, dur, { type = 'sine', to = null, gain = 0.2, a = 0.005, when = 0, pan = 0, vib = 0 } = {}) {
      const t0 = T(when), o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 14; lg.gain.setValueAtTime(f * vib, t0); lg.gain.exponentialRampToValueAtTime(0.01, t0 + dur); l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
      env(g, t0, a, dur, gain); o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
      o.start(t0); o.stop(t0 + a + dur + 0.05);
    }
    function noise(dur, { type = 'bandpass', f = 1200, to = null, q = 1, gain = 0.15, a = 0.01, when = 0 } = {}) {
      const t0 = T(when), s = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; bf.type = type; bf.Q.value = q; bf.frequency.setValueAtTime(f, t0); if (to) bf.frequency.exponentialRampToValueAtTime(to, t0 + a + dur);
      env(g, t0, a, dur, gain); s.connect(bf); bf.connect(g); g.connect(master); s.start(t0, Math.random()); s.stop(t0 + a + dur + 0.05);
    }
    const PENTA = [1568, 1760, 2093, 2349, 2637, 3136];
    const S = {
      pop: () => { tone(820, 0.09, { to: 480, gain: 0.22 }); noise(0.02, { f: 2500, q: 2, gain: 0.04 }); },
      tap: () => { tone(1500, 0.035, { gain: 0.1, to: 1200 }); noise(0.012, { f: 4000, q: 3, gain: 0.05 }); },
      whooshUp: () => noise(0.34, { f: 350, to: 2600, q: 1.4, gain: 0.2, a: 0.14 }),
      whooshDown: () => noise(0.3, { f: 2600, to: 350, q: 1.4, gain: 0.17, a: 0.1 }),
      chime: () => { tone(1318.5, 0.5, { gain: 0.13, type: 'triangle' }); tone(1975.5, 0.6, { gain: 0.11, when: 0.09, type: 'triangle' }); },
      typing: () => { noise(0.012, { f: 3200 + Math.random() * 900, q: 5, gain: 0.07 }); tone(2200 + Math.random() * 400, 0.012, { gain: 0.02 }); },
      reply: () => { noise(0.22, { f: 500, to: 2400, q: 1.3, gain: 0.13, a: 0.1 }); tone(660, 0.12, { to: 990, gain: 0.16, when: 0.2 }); tone(1320, 0.2, { gain: 0.06, when: 0.24, type: 'triangle' }); },
      bell: () => { [[1, 0.16, 1.1], [2.76, 0.06, 0.6], [5.4, 0.03, 0.35]].forEach(([m, g, d]) => { tone(1320 * m, d, { gain: g, a: 0.002 }); tone(1320 * m, d * 0.8, { gain: g * 0.6, a: 0.002, when: 0.3, pan: 0.3 }); tone(1320 * m, d * 0.6, { gain: g * 0.35, a: 0.002, when: 0.56, pan: -0.3 }); }); },
      offline: () => { tone(262, 0.6, { to: 196, gain: 0.14, a: 0.06 }); tone(131, 0.7, { to: 98, gain: 0.08, a: 0.08 }); },
      blip: () => tone(PENTA[(Math.random() * PENTA.length) | 0], 0.06, { type: 'triangle', gain: 0.06, pan: Math.random() * 1.2 - 0.6 }),
      error: () => { tone(392, 0.11, { type: 'triangle', gain: 0.16 }); tone(294, 0.2, { type: 'triangle', gain: 0.16, when: 0.13, to: 262 }); },
      success: () => { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => { tone(f, 0.45, { gain: 0.1, when: i * 0.07, type: 'triangle', pan: -0.4 + i * 0.27 }); }); noise(0.4, { type: 'highpass', f: 6000, gain: 0.03, when: 0.2, a: 0.05 }); },
      snore: () => { noise(0.9, { type: 'lowpass', f: 420, q: 4, gain: 0.07, a: 0.7 }); tone(90, 0.9, { gain: 0.03, a: 0.6 }); noise(1.1, { type: 'lowpass', f: 300, to: 180, q: 3, gain: 0.05, a: 0.15, when: 1.5 }); },
      lullaby: () => { [784, 659, 523].forEach((f, i) => tone(f, 0.6, { gain: 0.05, when: i * 0.38, a: 0.04 })); },
      boing: () => { tone(330, 0.32, { to: 165, gain: 0.16, vib: 0.18 }); noise(0.16, { type: 'lowpass', f: 1600, to: 260, q: 2, gain: 0.12, a: 0.01, when: 0.01 }); },
      squish: () => noise(0.18, { type: 'lowpass', f: 1800, to: 280, q: 3, gain: 0.16, a: 0.01 }),
      bounce: () => tone(230, 0.09, { to: 150, gain: 0.12 }),
      drop: () => tone(1250, 0.26, { to: 620, type: 'triangle', gain: 0.04 }),
      puff: () => { noise(0.35, { type: 'lowpass', f: 2400, to: 500, q: 0.8, gain: 0.14, a: 0.02 }); [2093, 2637, 3136].forEach((f, i) => tone(f, 0.08, { gain: 0.04, when: 0.05 + i * 0.05, type: 'triangle' })); },
    };
    const STATE_SND = { idle: 'pop', listening: 'chime', thinking: 'pop', reply: 'reply', reminder: null, offline: 'offline', translating: 'pop', error: 'error', success: 'success', sleeping: 'lullaby' };
    /** Play a named sound or an app event: play('state', {state}), play('land', {by, accessory}), play('boing') … */
    function play(name, o = {}) {
      if (muted || !ctx || ctx.state !== 'running') return;
      if (name === 'state') { const s = STATE_SND[o.state]; if (s) S[s](); return; }
      if (name === 'land') { if (o.by === 'accessory') { (o.accessory === 'holi' ? S.puff : S.boing)(); S.squish(); } else if (o.by === 'badge') S.bell(); else S.bounce(); return; }
      if (name === 'flinch') { S.boing(); S.squish(); return; }
      if (name === 'morphOpen') return S.whooshUp();
      if (name === 'morphClose') return S.whooshDown();
      if (name === 'insert' || name === 'send' || name === 'click') return S.tap();
      if (name === 'accessory') return o.accessory ? S.drop() : S.pop();
      if (name === 'move') return noise(0.2, { f: 600, to: 1800, q: 1.2, gain: 0.08, a: 0.06 });
      if (S[name]) S[name]();
    }
    return {
      unlock, play,
      get muted() { return muted; }, get ready() { return !!ctx && ctx.state === 'running'; },
      setMuted(m) { muted = !!m; if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02); },
    };
  }
  return { create };
});
