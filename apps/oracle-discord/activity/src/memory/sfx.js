// Grimoire Memory sounds, made with Web Audio (no files). They follow the Chamber's mute button (voice-sfx.js).
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
function swish(c, t, dur, { from = 1500, to = 4500, vol = 0.3, q = 1 } = {}) {
  const n = noise(c, dur), f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + dur);
}
// A pentatonic run, so combos climb without ever sounding wrong.
const PENTA = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];

export const SFX = {
  /** Dealing: a quick riffle of card snaps. */
  deal(n = 12) { const c = ctx(); if (!c) return; const t = c.currentTime; for (let i = 0; i < n; i++) swish(c, t + i * 0.045, 0.05, { from: 2500, to: 5000, vol: 0.18, q: 2.5 }); },
  /** A card turned over: a soft snap. */
  flip() { const c = ctx(); if (!c) return; const t = c.currentTime; swish(c, t, 0.09, { from: 1800, to: 5200, vol: 0.28, q: 1.5 }); tone(c, 1400, t, 0.04, { type: "triangle", vol: 0.05 }); },
  /** A pair: two bell notes, climbing higher with the combo. */
  match(combo = 1) { const c = ctx(); if (!c) return; const t = c.currentTime, k = Math.min(combo - 1, PENTA.length - 3);
    [PENTA[k], PENTA[k + 2]].forEach((f, i) => { tone(c, f, t + i * 0.09, 0.8, { vol: 0.32 }); tone(c, f * 3, t + i * 0.09, 0.3, { vol: 0.04 }); }); },
  /** Not a pair: a low, woody double knock. */
  miss() { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, 170, t, 0.18, { type: "triangle", vol: 0.4, to: 120 }); tone(c, 150, t + 0.12, 0.2, { type: "triangle", vol: 0.32, to: 100 }); },
  /** The peek: a shimmer as every card lifts, then falls. */
  peek() { const c = ctx(); if (!c) return; const t = c.currentTime; for (let i = 0; i < 6; i++) tone(c, 900 + i * 180, t + i * 0.04, 0.5, { vol: 0.07 }); swish(c, t, 0.4, { from: 800, to: 3000, vol: 0.15 }); },
  /** The board cleared: a rising arpeggio with a sparkle on top. */
  win() { const c = ctx(); if (!c) return; const t = c.currentTime; [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => tone(c, f, t + i * 0.1, 1.1, { vol: 0.3 }));
    for (let i = 0; i < 8; i++) tone(c, 1800 + Math.random() * 1600, t + 0.5 + i * 0.05, 0.25, { vol: 0.07 }); },
  /** A star appearing on the results. */
  star(i = 0) { const c = ctx(); if (!c) return; const t = c.currentTime; tone(c, PENTA[4 + i * 2], t, 0.6, { vol: 0.25 }); tone(c, PENTA[4 + i * 2] * 2, t, 0.3, { vol: 0.05 }); },
};
