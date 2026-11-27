// /tonight: tonight's real sky over a city (city only, from the shared list), the Observatory's bot command.
// When it gets dark, the Moon's phase, the planets you can see and where, bright stars high up, any meteor shower,
// and Tonight's Target: the same daily pick the Night Watch room gives everyone in that city.
import { PLACES, clock, sunAlt } from "../../../activity/src/stars/tonight.js";
import { skyTonight, fists } from "../../../activity/src/stars/planets.js";
import { upNow, watchTime, tonightsTarget } from "../../../activity/src/watch/engine.js";
import { domeSvg } from "../../../activity/src/watch/room.js";
import { showerTonight } from "../../../activity/src/watch/menubg.js";
import { moonLight, phaseName } from "../../../activity/src/scene.js";
import { dailySeed, todayKey } from "../../../activity/src/daily.js";
import { cardPng, PAL, esc, para, cut } from "../../card.js";

export const command = {
  name: "tonight",
  description: "Tonight's real sky over your city: planets, Moon, bright stars, meteors and the Night Watch target",
  options: [
    { type: 3, name: "city", description: `Nearest big city (e.g. ${PLACES.slice(0, 4).map((p) => p.name).join(", ")})`, required: true, min_length: 2, max_length: 40 },
    { type: 5, name: "private", description: "Only you see the card (default: posted to the channel)" },
  ],
};

const BLUE = 0x8FB8FF;
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
/** The listed city for what someone typed (exact, then prefix, then contains), or null. */
export function findCity(q) {
  const k = norm(q); if (!k) return null;
  return PLACES.find((p) => norm(p.name) === k) || PLACES.find((p) => norm(p.name).startsWith(k)) || PLACES.find((p) => norm(p.name).includes(k)) || null;
}

/** Everything the card says about tonight over a place. */
export function tonightOver(place, now = Date.now()) {
  const { at, night } = watchTime(place, now), up = upNow(place, at);
  const planets = skyTonight(place, at).filter((s) => s.p.id !== "moon" && s.see).sort((a, b) => b.alt - a.alt);
  const moonSky = skyTonight(place, at).find((s) => s.p.id === "moon");
  const stars = up.filter((o) => o.t.plate === "spectrum").slice(0, 3);
  const target = tonightsTarget(place, at, dailySeed("watch", todayKey(now)));
  const { lit } = moonLight(at);
  return { place, at, night, up, planets, stars, target, moon: { name: phaseName(at), lit, up: !!(moonSky && moonSky.alt > 0), dir: moonSky && moonSky.dir, alt: moonSky ? moonSky.alt : 0 },
    shower: showerTonight(at), darkNow: sunAlt(place, now) <= -12 };
}

const bino = (s) => (s.p.eye ? "" : " (binoculars)");
const where = (o) => `${o.dir}, ${fists(o.alt)} fist${fists(o.alt) > 1 ? "s" : ""} up`;
const moonLine = (m) => `${m.name}, ${Math.round(m.lit * 100)}% lit${m.up ? ` · ${where(m)}` : " · below the horizon then"}${m.lit > 0.8 ? ". Its glare hides faint galaxies tonight." : m.lit < 0.15 ? ". A dark sky: good for faint galaxies." : "."}`;

