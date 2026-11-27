// "My charts" in Your Grimoire: the member's personal data in one place. Data only (the reading rule: data first;
// meanings belong to a reading), what is stored and where, and the delete controls. Charts are worked out here
// from the saved birth details each time; no chart is stored anywhere.
import { bodygraph } from "../../src/humandesign/chart.js";
import { CENTERS } from "../../src/humandesign/data.js";
import { geocode, timeZoneAt, localToUtc, parseBirth } from "../../src/birthplace.js";
import { castChart } from "../../src/modules/astrology/chart.js";
import { lifePath, nameNumber, birthday, personalYear } from "../../src/modules/numerology/calc.js";
import { zodiacYear, fourPillars } from "../../src/modules/chinesezodiac/calendar.js";
import { mayaDate, SIGNS as MAYA } from "../../src/modules/mayan/calendar.js";
import { godFor } from "../../src/modules/egyptian/index.js";
import { treeFor, rangeOf } from "../../src/modules/celtic/index.js";
import { birthMoment, momentRows } from "../../src/moment.js";

const deg = (p) => `${Math.floor(p.deg)}°${String(Math.floor((p.deg % 1) * 60)).padStart(2, "0")}′`;
const pil = (x) => x ? `${x.stem.hz}${x.branch.hz} ${x.stem.py} ${x.branch.py} (${x.stem.yin ? "Yin" : "Yang"} ${x.stem.el} ${x.branch.animal})` : "needs a birth time";
const num = (r) => `${r.value}${r.karmic && r.karmic.length ? ` (karmic ${r.karmic.join(", ")})` : ""}`;

/** Every chart from one set of birth details. Each system is { key, emoji, label, rows: [[label, value]] } or { ..., error }. */
export async function chartData(profile, { fetchImpl = fetch, today = new Date() } = {}) {
  const pr = profile || {}, timeKnown = !!(pr.time && pr.time !== "unknown");
  const out = [], add = (key, emoji, label, fn) => { try { out.push({ key, emoji, label, rows: fn() }); } catch (e) { out.push({ key, emoji, label, error: e.message || "Could not work this out." }); } };
  if (!pr.date) return out;
  const b = parseBirth(pr.date, timeKnown ? pr.time : "12:00");
  let where = null, whereErr = "Add your birth town or city to work this out.";
  if (pr.place) { try { where = await geocode(pr.place, fetchImpl); if (!where) whereErr = `Couldn't find "${pr.place}".`; } catch { whereErr = "The place finder is not answering right now."; } }
  const utc = where ? localToUtc(b, timeZoneAt(where.lat, where.lon)) : null;
  const need = () => { if (!utc) throw new Error(whereErr); };
  const noon = timeKnown ? [] : [["Birth time", "unknown: a noon chart, so time-sensitive parts may differ"]];

  add("moment", "🕰️", "Birth moment", () => { need(); return momentRows(birthMoment(b, where, timeKnown), { detail: true }); });
  add("humandesign", "🧬", "Human Design", () => { need(); const c = bodygraph(utc), def = Object.keys(CENTERS).filter((k) => c.centers[k]);
    return [...noon, ["Type", c.type], ["Strategy", c.strategy], ["Authority", c.authority], ["Profile", c.profile], ["Definition", c.definition],
      ["Signature / not-self", `${c.signature[0]} / ${c.signature[1]}`],
      ["Defined centres", def.map((k) => CENTERS[k].name).join(", ") || "none"],
      ["Open centres", Object.keys(CENTERS).filter((k) => !c.centers[k]).map((k) => CENTERS[k].name).join(", ") || "none"],
      ["Channels", c.channels.map((x) => `${x.key} ${x.name}`).join(", ") || "none"], ["Incarnation Cross", c.cross.full],
      ["Conscious Sun / Earth", `Gate ${c.personality.sun.gate}.${c.personality.sun.line} / ${c.personality.earth.gate}.${c.personality.earth.line}`],
      ["Unconscious Sun / Earth", `Gate ${c.design.sun.gate}.${c.design.sun.line} / ${c.design.earth.gate}.${c.design.earth.line}`]]; });

  add("astrology", "♈", "Birth chart", () => { need(); const c = castChart({ utc, lat: where.lat, lon: where.lon, timeKnown });
    const rows = c.points.map((p) => [p.name, `${p.sign} ${deg(p)}${p.house ? ` · house ${p.house}` : ""}${p.retro ? " · retrograde" : ""}`]);
    const el = Object.entries(c.elements).map(([k, v]) => `${k} ${v}`).join(", ");
    return [...noon, ...rows, ["Elements (weighted)", el], ["Closest aspects", c.aspects.slice(0, 5).map((a) => `${c.get(a.a).name} ${a.type} ${c.get(a.b).name} (${a.orb.toFixed(1)}°)`).join("; ") || "none"]]; });

  add("numerology", "🔢", "Numerology", () => { const rows = [["Life Path", num(lifePath(b))], ["Birthday", `${birthday(b).value} (reduces to ${birthday(b).reduced})`],
    [`Personal Year ${today.getFullYear()}`, String(personalYear(b, today.getFullYear()).value)]];
    if (pr.name) rows.push(["Expression (full name)", num(nameNumber(pr.name))], ["Soul Urge (vowels)", num(nameNumber(pr.name, "vowels"))], ["Personality (consonants)", num(nameNumber(pr.name, "consonants"))]);
    else rows.push(["Name numbers", "add your full birth name with /profile set"]);
    return rows; });

  add("chinesezodiac", "🐉", "Chinese zodiac", () => { const z = zodiacYear(b), rows = [["Zodiac animal", `${z.stem.el} ${z.branch.animal} (${z.stem.yin ? "Yin" : "Yang"}), lunar year ${z.lunarYear}`]];
    if (utc) { const f = fourPillars(utc, b, timeKnown); rows.push(["Year pillar", pil(f.year)], ["Month pillar", pil(f.month)], ["Day pillar (Day Master)", pil(f.day)], ["Hour pillar", pil(f.hour)]); }
    else rows.push(["Four Pillars", whereErr]);
    return rows; });

  add("mayan", "🌀", "Mayan Tzolk'in", () => { const m = mayaDate(b);
    return [["Day sign", `${m.tone} ${m.signName} (kin ${m.kin} of 260)`], ["Tone", String(m.tone)], ["Direction", `${m.direction[0]} (${m.direction[1]})`],
      ["Haab' date", m.haabName], ["Long Count", m.longCount.join(".")], ["Trecena (13-day week)", MAYA[m.trecenaSign]], ["Lord of the Night", `G${m.lord}`]]; });

  add("egyptian", "𓂀", "Egyptian sign", () => { const g = godFor(b.month, b.day); if (!g) throw new Error("No sign covers that date."); return [["Sign", g]]; });

  add("celtic", "🌳", "Celtic tree", () => { const t = treeFor(b.month, b.day); return [["Tree", t.tree], ["Ogham", `${t.ogham} ${t.letter}`], ["Dates", rangeOf(t)]]; });
  return out;
}

