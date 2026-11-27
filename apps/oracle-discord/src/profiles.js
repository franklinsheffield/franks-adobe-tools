// Opt-in saved birth profiles (Cloudflare KV, AES-GCM sealed with ORACLE_KEY) and the "enter your birth data" modal.
import { seal, open } from "./seal.js";
import { parseBirth } from "./birthplace.js";

// Which option names each birth-data command uses.
export const BIRTH_FIELDS = {
  humandesign: { date: "date", time: "time", place: "place" },
  "astrology:chart": { date: "date", time: "time", place: "place" },
  "astrology:now": { date: "birth_date", time: "birth_time", place: "birth_place" },
};
export const fieldsFor = (name, o) => BIRTH_FIELDS[o.subcommand ? `${name}:${o.subcommand}` : name];

const kvKey = (userId) => "profile:" + userId;
export async function loadProfile(env, userId) {
  if (!env.PROFILES) return null;
  const s = await env.PROFILES.get(kvKey(userId));
  if (!s) return null;
  try { return await open(s, env.ORACLE_KEY); } catch { return null; }
}
export async function saveProfile(env, userId, p) {
  await env.PROFILES.put(kvKey(userId), await seal({ date: p.date, time: p.time || "unknown", place: p.place, saved: Date.now() }, env.ORACLE_KEY));
}
export const deleteProfile = (env, userId) => env.PROFILES.delete(kvKey(userId));

/** Validate a profile; returns an error message or null. */
export function checkBirth(p) {
  if (!p.place || String(p.place).trim().length < 2) return "Please add your birth town or city.";
  const t = p.time && String(p.time).trim() && p.time !== "unknown" ? p.time : "12:00";
  try { parseBirth(p.date, t); return null; } catch (e) { return e.message; }
}

/** Fill missing birth options from a saved profile (a saved blank time means "unknown", so we don't ask again). */
export function fillFromProfile(options, f, profile) {
  if (!profile) return;
  if (!options[f.date]) {
    options[f.date] = profile.date; options[f.place] = options[f.place] || profile.place;
    if (profile.time && profile.time !== "unknown" && !options[f.time]) options[f.time] = profile.time;
    if (profile.time === "unknown" && !options[f.time]) options.time_unknown = true;
    options.from_profile = true;
  }
}

/** Does this command still need the birth form? (missing date/place, or a time that isn't known to be unknown) */
export const needsForm = (options, f) => !options[f.date] || !options[f.place] || (!options[f.time] && !options.time_unknown);

// Modal. Pending options wait in KV for 15 minutes under a short id (custom_id max 100 chars).
export async function birthModal(env, name, options, f) {
  const id = crypto.randomUUID().slice(0, 12);
  if (env.PROFILES) await env.PROFILES.put("pending:" + id, await seal({ name, options }, env.ORACLE_KEY), { expirationTtl: 900 });
  const row = (custom_id, label, placeholder, required, max_length, value) => ({ type: 1, components: [{ type: 4, custom_id, label, style: 1, placeholder, required, max_length, ...(value ? { value: String(value).slice(0, max_length) } : {}) }] });
  return {
    type: 9, data: {
      custom_id: "birth:" + id, title: "Your birth details",
      components: [
        row("date", "Birth date (year-month-day)", "1990-04-09", true, 10, options[f.date]),
        row("time", "Birth time (leave blank if unknown)", "14:30 or 2:30 pm", false, 8, options[f.time]),
        row("place", "Birth town or city, country", "Phoenix, USA", true, 100, options[f.place]),
        row("save", "Save for next time? (yes / no)", "yes", false, 3, options.from_profile ? "yes" : ""),
      ],
    },
  };
}

/** Modal submit -> { name, options, save, profile } or null. */
export async function fromModal(env, it) {
  const [tag, id] = String(it.data.custom_id || "").split(":");
  if (tag !== "birth" || !env.PROFILES) return null;
  const s = await env.PROFILES.get("pending:" + id);
  if (!s) return null;
  await env.PROFILES.delete("pending:" + id);
  const { name, options } = await open(s, env.ORACLE_KEY);
  const v = Object.fromEntries(it.data.components.flatMap((r) => r.components).map((c) => [c.custom_id, (c.value || "").trim()]));
  const f = fieldsFor(name, options);
  options[f.date] = v.date; options[f.place] = v.place;
  if (v.time) { options[f.time] = v.time; delete options.time_unknown; } else { delete options[f.time]; options.time_unknown = true; options.birth_time_unknown = f.time === "birth_time"; }
  return { name, options, save: /^y/i.test(v.save || ""), profile: { date: v.date, time: v.time || "unknown", place: v.place } };
}

export const profileCommand = {
  name: "profile",
  description: "Save your birth details so /humandesign and /astrology fill them in for you",
  options: [
    { type: 1, name: "set", description: "Save (or replace) your birth details", options: [
      { type: 3, name: "date", description: "Birth date, year-month-day (1990-04-09)", required: true, max_length: 10 },
      { type: 3, name: "place", description: "Birth town or city, country", required: true, max_length: 100 },
      { type: 3, name: "time", description: "Birth time (14:30 or 2:30 pm). Leave out if unknown", max_length: 8 },
    ] },
    { type: 1, name: "show", description: "See what's saved (only you can see it)" },
    { type: 1, name: "delete", description: "Delete your saved birth details" },
  ],
};
