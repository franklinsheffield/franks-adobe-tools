// Element Duel sounds, made with Web Audio (no files). They follow the Chamber's mute button (voice-sfx.js).
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
  /** Cards dealt: quick flicks. */
  deal(n = 4) { const c = ctx(); if (!c) return; const t = c.currentTime; for (let i = 0; i < n; i++) hiss(c, t + i * 0.06, 0.05, { from: 3000, to: 6000, vol: 0.2, q: 2 }); },
  /** A card onto the bench: a glassy click whose pitch rises with each card. */
  place(i = 0) { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, 660 * Math.pow(1.122, i), t, 0.12, { type: "triangle", vol: 0.25 }); },
  /** Back into the hand. */
  unplace() { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, 520, t, 0.1, { type: "triangle", vol: 0.18, to: 380 }); },
  /** A reaction: a rising whoosh, then a boom sized by its power. */
  react(power = 5) { const c = ctx(); if (!c) return; const t = c.currentTime; hiss(c, t, 0.35, { from: 400, to: 5000, vol: 0.3 });
    const v = Math.min(0.8, 0.3 + power * 0.05); tone(c, 140, t + 0.35, 0.6, { vol: v, to: 40 }); hiss(c, t + 0.35, 0.5, { from: 2000, to: 200, vol: v * 0.6, q: 0.5 });
    [523, 784, 1047].forEach((f, i) => tone(c, f, t + 0.4 + i * 0.05, 0.4, { vol: 0.1 })); },
  /** A fizzle: bubbling then a sad hiss. */
  fizz() { const c = ctx(); if (!c) return; const t = c.currentTime; for (let i = 0; i < 6; i++) tone(c, 300 + Math.random() * 500, t + i * 0.05, 0.06, { vol: 0.12 }); hiss(c, t + 0.3, 0.6, { from: 4000, to: 800, vol: 0.25 }); },
  /** Getting hit: a low thud. */
  hit() { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, 90, t, 0.3, { vol: 0.6, to: 50 }); hiss(c, t, 0.1, { from: 500, to: 200, vol: 0.3, q: 0.7 }); },
  /** An inert shield going up: a shimmering chord. */
  shield() { const c = ctx(); if (!c) return; const t = c.currentTime; [392, 494, 587, 784].forEach((f, i) => { tone(c, f, t + i * 0.04, 0.9, { vol: 0.16 }); tone(c, f * 1.005, t + i * 0.04, 0.9, { vol: 0.1 }); }); },
  /** The lab condition card flipping over. */
  flip() { const c = ctx(); if (!c) return; const t = c.currentTime; hiss(c, t, 0.15, { from: 1500, to: 4500, vol: 0.25 }); tone(c, 880, t + 0.12, 0.2, { type: "triangle", vol: 0.15 }); },
  /** A brand-new compound for your Codex. */
  discover() { const c = ctx(); if (!c) return; const t = c.currentTime + 0.5; for (let i = 0; i < 6; i++) tone(c, 1000 + i * 200, t + i * 0.05, 0.3, { vol: 0.12 }); },
  /** A chain step. */
  chain(k = 1) { const c = ctx(); if (!c) return; const t = c.currentTime + 0.3; for (let i = 0; i <= k; i++) tone(c, 440 * Math.pow(1.26, i), t + i * 0.1, 0.3, { type: "square", vol: 0.08 }); },
  /** Victory fanfare. */
  win() { const c = ctx(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => { tone(c, f, t + i * 0.12, 0.35, { type: "square", vol: 0.12 }); tone(c, f / 2, t + i * 0.12, 0.35, { vol: 0.2 }); }); },
  /** Defeat: a falling minor line. */
  lose() { const c = ctx(); if (!c) return; const t = c.currentTime; [392, 349, 311, 262].forEach((f, i) => tone(c, f, t + i * 0.2, 0.5, { type: "triangle", vol: 0.3 })); },
};
