// The Oracle's voice: retro game text-box blips (not words), made with Web Audio, no audio files.
// Mutable; the choice is remembered.
const KEY = "oracle-voice-muted";
let ctx = null, out = null;
let muted = (() => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } })();

/** Create or resume the audio context. Call from a click (browsers allow sound only after a gesture). */
export function unlockVoice() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      out = ctx.createGain(); out.gain.value = 0.12;
      const echo = ctx.createDelay(); echo.delayTime.value = 0.11;
      const fb = ctx.createGain(); fb.gain.value = 0.32;
      const wet = ctx.createGain(); wet.gain.value = 0.2;
      out.connect(ctx.destination); out.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch { ctx = null; }
}

export const isMuted = () => muted;
let style = { type: "square", base: 330, step: 28, vowel: 60, dur: 0.045, lp: 2600 };
/** Choose the Oracle's voice (a blip style from the Essence store). */
export function setVoiceStyle(v) { if (v) style = { ...style, ...v }; }
/** A short sample of the current voice, for the store. */
export function sampleVoice() { [..."Hello"].forEach((c, i) => setTimeout(() => blip(c, { final: i === 4 }), i * 70)); }
export function setMuted(m) { muted = !!m; try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch {} }

/** One retro "talk" blip per letter, like an old-school RPG text box: a short square-wave beep whose pitch is
 * set by the letter, so the same words always sound the same. The last blip of a line drops in pitch. */
export function blip(ch, { final = false } = {}) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime, code = ch.toLowerCase().charCodeAt(0) || 97;
  const vowel = "aeiou".includes(ch.toLowerCase());
  const V = style, wob = V.wobble ? (Math.random() - 0.5) * V.wobble : 0;
  const pitch = Math.max(40, V.base + (code % 7) * V.step + (vowel ? V.vowel : 0) + wob), dur = final ? V.dur + 0.075 : V.dur;
  const osc = ctx.createOscillator(); osc.type = V.type;
  osc.frequency.setValueAtTime(V.meow ? pitch * 0.8 : pitch, t);
  if (V.meow) { osc.frequency.linearRampToValueAtTime(pitch * 1.25, t + dur * 0.45); osc.frequency.linearRampToValueAtTime(pitch * 0.75, t + dur); }
  else if (final) osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + dur);
  else if (V.sweep) osc.frequency.exponentialRampToValueAtTime(pitch * V.sweep, t + dur);
  if (V.vib) { const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = V.vib; depth.gain.value = V.vibDepth || 10;
    lfo.connect(depth); depth.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.01); }
  const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(V.gain || 0.5, t + 0.004);
  env.gain.setValueAtTime(V.gain || 0.5, t + dur * 0.6); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter(); lp.type = V.band ? "bandpass" : "lowpass"; lp.frequency.value = V.band || V.lp; if (V.band) lp.Q.value = 4;
  osc.connect(lp); lp.connect(env); env.connect(out);
  osc.start(t); osc.stop(t + dur + 0.01);
}

/** A short retro reward jingle: 1 = small find, 2 = unlock or rank up. */
export function chime(level = 1) {
  if (muted || !ctx || ctx.state !== "running") return;
  const notes = level > 1 ? [523, 659, 784, 1047] : [659, 988];
  notes.forEach((f, i) => {
    const t = ctx.currentTime + i * 0.09, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
  });
}

/** The trance: a low hum swelling for `secs` while bright glass tinkles rise, ending on a soft bell. */
export function trance(secs = 3) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime, end = t0 + secs;
  [110, 165, 220.5].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = i === 2 ? "triangle" : "sine";
    o.frequency.setValueAtTime(f, t0); o.frequency.linearRampToValueAtTime(f * 1.06, end);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(i === 2 ? 0.12 : 0.3, end - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.2);
    o.connect(g); g.connect(out); o.start(t0); o.stop(end + 0.25);
  });
  const scale = [784, 880, 988, 1175, 1319, 1568, 1760];
  for (let i = 0; i < secs * 5; i++) {
    const t = t0 + 0.2 + i * 0.2 + Math.random() * 0.08, f = scale[Math.min(scale.length - 1, Math.floor(i / (secs * 5) * scale.length + Math.random() * 2))];
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.14);
  }
  [1047, 1568].forEach((f) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, end); g.gain.exponentialRampToValueAtTime(0.3, end + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, end + 1.2);
    o.connect(g); g.connect(out); o.start(end); o.stop(end + 1.25); });
}

/** A soft "whoosh" of glass for Go deeper. */
export function deepen() {
  if (muted || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle";
  o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.5);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.6);
}

/** The checkout sound: coins clink into the till, the drawer rattles, and the register bell rings. */
export function checkout() {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime;
  [0, 0.07, 0.13].forEach((dt, i) => { const t = t0 + dt, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle";
    o.frequency.setValueAtTime(2200 + i * 260, t); o.frequency.exponentialRampToValueAtTime(3100 + i * 200, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.1); });
  const n = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * (i % 900 < 450 ? 1 : 0.3);
  const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain(); src.buffer = n; bp.type = "bandpass"; bp.frequency.value = 1800; ng.gain.value = 0.5;
  src.connect(bp); bp.connect(ng); ng.connect(out); src.start(t0 + 0.2);
  [[1568, 0.42], [2093, 0.42], [2637, 0.5]].forEach(([f, dt]) => { const t = t0 + dt, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.15); });
}

/** Ba-dum tss: two tom hits and a cymbal, for the Stand-up personality's punchlines. */
export function rimshot() {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + 0.05;
  [[170, 0], [120, 0.16]].forEach(([f, dt]) => { const t = t0 + dt, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.25); });
  const len = 0.9, n = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = n; hp.type = "highpass"; hp.frequency.value = 6000; g.gain.value = 0.45;
  src.connect(hp); hp.connect(g); g.connect(out); src.start(t0 + 0.34);
}
