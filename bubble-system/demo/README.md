# Akaya bubble: character and motion system

Our own iridescent Akaya bubble, drawn in 2D canvas. It borrows *techniques* from coded-mascot work (fake 3D light, springs, squash & stretch, superellipse construction, idle life, button→panel morph) but keeps the Akaya look: a pastel brand-gradient bubble, navy glossy eyes, mood glow, and Comfortaa type.

| File | What it is |
|---|---|
| `index.html` | Single-file demo with everything inlined. Open it directly in a browser (no server, no build). `?tour=1` autoplays the tour, `?record=1` uses the deterministic clock used for the video. |
| `akaya-bubble.js` | The renderer and physics. UMD: `window.AkayaBubbleKit` or `require()`. |
| `akaya-state-machine.js` | The app-state machine. UMD: `window.AkayaStateMachine` or `require()`. |
| `akaya-sfx.js` | Synthesized Web Audio sound effects (no audio files). UMD: `window.AkayaSfx`. |
| `../design-sheet.png` | The construction and spec sheet, rendered from the same code. |
| `../demo-720p.mp4` | A 29.5 s screen capture of the tour (silent). |
| `../demo-720p-sound.mp4` | The same capture with synthesized SFX and a music bed (AAC 48 kHz stereo, −16 LUFS). |

## Quick start

```html
<canvas id="akaya" style="width:320px;height:320px"></canvas>
<script src="akaya-bubble.js"></script>
<script src="akaya-state-machine.js"></script>
<script>
  const bubble  = new AkayaBubbleKit.AkayaBubble(document.getElementById('akaya'), { size: 0.26 });
  const machine = AkayaStateMachine.create({ bubble });

  bubble.setState('listening');       // direct
  machine.send('SPEECH_END');         // or event-driven: listening → thinking
  bubble.setLevel(rms);               // mic level 0..1 every frame while listening
  bubble.setAccessory('diya');        // 'diya' | 'holi' | 'santa' | 'gradcap' | null
</script>
```

## Construction

- **Body:** superellipse `|x/rx|^n + |y/ry|^n = 1` with **n = 2.2** and **ry = 0.94 · rx**. That is a soft bubble with a slightly sitting base. n = 2 reads as a plain ball, while n ≥ 3 turns into a jelly cube or app icon.
- **Eyes on a sphere:** yaw ±0.33 rad, pitch 0, size 0.19 × 0.23 rx. Gaze adds yaw ±0.36 and pitch ±0.30, and the eyes foreshorten (`cos^0.7`) as they turn.
- **Light stack, back to front:**
  1. Mood glow (radius 1.9 rx, state colour)
  2. Floor shadow (+1.22 ry; it shrinks when the bubble is in the air)
  3. Body gradient (cyan → blue → violet) plus brand-colour blobs
  4. Slowly spinning conic sheen
  5. Form shading (darker bottom-right)
  6. Green/cyan bounce light
  7. Fresnel rim
  8. Sharp top-left specular at (−0.42, −0.52) plus a pin highlight
- **Badge:** sits on the rim at −45°, radius 0.25 rx, filled with the state colour and ringed in white. It pops in on a spring (k 500, ζ 0.35).

## Motion

Every move uses a unit-mass, under-damped spring: `a = −k(x − target) − 2ζ√k · v`, sub-stepped at 240 Hz.

| Spring | k | ζ | Used for |
|---|---|---|---|
| travel | 170 | 0.42 | Position. Each move does anticipation (wind-up opposite plus a crouch, 120 ms), then quick travel, overshoot and settle |
| squash | 380 | 0.30 | Squash/stretch, area preserved (`sx·sy = 1`), pivot near the bottom |
| tilt | 200 | 0.36 | Lean into motion |
| gaze | 240 | 0.62 | Eyes |
| drop | 260 | 0.38 | Accessories and the reminder badge. They collide with the head, bounce, and squash the body |
| badge | 500 | 0.35 | Badge pop |
| shake | 900 | 0.12 | Error shake and flinch jiggle |

- **Squash and stretch:**
  - squash when an accessory lands, when the reminder bell drops in, and on hop landings;
  - stretch along the travel direction (≤ 12%) and on take-off;
  - a tap pushes the bubble away from the tap point, squeezes its eyes (`> <`) for 360 ms, then springs back.