/** What each part of the member's data is, where it lives and how to remove it (for the left page). */
export function storedRows(p, { hasProfile, signedIn }) {
  const rooms = Object.keys(p.rooms || {}).length, houses = Object.keys(p.houses || {}).length;
  return [
    ["🎂 Birth details", hasProfile ? "date, time, place, name" : "none saved", "/profile set in Discord", "Sealed (AES-GCM encrypted) in Cloudflare KV, key profile:<your id>", "Delete button below, or /profile delete"],
    ["🔭 Charts", "worked out on this page", "your birth details", "Not stored anywhere: recomputed each time", "Nothing to delete"],
    ["📜 Progress", `rank, ✦ ${p.xp || 0}, 💎 ${p.essence || 0}, Codex, ${rooms} game rooms, trophies`, "you playing", signedIn ? "Cloudflare KV, key progress:<your id>" : "this device only (not signed in)", "Ask a moderator to clear it"],
    ["🏠 Houses", `${houses} House${houses === 1 ? "" : "s"}: secrets, tokens, coats, rounds, opus`, "you playing in each House", "Inside your progress (prog.houses)", "With your progress"],
    ["🗓️ Journal + saved readings", "your log by day and readings you saved", "you, in Your Grimoire", "This device's browser storage (oracle-log:<your id>)", "Clear button below"],
  ];
}

export function chartsHtml(list, esc) {
  if (!list) return `<p class="bk-empty">Working out your charts…</p>`;
  if (!list.length) return `<p class="bk-empty">No birth details yet. Save them once with <b>/profile set</b> in Discord, then open this page again.</p>`;
  return list.map((s) => `<div class="mc-sys"><h4>${s.emoji} ${esc(s.label)}</h4>${s.error ? `<p class="bk-empty">${esc(s.error)}</p>`
    : `<dl class="mc-dl">${s.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`}<button type="button" class="c small" data-mc-read="${s.key}">✦ What this may mean</button></div>`).join("");
}
