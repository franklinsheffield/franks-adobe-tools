// /humandesign: real bodygraph from birth date, time and place, with Science is Magic interpretations.
import { bodygraph } from "../../humandesign/chart.js";
import { bodygraphPng } from "../../humandesign/bodygraph.js";
import { CENTERS } from "../../humandesign/data.js";
import { TYPES, SIGNATURE_TEXT, AUTHORITIES, LINES, CENTER_TEXT, DEFINITION_TEXT, CROSS_TEXT, GATES, CHANNEL_TEXT } from "../../humandesign/text.js";
import { analyse } from "../../humandesign/insight.js";
import { withInsight } from "../../insight.js";
import { geocode, timeZoneAt, localToUtc, parseBirth } from "../../birthplace.js";
import { birthMoment } from "../../moment.js";

export const GOLD = 0xE2B04A, TEAL = 0x66E0C8;
export const FOOTER = { text: "Science is Magic · for reflection, not prediction" };

export const command = {
  name: "humandesign",
  description: "Your Human Design bodygraph from real planetary data, with a Science is Magic reading",
  options: [
    { type: 3, name: "date", description: "Birth date as DD/MM/YYYY (uses your /profile if left out)", min_length: 8, max_length: 10 },
    { type: 3, name: "time", description: "Birth time, local clock, e.g. 14:30 or 2:30 pm (leave out if unknown)", max_length: 8 },
    { type: 3, name: "place", description: "Birth town/city and country, e.g. Phoenix, USA", max_length: 100 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
    { type: 5, name: "show_birth_details", description: "Print your birth date and place on the chart (default: hidden)" },
  ],
};

const list = (xs) => xs.join("\n").slice(0, 1024);
const fmtDate = (p) => `${p.day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][p.month - 1]} ${p.year}`;

/** Build the reading embeds for a computed chart (no I/O). */
export function readingEmbeds(chart, { who = "you", image = "attachment://bodygraph.png" } = {}) {
  const T = TYPES[chart.type], [pl, dl] = chart.profile.split("/").map(Number);
  const pSun = chart.personality.sun, pEarth = chart.personality.earth, dSun = chart.design.sun, dEarth = chart.design.earth;
  const gate = (a) => `**${a.gate}.${a.line} · ${GATES[a.gate][0]}**: ${GATES[a.gate][1]}`;
  const defined = Object.keys(CENTERS).filter((c) => chart.centers[c]), open = Object.keys(CENTERS).filter((c) => !chart.centers[c]);

  const main = {
    title: `${T.emoji} Human Design · ${chart.type}`, color: GOLD,
    description: `*${T.tagline}.* ${T.about}`,
    fields: [
      { name: "🧪 Strategy (the system's hypothesis)", value: `**${chart.strategy}.** ${T.strategy}` },
      { name: "⚖️ Signature", value: `**${chart.signature[0]}** vs **${chart.signature[1]}**. ${SIGNATURE_TEXT[chart.type]}` },
      { name: `🧭 Authority · ${chart.authority}`, value: AUTHORITIES[chart.authority] },
      { name: `🎭 Profile · ${chart.profile} ${LINES[pl][0]} / ${LINES[dl][0]}`,
        value: `**Conscious line ${pl} (${LINES[pl][0]}):** ${LINES[pl][1]}\n**Unconscious line ${dl} (${LINES[dl][0]}):** ${LINES[dl][1]}` },
    ],
    image: { url: image }, footer: FOOTER,
  };

  const chans = chart.channels.map((c) => `**${c.key} ${c.name}**: ${CHANNEL_TEXT[c.key]}`);
  const wiring = {
    title: "⚛️ Your wiring", color: TEAL,
    description: `**${chart.definition} definition.** ${DEFINITION_TEXT[chart.definition]}`,
    fields: [
      ...(defined.length ? [{ name: `Defined centres (${defined.length})`, value: list(defined.map((c) => `**${CENTERS[c].name}**: ${CENTER_TEXT[c][0]}`)) }] : []),
      ...(open.length ? [{ name: `Open centres (${open.length})`, value: list(open.map((c) => `**${CENTERS[c].name}**: ${CENTER_TEXT[c][1]}`)) }] : []),
      ...(chans.length ? [{ name: `Channels (${chans.length})`, value: list(chans) }] : [{ name: "Channels", value: "None: no fixed circuits, so you sample everyone's." }]),
    ],
    footer: FOOTER,
  };

  const purpose = {
    title: "🌌 Life theme", color: GOLD,
    fields: [
      { name: `Incarnation Cross`, value: `**${chart.cross.full}**\n${CROSS_TEXT[chart.cross.angle]}` },
      { name: "☉ Conscious Sun (who you know yourself to be)", value: gate(pSun) },
      { name: "⊕ Conscious Earth (what grounds you)", value: gate(pEarth) },
      { name: "☉ Unconscious Sun (what others see in you)", value: gate(dSun) },
      { name: "⊕ Unconscious Earth (your hidden ballast)", value: gate(dEarth) },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, wiring, purpose];
}

// Which headline results change between the first and last minute of the birth day (unknown birth time).
function timeSensitive(chart, birth, zone) {
  const ends = [{ ...birth, hour: 0, minute: 0 }, { ...birth, hour: 23, minute: 59 }].map((b) => bodygraph(localToUtc(b, zone)));
  const keys = { type: "type", authority: "authority", profile: "profile", definition: "definition", cross: "incarnation cross", channels: "channels" };
  const val = (c, k) => k === "cross" ? c.cross.full : k === "channels" ? c.channels.map((x) => x.key).join() : c[k];
  return Object.keys(keys).filter((k) => ends.some((c) => val(c, k) !== val(chart, k))).map((k) => keys[k]);
}

/** Discord options -> { embeds, files, ephemeral }. */
export async function run(o, ctx = {}) {
  const timeKnown = !!(o.time && String(o.time).trim());
  const birth = parseBirth(o.date, timeKnown ? o.time : "12:00");
  if (!o.date) throw new Error("I need your birth date. Add it, or save it once with /profile set.");
  if (!o.place || !String(o.place).trim()) return runNoPlace(o, ctx, birth);
  const where = ctx.geocoded || await geocode(o.place, ctx.fetch || fetch);
  if (!where) throw new Error(`Couldn't find "${o.place}". Try "City, Country".`);
  const zone = timeZoneAt(where.lat, where.lon), moment = birthMoment(birth, where, timeKnown), utc = moment.utc;
  const chart = bodygraph(utc);
  const unsure = timeKnown ? [] : timeSensitive(chart, birth, zone);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const place = where.name.split(",").slice(0, 1).concat(where.name.split(",").slice(-1)).map((s) => s.trim()).join(", ");
  const clock = timeKnown ? `${String(birth.hour).padStart(2, "0")}:${String(birth.minute).padStart(2, "0")}` : "time unknown (noon chart)";
  const subtitle = o.show_birth_details ? `${fmtDate(birth)} · ${clock} · ${place}` : `Personal chart for ${who}${timeKnown ? "" : " · birth time unknown"}`;
  const png = await bodygraphPng(chart, { title: "Human Design", subtitle });
  const embeds = readingEmbeds(chart, { who });
  if (!timeKnown) embeds[0].fields.unshift({ name: "⏱️ Birth time unknown", value: unsure.length
    ? `This is a noon chart. Across the whole day these could change: **${unsure.join(", ")}**. They are provisional without a birth time (a birth certificate or hospital record usually has it).`
    : "This is a noon chart, but your type, authority, profile, definition, cross and channels stay the same all day, so the core reading holds." });
  const ins = analyse(chart, { timeKnown, who, moment, detail: !!(o.private || o.show_birth_details || ctx.birthDetail), unsure });
  return { embeds: withInsight(embeds, ins), analysis: ins.analysis, files: [{ name: "bodygraph.png", data: png }], ephemeral: !!o.private, chart, moment,
    headline: `${chart.type} · ${chart.profile} · ${chart.authority} authority` };
}

/** No birth city: a noon chart in universal time, with everything that could differ anywhere on Earth that day flagged. */
async function runNoPlace(o, ctx, birth) {
  const noon = new Date(Date.UTC(birth.year, birth.month - 1, birth.day, 12, 0)), chart = bodygraph(noon);
  const ends = [-26, 24].map((h) => bodygraph(new Date(noon.getTime() + h * 3600000))); // a calendar date spans UTC-12 to UTC+14
  const keys = { type: "type", authority: "authority", profile: "profile", definition: "definition", cross: "incarnation cross", channels: "channels" };
  const val = (c, k) => (k === "cross" ? c.cross.full : k === "channels" ? c.channels.map((x) => x.key).join() : c[k]);
  const unsure = Object.keys(keys).filter((k) => ends.some((c) => val(c, k) !== val(chart, k))).map((k) => keys[k]);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const png = await bodygraphPng(chart, { title: "Human Design", subtitle: `Personal chart for ${who} · birth city and time not given` });
  const embeds = readingEmbeds(chart, { who });
  embeds[0].fields.unshift({ name: "📍 Birth city not given", value: unsure.length
    ? `This is a noon chart in universal time. Depending on where and when in the day the birth was, these could change: **${unsure.join(", ")}**. They are provisional until a birth city and time are added.`
    : "This is a noon chart in universal time, but type, authority, profile, definition, cross and channels stay the same across that whole date anywhere on Earth, so the core reading holds." });
  const ins = analyse(chart, { timeKnown: false, who, moment: null, detail: false, unsure });
  return { embeds: withInsight(embeds, ins), analysis: ins.analysis, files: [{ name: "bodygraph.png", data: png }], ephemeral: !!o.private, chart, moment: null,
    headline: `${chart.type} · ${chart.profile} · ${chart.authority} authority` };
}
