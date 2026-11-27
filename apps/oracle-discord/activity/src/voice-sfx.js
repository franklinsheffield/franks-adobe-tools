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
const BASE_STYLE = { type: "square", base: 330, step: 28, vowel: 60, dur: 0.045, lp: 2600 };
export function setVoiceStyle(v) { if (v) style = { ...BASE_STYLE, ...v }; }
/** A short sample of the current voice, for the store. */
export function sampleVoice() { const t = "Hello there? Yes!", P = prosody(t); [...t].forEach((c, i) => /\p{L}/u.test(c) && setTimeout(() => blip(c, { ...P[i], final: i === t.length - 2 }), i * 70)); }
export function setMuted(m) { muted = !!m; try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch {} }

/** How a line should be spoken: for each character, where it sits in its sentence (pos 0-1), how the sentence
 *  ends (mark: . ? ! …), whether it starts a word (start) and whether the word is SHOUTED (cap). */
export function prosody(text) {
  const out = new Array(text.length), ends = /[.?!…]/;
  let i = 0;
  while (i < text.length) {
    let j = i; while (j < text.length && !ends.test(text[j])) j++;
    const mark = text[j] || ".", len = Math.max(1, j - i);
    for (let k = i; k <= j && k < text.length; k++) {
      const start = /[\p{L}\p{N}]/u.test(text[k]) && (k === 0 || !/[\p{L}\p{N}'’]/u.test(text[k - 1]));
      let w0 = k, w1 = k; while (w0 > 0 && /\p{L}/u.test(text[w0 - 1])) w0--; while (w1 < text.length && /\p{L}/u.test(text[w1])) w1++;
      const word = text.slice(w0, w1);
      out[k] = { pos: (k - i) / len, mark, start, cap: word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase() };
    }
    i = j + 1;
  }
  return out;
}
/** The mood she is in colours the voice: p = pitch, d = length, g = loudness. Set by mood.js. */
export const VOICE_MOOD = { joy: { p: 1.12, d: 0.9 }, cheer: { p: 1.2, d: 0.85, g: 1.15 }, love: { p: 1.1 }, laugh: { p: 1.16, d: 0.85 }, wow: { p: 1.22, g: 1.15 }, curious: { p: 1.06 },
  think: { p: 0.97, d: 1.12 }, sad: { p: 0.87, d: 1.3, g: 0.85 }, sulk: { p: 0.84, d: 1.15, g: 0.85 }, smug: { p: 0.95, d: 1.1 }, angry: { p: 0.8, d: 0.9, g: 1.35 }, sleepy: { p: 0.74, d: 1.5, g: 0.7 } };
let vmood = null;
export function setVoiceMood(mood) { vmood = VOICE_MOOD[mood] || null; }
const VOWEL_MOUTH = { a: 1, e: 1.3, i: 1.65, o: 0.78, u: 0.62 };
let tune = 0, word = 0; // the little melody a voice wanders along, and a word counter for voices that alternate
/** Work out one syllable of a voice: pure, so it can be tested. `S` is the voice (store.js `v`), `p` its prosody,
 *  `st` = { tune, word } carried between syllables, `rand` a 0-1 source. Each voice has its own character:
 *  scale (the notes it sings), melody (how far its tune wanders), alt (waveforms per word), harm (a second
 *  partial), jit (uneven timing), trill (grace notes), hic, breath, wordEnd (a glide at the end of words). */
export function syllable(S, ch, p = {}, st = { tune: 0, word: 0 }, rand = Math.random, M = null) {
  const lc = ch.toLowerCase(), code = lc.charCodeAt(0) || 97, vowel = "aeiou".includes(lc);
  if (p.start) { st.word++; if (p.pos === 0) st.tune = 0; }
  if (S.melody) st.tune = Math.max(-3, Math.min(3, st.tune + Math.round((rand() - 0.5) * 2 * S.melody)));
  let pitch;
  if (S.scale) { const n = S.scale.length, idx = (((code % 7) + st.tune) % n + n) % n; pitch = S.base * Math.pow(2, (S.scale[idx] + (vowel ? (S.vowelUp ?? 2) : 0)) / 12); }
  else pitch = S.base + (code % 7) * S.step + (vowel ? S.vowel : 0);
  if (S.wobble) pitch += (rand() - 0.5) * S.wobble;
  // sentence melody: questions rise, statements fall, exclamations jump, trailing dots sink and slow
  const pos = p.pos || 0, mark = p.mark || ".";
  let dur = S.dur, gain = S.gain || 0.5;
  if (mark === "?") pitch *= 1 + 0.38 * pos * pos; else if (mark === "!") { pitch *= 1.1 - 0.06 * pos; gain *= 1.18; } else if (mark === "…") { pitch *= 1 - 0.12 * pos; dur *= 1 + 0.5 * pos; } else pitch *= 1.05 - 0.15 * pos;
  if (p.start) { pitch *= 1.05; gain *= 1.12; }
  if (p.cap) { pitch *= 1.12; gain *= 1.3; dur *= 1.15; }
  if (S.hic && rand() < S.hic) { pitch *= 1.8; dur *= 0.6; }
  if (S.jit) dur *= 1 + (rand() - 0.5) * S.jit;
  if (M) { pitch *= M.p || 1; dur *= M.d || 1; gain *= M.g || 1; }
  const type = S.alt ? S.alt[st.word % S.alt.length] : S.type;
  return { pitch: Math.max(40, pitch), dur, gain: Math.min(1, gain), type, vowel, mouth: vowel ? VOWEL_MOUTH[lc] : 1, trill: !!(S.trill && rand() < S.trill) };
}

/** One retro "talk" blip per letter, like an old-school RPG text box. The pitch comes from the letter, the
 *  voice's own scale and tune, and the sentence (see syllable); `ctxInfo` is that character's prosody() entry.
 *  The last blip of a line drops in pitch. */
export function blip(ch, { final = false, ...p } = {}) {
  if (muted || !ctx || ctx.state !== "running") return;
  const V = style, st = { tune, word }, y = syllable(V, ch, p, st, Math.random, vmood); tune = st.tune; word = st.word;
  const t = ctx.currentTime, pitch = y.pitch, dur = final ? y.dur + 0.075 : y.dur;
  const osc = ctx.createOscillator(); osc.type = y.type;
  osc.frequency.setValueAtTime(V.meow ? pitch * 0.8 : pitch, t);
  if (V.meow) { osc.frequency.linearRampToValueAtTime(pitch * 1.25, t + dur * 0.45); osc.frequency.linearRampToValueAtTime(pitch * 0.75, t + dur); }
  else if (final) osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + dur);
  else if (y.trill) { osc.frequency.setValueAtTime(pitch * 1.26, t + dur * 0.3); osc.frequency.setValueAtTime(pitch, t + dur * 0.6); }
  else if (V.sweep) osc.frequency.exponentialRampToValueAtTime(pitch * V.sweep, t + dur);
  else if (V.wordEnd && p.wordEnd) osc.frequency.exponentialRampToValueAtTime(pitch * V.wordEnd, t + dur);
  if (V.vib) { const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = V.vib; depth.gain.value = V.vibDepth || 10;
    lfo.connect(depth); depth.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.01); }
  const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(y.gain, t + 0.004);
  env.gain.setValueAtTime(y.gain, t + dur * 0.6); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  // the "mouth": vowels open or close the filter, so a, e, i, o and u each colour the voice differently
  const lp = ctx.createBiquadFilter(); lp.type = V.band ? "bandpass" : "lowpass"; lp.frequency.value = (V.band || V.lp) * (V.mouth === 0 ? 1 : 1 + (y.mouth - 1) * (V.mouth ?? 0.6)); if (V.band) lp.Q.value = 4;
  osc.connect(lp); lp.connect(env); env.connect(out);
  osc.start(t); osc.stop(t + dur + 0.01);
  if (V.harm) { const h = ctx.createOscillator(), hg = ctx.createGain(); h.type = "sine"; h.frequency.value = pitch * V.harm[0]; hg.gain.value = V.harm[1]; h.connect(hg); hg.connect(env); h.start(t); h.stop(t + dur + 0.01); }
  if (V.breath) { const n = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = n; bp.type = "bandpass"; bp.frequency.value = 2400 * y.mouth; g.gain.value = V.breath * y.gain; src.connect(bp); bp.connect(g); g.connect(out); src.start(t); }
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
/** Cards on the table: a riffle shuffle (fast paper ticks), then a soft slide-and-snap for each card dealt,
 *  timed to the table's deal animation (first card at 1.1 s, then every `step` seconds). */
export function cardDeal(count = 3, step = 0.2) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + 0.05;
  const burst = (t, dur, freq, vol, q = 1.2) => { const n = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = n; bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q; g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(out); src.start(t); };
  for (let k = 0; k < 26; k++) burst(t0 + 0.3 + k * 0.022 + Math.random() * 0.006, 0.02, 3200 + Math.random() * 1500, 0.32); // riffle
  burst(t0 + 0.92, 0.09, 900, 0.5, 0.8); // the halves meet
  for (let i = 0; i < count; i++) { const t = t0 + 1.1 + i * step; burst(t, 0.16, 2400, 0.28, 0.6); burst(t + 0.15, 0.03, 1200, 0.45, 2); }
}

