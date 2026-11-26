// /astrology: natal chart wheel + branded reading from real ephemeris data.
import { geocode, timeZoneAt, localToUtc, parseBirth } from "../../birthplace.js";
import { castChart, NAMES } from "./chart.js";
import { wheelSvg, GLYPH } from "./wheel.js";
import { castNow, skyContext, transits, transitLine } from "./now.js";
import { SUN, MOON, RISING, planetLine, aspectLine, elementLine, formula } from "./text.js";

const CHART_OPTS = [
  { type: 3, name: "date", description: "Birth date, year-month-day (1990-07-14)", required: true },
  { type: 3, name: "place", description: "Birth town or city (Phoenix, AZ)", required: true },
  { type: 3, name: "time", description: "Birth time (08:45 or 8:45 am). Leave out if unknown", required: false },
  { type: 3, name: "name", description: "Name shown on the chart", required: false },
  { type: 3, name: "houses", description: "House system", required: false,
    choices: [{ name: "Whole Sign (default)", value: "whole" }, { name: "Placidus", value: "placidus" }] },
  { type: 5, name: "private", description: "Only you see the reading (default: yes)", required: false },
];
const NOW_OPTS = [
  { type: 3, name: "place", description: "Where you are, for houses (optional)", required: false },
  { type: 3, name: "birth_date", description: "Your birth date to see how today's sky touches your chart", required: false },
  { type: 3, name: "birth_time", description: "Your birth time (optional)", required: false },
  { type: 3, name: "birth_place", description: "Your birth town or city", required: false },
  { type: 5, name: "private", description: "Only you see it (default: no, unless birth details are given)", required: false },
];

// Subcommands: /astrology chart (natal reading) and /astrology now (the sky right now + context).
// The runner passes the chosen subcommand as options.subcommand ("chart" when absent).
export const command = {
  name: "astrology",
  description: "Natal charts and the sky right now, Science is Magic style",
  options: [
    { type: 1, name: "chart", description: "Your natal chart wheel and reading", options: CHART_OPTS },
    { type: 1, name: "now", description: "The sky right now, with context (and how it touches your chart)", options: NOW_OPTS },
  ],
};

const FONT_DIR = new URL("../../../assets/fonts/", import.meta.url);
async function svgToPng(svg) {
  const { Resvg } = await import("@resvg/resvg-js");
  const { fileURLToPath } = await import("node:url");
  const f = (n) => fileURLToPath(new URL(n, FONT_DIR));
  return new Resvg(svg, { font: { fontFiles: [f("DejaVuSans.ttf"), f("DejaVuSans-Bold.ttf")], loadSystemFonts: false, defaultFontFamily: "DejaVu Sans" } }).render().asPng();
}

const deg = (p) => `${Math.floor(p.deg)}°${String(Math.floor((p.deg % 1) * 60)).padStart(2, "0")}'`;
const head = (p) => `${GLYPH[p.key] || ""} ${p.name} in ${p.sign} ${deg(p)}${p.house ? `, house ${p.house}` : ""}${p.retro ? " ℞" : ""}`.trim();

/** Build the reading. options: { date, place, time?, name?, houses?, private? }. ctx: { fetch?, geocoded? } */
export async function run(options, ctx = {}) {
  if (options.subcommand === "now") return runNow(options, ctx);
  const { chart: c, where } = await natalFrom(options, ctx);
  const nowChart = castNow(ctx.now || new Date(), null);
  return withPng({ chart: c, ...render(c, options, where, nowChart) });
}

async function natalFrom(options, ctx) {
  const timeKnown = !!(options.time && String(options.time).trim());
  const birth = parseBirth(options.date, timeKnown ? options.time : "12:00");
  const where = ctx.geocoded || await geocode(options.place, ctx.fetch || fetch);
  if (!where) throw new Error(`Couldn't find "${options.place}". Try "City, Country".`);
  const zone = timeZoneAt(where.lat, where.lon);
  let utc = localToUtc(birth, zone);
  // Before standard time zones (zone offset is the zone city's local mean time, not a whole quarter hour),
  // use local mean time at the birthplace itself, as astrologers do.
  const wall = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
  if (Math.round((wall - utc) / 60000) % 15 !== 0) utc = new Date(wall - (where.lon / 15) * 3600000);
  const chart = castChart({ utc, lat: where.lat, lon: where.lon, houses: options.houses || "whole", timeKnown });
  return { chart, where };
}

/** /astrology now: current sky wheel + context, plus transits when birth details are given. */
export async function runNow(options, ctx = {}) {
  const date = ctx.now || new Date();
  const geo = (q, key) => (ctx.geocodedNow && key === "place" ? ctx.geocodedNow : geocode(q, ctx.fetch || fetch));
  const where = options.place ? await geo(options.place, "place") : null;
  if (options.place && !where) throw new Error(`Couldn't find "${options.place}".`);
  const sky = castNow(date, where);
  let natal = null;
  if (options.birth_date) {
    if (!options.birth_place) throw new Error("Add birth_place too, so I can place your chart.");
    ({ chart: natal } = await natalFrom({ date: options.birth_date, time: options.birth_time, place: options.birth_place }, { ...ctx, geocoded: ctx.geocodedBirth }));
  }
  return withPng(renderNow(sky, date, where, natal, options));
}

