// Herbalist's Grimoire sounds, made with Web Audio (no files). They follow the Chamber's mute button (voice-sfx.js).
import { isMuted } from "../voice-sfx.js";

let ac = null, out = null;
function ctx() {
  if (isMuted()) return null;
  try {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); out = ac.createGain(); out.gain.value = 0.22; out.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  } catch { return null; }
}
function noise(c, dur) { const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; }
function tone(c, freq, t, dur, { type = "sine", vol = 0.5, to = null } = {}) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
function hiss(c, t, dur, { from = 1200, to = 4000, vol = 0.35, q = 0.8 } = {}) {
  const n = noise(c, dur), f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + dur);
}

export const SFX = {
  /** A grimoire page turning: two soft paper swishes. */
  page() { const c = ctx(); if (!c) return; const t = c.currentTime; hiss(c, t, 0.22, { from: 900, to: 3800 }); hiss(c, t + 0.16, 0.28, { from: 3000, to: 700, vol: 0.25 }); },
  /** A leaf drifting off the page: a falling, wavering whistle and a tiny rustle. */
  leaf() { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, 880, t, 0.55, { type: "triangle", vol: 0.18, to: 330 }); hiss(c, t + 0.4, 0.18, { from: 2500, to: 1500, vol: 0.18, q: 2 }); },
  /** Another clue: a quick quill scratch. */
  quill() { const c = ctx(); if (!c) return; const t = c.currentTime; for (let i = 0; i < 3; i++) hiss(c, t + i * 0.07, 0.06, { from: 5000, to: 7000, vol: 0.16, q: 3 }); },
  /** A right answer: a bright kalimba-like arpeggio. */
  right() { const c = ctx(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047].forEach((f, i) => { tone(c, f, t + i * 0.08, 0.7, { vol: 0.35 }); tone(c, f * 2, t + i * 0.08, 0.25, { vol: 0.06 }); }); },
  /** A wrong answer: a dull, woody knock. */
  wrong() { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, 180, t, 0.25, { type: "triangle", vol: 0.45, to: 110 }); hiss(c, t, 0.08, { from: 600, to: 300, vol: 0.2, q: 1 }); },
  /** The POISON stamp coming down. */
  stamp() { const c = ctx(); if (!c) return; const t = c.currentTime + 0.2; tone(c, 90, t, 0.35, { vol: 0.7, to: 45 }); hiss(c, t, 0.12, { from: 400, to: 200, vol: 0.5, q: 0.6 }); tone(c, 233, t + 0.05, 0.6, { type: "sawtooth", vol: 0.05, to: 220 }); },
  /** A page earned: a rising sparkle. */
  sparkle() { const c = ctx(); if (!c) return; const t = c.currentTime; for (let i = 0; i < 7; i++) tone(c, 1200 + i * 220 + Math.random() * 80, t + i * 0.05, 0.3, { vol: 0.12 }); },
};
