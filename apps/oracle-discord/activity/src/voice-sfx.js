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
export function setMuted(m) { muted = !!m; try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch {} }

/** One retro "talk" blip per letter, like an old-school RPG text box: a short square-wave beep whose pitch is
 * set by the letter, so the same words always sound the same. The last blip of a line drops in pitch. */
export function blip(ch, { final = false } = {}) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime, code = ch.toLowerCase().charCodeAt(0) || 97;
  const vowel = "aeiou".includes(ch.toLowerCase());
  const pitch = 330 + (code % 7) * 28 + (vowel ? 60 : 0), dur = final ? 0.12 : 0.045;
  const osc = ctx.createOscillator(); osc.type = "square";
  osc.frequency.setValueAtTime(pitch, t);
  if (final) osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + dur);
  const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
  env.gain.setValueAtTime(0.5, t + dur * 0.6); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
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
