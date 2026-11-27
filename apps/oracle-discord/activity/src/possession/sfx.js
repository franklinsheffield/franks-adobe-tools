// Possession sounds, synthesised with Web Audio (no files). Follows the Chamber's mute button. The shared party sounds
// (curtain, seal, buzz, tick, flip, fanfare) come from ../party/sfx.js.
import { isMuted } from "../voice-sfx.js";

let ac = null, bus = null;
function ready() {
  if (isMuted()) return null;
  try {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); bus = ac.createGain(); bus.gain.value = 0.2; bus.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  } catch { return null; }
}
/** The host is possessed: a wavering theremin glide over a low drone. */
export function possess() {
  if (!ready()) return; const t = ac.currentTime;
  const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(660, t + 0.9); o.frequency.exponentialRampToValueAtTime(440, t + 1.8);
  lfo.frequency.value = 6; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
  o.connect(g); g.connect(bus); o.start(t); lfo.start(t); o.stop(t + 2.05); lfo.stop(t + 2.05);
  const d = ac.createOscillator(), dg = ac.createGain(); d.type = "triangle"; d.frequency.value = 55;
  dg.gain.setValueAtTime(0.0001, t); dg.gain.exponentialRampToValueAtTime(0.12, t + 0.4); dg.gain.exponentialRampToValueAtTime(0.0001, t + 2);
  d.connect(dg); dg.connect(bus); d.start(t); d.stop(t + 2.05);
}
/** A quill scratching across the page (one stroke per word, roughly). */
export function quill(words = 5) {
  if (!ready()) return; const t = ac.currentTime;
  for (let k = 0; k < Math.min(12, words); k++) {
    const n = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.07), ac.sampleRate), dd = n.getChannelData(0);
    for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * (1 - i / dd.length);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = n; f.type = "highpass"; f.frequency.value = 3200 + Math.random() * 1500; g.gain.value = 0.16;
    s.connect(f); f.connect(g); g.connect(bus); s.start(t + k * 0.11 + Math.random() * 0.03);
  }
}
/** The table host strikes a card: a paper rip. */
export function rip() {
  if (!ready()) return; const t = ac.currentTime, n = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.35), ac.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.3) * (1 - i / d.length);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = n; f.type = "bandpass"; f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.35); g.gain.value = 0.3;
  s.connect(f); f.connect(g); g.connect(bus); s.start(t);
}
/** The tale is finished: the book closes with a soft thump and a chime. */
export function closeBook() {
  if (!ready()) return; const t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.25);
  g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.32);
  [784, 1175].forEach((f, k) => { const c = ac.createOscillator(), cg = ac.createGain(); c.type = "triangle"; c.frequency.value = f;
    cg.gain.setValueAtTime(0.0001, t + 0.3 + k * 0.12); cg.gain.exponentialRampToValueAtTime(0.12, t + 0.32 + k * 0.12); cg.gain.exponentialRampToValueAtTime(0.0001, t + 1.2 + k * 0.12);
    c.connect(cg); cg.connect(bus); c.start(t + 0.3 + k * 0.12); c.stop(t + 1.4 + k * 0.12); });
}
