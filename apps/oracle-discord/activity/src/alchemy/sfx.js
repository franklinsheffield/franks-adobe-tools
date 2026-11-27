// Alchemist's Lab sound effects, synthesised with Web Audio (no audio files): glass clinks, pouring, bubbling,
// the furnace whoosh and crackle, a failed fizzle, a snuffed flame, page turns and the transmutation chord.
// Follows the Chamber's mute button (voice-sfx.js isMuted). Started from clicks, so browsers allow the sound.
import { isMuted } from "../voice-sfx.js";

let ac = null, bus = null, crackleTimer = null;
function ready() {
  if (isMuted()) return null;
  try {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); bus = ac.createGain(); bus.gain.value = 0.22; bus.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  } catch { return null; }
}
const rnd = (a, b) => a + Math.random() * (b - a);
function tone(f, t, dur, { type = "sine", vol = 0.3, to = null, attack = 0.004 } = {}) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, { type = "bandpass", f = 1000, to = null, q = 1, vol = 0.3, shape = (x) => 1 - x } = {}) {
  const n = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * shape(i / d.length);
  const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = n; fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q; g.gain.value = vol;
  src.connect(fl); fl.connect(g); g.connect(bus); src.start(t);
}

/** A glass jar tapped as it comes off the shelf. */
export function clink(i = 0) { if (!ready()) return; const t = ac.currentTime, f = 1900 + (i % 6) * 170;
  tone(f, t, 0.35, { vol: 0.22 }); tone(f * 2.76, t, 0.18, { vol: 0.08 }); }
/** Liquid pouring into the flask, then a small splash. */
export function pour() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.55, { f: 700, to: 1800, q: 2.5, vol: 0.35, shape: (x) => Math.sin(Math.PI * x) * (0.7 + 0.3 * Math.sin(x * 90)) });
  for (let k = 0; k < 3; k++) tone(rnd(500, 900), t + 0.45 + k * 0.05, 0.06, { vol: 0.15, to: rnd(1200, 1800) }); }
/** A run of bubbles: little rising pops. */
export function bubble(n = 6) { if (!ready()) return; const t = ac.currentTime;
  for (let k = 0; k < n; k++) { const s = t + k * rnd(0.05, 0.12), f = rnd(260, 620); tone(f, s, rnd(0.05, 0.09), { vol: 0.18, to: f * rnd(1.8, 2.6) }); } }
/** The furnace roars: a rising whoosh. */
export function whoosh() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.7, { type: "lowpass", f: 200, to: 2200, vol: 0.45, shape: (x) => Math.min(1, x * 6) * (1 - x) });
  tone(70, t, 0.6, { type: "triangle", vol: 0.2, to: 110, attack: 0.05 }); }
/** A failed mix: a hiss, a sour bubble and a dull thud. */
export function fizzle() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.8, { type: "highpass", f: 3000, to: 800, vol: 0.28 }); tone(180, t + 0.05, 0.35, { type: "sawtooth", vol: 0.12, to: 70 });
  tone(90, t + 0.35, 0.25, { vol: 0.35, to: 45 }); }
/** A flame going out: a short puff. */
export function snuff() { if (!ready()) return; const t = ac.currentTime + 0.25;
  noise(t, 0.3, { type: "bandpass", f: 900, to: 300, q: 0.8, vol: 0.35, shape: (x) => (1 - x) ** 2 }); }
/** A page of the notebook turning. */
export function page() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 0.28, { type: "highpass", f: 2500, vol: 0.22, shape: (x) => Math.sin(Math.PI * x) * (0.6 + 0.4 * Math.random()) }); }
/** Success: a shimmering rising arpeggio over a warm chord, with a bubbling flourish. */
export function transmute() { if (!ready()) return; const t = ac.currentTime;
  [262, 330, 392].forEach((f) => tone(f, t, 1.6, { type: "triangle", vol: 0.12, attack: 0.08 }));
  [523, 659, 784, 1047, 1319, 1568].forEach((f, k) => tone(f, t + 0.1 + k * 0.07, 0.9, { vol: 0.16 }));
  noise(t + 0.4, 1.2, { type: "highpass", f: 6000, vol: 0.12, shape: (x) => (1 - x) * (Math.random() > 0.97 ? 1 : 0.15) });
  setTimeout(() => bubble(8), 250); }
