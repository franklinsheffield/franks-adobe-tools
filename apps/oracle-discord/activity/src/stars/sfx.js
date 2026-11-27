// Star Lore Navigator sounds: glassy star pings, a guttering lantern, the observatory dome, and a bell arpeggio when you
// find something. Web Audio only (no files). Follows the Chamber's mute switch (voice-sfx.js isMuted).
import { isMuted } from "../voice-sfx.js";

let ac = null, out = null;
function ready() {
  if (isMuted()) return false;
  try {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ac = new AC(); out = ac.createGain(); out.gain.value = 0.16;
      const dl = ac.createDelay(); dl.delayTime.value = 0.23; const fb = ac.createGain(); fb.gain.value = 0.38; const wet = ac.createGain(); wet.gain.value = 0.3;
      out.connect(ac.destination); out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume();
    return true;
  } catch { return false; }
}
/** One bell-like tone: sine plus a quiet octave, quick attack, long decay. */
function bell(f, at = 0, dur = 1.2, vol = 0.5, type = "sine") {
  const t = ac.currentTime + at;
  for (const [mul, v] of [[1, vol], [2.01, vol * 0.25]]) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f * mul;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
}
function sweep(f0, f1, at, dur, vol, type = "sine") {
  const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
function hiss(at, dur, vol, freq = 900) {
  const t = ac.currentTime + at, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(out); s.start(t);
}
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

/** The dome opens: a low rumble sliding up, then a soft high bell. */
export function domeOpen() { if (!ready()) return; sweep(70, 120, 0, 1.1, 0.35, "triangle"); hiss(0, 1, 0.12, 300); bell(1318.5, 0.9, 1.6, 0.18); }
/** A tap on a star: a glass ping, brighter stars ring lower and fuller. */
export function ping(mag = 3) { if (!ready()) return; bell(PENTA[Math.max(0, Math.min(7, Math.round(mag + 2)))] * 1.5, 0, 0.5, 0.28); }
/** Wrong star: a lantern gutters (a soft puff and a falling tone). */
export function gutter() { if (!ready()) return; hiss(0, 0.35, 0.35, 600); sweep(330, 150, 0.02, 0.45, 0.3, "triangle"); }
/** The hint: a shimmer rising across the sky. */
export function shimmer() { if (!ready()) return; [0, 2, 4, 5, 7].forEach((k, i) => bell(PENTA[k] * 2, i * 0.07, 0.6, 0.12)); }
/** Found it: a rising bell arpeggio with a low fifth underneath, and a whoosh for the shooting star. */
export function discover() {
  if (!ready()) return; bell(130.81, 0, 2.4, 0.35); bell(196, 0.05, 2.4, 0.25);
  [0, 2, 4, 5, 7].forEach((k, i) => bell(PENTA[k], 0.1 + i * 0.12, 1.8, 0.32)); hiss(0.6, 0.7, 0.18, 2400);
}
/** The search ends without a find: the last lantern goes out. */
export function darkness() { if (!ready()) return; hiss(0, 0.5, 0.4, 500); [392, 330, 262].forEach((f, i) => bell(f, 0.1 + i * 0.22, 1.2, 0.22, "triangle")); }
/** Quiz answer: two bright bells, or one low one. */
export function verdict(ok) { if (!ready()) return; if (ok) { bell(783.99, 0, 1, 0.3); bell(1174.66, 0.12, 1.4, 0.3); } else bell(196, 0, 0.9, 0.3, "triangle"); }
