// Herbalist's Grimoire: the Daily Specimen. One plant for the whole server each UTC day, picked from all 76 by the
// shared daily seed (../daily.js). Only the first run of the day counts; the shared board and the share line never
// name the plant, so nobody spoils it for the rest of the server.
import { ALL, LEAVES, scoreOf } from "./logic.js";
import { dailySeed, todayKey, dayNumber } from "../daily.js";

export const DAILY_ID = "grimoire";
/** Today's plant and its level: the same for everyone on the same UTC day. */
export const dailyPick = (day = todayKey()) => ALL[dailySeed(DAILY_ID, day) % ALL.length];
/** Bonus Essence for the first daily of the day: 10, plus 2 per day of streak, up to 30. */
export const dailyBonus = (streak) => Math.min(30, 10 + 2 * Math.max(0, streak - 1));
/** What the board shows next to your score: how you did, never which plant it was. */
export const dailyDetail = (run) => (run.won ? `${run.mode === "type" ? "typed" : "picked"} · ${run.leaves} leaves` : "unnamed")
  + `${run.safetyRight ? " · safety ✓" : ""}${run.claimRight ? " · claim ✓" : ""}`;
/** A spoiler-free line to paste in the channel, like a daily word game. */
export function shareLine(run, streak, day = todayKey()) {
  const leaves = "🍃".repeat(run.leaves) + "▫️".repeat(LEAVES - run.leaves);
  return `🌿 Herbalist's Grimoire · Daily specimen #${dayNumber(day)}\n${run.won ? leaves : "🥀 unnamed"} · ${run.mode === "type" ? "✍️ typed" : "🎴 picked"}\n` +
    `${run.safetyRight ? "✅" : "❌"} safety · ${run.claimRight ? "✅" : "❌"} science or folklore · ${scoreOf(run)} pts · 🔥 ${streak}`;
}
