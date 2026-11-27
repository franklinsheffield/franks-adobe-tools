// Séance sound effects, made with Web Audio (no audio files). They follow the Oracle's voice mute switch.
// The context is created on the first sound, which always follows a click (browsers allow sound only after a gesture).
import { isMuted } from "../voice-sfx.js";

let ctx = null, out = null;
function ac() {
  if (isMuted()) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.22;
      const verb = ctx.createDelay(); verb.delayTime.value = 0.17; const fb = ctx.createGain(); fb.gain.value = 0.35; const wet = ctx.createGain(); wet.gain.value = 0.25;
      out.connect(ctx.destination); out.connect(verb); verb.connect(fb); fb.connect(verb); verb.connect(wet); wet.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch { ctx = null; return null; }
}
function env(g, t, peak, a, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(c, { type = "sine", f, f2, t = 0, a = 0.01, d = 0.3, peak = 0.4, lp } = {}) {
  const at = c.currentTime + t, o = c.createOscillator(), g = c.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  env(g, at, peak, a, d);
  if (lp) { const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; o.connect(fl); fl.connect(g); } else o.connect(g);
  g.connect(out); o.start(at); o.stop(at + a + d + 0.05); return o;
}
function noise(c, { t = 0, d = 0.3, peak = 0.3, type = "bandpass", f = 1200, f2, q = 1 } = {}) {
  const at = c.currentTime + t, n = Math.ceil(c.sampleRate * (d + 0.05)), buf = c.createBuffer(1, n, c.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, at); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + d);
  env(g, at, peak, 0.01, d); s.connect(fl); fl.connect(g); g.connect(out); s.start(at); s.stop(at + d + 0.05);
}

/** Raps on the underside of the table: low wooden knocks. */
export function knock(times = 2) {
  const c = ac(); if (!c) return;
  for (let i = 0; i < times; i++) { const t = i * 0.28; tone(c, { f: 110, f2: 60, t, a: 0.004, d: 0.18, peak: 0.9 }); noise(c, { t, d: 0.06, peak: 0.35, f: 900, q: 2 }); }
}
/** A candle blown out: a soft breath, then a hiss of smoke. */
export function snuff(n = 1) {
  const c = ac(); if (!c) return;
  for (let i = 0; i < n; i++) { const t = i * 0.22; noise(c, { t, d: 0.35, peak: 0.45, f: 500, f2: 2400, q: 0.7 }); noise(c, { t: t + 0.25, d: 0.5, peak: 0.08, type: "highpass", f: 5000 }); }
}
/** The ghost's wail: a theremin glide with vibrato. */
export function wail(up = true) {
  const c = ac(); if (!c) return;
  const at = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = "sine"; lfo.frequency.value = 6; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
  const [a, b, d] = up ? [330, 660, 520] : [520, 300, 220];
  o.frequency.setValueAtTime(a, at); o.frequency.exponentialRampToValueAtTime(b, at + 0.6); o.frequency.exponentialRampToValueAtTime(d, at + 1.3);
  env(g, at, 0.3, 0.25, 1.1); o.connect(g); g.connect(out); o.start(at); lfo.start(at); o.stop(at + 1.45); lfo.stop(at + 1.45);
}
/** The circle opens: a hollow chord swells, then two knocks. */
export function summon() {
  const c = ac(); if (!c) return;
  [146.8, 174.6, 220, 277.2].forEach((f, i) => tone(c, { type: "triangle", f, f2: f * 0.98, t: i * 0.05, a: 0.6, d: 1.2, peak: 0.12, lp: 900 }));
  setTimeout(() => knock(2), 900);
}
/** Wrong name: a sour two-note slide down. */
export function wrong() {
  const c = ac(); if (!c) return;
  tone(c, { type: "sawtooth", f: 233, f2: 196, a: 0.02, d: 0.25, peak: 0.18, lp: 1200 }); tone(c, { type: "sawtooth", f: 196, f2: 147, t: 0.27, a: 0.02, d: 0.4, peak: 0.18, lp: 1000 });
}
/** Right: the ghost rises in a shimmer of bells. */
export function reveal() {
  const c = ac(); if (!c) return;
  [523, 659, 784, 988, 1175, 1568].forEach((f, i) => tone(c, { f, t: i * 0.07, a: 0.005, d: 0.6, peak: 0.25 }));
  noise(c, { t: 0, d: 1.2, peak: 0.06, type: "highpass", f: 6000 });
  setTimeout(() => wail(true), 350);
}
/** The last candle goes out: a falling drone in the dark. */
export function darkness() {
  const c = ac(); if (!c) return;
  tone(c, { type: "sawtooth", f: 98, f2: 49, a: 0.3, d: 1.8, peak: 0.2, lp: 400 }); setTimeout(() => wail(false), 500);
}
/** Cards fanned out for "Show me 4". */
export function deal() {
  const c = ac(); if (!c) return;
  for (let i = 0; i < 4; i++) noise(c, { t: i * 0.09, d: 0.07, peak: 0.25, f: 3000, q: 1.5 });
}
