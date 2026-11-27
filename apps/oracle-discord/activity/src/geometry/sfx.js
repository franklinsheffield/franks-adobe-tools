// Sacred Geometry Builder sounds, made with Web Audio (no files). Follows the Chamber's 🔊 mute (voice-sfx.js).
// The scale is Pythagorean: the string-length ratios 1, 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2 that the
// Pythagoreans tied to number, so the room's music is built from the same whole-number ratios it teaches.
import { isMuted } from "../voice-sfx.js";

let ctx = null, out = null, noise = null;
const RATIOS = [1, 9 / 8, 81 / 64, 4 / 3, 3 / 2, 27 / 16, 243 / 128, 2];
const BASE = 392; // G4

/** Create or resume our audio context. Call from a tap (browsers allow sound only after a gesture). */
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.16; out.connect(ctx.destination);
      const len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; noise = buf;
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch { ctx = null; }
}
const ok = () => !isMuted() && ctx && ctx.state === "running";

function tone(freq, t, dur, { type = "sine", gain = 0.5, attack = 0.005, glide = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
}
function scratch(t, dur, { freq = 2400, q = 1.2, gain = 0.35, sweep = 1 } = {}) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; s.loop = true; f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.04);
  g.gain.setValueAtTime(gain, t + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.02);
}

/** A point picked up: a small wooden tick. */
export function tick() { if (!ok()) return; const t = ctx.currentTime; tone(1320, t, 0.06, { type: "triangle", gain: 0.35 }); }
/** The compass swings round: graphite scratch plus a soft hum, lower for bigger circles. */
export function compass(r = 60, dur = 0.65) {
  if (!ok()) return; const t = ctx.currentTime;
  scratch(t, dur, { freq: 3200, q: 2.5, gain: 0.22, sweep: 0.8 });
  tone(Math.max(110, 260 - r), t, dur, { type: "sine", gain: 0.12, attack: 0.08, glide: 1.06 });
}
/** The pencil runs along the straightedge. */
export function ruler(dur = 0.45) { if (!ok()) return; const t = ctx.currentTime; scratch(t, dur, { freq: 1800, q: 1.4, gain: 0.25, sweep: 1.5 }); tone(1760, t + dur - 0.02, 0.05, { type: "triangle", gain: 0.15 }); }
/** New crossings appear: little glass tings climbing the scale. */
export function tings(n, delay = 0.55) {
  if (!ok() || !n) return; const t = ctx.currentTime + delay;
  for (let i = 0; i < Math.min(n, 5); i++) tone(BASE * 4 * RATIOS[(i * 2) % RATIOS.length], t + i * 0.07, 0.25, { gain: 0.12 });
}
/** A goal part drawn: a bell on the next note of the scale. */
export function goal(i = 0, delay = 0.5) {
  if (!ok()) return; const t = ctx.currentTime + delay, f = BASE * RATIOS[i % 8] * (i >= 8 ? 2 : 1);
  tone(f * 2, t, 0.9, { gain: 0.35 }); tone(f * 4, t, 0.5, { gain: 0.08 }); tone(f * 3, t + 0.01, 0.6, { gain: 0.06 });
}
/** The figure is complete: the octave, fifth and fourth (2:1, 3:2, 4:3) rung up, then a shimmering chord. */
export function complete(delay = 0.6) {
  if (!ok()) return; const t = ctx.currentTime + delay;
  [1, 4 / 3, 3 / 2, 2].forEach((r, i) => tone(BASE * r, t + i * 0.13, 1.1, { gain: 0.3 }));
  [1, 3 / 2, 2, 3].forEach((r) => tone(BASE * r, t + 0.6, 2.2, { gain: 0.12, attack: 0.05 }));
  for (let i = 0; i < 6; i++) tone(BASE * 8 * RATIOS[(i * 3) % 8], t + 0.65 + i * 0.06, 0.3, { gain: 0.05 });
}
/** Not allowed / wrong answer: a soft wooden knock. */
export function nope() { if (!ok()) return; const t = ctx.currentTime; tone(140, t, 0.18, { type: "triangle", gain: 0.4, glide: 0.7 }); }
/** A right answer. */
export function right() { if (!ok()) return; const t = ctx.currentTime; tone(BASE * 2, t, 0.4, { gain: 0.3 }); tone(BASE * 3, t + 0.1, 0.6, { gain: 0.25 }); }
/** A solid turns into view: a low airy whoosh. */
export function whoosh() { if (!ok()) return; const t = ctx.currentTime; scratch(t, 0.7, { freq: 500, q: 0.8, gain: 0.25, sweep: 3 }); }
