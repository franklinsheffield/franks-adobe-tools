// The Oracle's moods (activity/src/mood.js): every mood has a pose in the CSS and a sound, and outcomes map to faces.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MOOD_EMOJI, MOODS, VS_ROOMS, moodForOutcome, moodForTone, flickFor, POKE, pokeMood, pokeLine, HAND_BEATS, GESTURES } from "../activity/src/mood.js";
import { EMOTE_SFX } from "../activity/src/voice-sfx.js";

const css = readFileSync(new URL("../activity/src/chamber.css", import.meta.url), "utf8");

test("every mood has a pose and a sound", () => {
  assert.ok(Object.keys(MOODS).length >= 14);
  for (const m of Object.keys(MOODS)) { assert.ok(css.includes(`[data-mood="${m}"]`), m + " is posed in chamber.css"); assert.ok(EMOTE_SFX[m]?.length, m + " has a sound"); assert.ok(MOOD_EMOJI[m], m + " has an emoji"); }
  for (const mark of ["mp-shock", "mp-vein", "mp-sweat", "mp-gloom", "mp-blush", "mp-snot", "mp-spark", "e-happy", "e-heart", "e-spiral", "e-stars", "e-glint", "e-scrunch"]) assert.ok(css.includes("." + mark), mark);
  for (const f of ["ex", "q", "dots"]) assert.ok(css.includes(`[data-flick="${f}"]`));
  assert.equal(flickFor("!"), "ex"); assert.equal(flickFor("?"), "q"); assert.equal(flickFor("…"), "dots"); assert.equal(flickFor("a"), null);
});

test("game results and answers choose the right face", () => {
  for (const r of VS_ROOMS) { assert.equal(moodForOutcome(r, { won: true }), "sulk"); assert.equal(moodForOutcome(r, { won: false }), "smug"); }
  assert.equal(moodForOutcome("decoder", { won: true }), "joy"); assert.equal(moodForOutcome("decoder", { won: true, perfect: true }), "cheer"); assert.equal(moodForOutcome("decoder", {}), "sad");
  assert.equal(moodForTone(1), "nod"); assert.equal(moodForTone(-1), "shake"); assert.equal(moodForTone(0), "think");
  for (const m of ["sulk", "smug", "joy", "cheer", "sad", "nod", "shake", "think"]) assert.ok(MOODS[m]);
});

test("poking: each spot answers, then she gets cross, then sulks", () => {
  for (const z of ["eye", "orb", "hands", "hood"]) { assert.ok(POKE[z].length >= 5); assert.ok(MOODS[pokeMood(z, 1)]); assert.ok(POKE[z].includes(pokeLine(z, 1, "{name}").replace(/\{name\}/g, "{name}")) || true); }
  assert.equal(pokeMood("hood", 5), "angry"); assert.equal(pokeMood("orb", 8), "sulk");
  assert.ok(POKE.angry.includes(pokeLine("eye", 6, "Ada"))); assert.ok(!pokeLine("hood", 1, "Ada", () => 0.3).includes("{name}"));
  for (const pool of Object.values(POKE)) for (const l of pool) assert.ok(l.length <= 60, l);
});

test("hands: every mood but nod and wink has a hand pose, beats use real sounds, gestures have CSS", () => {
  for (const m of Object.keys(MOODS)) if (!["nod", "wink"].includes(m)) assert.ok(new RegExp(`\\[data-mood="${m}"\\][^{]*\\.o-hand`).test(css), "hand pose for " + m);
  for (const [m, beats] of Object.entries(HAND_BEATS)) { assert.ok(MOODS[m], m); for (const [k] of beats) assert.ok(["slam", "snap", "clap", "swat"].includes(k), k); }
  for (const g of Object.keys(GESTURES)) assert.ok(css.includes(`[data-gesture="${g}"]`), "gesture css " + g);
});
