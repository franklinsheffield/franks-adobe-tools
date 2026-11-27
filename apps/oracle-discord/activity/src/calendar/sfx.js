// Calendar Keeper sounds, made with Web Audio (no audio files). Follows the Chamber's mute button (voice-sfx isMuted).
// The context is created on the first room click, as browsers only allow sound after a gesture.
import { isMuted } from "../voice-sfx.js";

let ctx = null, out = null, noiseBuf = null;
function ac() {
  if (isMuted()) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.22; out.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch { return null; }
}
/** One tone with an attack/decay envelope. */
function tone(f, t, dur, { type = "sine", vol = 0.5, f2 = null, lp = null } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o; if (lp) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; o.connect(f); node = f; }
  node.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
}
/** A burst of filtered noise. */
function noise(t, dur, { freq = 2000, q = 4, vol = 0.4, type = "bandpass", sweep = null } = {}) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf;
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q; if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}

/** Gear ratchet: n clicks over `secs` (the gears turning), then a clunk as they lock. */
export function gears(n, secs = 1.2) {
  if (!ac()) return; const t0 = ctx.currentTime + 0.02, k = Math.max(1, Math.min(18, n));
  for (let i = 0; i < k; i++) { const t = t0 + (secs * 0.85 * i) / k; noise(t, 0.03, { freq: 3200 + (i % 2) * 900, q: 9, vol: 0.5 }); tone(180 + (i % 3) * 20, t, 0.04, { type: "square", vol: 0.08, lp: 900 }); }
  clunk(t0 + secs * 0.9);
}
/** One ratchet click: a single day turned by hand. */
export function tick(fwd = true) { if (!ac()) return; const t = ctx.currentTime; noise(t, 0.025, { freq: fwd ? 3600 : 2900, q: 9, vol: 0.45 }); tone(fwd ? 200 : 170, t, 0.035, { type: "square", vol: 0.07, lp: 900 }); }
export function clunk(t = null) { if (!ac()) return; t ??= ctx.currentTime; tone(110, t, 0.18, { type: "triangle", vol: 0.5, f2: 70 }); noise(t, 0.08, { freq: 600, q: 2, vol: 0.35 }); }
/** Fast whirl for a long jump through time. */
export function whirl(secs = 2) {
  if (!ac()) return; const t = ctx.currentTime;
  for (let i = 0; i < 26; i++) { const p = i / 26, at = t + secs * 0.85 * (1 - (1 - p) ** 1.6); noise(at, 0.025, { freq: 2600 + p * 1800, q: 10, vol: 0.35 }); }
  tone(220, t, secs * 0.9, { type: "sawtooth", vol: 0.05, f2: 520, lp: 1400 }); clunk(t + secs * 0.92);
}
/** Correct: three bell notes rising. */
export function right() { if (!ac()) return; const t = ctx.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { tone(f, t + i * 0.11, 0.9, { vol: 0.35 }); tone(f * 2.01, t + i * 0.11, 0.5, { vol: 0.08 }); }); }
/** Wrong: gears grinding. */
export function wrong() { if (!ac()) return; const t = ctx.currentTime; tone(160, t, 0.4, { type: "sawtooth", vol: 0.18, f2: 90, lp: 700 }); noise(t, 0.35, { freq: 400, q: 1.5, vol: 0.3, sweep: 200 }); }
/** Hint: a soft shimmer. */
export function hint() { if (!ac()) return; const t = ctx.currentTime; [1318.5, 1568, 1975.5].forEach((f, i) => tone(f, t + i * 0.06, 0.6, { vol: 0.12 })); }
/** Stars earned: one sparkle per star. */
export function stars(n) { if (!ac()) return; const t = ctx.currentTime; for (let i = 0; i < n; i++) { tone(1567.98 * (1 + i * 0.25), t + i * 0.18, 0.35, { vol: 0.22 }); noise(t + i * 0.18, 0.15, { freq: 7000, q: 3, vol: 0.12 }); } }
/** New title or level: a little brass fanfare. */
export function fanfare() { if (!ac()) return; const t = ctx.currentTime; [[392, 0], [523.25, 0.14], [659.25, 0.28], [783.99, 0.42], [1046.5, 0.6]].forEach(([f, d]) => tone(f, t + d, d === 0.6 ? 0.9 : 0.2, { type: "square", vol: 0.1, lp: 2400 })); }
/** Eclipse: a deep gong that swells as the Moon covers the Sun. */
export function eclipse() {
  if (!ac()) return; const t = ctx.currentTime;
  [[65.4, 0.5], [98.1, 0.25], [131.2, 0.18], [196.5, 0.1], [261.9, 0.06]].forEach(([f, v]) => tone(f, t, 4.2, { vol: v }));
  tone(66.2, t, 4.2, { vol: 0.3 }); noise(t + 1.6, 1.8, { freq: 5000, q: 1, vol: 0.06, type: "highpass" });
}
/** Fire festival: bonfire crackle. */
export function fire() { if (!ac()) return; const t = ctx.currentTime; noise(t, 1.6, { freq: 900, q: 0.7, vol: 0.12, type: "lowpass", sweep: 400 }); for (let i = 0; i < 16; i++) noise(t + Math.random() * 1.5, 0.02, { freq: 2500 + Math.random() * 3000, q: 6, vol: 0.4 }); }
/** Study guide: a page turn. */
export function page() { if (!ac()) return; noise(ctx.currentTime, 0.28, { freq: 1800, q: 0.8, vol: 0.18, sweep: 5000 }); }