export function readingEmbeds(d) {
  const pl = d.planets.length ? d.planets.map((s) => `**${s.p.name}**${bino(s)} · ${where(s)}`).join("\n") : "None well placed tonight: they're below the horizon or lost in the Sun's glare.";
  const st = d.stars.length ? d.stars.map((o) => `**${o.t.name}**${o.t.kind === "Star" ? "" : ` (${o.t.kind.toLowerCase()})`} · ${where(o)}`).join("\n") : "None high enough yet.";
  const fields = [
    { name: "🌙 The Moon", value: moonLine(d.moon) },
    { name: "🪐 Planets you can see", value: cut(pl) },
    { name: "✨ Bright stars high up", value: cut(st) },
  ];
  if (d.target) fields.push({ name: `🎯 Tonight's Target: ${d.target.t.name}`, value: cut(`${where(d.target)}. ${d.target.t.note}`) });
  if (d.shower) fields.push({ name: `☄️ ${d.shower} meteor shower`, value: "Peaking now. Look away from city lights after midnight, let your eyes adapt for 20 minutes, and look about halfway up." });
  fields.push({ name: "🔭 Play it", value: "Log tonight's target, measure it in the Plate Room and answer the Almanac Desk in **The Night Watch**: run `/oracle` and open it, or visit Keeper Altair in #🔭-observatory." });
  return [{
    title: `🔭 Tonight over ${d.place.name}`, color: BLUE,
    description: d.night.bright ? `It never gets fully dark here this time of year. The darkest hour is about **${clock(d.at, d.place)}** local time.`
      : `${d.darkNow ? "It's dark now" : `Dark from about **${clock(d.night.start, d.place)}**`} until about **${clock(d.night.end, d.place)}** local time. A fist held at arm's length covers about 10° of sky.`,
    fields, image: { url: "attachment://tonight.png" }, footer: { text: "Science is Magic · The Observatory · positions from Astronomy Engine, city only" },
  }];
}

/** The dome's scope turns with CSS; a PNG renderer needs a plain transform attribute. */
const staticDome = (svg) => svg.replace(/style="transform:rotate\((-?[\d.]+)deg\)"/g, (_, a) => `transform="rotate(${a} 200 200)"`).replace('<svg class="nw-dome" ', '<svg x="40" y="10" width="680" height="680" ');

function body(d) {
  let s = staticDome(domeSvg(d.up, { sel: d.target && d.target.t.id })), y = 20; const X = 780;
  const rows = [["THE MOON", d.moon.name, moonLine(d.moon)],
    ["PLANETS", d.planets.length ? d.planets.map((p) => p.p.name).join(" · ") : "None tonight", d.planets.length ? d.planets.map((p) => `${p.p.name}${bino(p)}: ${where(p)}`).join(". ") + "." : "Below the horizon or lost in the Sun's glare."],
    ["TONIGHT'S TARGET", d.target ? d.target.t.name : "Nothing high enough", d.target ? `${where(d.target)}. ${d.target.t.note}` : "Try the Archive in the Night Watch."]];
  if (d.shower) rows.push(["METEORS", `${d.shower} tonight`, "A meteor shower is peaking. Best after midnight, away from city lights."]);
  for (const [k, big, small] of rows) {
    s += `<text x="${X}" y="${y + 16}" font-size="16" letter-spacing="3" fill="${PAL.teal}">${esc(k)}</text><text x="${X}" y="${y + 52}" font-family="Cinzel" font-weight="900" font-size="30" fill="${PAL.light}">${esc(cut(big, 32))}</text>${para(X, y + 84, small, { n: 62, size: 19, fill: PAL.text, max: 3 })}`;
    y += d.shower ? 166 : 220;
  }
  return s;
}

export async function run(o = {}, ctx = {}) {
  const place = findCity(o.city);
  if (!place) throw new Error(`I don't have "${o.city}" on the star chart yet. Try the nearest big city, like ${PLACES.slice(0, 8).map((p) => p.name).join(", ")}.`);
  const now = (ctx.now ? new Date(ctx.now) : new Date()).getTime(), d = tonightOver(place, now);
  const png = await cardPng({ title: `Tonight over ${place.name}`, subtitle: `The real sky from the Observatory dome, ${clock(d.at, place)} local time`, tag: "The Observatory · Keeper Altair",
    body: body(d), facts: [["Moon", `${Math.round(d.moon.lit * 100)}% lit`], ["Planets", String(d.planets.length)], ["Target", d.target ? d.target.t.name : "—"], ["Meteors", d.shower || "Sporadic"]] });
  return { embeds: readingEmbeds(d), files: [{ name: "tonight.png", data: png }], ephemeral: !!o.private, reading: { city: place.name }, headline: `Tonight over ${place.name}` };
}
