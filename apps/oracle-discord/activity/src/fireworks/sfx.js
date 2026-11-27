// Fireworks Workshop sound (Web Audio, no files): the mortar thump, the rising whistle, the boom of the burst, the
// crackle of a chrysanthemum, a fizzle for a dud, and the show's beat. Follows the Chamber mute (voice-sfx.js).
import { isMuted } from "../voice-sfx.js";
let ac = null, bus = null;
function ready() {
  if (isMuted()) return null;
  try { if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); bus = ac.createGain(); bus.gain.value = 0.22; bus.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume(); return ac; } catch { return null; }
}
function tone(f, t, dur, { type = "sine", vol = 0.3, to = null } = {}) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, { type = "lowpass", f = 800, to = null, vol = 0.4, q = 0.7 } = {}) {
  const n = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = n; fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q; g.gain.value = vol;
  s.connect(fl); fl.connect(g); g.connect(bus); s.start(t);
}
export function thump() { if (!ready()) return; const t = ac.currentTime; tone(90, t, 0.25, { vol: 0.5, to: 40 }); noise(t, 0.2, { f: 400, vol: 0.5 }); }
export function whistle(rise = 0.9) { if (!ready()) return; const t = ac.currentTime + 0.05; tone(900, t, Math.max(0.4, rise - 0.1), { type: "triangle", vol: 0.06, to: 2400 }); }
export function boom(at = 0, big = 1) { if (!ready()) return; const t = ac.currentTime + at; noise(t, 1.1, { f: 900, to: 120, vol: 0.7 * big }); tone(60, t, 0.6, { vol: 0.4 * big, to: 30 }); }
export function crackle(at = 0) { if (!ready()) return; const t0 = ac.currentTime + at + 0.4; for (let i = 0; i < 26; i++) noise(t0 + Math.random() * 1.4, 0.02, { type: "highpass", f: 3000, vol: 0.25 }); }
export function fizzle() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.7, { type: "bandpass", f: 2400, to: 600, vol: 0.3, q: 2 }); }
export function beat(hi = false) { if (!ready()) return; const t = ac.currentTime; tone(hi ? 660 : 440, t, 0.12, { type: "square", vol: 0.05 }); tone(110, t, 0.15, { vol: 0.2 }); }
export function pack() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.12, { type: "bandpass", f: 1800, vol: 0.2, q: 3 }); }
export function right() { if (!ready()) return; const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.3, { vol: 0.12 })); }
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.45, { type: "triangle", vol: 0.15, to: 150 }); }
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.08, 0.15, 0.24].forEach((d, i) => tone(1800 + i * 120, t + d, 0.12, { type: "triangle", vol: 0.1 })); }
/** Burst sounds for a shot that bursts `at` seconds from now. */
export function burstAt(at, effect) { boom(at, 1); if (effect === "chrysanthemum") crackle(at); }