/** Wrong symbol on level 1: a low, dull bell. */
export function wrong() { if (!ready()) return; const t = ac.currentTime; tone(196, t, 0.5, { type: "triangle", vol: 0.25, to: 185 }); tone(233, t, 0.5, { type: "triangle", vol: 0.15 }); }
/** Coins on the apothecary counter. */
export function coins() { if (!ready()) return; const t = ac.currentTime; [0, 0.08, 0.15, 0.24].forEach((d, k) => { tone(3000 + k * 220, t + d, 0.12, { vol: 0.12 }); tone(4400 + k * 180, t + d, 0.08, { vol: 0.06 }); }); }

/** Quiet fire crackle and the odd bubble while the bench is open. `alive()` says whether to keep going. */
export function ambience(alive) {
  clearInterval(crackleTimer);
  crackleTimer = setInterval(() => {
    if (!alive()) { clearInterval(crackleTimer); return; }
    if (!ac || ac.state !== "running" || isMuted()) return;
    const t = ac.currentTime;
    for (let k = 0; k < 3; k++) if (Math.random() < 0.5) noise(t + rnd(0, 0.5), 0.02, { type: "highpass", f: rnd(1500, 4000), vol: rnd(0.05, 0.14) });
    if (Math.random() < 0.25) { const f = rnd(300, 500); tone(f, t + rnd(0, 0.4), 0.06, { vol: 0.05, to: f * 2 }); }
  }, 600);
}
/** Electricity from Volta's pile: a crackling buzz. */
export function zap() { if (!ready()) return; const t = ac.currentTime;
  tone(120, t, 0.5, { type: "sawtooth", vol: 0.12, to: 90 }); for (let k = 0; k < 6; k++) noise(t + k * 0.07, 0.03, { type: "highpass", f: 3000, vol: 0.25 }); }

/** The product's own sound, after the swirl: fumes hiss, crystals tinkle, potassium crackles, phosphorus hums. */
export function react(fx) {
  setTimeout(() => {
    if (!ready()) return; const t = ac.currentTime;
    if (fx === "fumes" || fx === "sublime" || fx === "calx") noise(t, 1.4, { type: "highpass", f: 2500, to: 5000, vol: 0.16, shape: (x) => Math.sin(Math.PI * x) });
    if (fx === "bubbles" || fx === "nugget" || fx === "plate") bubble(14);
    if (fx === "crystals" || fx === "tree") [2637, 3136, 3520, 2794, 3951, 3322].forEach((f, k) => tone(f, t + k * 0.13, 0.5, { vol: 0.08 }));
    if (fx === "sparks") for (let k = 0; k < 10; k++) noise(t + k * rnd(0.04, 0.1), 0.03, { type: "highpass", f: rnd(2000, 5000), vol: 0.3 });
    if (fx === "flare") whoosh();
    if (fx === "glow") { tone(440, t, 2.2, { vol: 0.08, attack: 0.6 }); tone(659, t + 0.2, 2, { vol: 0.06, attack: 0.6 }); tone(880, t + 0.4, 1.8, { vol: 0.04, attack: 0.6 }); }
    if (fx === "drip") [0, 0.35, 0.7, 1.05].forEach((d) => tone(rnd(900, 1300), t + d, 0.07, { vol: 0.14, to: 2000 }));
    if (fx === "powder") noise(t, 0.9, { type: "bandpass", f: 4000, q: 2, vol: 0.12, shape: (x) => (1 - x) * (Math.random() > 0.6 ? 1 : 0.2) });
  }, 1100);
}

