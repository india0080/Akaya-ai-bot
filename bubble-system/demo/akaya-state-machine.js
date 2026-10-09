/*!
 * akaya-state-machine.js: a small event-driven state machine for the Akaya bubble.
 * Works as a classic <script> (window.AkayaStateMachine) or via CommonJS require.
 *
 *   const machine = AkayaStateMachine.create({ bubble });
 *   machine.send('MIC_ON');        // idle → listening
 *   machine.send('SPEECH_END');    // listening → thinking
 *   machine.send('DRAFT_READY');   // thinking → reply   (draft written, waiting for Send)
 *   machine.send('SEND');          // reply → success → (auto) idle
 *
 * '@rest' means the resting state: 'idle' when online, 'offline' in on-device mode.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AkayaStateMachine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TRANSITIONS = {
    idle:        { MIC_ON: 'listening', TRANSLATE: 'translating', REMINDER: 'reminder', IDLE_TIMEOUT: 'sleeping', ERROR: 'error' },
    offline:     { MIC_ON: 'listening', TRANSLATE: 'translating', REMINDER: 'reminder', IDLE_TIMEOUT: 'sleeping', ERROR: 'error' },
    listening:   { SPEECH_END: 'thinking', MIC_OFF: '@rest', ERROR: 'error' },
    thinking:    { DRAFT_READY: 'reply', CANCEL: '@rest', ERROR: 'error' },
    translating: { DRAFT_READY: 'reply', CANCEL: '@rest', ERROR: 'error' },
    reply:       { SEND: 'success', DISCARD: '@rest', MIC_ON: 'listening', ERROR: 'error' },
    reminder:    { DISMISS: '@rest', SNOOZE: '@rest', DONE: 'success' },
    success:     { DONE: '@rest', MIC_ON: 'listening' },
    error:       { RETRY: 'listening', DISMISS: '@rest' },
    sleeping:    { WAKE: '@rest', TAP: '@rest', MIC_ON: 'listening', REMINDER: 'reminder' },
  };
  /** States that leave by themselves. */
  const AUTO = { success: { after: 1800, event: 'DONE' }, error: { after: 4000, event: 'DISMISS' } };
  /** A reminder never interrupts these. It waits and fires when the bubble is back at rest. */
  const BUSY = ['listening', 'thinking', 'translating'];

  function create({ bubble = null, initial = 'idle', online = true, sleepAfter = 60000, scheduler = null } = {}) {
    const sch = scheduler || (bubble && bubble.scheduler) || { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) };
    let state = initial, isOnline = online, autoId = null, sleepId = null, pendingReminder = false;
    const listeners = [];
    const rest = () => (isOnline ? 'idle' : 'offline');
    const isRest = s => s === 'idle' || s === 'offline';

    function enter(next, event, payload) {
      const from = state; state = next;
      if (bubble) bubble.setState(next);
      if (autoId != null) { sch.clear(autoId); autoId = null; }
      if (AUTO[next]) autoId = sch.set(() => send(AUTO[next].event), AUTO[next].after);
      armSleep();
      listeners.forEach(fn => fn({ from, to: next, event, payload, online: isOnline }));
      if (isRest(next) && pendingReminder) { pendingReminder = false; sch.set(() => send('REMINDER'), 400); }
    }
    function armSleep() {
      if (sleepId != null) { sch.clear(sleepId); sleepId = null; }
      if (isRest(state) && sleepAfter > 0) sleepId = sch.set(() => send('IDLE_TIMEOUT'), sleepAfter);
    }
    /** Send an event. Returns true if it caused a transition (or changed the online mode). */
    function send(event, payload) {
      if (event === 'NETWORK_OFF' || event === 'NETWORK_ON') {
        isOnline = event === 'NETWORK_ON';
        if (isRest(state) && state !== rest()) enter(rest(), event, payload);
        return true;
      }
      if (event === 'REMINDER' && BUSY.includes(state)) { pendingReminder = true; return false; }
      let to = (TRANSITIONS[state] || {})[event];
      if (!to && event === 'ERROR') to = 'error';
      if (!to) { armSleep(); return false; }
      if (to === '@rest') to = rest();
      enter(to, event, payload);
      return true;
    }
    return {
      get state() { return state; },
      get online() { return isOnline; },
      send,
      can: event => !!((TRANSITIONS[state] || {})[event]) || event === 'ERROR' || event === 'NETWORK_ON' || event === 'NETWORK_OFF',
      /** Jump straight to a state (design tools and demos). */
      force: (s, event = 'FORCE') => { enter(s === '@rest' ? rest() : s, event); },
      on: fn => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },
      destroy: () => { if (autoId != null) sch.clear(autoId); if (sleepId != null) sch.clear(sleepId); listeners.length = 0; },
    };
  }
  return { create, TRANSITIONS, AUTO };
});