export function renderNow(sky, date, where, natal, options = {}) {
  const { fields, phase } = skyContext(sky, date);
  if (natal) {
    const tr = transits(natal, sky).slice(0, 5);
    fields.push({ name: "🌌 How it touches your chart", value: tr.length ? tr.map(transitLine).join("\n").slice(0, 1024) : "No tight contacts today: a quiet sky for you. Good for steady work." });
  }
  const unix = Math.floor(date.getTime() / 1000);
  const place = where ? String(where.name).split(",").slice(0, 2).join(",").trim() : "";
  const zone = where ? timeZoneAt(where.lat, where.lon) : "UTC";
  const stamp = new Intl.DateTimeFormat("en-GB", { timeZone: zone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  const svg = wheelSvg(sky, { title: "THE SKY NOW", subtitle: `${stamp}${where ? " · " + place : " UTC"} · ${phase.name.slice(3)}` });
  const embed = {
    title: "✨ Astrology · The Sky Now",
    description: `<t:${unix}:F>${where ? ` · ${place}` : ""}\nTropical zodiac${where ? " · Whole Sign houses" : " · add place: for houses"}`,
    color: 0xE2B04A, image: { url: "attachment://sky.png" }, fields,
    footer: { text: "Science is Magic · for reflection, not prediction" },
  };
  return { embeds: [embed], ephemeral: options.private ?? !!natal, files: [{ name: "sky.png", svg }] };
}

export function render(c, options, where, nowChart = null) {
  const sun = c.get("sun"), moon = c.get("moon"), asc = c.cusps ? c.get("asc") : null;
  const pad = (n) => String(n).padStart(2, "0");
  const b = parseBirth(options.date, c.timeKnown ? options.time : "12:00");
  const when = `${b.year}-${pad(b.month)}-${pad(b.day)}${c.timeKnown ? ` · ${pad(b.hour)}:${pad(b.minute)}` : " · time unknown"}`;
  const place = String(where.name || options.place).split(",").slice(0, 2).join(",").trim();
  const title = (options.name || "Natal Chart").toUpperCase().slice(0, 40);

  const fields = [];
  fields.push({ name: `☉ Sun in ${sun.sign}${sun.house ? `, house ${sun.house}` : ""}`, value: SUN[sun.sign] });
  fields.push({ name: `☽ Moon in ${moon.sign}${moon.house ? `, house ${moon.house}` : ""}`,
    value: MOON[moon.sign] + (c.timeKnown ? "" : " (Birth time unknown: the Moon could sit up to 7° either side, so this may belong to a neighbouring sign.)") });
  if (asc) fields.push({ name: `↑ ${asc.sign} Rising`, value: RISING[asc.sign] });

  const inst = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"].map((k) => `**${head(c.get(k))}**\n${planetLine(c.get(k))}`);
  const half = Math.ceil(inst.length / 2);
  fields.push({ name: "🔭 The Instruments", value: inst.slice(0, half).join("\n").slice(0, 1024) });
  fields.push({ name: "​", value: inst.slice(half).join("\n").slice(0, 1024) });

  const top = c.aspects.slice(0, 5).map((a) => `**${NAMES[a.a]} ${a.symbol} ${NAMES[a.b]}** (${a.orb.toFixed(1)}°) ${aspectLine(a)}`);
  if (top.length) fields.push({ name: "⚗️ The Reactions", value: top.join("\n").slice(0, 1024) });
  fields.push({ name: "🜂 Element balance", value: elementLine(c.elements) });
  fields.push({ name: "🧪 The Formula", value: formula(c) });
  if (nowChart) {
    const tr = transits(c, nowChart).slice(0, 3);
    if (tr.length) fields.push({ name: "🌌 Right now", value: (tr.map(transitLine).join("\n") + "\nFull sky: `/astrology now`").slice(0, 1024) });
  }

  const svg = wheelSvg(c, { title, subtitle: `${when} · ${place}` });
  const embed = {
    title: `✨ Astrology · ${options.name ? options.name : "Natal Chart"}`,
    description: `${when} · ${place}\nTropical zodiac · ${!c.timeKnown ? "no houses (birth time unknown)" : c.system === "placidus" ? "Placidus houses" : "Whole Sign houses"}`,
    color: 0xE2B04A,
    image: { url: "attachment://chart.png" },
    fields,
    footer: { text: "Science is Magic · for reflection, not prediction" },
  };
  return { embeds: [embed], svg, ephemeral: options.private !== false, files: [{ name: "chart.png", svg }] };
}

/** Node-side helper: fill PNG bytes for files that only carry SVG. */
export async function withPng(result) {
  for (const f of result.files) if (f.svg && !f.data) { f.data = new Uint8Array(await svgToPng(f.svg)); delete f.svg; }
  return result;
}
