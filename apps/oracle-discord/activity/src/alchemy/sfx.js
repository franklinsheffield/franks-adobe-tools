// Alchemist's Lab sound effects, synthesised with Web Audio (no audio files): glass clinks, pouring, bubbling,
// the furnace whoosh and crackle, a failed fizzle, a snuffed flame, page turns and the transmutation chord.
// Follows the Chamber's mute button (voice-sfx.js isMuted). Started from clicks, so browsers allow the sound.
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

/** A glass jar tapped as it comes off the shelf. */
export function clink(i = 0) { if (!ready()) return; const t = ac.currentTime, f = 1900 + (i % 6) * 170;
  tone(f, t, 0.35, { vol: 0.22 }); tone(f * 2.76, t, 0.18, { vol: 0.08 }); }
/** Liquid pouring into the flask, then a small splash. */
export function pour() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.55, { f: 700, to: 1800, q: 2.5, vol: 0.35, shape: (x) => Math.sin(Math.PI * x) * (0.7 + 0.3 * Math.sin(x * 90)) });
  for (let k = 0; k < 3; k++) tone(rnd(500, 900), t + 0.45 + k * 0.05, 0.06, { vol: 0.15, to: rnd(1200, 1800) }); }
/** A run of bubbles: little rising pops. */
export function bubble(n = 6) { if (!ready()) return; const t = ac.currentTime;
  for (let k = 0; k < n; k++) { const s = t + k * rnd(0.05, 0.12), f = rnd(260, 620); tone(f, s, rnd(0.05, 0.09), { vol: 0.18, to: f * rnd(1.8, 2.6) }); } }
/** The furnace roars: a rising whoosh. */
export function whoosh() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.7, { type: "lowpass", f: 200, to: 2200, vol: 0.45, shape: (x) => Math.min(1, x * 6) * (1 - x) });
  tone(70, t, 0.6, { type: "triangle", vol: 0.2, to: 110, attack: 0.05 }); }
/** A failed mix: a hiss, a sour bubble and a dull thud. */
export function fizzle() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.8, { type: "highpass", f: 3000, to: 800, vol: 0.28 }); tone(180, t + 0.05, 0.35, { type: "sawtooth", vol: 0.12, to: 70 });
  tone(90, t + 0.35, 0.25, { vol: 0.35, to: 45 }); }
/** A flame going out: a short puff. */
export function snuff() { if (!ready()) return; const t = ac.currentTime + 0.25;
  noise(t, 0.3, { type: "bandpass", f: 900, to: 300, q: 0.8, vol: 0.35, shape: (x) => (1 - x) ** 2 }); }
/** A page of the notebook turning. */
export function page() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.28, { type: "highpass", f: 2500, vol: 0.22, shape: (x) => Math.sin(Math.PI * x) * (0.6 + 0.4 * Math.random()) }); }
/** Success: a shimmering rising arpeggio over a warm chord, with a bubbling flourish. */
export function transmute() { if (!ready()) return; const t = ac.currentTime;
  [262, 330, 392].forEach((f) => tone(f, t, 1.6, { type: "triangle", vol: 0.12, attack: 0.08 }));
  [523, 659, 784, 1047, 1319, 1568].forEach((f, k) => tone(f, t + 0.1 + k * 0.07, 0.9, { vol: 0.16 }));
  noise(t + 0.4, 1.2, { type: "highpass", f: 6000, vol: 0.12, shape: (x) => (1 - x) * (Math.random() > 0.97 ? 1 : 0.15) });
  setTimeout(() => bubble(8), 250); }
/** Wrong symbol on level 1: a low, dull bell. */
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.5, { type: "triangle", vol: 0.25, to: 185 }); tone(233, t, 0.5, { type: "triangle", vol: 0.15 }); }
/** Coins on the apothecary counter. */
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.08, 0.15, 0.24].forEach((d, k) => { tone(3000 + k * 220, t + d, 0.12, { vol: 0.12 }); tone(4400 + k * 180, t + d, 0.08, { vol: 0.06 }); }); }

/** Quiet fire crackle and the odd bubble while the bench is open. `alive()` says whether to keep going. */
export function ambience(alive) {
  clearInterval(crackleTimer);
  crackleTimer = setInterval(() => {
    if (!alive()) { clearInterval(crackleTimer); return; }
    if (!ac || ac.state !== "running" || isMuted()) return;
    const t = ac.currentTime;
    for (let k = 0; k < 3; k++) if (Math.random() < 0.5) noise(t + rnd(0, 0.5), 0.02, { type: "highpass", f: rnd(1500, 4000), vol: rnd(0.05, 0.14) });
    if (Math.random() < 0.25) { const f = rnd(300, 500); tone(f, t + rnd(0, 0.4), 0.06, { vol: 0.05, to: f * 2 }); }
  }, 600);
}
/** Electricity from Volta's pile: a crackling buzz. */
export function zap() { if (!ready()) return; const t = ac.currentTime;
  tone(120, t, 0.5, { type: "sawtooth", vol: 0.12, to: 90 }); for (let k = 0; k < 6; k++) noise(t + k * 0.07, 0.03, { type: "highpass", f: 3000, vol: 0.25 }); }
