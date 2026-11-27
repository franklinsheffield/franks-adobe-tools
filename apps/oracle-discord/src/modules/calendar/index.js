// /calendar: today (or any date) in the Maya, Egyptian and Celtic calendars, with the next fire festival and the next
// eclipse worked out from the real sky. Same maths and desk drawing as the Calendar Keeper room in the Oracle Chamber.
import * as E from "../../../activity/src/calendar/engine.js";
import { deskSvg } from "../../../activity/src/calendar/desk.js";
import { SIGN_MEANING } from "../../../activity/src/calendar/birthday.js";
import { cardPng, PAL, esc, para, GOLD, TEAL, FOOTER } from "../../card.js";

export const command = {
  name: "calendar",
  description: "Today in the Maya, Egyptian and Celtic calendars, plus the next festival and the next eclipse",
  options: [
    { type: 3, name: "date", description: "Any date as year-month-day (default: today)", min_length: 8, max_length: 11 },
    { type: 5, name: "private", description: "Only you see the card (default: posted to the channel)" },
  ],
};

const LOOK = { bg: ["#2E1E68", "#161030"], gear: "#E2B04A", gear2: "#8a6420", ink: "#1a1030", ring: "#66E0C8", text: "#FADE8C", fx: null };
const days = (n) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n.toLocaleString("en")} days`);

/** Everything the card says about day j. */
export function calendarDay(j) {
  const m = E.maya(j), e = E.egyptCivil(j), c = E.copticOf(j), nf = E.nextFestival(j), sun = E.sunLon(j);
  const ecl = E.nextEclipse(j, true), saros = E.sarosAfter(ecl), thoth = E.nextThoth(j);
  return { j, m, e, c, nf, sun, ecl, saros, thoth, meaning: SIGN_MEANING[m.sign] };
}

/** The desk turns its dials with CSS; a PNG renderer needs plain transform attributes instead. */
export const staticDesk = (svg) => svg.replace(/style="transform:rotate\((-?[\d.e+-]+)deg\);transform-origin:([\d.]+)px ([\d.]+)px"((?: data-k="\w+")?) data-to="(-?[\d.e+-]+)"/g, (_, _a, x, y, k, to) => `transform="rotate(${to} ${x} ${y})"${k}`);

function body(d) {
  const desk = staticDesk(deskSvg(d.j, LOOK)).replace("<svg ", '<svg x="0" y="0" width="760" height="687" ');
  const X = 800, lines = [
    ["MAYA", `${d.m.tz} · Haab' ${d.m.haabName}`, `Long Count ${d.m.lc}. Day sign: ${d.meaning}.`],
    ["EGYPT · CIVIL YEAR", d.e.name, `Season of ${d.e.season}. Coptic: ${d.c.text}. Next 1 Thoth (new year) ${days(d.thoth - d.j)}.`],
    ["CELTIC YEAR", `${d.nf.f.name} ${days(d.nf.jdn - d.j)}`, `${E.fmt(d.nf.jdn, true)}, marking ${d.nf.f.marks}.`],
    ["NEXT ECLIPSE", `${E.eclipseName(d.ecl)[0].toUpperCase() + E.eclipseName(d.ecl).slice(1)}`, `${E.fmt(d.ecl.jdn, true)} (${days(d.ecl.jdn - d.j)}). One Saros later it returns on ${E.fmt(d.saros.jdn)}.`],
  ];
  let s = desk, y = 14;
  for (const [k, big, small] of lines) {
    s += `<text x="${X}" y="${y + 16}" font-size="16" letter-spacing="3" fill="${PAL.teal}">${esc(k)}</text><text x="${X}" y="${y + 52}" font-family="Cinzel" font-weight="900" font-size="30" fill="${PAL.light}">${esc(big)}</text>${para(X, y + 84, small, { n: 62, size: 19, fill: PAL.text, max: 3 })}`;
    y += 168;
  }
  return s;
}

export function readingEmbeds(d) {
  const e = d.ecl;
  return [{
    title: `🗓️ ${E.fmt(d.j, true)} in three calendars`, color: GOLD,
    description: `🌽 **${d.m.tz}** (${d.meaning}) · Haab' **${d.m.haabName}** · Long Count **${d.m.lc}**\n🏺 **${d.e.name}**, season of ${d.e.season} · Coptic ${d.c.text}\n🔥 **${d.nf.f.name}** ${days(d.nf.jdn - d.j)} (${E.fmt(d.nf.jdn)})`,
    fields: [
      { name: `🌘 Next eclipse: ${E.eclipseName(e)}`, value: `${E.fmt(e.jdn, true)}, ${days(e.jdn - d.j)}.${e.type === "solar" && e.lat != null ? ` Greatest eclipse near ${Math.abs(Math.round(e.lat))}°${e.lat < 0 ? "S" : "N"} ${E.lonText(e.lon)}.` : " Seen from the whole night side of Earth."} One Saros (6,585⅓ days) later it returns on ${E.fmt(d.saros.jdn)}.` },
      { name: "🗓️ Play it", value: "Turn these wheels yourself, predict festivals and eclipses, and try the ☀️ Daily Sky in **Calendar Keeper**: run `/oracle` and open the Oracle Chamber." },
    ],
    image: { url: "attachment://calendar.png" }, footer: { text: "Science is Magic · Maya GMT correlation 584283 · eclipses from Astronomy Engine" },
  }];
}

export async function run(o = {}, ctx = {}) {
  const now = ctx.now || new Date();
  const j = o.date ? E.parseYmd(o.date) : E.jdnOf({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() });
  if (j == null) throw new Error("That date doesn't turn the wheels. Use year-month-day, like 2012-12-21.");
  const d = calendarDay(j);
  const png = await cardPng({ title: "The Keeper's Desk", subtitle: `${E.fmt(j, true)} in the Maya, Egyptian and Celtic calendars`, tag: "Calendar Keeper · real calendars, real sky", body: body(d),
    facts: [["Tzolk'in", d.m.tz], ["Egyptian", d.e.short], ["Next festival", d.nf.f.name.split(" ")[0]], ["Next eclipse", E.fmt(d.ecl.jdn)]] });
  return { embeds: readingEmbeds(d), files: [{ name: "calendar.png", data: png }], ephemeral: !!o.private, reading: { tz: d.m.tz, egy: d.e.short }, headline: `${d.m.tz} · ${d.e.short}` };
}