- **Idle life:** it breathes (period and amplitude per state), floats, blinks every 2.4–5.2 s for 170 ms, follows the pointer, and makes small glances when there's no pointer. Every state change is a **300 ms blink-swap**: the eyes close, swap to the new shape, and reopen.

## States

| State | Glow | Eyes | Badge | Motion |
|---|---|---|---|---|
| `idle` | violet #7625ef | open, follows pointer | green presence dot | breath 4.2 s, float, blinks |
| `listening` | cyan #0dabf4 | wide (×1.14) | mic plus level arcs | rings and body pulse follow `setLevel()`, rises slightly |
| `thinking` | #8b5cf6 | half-lidded, looking up-right | typing dots | sways, drifts up-left |
| `reply` (reply ready) | blue #0269f8 | happy ^ ^ plus blush, looking down-right toward Send | paper plane | small hop, leans right |
| `reminder` | orange #E8743B | wide | bell drops in, then swings | squash on badge landing, 2-bounce hop |
| `offline` | muted #4a6fa8 | calm (34% lid) | cloud with slash | dimmer and desaturated, slow 6 s breath, 0.6× speed |
| `translating` | cyan ↔ green | reading scan left→right | cycling glyphs A · अ · あ · ع · த … | greetings (नमस्ते, Hola, こんにちは, வணக்கம் …) float out |
| `error` | red #ff4d6a | smaller, worried (slanted lids) | ! | quick shake |
| `success` | green #08da73 | happy plus blush | check | jump with stretch, sparkle burst |
| `sleeping` | deep indigo | closed ‿ ‿ | moon | dim, deep 5.6 s breath, sinks, z's |

Aliases: `replyReady`, `reply-ready` → `reply`; `sleep` → `sleeping`.

## Bubble API (`AkayaBubbleKit.AkayaBubble`)

`new AkayaBubble(canvas, opts)` takes these options:
- `size`: rx as a fraction of the canvas's smaller side; default 0.28
- `center`: `[fx, fy]`
- `n` and `ryRatio`
- `glow` and `shadow`: booleans
- `glowBlend`: `'screen'` on dark backgrounds, `'source-over'` on light ones
- `interactive`: pointer-follow and tap; default true
- `autoStart`: its own rAF loop; default true. Set it to false and call `tick(dt)` from your loop.
- `seed` and `dpr`

| Method | |
|---|---|
| `setState(name, {instant})` | Changes state with a blink-swap, badge pop and the state's entry motion |
| `setLevel(0..1)` | Mic level (feed analyser RMS) |
| `lookAt(x, y)` / `lookAt(null)` | Points the eyes at a point in canvas CSS px, or returns to idle glances |
| `moveTo(ox, oy)` / `moveToPoint(x, y)` | Travels with anticipation and overshoot (offset in rx units, or a canvas point) |
| `tapAt(x, y)` / `hitTest(x, y)` | Flinch from a tap; hit-test against the superellipse |
| `setAccessory(type)` | Drops in `'diya'`, `'holi'`, `'santa'`, `'gradcap'`, or `null` to remove |
| `hop(v0, bounces)` | Crouch, jump and land with squash |
| `tick(dt)`, `update(dt)`, `render()`, `start()`, `stop()`, `resize()` | Drive the loop yourself |
| `on(event, fn)` | Events: `statechange` `{state, prev}`, `tap`, `stageclick`, `land` `{by}`, `accessory` |
| `after(sec, fn)` / `scheduler` | Deterministic timers on the bubble clock (the machine uses them) |

Exports: `STATES`, `STATE_ORDER`, `ACCESSORIES`, `SHAPE`, `SPRINGS`, `BRAND`, `Spring`, `superPath`, `superPoint`.

## State machine (`AkayaStateMachine.create({ bubble, initial, online, sleepAfter, scheduler })`)

```
idle / offline ── MIC_ON ──▶ listening ── SPEECH_END ──▶ thinking ── DRAFT_READY ──▶ reply ── SEND ──▶ success ─(1.8 s)─▶ @rest
      │  TRANSLATE ─▶ translating ── DRAFT_READY ─▶ reply           (CANCEL / MIC_OFF / DISCARD ─▶ @rest)
      │  REMINDER ──▶ reminder ── DISMISS / SNOOZE ─▶ @rest, DONE ─▶ success
      │  IDLE_TIMEOUT (sleepAfter, default 60 s) ─▶ sleeping ── WAKE / TAP / MIC_ON ─▶ …
any ── ERROR ─▶ error ── RETRY ─▶ listening, DISMISS or 4 s ─▶ @rest
NETWORK_OFF / NETWORK_ON switch @rest between idle and offline
```