/** A trophy rises: a swelling chord, an arpeggio that climbs higher for each tier, and a bell. On an upgrade, a molten whoosh first. */
export function trophyWin(tier = 1, upgrade = false) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + (upgrade ? 0.35 : 0);
  if (upgrade) { const n = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = n; f.type = "bandpass";
    f.frequency.setValueAtTime(300, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.45); g.gain.value = 0.6;
    src.connect(f); f.connect(g); g.connect(out); src.start(); }
  [262, 330, 392].forEach((f) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 1.65); });
  const run = [523, 659, 784, 1047, 1319, 1568, 2093].slice(0, 3 + Math.min(4, tier));
  run.forEach((f, i) => { const t = t0 + 0.2 + i * 0.1, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.24); });
  const tb = t0 + 0.3 + run.length * 0.1;
  [[2093, 1], [3136, 0.5], tier >= 4 ? [4186, 0.4] : null].filter(Boolean).forEach(([f, a]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, tb); g.gain.exponentialRampToValueAtTime(0.3 * a, tb + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tb + 1.8);
    o.connect(g); g.connect(out); o.start(tb); o.stop(tb + 1.85); });
}

/** Little wordless sounds for the Oracle's moods (mood.js), sung in whatever voice is equipped: each note is
 *  [pitch ratio, seconds, glide-to ratio?]. Pitched around the voice's own base so every voice emotes differently. */
