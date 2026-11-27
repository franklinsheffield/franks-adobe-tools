// Lead into Gold sound (Web Audio, no files): Geiger clicks, the pop of an alpha, the zip of a beta, the accelerator
// beam, and a gold chime. Follows the Chamber mute (voice-sfx.js).
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
function click(t, vol = 0.35) { const n = ac.createBuffer(1, 160, ac.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = n; g.gain.value = vol; s.connect(g); g.connect(bus); s.start(t); }
/** A burst of Geiger-counter clicks at random intervals. */
export function geiger(n = 8, span = 0.8) { if (!ready()) return; const t = ac.currentTime; for (let i = 0; i < n; i++) click(t + Math.random() * span, 0.2 + Math.random() * 0.2); }
export function alpha() { if (!ready()) return; const t = ac.currentTime; tone(180, t, 0.25, { type: "triangle", vol: 0.3, to: 60 }); click(t, 0.4); }
export function beta() { if (!ready()) return; const t = ac.currentTime; tone(1800, t, 0.18, { type: "sawtooth", vol: 0.05, to: 5200 }); }
export function beam() { if (!ready()) return; const t = ac.currentTime; tone(110, t, 0.5, { type: "sawtooth", vol: 0.06, to: 880 }); tone(1320, t + 0.45, 0.2, { vol: 0.1, to: 440 }); }
export function gold() { if (!ready()) return; const t = ac.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.6, { vol: 0.12 })); }
export function right() { if (!ready()) return; const t = ac.currentTime; tone(660, t, 0.2, { vol: 0.12 }); tone(990, t + 0.1, 0.3, { vol: 0.12 }); }
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.45, { type: "triangle", vol: 0.15, to: 150 }); }
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.08, 0.15, 0.24].forEach((d, i) => tone(1800 + i * 120, t + d, 0.12, { type: "triangle", vol: 0.1 })); }
