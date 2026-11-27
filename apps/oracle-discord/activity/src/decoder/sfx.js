// Decoder sounds, made with Web Audio (no audio files). Each script has its own carving sound:
// a chisel on stone for runes, a knock on a standing stone for Ogham, a reed pen for hieroglyphs, a tap on clay for Maya.
// Sounds follow the Chamber's mute button (voice-sfx.js) and only play after a click, as browsers require.
import { isMuted } from "../voice-sfx.js";

let ctx = null, out = null;
function ac() {
  if (isMuted()) return null;
  try {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.16; out.connect(ctx.destination); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(f, at, dur, { type = "sine", g = 0.4, to = 0, vib = 0 } = {}) {
  const t = ctx.currentTime + at, o = ctx.createOscillator(), e = ctx.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  if (vib) { const l = ctx.createOscillator(), d = ctx.createGain(); l.frequency.value = vib; d.gain.value = f * 0.015; l.connect(d); d.connect(o.frequency); l.start(t); l.stop(t + dur + 0.02); }
  e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e); e.connect(out); o.start(t); o.stop(t + dur + 0.02);
}
function noise(at, dur, { f = 2000, q = 1, g = 0.5, type = "bandpass", fall = 2 } = {}) {
  const t = ctx.currentTime + at, n = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, fall);
  const s = ctx.createBufferSource(), b = ctx.createBiquadFilter(), e = ctx.createGain(); s.buffer = n; b.type = type; b.frequency.value = f; b.Q.value = q; e.gain.value = g;
  s.connect(b); b.connect(e); e.connect(out); s.start(t);
}

// A rising pentatonic scale: each correct sign in an inscription plays the next note.
const SCALE = [392, 440, 523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
const note = (i) => SCALE[i % SCALE.length];

const CARVE = {
  futhark: (i) => { noise(0, 0.05, { f: 3800, q: 3, g: 0.7 }); noise(0.05, 0.04, { f: 2600, q: 3, g: 0.4 }); tone(note(i), 0.03, 0.22, { type: "triangle", g: 0.3 }); },
  ogham: (i) => { tone(210, 0, 0.12, { to: 120, g: 0.6 }); noise(0, 0.06, { f: 600, type: "lowpass", g: 0.5 }); tone(note(i), 0.04, 0.3, { type: "triangle", g: 0.28 }); },
  egyptian: (i) => { noise(0, 0.14, { f: 5200, type: "highpass", g: 0.35, fall: 1 }); tone(note(i), 0.06, 0.3, { type: "sine", g: 0.32 }); },
  maya: (i) => { tone(330, 0, 0.09, { to: 160, g: 0.55 }); noise(0, 0.04, { f: 1200, q: 2, g: 0.35 }); tone(note(i), 0.03, 0.3, { type: "triangle", g: 0.3 }); },
};

export const SFX = {
  /** A correct sign: the script's carving sound plus the next note up the scale. */
  carve: (script, i = 0) => (CARVE[script] || CARVE.futhark)(i),
  /** A wrong sign: a dull thud and a falling buzz. */
  wrong: () => { tone(150, 0, 0.18, { type: "sawtooth", to: 90, g: 0.25 }); noise(0, 0.08, { f: 300, type: "lowpass", g: 0.4 }); },
  /** Opening a script: a short motif in its people's sound. */
  open: (script) => ({
    futhark: () => { tone(110, 0, 0.9, { type: "sawtooth", to: 147, g: 0.18 }); tone(220, 0.05, 0.8, { type: "triangle", g: 0.12 }); },
    ogham: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.6, { type: "triangle", g: 0.22 })),
    egyptian: () => [0, 0.12, 0.24].forEach((t) => noise(t, 0.1, { f: 7000, type: "highpass", g: 0.4, fall: 3 })),
    maya: () => { tone(90, 0, 0.25, { to: 60, g: 0.6 }); tone(784, 0.2, 0.7, { g: 0.2, vib: 6 }); },
  }[script] || (() => {}))(),
  /** Turning to a lesson or a new card. */
  page: () => noise(0, 0.12, { f: 3000, q: 0.7, g: 0.25, fall: 1.5 }),
  /** A card zooms up. */
  zoom: () => { noise(0, 0.25, { f: 1500, q: 0.6, g: 0.2, fall: 0.8 }); tone(660, 0.05, 0.25, { to: 990, g: 0.12 }); },
  /** The whole inscription is read: a glittering run up the scale. */
  solve: () => [0, 2, 4, 5, 7, 9].forEach((k, i) => tone(note(k), i * 0.07, 0.4, { type: "triangle", g: 0.3 })),
  /** Stars pop in one by one. */
  stars: (n) => { for (let i = 0; i < n; i++) { tone(1319 + i * 220, 0.35 + i * 0.22, 0.25, { type: "square", g: 0.14 }); tone(2637 + i * 440, 0.36 + i * 0.22, 0.2, { g: 0.08 }); } },
  /** A right answer to the meaning question. */
  right: () => { tone(784, 0, 0.18, { type: "triangle", g: 0.3 }); tone(1047, 0.09, 0.3, { type: "triangle", g: 0.3 }); },
  /** Cards: a riffle and a deal of n cards, one drawn card, a card flicked from the hand, the ink running dry. */
  deal: (n = 5) => { for (let k = 0; k < 18; k++) noise(k * 0.02, 0.02, { f: 3400 + Math.random() * 1200, q: 1.2, g: 0.3 }); for (let i = 0; i < Math.min(8, n); i++) noise(0.45 + i * 0.07, 0.07, { f: 2300, q: 0.7, g: 0.28 }); },
  draw: () => { noise(0, 0.1, { f: 2600, q: 0.6, g: 0.35 }); noise(0.09, 0.03, { f: 1200, q: 2, g: 0.4 }); },
  flick: () => noise(0, 0.06, { f: 3200, q: 0.9, g: 0.3 }),
  dry: () => { tone(330, 0, 0.5, { type: "triangle", to: 110, g: 0.3 }); noise(0.1, 0.3, { f: 500, type: "lowpass", g: 0.25, fall: 1 }); },
  /** A tap on a tile or button (very soft). */
  tap: () => tone(1200, 0, 0.04, { type: "triangle", g: 0.08 }),
};

/** Play a Decoder sound. Silent when muted, unsupported or not yet unlocked by a click. */
export function play(name, ...args) { try { if (SFX[name] && ac()) SFX[name](...args); } catch {} }
