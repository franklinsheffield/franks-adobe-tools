// Constellation Rummy sounds: shuffles and card flicks made from filtered noise, a star chord when a set is laid down
// (its notes rise with the stars' brightness), a soft buzz for a set that isn't one, and a fanfare or a falling sigh at
// the end. Web Audio only (no files). Follows the Chamber's mute switch (voice-sfx.js isMuted).
import { isMuted } from "../voice-sfx.js";

let ac = null, out = null, noiseBuf = null;
function ready() {
  if (isMuted()) return false;
  try {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ac = new AC(); out = ac.createGain(); out.gain.value = 0.18;
      const dl = ac.createDelay(); dl.delayTime.value = 0.19; const fb = ac.createGain(); fb.gain.value = 0.3; const wet = ac.createGain(); wet.gain.value = 0.25;
      out.connect(ac.destination); out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    if (ac.state === "suspended") ac.resume();
    return true;
  } catch { return false; }
}
function tone(f, at = 0, dur = 0.8, vol = 0.4, type = "sine") {
  const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
/** A burst of filtered noise: the sound of card stock. */
function swish(at = 0, dur = 0.08, freq = 2400, vol = 0.5, q = 0.8) {
  const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
}
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
export function shuffleSfx() { if (!ready()) return; for (let i = 0; i < 14; i++) swish(i * 0.045, 0.05, 1800 + Math.random() * 1600, 0.35); swish(0.68, 0.14, 900, 0.5); }
export function dealSfx(n = 6) { if (!ready()) return; for (let i = 0; i < n; i++) { swish(i * 0.09, 0.06, 3000, 0.4); tone(PENTA[i % PENTA.length] * 2, i * 0.09 + 0.02, 0.25, 0.05); } }
export function flickSfx() { if (!ready()) return; swish(0, 0.07, 2800, 0.5, 1.2); tone(1568, 0.02, 0.2, 0.06, "triangle"); }
export function takeSfx() { if (!ready()) return; swish(0, 0.1, 1500, 0.45); tone(659.25, 0.03, 0.35, 0.12, "triangle"); }
export function discardSfx() { if (!ready()) return; swish(0, 0.12, 1200, 0.5, 0.6); tone(392, 0.04, 0.3, 0.08, "triangle"); }
/** A rising star chord; brighter stars (more points) start higher. */
export function meldSfx(n = 3, bright = 1) { if (!ready()) return; const base = bright >= 3 ? 2 : bright >= 2 ? 1 : 0;
  for (let i = 0; i < n + 1; i++) tone(PENTA[Math.min(PENTA.length - 1, base + i)], i * 0.11, 1.4, 0.22); tone(PENTA[base] / 2, 0, 1.6, 0.12, "triangle"); }
export function layoffSfx() { if (!ready()) return; tone(1046.5, 0, 0.6, 0.18); tone(1318.5, 0.08, 0.7, 0.14); }
export function badSfx() { if (!ready()) return; tone(146.83, 0, 0.28, 0.2, "sawtooth"); tone(138.59, 0.12, 0.3, 0.16, "sawtooth"); }
export function oracleSfx() { if (!ready()) return; tone(220, 0, 0.5, 0.08, "triangle"); tone(330, 0.1, 0.5, 0.06, "triangle"); }
export function winSfx() { if (!ready()) return; [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.12, i === 6 ? 1.8 : 0.5, 0.25)); }
export function loseSfx() { if (!ready()) return; [659.25, 587.33, 523.25, 392].forEach((f, i) => tone(f, i * 0.2, 0.8, 0.18, "triangle")); }
export function dawnSfx() { if (!ready()) return; for (let i = 0; i < 5; i++) tone(261.63 * (1 + i * 0.25), i * 0.18, 1.6, 0.1); }