// ---- background music: a slow, generated "laboratory" loop (drone + soft modal arpeggio with echo). Own toggle, also
// silenced by the Chamber's mute. It stops by itself when you leave the Lab. ----
const MKEY = "al-music";
export const musicOn = () => { try { return localStorage.getItem(MKEY) !== "0"; } catch { return true; } };
export function setMusic(on) { try { localStorage.setItem(MKEY, on ? "1" : "0"); } catch {} if (!on) stopMusic(); }
let mus = null;
const SCALE = [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23, 392]; // D dorian-ish: D F G A C D F G
const PHRASES = [[0, 2, 4, 3, 5, 4, 2, 1], [3, 4, 6, 5, 4, 2, 3, 0], [5, 7, 6, 4, 3, 4, 2, 0]];
export function startMusic(alive) {
  if (mus || !musicOn() || !ready()) return;
  const g = ac.createGain(); g.gain.value = 0; g.connect(bus); g.gain.linearRampToValueAtTime(0.5, ac.currentTime + 3);
  const dl = ac.createDelay(); dl.delayTime.value = 0.42; const fb = ac.createGain(); fb.gain.value = 0.35; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
  dl.connect(fb); fb.connect(dl); dl.connect(lp); lp.connect(g);
  const drones = [73.42, 110].map((f) => { const o = ac.createOscillator(), dg = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = "sine"; o.frequency.value = f; dg.gain.value = 0.09; lfo.frequency.value = 0.07 + f / 4000; lg.gain.value = 0.04; lfo.connect(lg); lg.connect(dg.gain);
    o.connect(dg); dg.connect(g); o.start(); lfo.start(); return [o, lfo]; }).flat();
  let step = 0, phrase = 0;
  const note = () => {
    if (!alive() || isMuted() || !musicOn()) return stopMusic();
    const t = ac.currentTime, f = SCALE[PHRASES[phrase][step % 8]] * (step % 16 >= 8 ? 2 : 1);
    if (step % 8 !== 7 || Math.random() < 0.5) { const o = ac.createOscillator(), ng = ac.createGain(); o.type = "triangle"; o.frequency.value = f;
      ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.07, t + 0.04); ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(ng); ng.connect(g); ng.connect(dl); o.start(t); o.stop(t + 1.5); }
    if (++step % 16 === 0) phrase = (phrase + 1) % PHRASES.length;
  };
  mus = { g, drones, timer: setInterval(note, 620) };
}
export function stopMusic() {
  if (!mus) return; const m = mus; mus = null; clearInterval(m.timer);
  try { const t = ac.currentTime; m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => m.drones.forEach((o) => { try { o.stop(); } catch {} }), 1400); } catch {}
}

/** An explosion: a white-noise blast, a deep thump, a rumble, then glass raining down. */
export function boom() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 1.6, { type: "lowpass", f: 4000, to: 120, vol: 0.9, shape: (x) => Math.exp(-x * 4) });
  tone(90, t, 0.8, { vol: 0.8, to: 28, attack: 0.002 }); tone(55, t + 0.05, 1.6, { type: "triangle", vol: 0.4, to: 30 });
  noise(t + 0.2, 2.2, { type: "lowpass", f: 300, vol: 0.4, shape: (x) => (1 - x) ** 2 });
  for (let k = 0; k < 14; k++) { const s = t + 0.25 + k * rnd(0.04, 0.11), f = rnd(2500, 5200); tone(f, s, rnd(0.08, 0.25), { vol: rnd(0.05, 0.12) }); tone(f * 1.5, s, 0.08, { vol: 0.04 }); } }

/** Poison gas: a long hiss from the flask, a low uneasy drone, then a fit of coughing. */
export function gas() { if (!ready()) return; const t = ac.currentTime;
  noise(t, 2.6, { type: "highpass", f: 2200, vol: 0.35, shape: (x) => (x < 0.1 ? x * 10 : 1 - x) });
  tone(73, t + 0.2, 2.6, { type: "sawtooth", vol: 0.07, to: 65 }); tone(77.8, t + 0.2, 2.6, { type: "sawtooth", vol: 0.06, to: 69 });
  [1.5, 1.78, 2.02, 2.6, 2.85].forEach((d, k) => noise(t + d, 0.18, { type: "bandpass", f: 520 + k * 40, q: 2.2, vol: 0.5, shape: (x) => Math.exp(-x * 6) })); }
/** Safety gear doing its job: a solid clunk and a fan-like whoosh. */
export function saved() { if (!ready()) return; const t = ac.currentTime;
  tone(180, t, 0.25, { type: "square", vol: 0.12, to: 90 }); noise(t + 0.05, 1.1, { type: "bandpass", f: 900, to: 300, q: 0.8, vol: 0.25 });
  tone(660, t + 0.3, 0.4, { vol: 0.08 }); tone(990, t + 0.42, 0.5, { vol: 0.06 }); }
