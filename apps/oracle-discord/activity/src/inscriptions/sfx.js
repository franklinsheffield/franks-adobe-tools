// Inscription Tray sound effects, synthesised with Web Audio (no audio files): a drawer sliding open, a stone set in
// the tray, a quill scratch for a test, a page turn, the wax-seal thump when a script is filed, right and wrong chimes,
// a tick for the speed round, coins and a finale. Follows the Chamber's mute button (voice-sfx.js isMuted).
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
/** A wooden drawer slides open. */
export function drawer() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.45, { type: "lowpass", f: 700, to: 300, vol: 0.3, shape: (x) => 0.6 + 0.4 * Math.sin(x * 40) }); tone(120, t + 0.42, 0.12, { vol: 0.2 }); }
/** A find is set down in the tray; heavier for stone and clay. */
export function setDown(heavy = true) { if (!ready()) return; const t = ac.currentTime; tone(heavy ? 90 : 220, t, 0.2, { vol: 0.3, to: heavy ? 60 : 160 }); noise(t, 0.08, { type: "lowpass", f: heavy ? 500 : 1500, vol: 0.3 }); }
/** A quill scratches a note (each test). */
export function scratch() { if (!ready()) return; const t = ac.currentTime; for (let k = 0; k < 3; k++) noise(t + k * 0.11, 0.09, { f: 3200 + k * 500, q: 3, vol: 0.18, shape: (x) => Math.sin(x * Math.PI) }); }
export function page() { if (!ready()) return; noise(ac.currentTime, 0.2, { f: 2400, to: 900, q: 0.8, vol: 0.18 }); }
/** The wax seal stamps a filed script: a soft thump and a little bell. */
export function seal() { if (!ready()) return; const t = ac.currentTime; tone(80, t, 0.25, { vol: 0.4, to: 55 }); noise(t, 0.06, { type: "lowpass", f: 400, vol: 0.4 }); tone(1568, t + 0.18, 0.6, { vol: 0.08 }); tone(2349, t + 0.2, 0.5, { vol: 0.05 }); }
export function right() { if (!ready()) return; const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, k) => tone(f, t + k * 0.07, 0.5, { type: "triangle", vol: 0.18 })); }
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.45, { type: "triangle", vol: 0.25, to: 180 }); noise(t, 0.2, { type: "lowpass", f: 600, vol: 0.12 }); }
export function tick(hi = false) { if (!ready()) return; tone(hi ? 1600 : 1100, ac.currentTime, 0.05, { type: "square", vol: 0.06 }); }
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.08, 0.15, 0.24].forEach((d, k) => { tone(3000 + k * 220, t + d, 0.12, { vol: 0.12 }); tone(4400 + k * 180, t + d, 0.08, { vol: 0.06 }); }); }
/** A finished round: a hurdy-gurdy-like drone and a rising tune for a win, a falling one for a loss. */
export function finale(won) { if (!ready()) return; const t = ac.currentTime; tone(147, t, 1.6, { type: "sawtooth", vol: 0.05 });
  (won ? [294, 370, 440, 587] : [330, 294, 262]).forEach((f, k) => tone(f, t + k * 0.14, 0.7, { type: "triangle", vol: 0.16 })); }
