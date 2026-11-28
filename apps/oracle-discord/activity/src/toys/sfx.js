// Sounds for the House toys, synthesised with Web Audio (no audio files). Follows the Chamber's mute button
// (voice-sfx.js isMuted); every sound starts from a click or tap.
import { isMuted } from "../voice-sfx.js";

let ac = null, bus = null;
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

// ---- the Scriptorium ----
/** A quill stroke on vellum: a short dry scratch. */
export function quill(len = 0.18) { if (!ready()) return; noise(ac.currentTime, len, { f: rnd(3200, 4600), to: rnd(2000, 2800), q: 2.5, vol: 0.14, shape: (x) => (0.6 + 0.4 * Math.sin(x * 40)) * (1 - x) }); }
/** Dip the quill in the inkwell: a tiny glassy tap. */
export function dip() { if (!ready()) return; const t = ac.currentTime; tone(2200, t, 0.12, { vol: 0.08 }); tone(3300, t + 0.02, 0.08, { vol: 0.04 }); }
/** The wax seal pressed down: a soft thump and a squish. */
export function seal() { if (!ready()) return; const t = ac.currentTime; tone(120, t, 0.3, { vol: 0.35, to: 70 }); noise(t, 0.25, { type: "lowpass", f: 700, vol: 0.25, shape: (x) => Math.exp(-x * 6) }); noise(t + 0.08, 0.3, { f: 900, q: 0.7, vol: 0.06 }); }
/** A page turned. */
export function page() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.28, { f: 2600, to: 800, q: 0.7, vol: 0.18, shape: (x) => Math.sin(Math.PI * x) }); noise(t + 0.22, 0.06, { type: "highpass", f: 3000, vol: 0.1 }); }
/** A candle crackle and the room's hush, while `alive()` holds. */
let hushOn = false;
export function hush(alive) { if (hushOn || !ready()) return; hushOn = true;
  const step = () => { if (!alive() || !ready()) { hushOn = false; return; } const t = ac.currentTime;
    noise(t, 2.6, { type: "lowpass", f: 260, q: 0.5, vol: 0.035, shape: () => 1 });
    if (Math.random() < 0.7) for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) noise(t + rnd(0, 2.2), 0.015, { type: "highpass", f: 2500, vol: rnd(0.04, 0.12) });
    setTimeout(step, 2500); };
  step(); }
/** A low bell for a new quote. */
export function bell() { if (!ready()) return; const t = ac.currentTime; [392, 784, 1176, 1568].forEach((f, k) => tone(f, t, 2.2 - k * 0.4, { vol: 0.09 / (k + 1) })); }

// ---- the Alchemist's House ----
/** Salt poured into the flask: a granular trickle. */
export function pour() { if (!ready()) return; const t = ac.currentTime; for (let k = 0; k < 14; k++) noise(t + k * 0.03 + rnd(0, 0.02), 0.02, { type: "highpass", f: rnd(3000, 6000), vol: rnd(0.05, 0.12) }); }
/** Bubbles rising. */
export function bubbles(n = 6) { if (!ready()) return; const t = ac.currentTime; for (let k = 0; k < n; k++) { const f = rnd(500, 1200); tone(f, t + k * rnd(0.06, 0.14), 0.09, { vol: 0.12, to: f * 2.2 }); } }
/** A glass rod stirring the flask. */
export function stir() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.9, { f: 1400, to: 2200, q: 3, vol: 0.06, shape: (x) => 0.5 + 0.5 * Math.sin(x * 22) }); tone(2600, t + 0.4, 0.15, { vol: 0.04 }); }
/** The flame meets the sample: whoosh and sizzle. */
export function flame() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.6, { type: "lowpass", f: 300, to: 1600, vol: 0.4, shape: (x) => Math.exp(-x * 4) });
  noise(t + 0.15, 0.8, { f: 3000, q: 1.5, vol: 0.18, shape: (x) => (0.5 + 0.5 * Math.random()) * (1 - x) }); }
/** A discharge tube buzzing on. */
export function buzz() { if (!ready()) return; const t = ac.currentTime; tone(120, t, 0.8, { type: "sawtooth", vol: 0.05 }); tone(240, t + 0.05, 0.7, { type: "square", vol: 0.02 }); tone(1800, t, 0.12, { vol: 0.05 }); }
/** One element tile tapped: a glassy note pitched by atomic number, with a timbre per family. */
const TIMBRE = { alkali: "triangle", alkaline: "sine", transition: "triangle", post: "sine", metalloid: "square", nonmetal: "sine", halogen: "sawtooth", noble: "sine", lanthanide: "triangle", actinide: "triangle", superheavy: "square" };
export function tile(z, cat = "transition") { if (!ready()) return; const t = ac.currentTime, f = 220 * Math.pow(2, ((z - 1) % 36) / 12);
  tone(f, t, 0.6, { type: TIMBRE[cat] || "sine", vol: cat === "halogen" || cat === "metalloid" || cat === "superheavy" ? 0.05 : 0.14 }); tone(f * 2, t + 0.01, 0.3, { vol: 0.04 }); }
/** A reveal: a rising sparkle. */
export function reveal() { if (!ready()) return; const t = ac.currentTime; [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, t + k * 0.08, 0.7, { type: "triangle", vol: 0.13 })); }
/** Cobalt glass held up. */
export function glass() { if (!ready()) return; const t = ac.currentTime; tone(2400, t, 0.4, { vol: 0.16 }); tone(6100, t, 0.2, { vol: 0.05 }); }
/** Flask emptied: a gurgle down the drain. */
export function drain() { if (!ready()) return; const t = ac.currentTime; for (let k = 0; k < 6; k++) tone(rnd(200, 420), t + k * 0.09, 0.1, { vol: 0.1, to: rnd(120, 200) }); }
