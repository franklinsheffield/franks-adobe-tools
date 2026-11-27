// Opt-in saved birth profiles (Cloudflare KV, AES-GCM sealed with ORACLE_KEY) and the "enter your birth data" modal.
import { seal, open } from "./seal.js";
import { parseBirth } from "./birthplace.js";

// Which option names each birth-data command uses, and which of them it needs before it can run.
const FULL = { date: "date", time: "time", place: "place", need: ["date", "place", "time"] };
export const BIRTH_FIELDS = {
  humandesign: FULL,
  "astrology:chart": FULL,
  "astrology:now": { date: "birth_date", time: "birth_time", place: "birth_place", need: ["date", "place", "time"] },
  numerology: { date: "date", name: "name", need: ["date", "name"] },
  chinesezodiac: FULL,
  mayan: { date: "date", need: ["date"] },
  egyptian: { date: "date", need: ["date"] },
  celtic: { date: "date", need: ["date"] },
};
export const fieldsFor = (name, o) => BIRTH_FIELDS[o.subcommand && BIRTH_FIELDS[`${name}:${o.subcommand}`] ? `${name}:${o.subcommand}` : name];

const kvKey = (userId) => "profile:" + userId;
export async function loadProfile(env, userId) {
  if (!env.PROFILES) return null;
  const s = await env.PROFILES.get(kvKey(userId));
  if (!s) return null;
  try { return await open(s, env.ORACLE_KEY); } catch { return null; }
}
/** Save, merging with what is already saved (a form for one system never wipes another system's details). */
export async function saveProfile(env, userId, p, { merge = true } = {}) {
  const old = merge ? (await loadProfile(env, userId)) || {} : {};
  const keep = (k) => (p[k] !== undefined && p[k] !== "" ? p[k] : old[k]);
  const date = keep("date"), sameDate = !p.date || p.date === old.date;
  const out = { date, time: p.time !== undefined ? (p.time || "unknown") : sameDate ? old.time || "unknown" : "unknown", place: keep("place"), name: keep("name"), saved: Date.now() };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  await env.PROFILES.put(kvKey(userId), await seal(out, env.ORACLE_KEY));
  return out;
}
export const deleteProfile = (env, userId) => env.PROFILES.delete(kvKey(userId));

/** Validate a profile for the given needs; returns an error message or null. */
export function checkBirth(p, need = ["date", "place"]) {
  if (need.includes("place") && (!p.place || String(p.place).trim().length < 2)) return "Please add your birth town or city.";
  if (need.includes("name") && (!p.name || !/\p{L}/u.test(p.name))) return "Please add your full birth name (as on your birth certificate).";
  if (p.name && String(p.name).length > 100) return "That name is too long (100 characters max).";
  const t = p.time && String(p.time).trim() && p.time !== "unknown" ? p.time : "12:00";
  try { parseBirth(p.date, t); return null; } catch (e) { return e.message; }
}

/** Fill missing birth options from a saved profile (a saved blank time means "unknown", so we don't ask again). */
export function fillFromProfile(options, f, profile) {
  if (!profile) return;
  if (!options[f.date] && profile.date) {
    options[f.date] = profile.date; options.from_profile = true;
    if (f.place) options[f.place] = options[f.place] || profile.place;
    if (f.time && profile.time && profile.time !== "unknown" && !options[f.time]) options[f.time] = profile.time;
    if (f.time && profile.time === "unknown" && !options[f.time]) options.time_unknown = true;
  }
  if (f.name && !options[f.name] && profile.name) { options[f.name] = profile.name; options.from_profile = true; }
}

/** Does this command still need the birth form? */
export const needsForm = (options, f) => (f.need || ["date", "place", "time"]).some((k) =>
  k === "time" ? !options[f.time] && !options.time_unknown : !options[f[k]]);

// Modal. Pending options wait in KV for 15 minutes under a short id (custom_id max 100 chars).
export async function birthModal(env, name, options, f) {
  const id = crypto.randomUUID().slice(0, 12), need = f.need || ["date", "place", "time"];
  if (env.PROFILES) await env.PROFILES.put("pending:" + id, await seal({ name, options }, env.ORACLE_KEY), { expirationTtl: 900 });
  const row = (custom_id, label, placeholder, required, max_length, value) => ({ type: 1, components: [{ type: 4, custom_id, label, style: 1, placeholder, required, max_length, ...(value ? { value: String(value).slice(0, max_length) } : {}) }] });
  const rows = [row("date", "Birth date (year-month-day)", "1990-04-09", true, 10, options[f.date])];
  if (need.includes("time")) rows.push(row("time", "Birth time (leave blank if unknown)", "14:30 or 2:30 pm", false, 8, options[f.time]));
  if (need.includes("place")) rows.push(row("place", "Birth town or city, country", "Phoenix, USA", true, 100, options[f.place]));
  if (need.includes("name")) rows.push(row("name", "Full birth name (as on your birth certificate)", "Mary Ann Smith", true, 100, options[f.name]));
  rows.push(row("save", "Save for next time? (yes / no)", "yes", false, 3, options.from_profile ? "yes" : ""));
  return { type: 9, data: { custom_id: "birth:" + id, title: "Your birth details", components: rows } };
}

/** Modal submit -> { name, options, save, profile, need } or null. */
export async function fromModal(env, it) {
  const [tag, id] = String(it.data.custom_id || "").split(":");
  if (tag !== "birth" || !env.PROFILES) return null;
  const s = await env.PROFILES.get("pending:" + id);
  if (!s) return null;
  await env.PROFILES.delete("pending:" + id);
  const { name, options } = await open(s, env.ORACLE_KEY);
  const v = Object.fromEntries(it.data.components.flatMap((r) => r.components).map((c) => [c.custom_id, (c.value || "").trim()]));
  const f = fieldsFor(name, options), need = f.need || ["date", "place", "time"];
  const profile = { date: v.date };
  options[f.date] = v.date;
  if (need.includes("place")) { options[f.place] = v.place; profile.place = v.place; }
  if (need.includes("name")) { options[f.name] = v.name; profile.name = v.name; }
  if (need.includes("time")) {
    profile.time = v.time || "unknown";
    if (v.time) { options[f.time] = v.time; delete options.time_unknown; } else { delete options[f.time]; options.time_unknown = true; options.birth_time_unknown = f.time === "birth_time"; }
  }
  return { name, options, need, save: /^y/i.test(v.save || ""), profile };
}

export const profileCommand = {
  name: "profile",
  description: "Save your birth details so the oracle's readings fill them in for you",
  options: [
    { type: 1, name: "set", description: "Save or update your birth details (blank fields keep what's saved)", options: [
      { type: 3, name: "date", description: "Birth date, year-month-day (1990-04-09)", max_length: 10 },
      { type: 3, name: "place", description: "Birth town or city, country", max_length: 100 },
      { type: 3, name: "time", description: "Birth time (14:30 or 2:30 pm). Leave out if unknown", max_length: 8 },
      { type: 3, name: "name", description: "Full birth name, for /numerology", max_length: 100 },
    ] },
    { type: 1, name: "show", description: "See what's saved (only you can see it)" },
    { type: 1, name: "delete", description: "Delete your saved birth details" },
  ],
};
