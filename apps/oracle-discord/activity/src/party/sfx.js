// Party round sound effects (Fact or Fib and later party rounds), synthesised with Web Audio, no audio files.
// Follows the Chamber's mute button (voice-sfx.js isMuted); started from clicks.
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
function tone(f, t, dur, { type = "sine", vol = 0.3, to = null } = {}) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, { f = 1200, to = null, vol = 0.2 } = {}) {
  const n = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = n; fl.type = "bandpass"; fl.frequency.setValueAtTime(f, t);
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(bus); s.start(t);
}
/** A round opens: a curtain swish and two notes. */
export function curtain() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.5, { f: 600, to: 3000, vol: 0.18 }); tone(392, t + 0.2, 0.3, { type: "triangle", vol: 0.15 }); tone(587, t + 0.35, 0.4, { type: "triangle", vol: 0.15 }); }
/** Your fib is locked in: a quill scratch and a seal thump. */
export function seal() { if (!ready()) return; const t = ac.currentTime; noise(t, 0.12, { f: 3500, vol: 0.15 }); tone(110, t + 0.12, 0.2, { type: "square", vol: 0.18, to: 60 }); }
/** "Too close to the truth": a soft buzz. */
export function buzz() { if (!ready()) return; tone(150, ac.currentTime, 0.25, { type: "sawtooth", vol: 0.08 }); }
/** The countdown's last seconds. */
export function tick(hi = false) { if (!ready()) return; tone(hi ? 1500 : 1000, ac.currentTime, 0.05, { type: "square", vol: 0.05 }); }
/** The cards flip face up for voting. */
export function flip(n = 4) { if (!ready()) return; const t = ac.currentTime; for (let k = 0; k < n; k++) noise(t + k * 0.07, 0.06, { f: 2500 + k * 200, vol: 0.2 }); }
/** A fib is exposed: a comic slide-whistle drop. */
export function fooled() { if (!ready()) return; const t = ac.currentTime; tone(900, t, 0.45, { type: "sine", vol: 0.15, to: 180 }); }
/** The truth is revealed: a bright chord. */
export function truth() { if (!ready()) return; const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, k) => tone(f, t + k * 0.06, 0.6, { type: "triangle", vol: 0.15 })); }
/** The match ends: a fanfare, brighter for a win. */
export function fanfare(won) { if (!ready()) return; const t = ac.currentTime, ch = won ? [392, 523, 659, 784, 1047] : [392, 349, 330];
  ch.forEach((f, k) => tone(f, t + k * 0.11, 0.7, { type: "triangle", vol: 0.15 })); }
