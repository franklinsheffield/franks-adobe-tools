// Phantasmagoria sounds (Web Audio, no files): a glass harmonica note, a thunder sheet, a lantern shutter, a whoosh.
// They follow the Oracle's voice mute switch.
import { isMuted } from "../voice-sfx.js";
let ctx = null;
function ac() { if (isMuted()) return null; try { if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); } if (ctx.state === "suspended") ctx.resume(); return ctx; } catch { ctx = null; return null; } }
function tone(c, f, t, d, vol = 0.12, type = "sine", a = 0.12) { const o = c.createOscillator(), g = c.createGain(), at = c.currentTime + t; o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + a + d); o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + a + d + 0.05); }
function noise(c, t, d, f, vol) { const n = Math.ceil(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; fl.type = "lowpass"; fl.frequency.value = f; g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(c.currentTime + t); }
const SCALE_HZ = [523, 587, 659, 784, 880, 1047];
/** A glass harmonica note: a soft sine with its octave, slow to swell. */
export function harmonica(k = 0, t = 0) { const c = ac(); if (!c) return; const f = SCALE_HZ[((k % 6) + 6) % 6]; tone(c, f, t, 1.4, 0.1, "sine", 0.25); tone(c, f * 2, t, 1.1, 0.03, "sine", 0.3); }
export function thunder() { const c = ac(); if (!c) return; noise(c, 0, 1.6, 220, 0.5); noise(c, 0.25, 1.1, 500, 0.25); }
export function shutter() { const c = ac(); if (!c) return; noise(c, 0, 0.06, 3000, 0.25); tone(c, 180, 0, 0.08, 0.08, "square", 0.005); }
export function whoosh() { const c = ac(); if (!c) return; noise(c, 0, 0.7, 900, 0.3); }
/** The music under the timed show: one harmonica note per beat, for len ms. Returns a stop function. */
export function music(len, beat = 750) { const c = ac(); if (!c) return () => {}; const n = Math.floor(len / beat), ids = [];
  for (let i = 0; i < n; i++) ids.push(setTimeout(() => harmonica([0, 2, 4, 3, 1, 4, 5, 2][i % 8]), i * beat)); return () => ids.forEach(clearTimeout); }
