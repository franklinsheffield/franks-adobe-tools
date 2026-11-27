// Flame Test Lab sound effects, synthesised with Web Audio (no audio files): the gas tap, ignition, a sizzle as the
// sample meets the flame, a steady burner roar, a glass clink for the cobalt glass, a tick for the speed round and
// right and wrong chimes. Follows the Chamber's mute button (voice-sfx.js isMuted); started from clicks.
import { isMuted } from "../voice-sfx.js";

let ac = null, bus = null, crackleTimer = null;
function ready() {
  if (isMuted()) return null;
  try {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); bus = ac.createGain(); bus.gain.value = 0.22; bus.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  } catch { return null; }
}
const rnd = (a, b) => a + Math.random() * (b - a);
function tone(f, t, dur, { type = "sine", vol = 0.3, to = null, attack = 0.004 } = {}) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, { type = "bandpass", f = 1000, to = null, q = 1, vol = 0.3, shape = (x) => 1 - x } = {}) {
  const n = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * shape(i / d.length);
  const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = n; fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q; g.gain.value = vol;
  src.connect(fl); fl.connect(g); g.connect(bus); src.start(t);
}

/** The gas tap opens: a soft hiss. */
export function hiss() { if (!ready()) return; noise(ac.currentTime, 0.6, { type: "highpass", f: 3000, vol: 0.12, shape: (x) => Math.min(1, x * 4) * (1 - x) }); }
/** The burner lights: a low whump. */
export function ignite() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.5, { type: "lowpass", f: 300, to: 1400, vol: 0.5, shape: (x) => Math.exp(-x * 5) }); tone(90, t, 0.35, { type: "sine", vol: 0.25, to: 60 }); }
/** The sample meets the flame: crackle and sizzle, pitched by the element so each sounds a little different. */
export function sizzle(i = 0) { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.7, { f: 2600 + (i % 8) * 300, q: 1.5, vol: 0.28, shape: (x) => (0.5 + 0.5 * Math.random()) * (1 - x) });
  for (let k = 0; k < 6; k++) noise(t + rnd(0, 0.5), 0.02, { type: "highpass", f: 4000, vol: 0.25 }); }
/** Cobalt glass held up: a glass clink. */
export function glass() { if (!ready()) return; const t = ac.currentTime; tone(2400, t, 0.4, { vol: 0.18 }); tone(6100, t, 0.2, { vol: 0.06 }); }
/** The spectroscope: a brass click and a shimmer. */
export function scope() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.04, { type: "bandpass", f: 1800, q: 4, vol: 0.4 });
  [880, 1320, 1760, 2640].forEach((f, k) => tone(f, t + 0.06 + k * 0.05, 0.4, { vol: 0.06 })); }
export function right() { if (!ready()) return; const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, k) => tone(f, t + k * 0.07, 0.5, { type: "triangle", vol: 0.18 })); }
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.45, { type: "triangle", vol: 0.25, to: 180 }); noise(t, 0.3, { type: "lowpass", f: 500, vol: 0.15 }); }
export function tick(hi = false) { if (!ready()) return; tone(hi ? 1600 : 1100, ac.currentTime, 0.05, { type: "square", vol: 0.06 }); }
export function page() { if (!ready()) return; noise(ac.currentTime, 0.18, { f: 2400, to: 900, q: 0.8, vol: 0.18 }); }
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.08, 0.15, 0.24].forEach((d, k) => { tone(3000 + k * 220, t + d, 0.12, { vol: 0.12 }); tone(4400 + k * 180, t + d, 0.08, { vol: 0.06 }); }); }
/** A finished round: a rising chord, brighter for a win. */
export function finale(won) { if (!ready()) return; const t = ac.currentTime, ch = won ? [392, 494, 587, 784, 988] : [330, 311, 294];
  ch.forEach((f, k) => tone(f, t + k * 0.1, 0.8, { type: "triangle", vol: 0.16 })); }
/** A quiet burner roar while the room is open. alive() false stops it. */
let roarOn = false;
export function roar(alive) { if (roarOn || !ready()) return; roarOn = true;
  const step = () => { if (!alive() || !ready()) { roarOn = false; return; } noise(ac.currentTime, 2.1, { type: "lowpass", f: 380, q: 0.6, vol: 0.05, shape: () => 1 }); setTimeout(step, 2000); };
  step(); }

// ---- also used by the Mineral Cabinet (minerals/room.js) ----
/** A hard point dragged across stone. */
export function scratch() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.35, { f: 3800, to: 2200, q: 3, vol: 0.3, shape: (x) => (0.6 + 0.4 * Math.sin(x * 60)) * (1 - x) }); }
/** Acid on a carbonate: a burst of tiny pops. n = how many. */
export function fizz(n = 14) { if (!ready()) return; const t = ac.currentTime; noise(t, 0.9, { type: "highpass", f: 5000, vol: 0.08 });
  for (let k = 0; k < n; k++) tone(rnd(1400, 3200), t + rnd(0, 0.8), 0.03, { vol: 0.08 }); }
/** A magnet snapping onto rock. */
export function clunk() { if (!ready()) return; const t = ac.currentTime; tone(140, t, 0.18, { type: "square", vol: 0.25, to: 70 }); noise(t, 0.08, { type: "lowpass", f: 900, vol: 0.4 }); }
/** A rock set down, or a balance pan settling. */
export function tap(heavy = false) { if (!ready()) return; const t = ac.currentTime; tone(heavy ? 120 : 260, t, 0.2, { type: "triangle", vol: 0.25, to: heavy ? 80 : 180 }); noise(t, 0.05, { type: "lowpass", f: 1500, vol: 0.3 }); }
/** The UV lamp switches on: a hum. */
export function hum() { if (!ready()) return; const t = ac.currentTime; tone(120, t, 0.9, { type: "sawtooth", vol: 0.05 }); tone(240, t, 0.9, { vol: 0.04 }); }
