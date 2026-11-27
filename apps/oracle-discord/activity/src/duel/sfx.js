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
  /**
   * The damage phase, timed to the table animation: cards swish in (0 s), the atoms fuse (0.5 s), the reaction plays its
   * own sound by kind (0.8 s, with a deep boom for power 8+ and a bigger one for 11+), an orb launches (1.15 s) and lands with a hit, or a clang on a shield (1.5 s).
   */
  react(power = 5, kind = "crystal", { dmg = 1, blocked = 0 } = {}) {
    const c = ctx(); if (!c) return; const t = c.currentTime, h0 = t + 1.5;
    out.gain.setValueAtTime(power <= 4 ? 0.15 : 0.22, t); out.gain.setValueAtTime(0.22, t + 2.4); // small reactions are quieter
    for (let i = 0; i < 3; i++) hiss(c, t + i * 0.07, 0.12, { from: 2500, to: 6000, vol: 0.18, q: 1.5 });
    [523, 659].forEach((f, i) => tone(c, f, t + 0.5 + i * 0.06, 0.25, { type: "triangle", vol: 0.12 }));
    const k = t + 0.8, v = Math.min(0.8, 0.3 + power * 0.05);
    ({
      fire: () => { hiss(c, k, 0.9, { from: 300, to: 1800, vol: v * 0.8, q: 0.4 }); tone(c, 110, k, 0.8, { vol: v, to: 45 }); for (let i = 0; i < 6; i++) hiss(c, k + 0.1 + Math.random() * 0.6, 0.04, { from: 3000, to: 5000, vol: 0.2, q: 4 }); },
      frost: () => { for (let i = 0; i < 8; i++) tone(c, 1800 + Math.random() * 1600, k + i * 0.07, 0.25, { vol: 0.09 }); hiss(c, k, 1, { from: 6000, to: 9000, vol: 0.12, q: 2 }); tone(c, 220, k, 0.9, { type: "triangle", vol: 0.15, to: 110 }); },
      spark: () => { for (let i = 0; i < 3; i++) { tone(c, 90, k + i * 0.12, 0.08, { type: "sawtooth", vol: 0.35 }); hiss(c, k + i * 0.12, 0.08, { from: 6000, to: 2000, vol: 0.4, q: 0.6 }); } tone(c, 60, k + 0.35, 0.6, { vol: 0.5, to: 35 }); },
      acid: () => { hiss(c, k, 1.1, { from: 5000, to: 3000, vol: 0.3, q: 1.2 }); for (let i = 0; i < 6; i++) tone(c, 600 + Math.random() * 400, k + 0.1 + i * 0.12, 0.05, { vol: 0.1, to: 300 }); },
      base: () => { for (let i = 0; i < 9; i++) tone(c, 400 + Math.random() * 700, k + i * 0.08, 0.08, { vol: 0.14, to: 900 + Math.random() * 600 }); },
      catalyst: () => { tone(c, 220, k, 1.2, { type: "sawtooth", vol: 0.06, to: 880 }); [440, 554, 659, 880].forEach((f, i) => tone(c, f, k + 0.2 + i * 0.1, 0.4, { vol: 0.12 })); },
      gas: () => { hiss(c, k, 1.2, { from: 800, to: 2400, vol: 0.35, q: 0.5 }); tone(c, 150, k, 0.5, { vol: 0.2, to: 90 }); },
      crystal: () => { [1568, 2093, 1760, 2637].forEach((f, i) => tone(c, f, k + i * 0.06, 0.6, { vol: 0.12 })); tone(c, 130, k, 0.5, { vol: v * 0.7, to: 60 }); },
    }[kind] || (() => {}))();
    if (power >= 11) { tone(c, 55, k + 0.05, 1.4, { vol: 0.9, to: 28 }); hiss(c, k + 0.05, 1.1, { from: 200, to: 900, vol: 0.6, q: 0.3 }); tone(c, 82, h0 + 0.02, 0.6, { vol: 0.7, to: 35 }); }
    else if (power >= 8) { tone(c, 70, k + 0.05, 0.9, { vol: 0.6, to: 35 }); hiss(c, k + 0.05, 0.7, { from: 300, to: 1200, vol: 0.4, q: 0.4 }); }
    tone(c, 300, t + 1.15, 0.35, { type: "triangle", vol: 0.12, to: 900 }); hiss(c, t + 1.15, 0.35, { from: 1200, to: 4000, vol: 0.18 });
    const h = t + 1.5;
    if (blocked) { [880, 1320].forEach((f) => tone(c, f, h, 0.6, { type: "square", vol: 0.07 })); hiss(c, h, 0.2, { from: 3000, to: 1500, vol: 0.2, q: 3 }); }
    if (dmg) { tone(c, 90, h, 0.35, { vol: Math.min(0.8, 0.35 + dmg * 0.05), to: 45 }); hiss(c, h, 0.15, { from: 600, to: 200, vol: 0.35, q: 0.7 }); }
  },
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
