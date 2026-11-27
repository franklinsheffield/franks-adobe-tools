// Voices (activity/src/voice-sfx.js): each voice has its own character and every line has a sentence melody.
import test from "node:test";
import assert from "node:assert/strict";
import { prosody, syllable, VOICE_MOOD, EMOTE_SFX } from "../activity/src/voice-sfx.js";
import { STORE } from "../activity/src/store.js";
import { MOODS } from "../activity/src/mood.js";

const BASE = { type: "square", base: 330, step: 28, vowel: 60, dur: 0.045, lp: 2600 };
const voices = STORE.filter((s) => s.kind === "voice");
const rng = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const sing = (v, text, rand = rng()) => { const P = prosody(text), st = { tune: 0, word: 0 }; return [...text].map((c, i) => (/\p{L}/u.test(c) ? syllable({ ...BASE, ...v }, c, P[i], st, rand) : null)).filter(Boolean); };

test("prosody: sentences, word starts and shouting", () => {
  const P = prosody("Is it so? YES! Well…");
  assert.equal(P[0].mark, "?"); assert.equal(P[0].pos, 0); assert.ok(P[0].start); assert.ok(!P[1].start); assert.ok(P[6].pos > P[3].pos);
  assert.equal(P[10].mark, "!"); assert.ok(P[10].cap); assert.ok(!P[0].cap); assert.equal(P[15].mark, "…");
  assert.equal(prosody("no end").length, 6); assert.equal(prosody("no end")[0].mark, ".");
});

test("every voice has its own character and plenty of variation", () => {
  assert.ok(voices.length >= 13);
  const line = "Will the move go well? The cards say yes! And then, slowly, it settles…";
  const prints = new Set();
  for (const it of voices) {
    assert.ok(it.v.scale, it.id + " sings on its own scale");
    const traits = ["melody", "alt", "harm", "jit", "trill", "breath", "wordEnd", "hic"].filter((k) => it.v[k] != null); assert.ok(traits.length >= 2, it.id + " has at least two traits of its own");
    const notes = sing(it.v, line); assert.ok(new Set(notes.map((n) => Math.round(n.pitch))).size >= 15, it.id + " varies its pitch");
    prints.add(JSON.stringify([it.v.scale, traits]));
  }
  assert.equal(prints.size, voices.length, "no two voices share a scale and trait set");
});

test("questions rise, statements fall, shouting is louder, moods colour the voice", () => {
  const flat = { scale: [0, 0, 0, 0, 0, 0, 0], vowelUp: 0 }, P = prosody("aaaaaaaa? aaaaaaaa. AAAA aaaa!");
  const at = (i, M) => syllable({ ...BASE, ...flat }, "a", { ...P[i], start: false }, { tune: 0, word: 0 }, () => 0.5, M);
  assert.ok(at(7).pitch > at(0).pitch * 1.2, "a question rises"); assert.ok(at(17).pitch < at(10).pitch, "a statement falls");
  assert.ok(at(20).gain > at(26).gain, "capitals are louder");
  assert.ok(at(0, VOICE_MOOD.angry).pitch < at(0).pitch); assert.ok(at(0, VOICE_MOOD.joy).pitch > at(0).pitch); assert.ok(at(0, VOICE_MOOD.sleepy).dur > at(0).dur);
  for (const m of Object.keys(VOICE_MOOD)) assert.ok(MOODS[m] && EMOTE_SFX[m], m);
});
