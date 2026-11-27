// Cipher Desk sound effects, synthesised with Web Audio (no audio files): paper unfolding, the click of a cipher
// wheel, letters flickering into place, a seal cracking on a forgery, right and wrong, coins and a finale.
// Follows the Chamber's mute button (voice-sfx.js isMuted).
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
/** A folded letter opens. */
export function unfold() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.18, { f: 2400, q: 0.7, vol: 0.25 }); noise(t + 0.16, 0.22, { f: 1800, q: 0.7, vol: 0.2 }); }
/** One click of the wheel. */
export function click(up = true) { if (!ready()) return; const t = ac.currentTime; noise(t, 0.035, { type: "highpass", f: up ? 3200 : 2600, vol: 0.35 }); tone(up ? 900 : 760, t, 0.04, { type: "square", vol: 0.04 }); }
/** Letters flicker into plain text. */
export function decode(n = 8) { if (!ready()) return; const t = ac.currentTime; for (let i = 0; i < n; i++) tone(700 + ((i * 137) % 600), t + i * 0.045, 0.05, { type: "triangle", vol: 0.06 }); tone(1046, t + n * 0.045, 0.3, { vol: 0.12 }); }
/** A quill scratch: a test or a note. */
export function scratch() { if (!ready()) return; const t = ac.currentTime; for (let i = 0; i < 3; i++) noise(t + i * 0.09, 0.08, { f: 3800, q: 2, vol: 0.18 }); }
/** The wax seal thumps down. */
export function seal() { if (!ready()) return; const t = ac.currentTime; tone(110, t, 0.25, { vol: 0.4, to: 60 }); noise(t, 0.08, { type: "lowpass", f: 500, vol: 0.3 }); }
/** Wren's seal cracks: a forgery read as genuine. */
export function crack() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.12, { type: "highpass", f: 1800, vol: 0.5 }); noise(t + 0.1, 0.25, { type: "bandpass", f: 900, q: 3, vol: 0.25 }); tone(220, t + 0.05, 0.4, { type: "sawtooth", vol: 0.05, to: 110 }); }
export function right() { if (!ready()) return; const t = ac.currentTime; [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.08, 0.25, { vol: 0.16 })); }
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.25, { type: "triangle", vol: 0.18, to: 150 }); }
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.07, 0.14].forEach((d, i) => tone(1800 + i * 250, t + d, 0.12, { type: "triangle", vol: 0.1 })); }
export function finale(won) { if (!ready()) return; const t = ac.currentTime; (won ? [523, 659, 784, 1046] : [392, 349, 294]).forEach((f, i) => tone(f, t + i * 0.13, 0.4, { vol: 0.15 })); }