export const EMOTE_SFX = {
  joy: [[1, 0.07], [1.26, 0.07], [1.5, 0.07], [2, 0.14]], cheer: [[1, 0.06], [1.26, 0.06], [1.5, 0.06], [2, 0.06], [2.52, 0.22]],
  love: [[1.5, 0.1], [2, 0.1], [1.5, 0.1], [2.25, 0.22]], laugh: [[1.7, 0.06, 1.4], [1.55, 0.06, 1.3], [1.4, 0.06, 1.15], [1.3, 0.06, 1.05], [1.15, 0.12, 0.9]],
  wow: [[1, 0.24, 2.3]], curious: [[1, 0.12, 1.35]], think: [[1, 0.14, 0.94], [1.19, 0.22, 1.26]], nod: [[1, 0.08], [1.33, 0.13]], shake: [[1.33, 0.08], [1, 0.13]],
  wink: [[2, 0.05], [3, 0.12]], flinch: [[1.9, 0.07, 1.2]], sad: [[1.2, 0.2, 1], [0.9, 0.36, 0.7]], sulk: [[0.7, 0.12, 0.6], [0.6, 0.24, 0.5]],
  smug: [[1.1, 0.08], [1.3, 0.16, 1.42]], angry: [[0.5, 0.1], [0.5, 0.1], [0.45, 0.28, 0.38]], sleepy: [[1, 0.55, 0.6]],
  nervous: [[1.5, 0.05], [1.4, 0.05], [1.5, 0.05], [1.3, 0.12, 1.1]], dizzy: [[1.6, 0.12, 1.1], [1.1, 0.12, 1.5], [1.5, 0.12, 1], [1, 0.2, 0.8]],
};
export function emoteSfx(mood) {
  if (muted || !ctx || ctx.state !== "running") return;
  if (mood === "orb") { // a finger on the glass: two bright pings
    [[1568, 0], [2349, 0.07]].forEach(([f, dt]) => { const t = ctx.currentTime + dt, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.75); });
    return; }
  const notes = EMOTE_SFX[mood]; if (!notes) return;
  const V = style, base = Math.max(90, V.base); let t = ctx.currentTime + 0.01;
  for (const [r, d, to] of notes) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = mood === "angry" ? "sawtooth" : V.type;
    o.frequency.setValueAtTime(base * r, t); if (to) o.frequency.exponentialRampToValueAtTime(base * to, t + d);
    lp.type = "lowpass"; lp.frequency.value = V.lp || 2600;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(V.gain || 0.45, t + 0.006); g.gain.setValueAtTime(V.gain || 0.45, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02); t += d + 0.025;
  }
}

/** Small sounds for the Chamber's looks reacting: a robe swirling on, a candle lit, a candle blown out. */
function noiseSweep(dur, f0, f1, vol, q = 1) {
  const t = ctx.currentTime, n = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length);
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = n; f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.value = vol; src.connect(f); f.connect(g); g.connect(out); src.start(t);
}
export function whoosh() { if (muted || !ctx || ctx.state !== "running") return; noiseSweep(0.45, 400, 3200, 0.7); }
export function puff() { if (muted || !ctx || ctx.state !== "running") return; noiseSweep(0.22, 2600, 500, 0.6, 0.7); }
export function ignite() { if (muted || !ctx || ctx.state !== "running") return; noiseSweep(0.3, 900, 5200, 0.55, 2);
  const t = ctx.currentTime + 0.12, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22); }

/** Hand sounds for the Oracle's gestures: a fist slam on the table, a finger snap, a clap, a swat through the air. */
export function handSfx(kind) {
  if (muted || !ctx || ctx.state !== "running") return;
  if (kind === "slam") { noiseSweep(0.2, 700, 110, 0.9, 0.6);
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.8, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32); return; }
  if (kind === "snap") { noiseSweep(0.05, 3800, 2600, 0.9, 3); return; }
  if (kind === "clap") { noiseSweep(0.08, 1900, 900, 0.75, 0.8); return; }
  if (kind === "swat") { noiseSweep(0.16, 700, 2600, 0.45, 1.2); }
}
