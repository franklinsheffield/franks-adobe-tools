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