- `@rest` is `idle` when online and `offline` in on-device mode.
- A `REMINDER` that arrives during listening, thinking or translating waits and fires once the bubble is back at rest.

The machine exposes:
- `machine.state` and `machine.online`
- `machine.send(event)`, which returns whether anything changed
- `machine.can(event)`
- `machine.force(state)`
- `machine.on(fn)` with `{from, to, event}`
- `machine.destroy()`

## Floating button → panel (demo)

- The real app's floating button stays an **orange sparkle circle**, with a mood ring in the current state's colour.
- When it's tapped, the same element morphs into the **dark navy panel**:
  - Width leads and height follows on separate springs.
  - The colour goes orange → brand violet → navy.
  - The panel controls fade in: akaYa pill, language dropdown, Hinglish/English/More tabs, Tone/Purpose/Read Screen/Grammar, and Copy/Read/Insert.
- The bubble **lives inside the button**. It pops out along an arc into the panel header and mirrors the main bubble's state. On close, it ducks back in first and then the panel folds away.

## Demo controls

- **App state pills:** call `machine.force(state)`.
- **Accessory pills:** call `setAccessory`.
- **Floating button ⇄ panel:** toggles the morph.
- **Play tour:** runs the scripted tour from the video.
- **Use my mic:** real microphone level through `getUserMedia`, with an analyser feeding RMS into `setLevel`. It falls back to a simulated level.
- Tap the bubble to make it flinch, click empty stage to make it travel; its eyes follow your pointer.

Fonts: Comfortaa Bold and Manrope (Google Fonts, if online), plus Noto Sans Devanagari, CJK JP, Tamil and Arabic for the greetings.

## Sound

Every sound is synthesized: numpy for the video (`src/make_audio.py`) and Web Audio oscillators and noise for the live demo (`akaya-sfx.js`). No samples are downloaded, so there is nothing to license.

```js
const sfx = AkayaSfx.create();                                   // on by default
window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });   // browsers need one gesture
bubble.on('statechange', e => sfx.play('state', e));
bubble.on('land', e => sfx.play('land', e));     // accessory / badge / hop landings
bubble.on('tap',  () => sfx.play('flinch'));
sfx.setMuted(true);
```

In the demo, the **🔊 Sound on** pill toggles mute. Sound starts after your first click.

| Event | Sound |
|---|---|
| State change → idle, thinking, translating, reminder | Soft "bloop" pop (820 → 480 Hz) |
| listening | Two-note rising chime (E6 → B6) |
| thinking (while in state) | Quiet typing ticks, every 70–180 ms |
| reply ready | Rising whoosh and a pluck (660 → 990 Hz) |
| reminder: bell badge lands | Bell ding (partials 1 / 2.76 / 5.4 × 1320 Hz) with two quieter swing dings panned L/R |
| reminder bounces / hop landings | Small soft thud (240 → 150 Hz) |
| offline | Soft low falling tone (262 → 196 Hz with an octave below) |
| translating (while in state) | Sparkly pentatonic blips, panned around |
| error | Gentle "boo-boop" (G4 → D4) |
| success | Sparkle chime: C6-E6-G6-C7 arpeggio, shimmer and glints |
| sleeping | Three lullaby notes (G5-E5-C5), then a soft snore (breath in and out with a gentle purr) |
| Tap on bubble (flinch) | Boing (springy vibrato glide), squish and a tiny "eep" |
| Accessory dropped | Soft slide-whistle down |
| Accessory lands | Boing and squish (Holi: a powder puff plus glints) |
| Button morphs into the panel / back | Whoosh up / whoosh down, panned from the button |
| Insert / Send | Soft tap |
| Bubble travels (stage click) | Short airy swish |

**Video mix:**
- Event times come from the deterministic tour clock: `record.cjs` saves `window.__log` as `events.json`.
- The music bed is a light C–G–Am–F loop at 116 BPM: marimba arpeggio, soft bass, kick, snaps and shaker. It is about 7.5 LU under the SFX, ducks briefly under each effect, fades in over 1.6 s and out over 2.6 s.
- The final mix is normalised to −16 LUFS integrated, with a −1.5 dBFS peak limiter.
