// /egyptian: the modern "Egyptian zodiac" deity for a birthday, plus the birthday's place in the Coptic calendar,
// the living descendant of the ancient Egyptian civil calendar.
import { parseBirth, geocode } from "../../birthplace.js";
import { optionalMoment, dayReckoning } from "../../moment.js";
import { GODS, COPTIC, SEASONS } from "./data.js";
import { analyse } from "./insight.js";
import { withInsight } from "../../insight.js";
import { cardPng, PAL, esc, para, GOLD, TEAL, FOOTER, MONTHS, MONTHS_LONG } from "../../card.js";

export const command = {
  name: "egyptian",
  description: "Your Egyptian zodiac deity (a modern reconstruction) and your birthday in the Egyptian calendar",
  options: [
    { type: 3, name: "date", description: "Birth date as DD/MM/YYYY (uses your /profile if left out)", min_length: 8, max_length: 10 },
    { type: 3, name: "time", description: "Birth time, local clock (optional: day or night birth, day boundary)", max_length: 8 },
    { type: 3, name: "place", description: "Birth town or city, country (optional, with the time)", max_length: 100 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

export function godFor(month, day) {
  for (const [name, g] of Object.entries(GODS)) if (g.ranges.some(([m, a, b]) => m === month && day >= a && day <= b)) return name;
  return null;
}

const EPOCH = 1825030; // 1 Thout, year 1 of the Era of Martyrs (29 Aug 284, Julian)
function jdn(y, m, d) { const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045; }
const copticJdn = (y, m, d) => EPOCH - 1 + 365 * (y - 1) + Math.floor(y / 4) + 30 * (m - 1) + d;
export function coptic({ year, month, day }) {
  const j = jdn(year, month, day), y = Math.floor((4 * (j - EPOCH) + 1463) / 1461);
  const m = Math.floor((j - copticJdn(y, 1, 1)) / 30) + 1, d = j + 1 - copticJdn(y, m, 1);
  return { year: y, month: m, day: d, name: COPTIC[m - 1][0], season: COPTIC[m - 1][1], about: COPTIC[m - 1][2] };
}

const rangeText = (r) => r.map(([m, a, b]) => `${MONTHS[m - 1]} ${a}${a === b ? "" : `–${b}`}`).join(", ");
const glyph = (name) => String.fromCodePoint(GODS[name].glyph);

function body(name, c) {
  const g = GODS[name];
  let s = `<circle cx="310" cy="300" r="290" fill="url(#halo)"/>
  <circle cx="310" cy="290" r="200" fill="none" stroke="${PAL.gold}" stroke-width="3" filter="url(#glow)"/>
  <circle cx="310" cy="290" r="214" fill="none" stroke="${PAL.teal}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="2 10"/>
  <text x="310" y="360" font-family="Noto Sans Egyptian Hieroglyphs" font-size="230" fill="url(#goldfill)" text-anchor="middle" filter="url(#glow)">${glyph(name)}</text>
  <text x="310" y="560" font-family="Cinzel" font-weight="900" font-size="54" fill="${PAL.light}" text-anchor="middle">${esc(name.toUpperCase())}</text>
  <text x="310" y="600" font-size="22" fill="${PAL.teal}" text-anchor="middle">${esc(g.title)} · ${esc(g.kw.join(" · "))}</text>`;
  // the twelve
  const names = Object.keys(GODS);
  s += `<text x="680" y="20" font-size="17" letter-spacing="3" fill="${PAL.teal}">THE TWELVE</text>`;
  names.forEach((n, i) => {
    const x = 680 + (i % 6) * 140, y = 40 + Math.floor(i / 6) * 150, on = n === name;
    s += `<rect x="${x}" y="${y}" width="124" height="134" rx="14" fill="${on ? PAL.gold : PAL.ink}" fill-opacity="${on ? 0.9 : 0.55}" stroke="${PAL.gold}" stroke-opacity="0.45"/>
    <text x="${x + 62}" y="${y + 86}" font-family="Noto Sans Egyptian Hieroglyphs" font-size="64" fill="${on ? PAL.ink : PAL.light}" text-anchor="middle">${glyph(n)}</text>
    <text x="${x + 62}" y="${y + 120}" font-size="15" font-weight="${on ? 700 : 400}" fill="${on ? PAL.ink : PAL.mute}" text-anchor="middle">${esc(n)}</text>`;
  });
  // coptic panel
  s += `<rect x="680" y="350" width="824" height="250" rx="18" fill="${PAL.ink}" fill-opacity="0.55" stroke="${PAL.gold}" stroke-opacity="0.45"/>
  <text x="710" y="388" font-size="16" letter-spacing="3" fill="${PAL.teal}">YOUR BIRTHDAY IN THE EGYPTIAN CALENDAR</text>
  <text x="1470" y="470" font-family="Noto Sans Egyptian Hieroglyphs" font-size="96" fill="${PAL.gold}" fill-opacity="0.85" text-anchor="end">${String.fromCodePoint(0x132F9)}</text>
  <text x="710" y="458" font-family="Cinzel" font-weight="900" font-size="48" fill="${PAL.light}">${c.day} ${esc(c.name)}</text>
  <text x="710" y="498" font-size="20" fill="${PAL.text}">Season of ${esc(c.season)} · Coptic year ${c.year}</text>
  ${para(710, 538, `${c.about[0].toUpperCase()}${c.about.slice(1)}.`, { n: 66, size: 18, fill: PAL.mute, max: 2 })}`;
  return s;
}

export function readingEmbeds(name, c, { who = "you" } = {}) {
  const g = GODS[name];
  const main = {
    title: `☥ Egyptian Zodiac · ${name}, ${g.title}`, color: GOLD,
    description: `*${g.kw.join(", ")}.* Your birthday falls in one of ${name}'s periods: **${rangeText(g.ranges)}**.`,
    fields: [
      { name: `📜 The myth`, value: g.myth },
      { name: `✨ ${name} in you`, value: g.about },
      { name: "🌑 Shadow", value: g.shadow },
      { name: "🤝 Kindred deities", value: `${g.allies.map((a) => `**${a}** (${GODS[a].title})`).join(" and ")}: their people tend to understand yours.` },
    ],
    image: { url: "attachment://egyptian.png" }, footer: FOOTER,
  };
  const cal = {
    title: `☥ The Egyptian calendar · ${c.day} ${c.name}`, color: TEAL,
    fields: [
      { name: `🌊 Season of ${c.season}`, value: `Ancient Egypt's year had three seasons of four 30-day months, plus five extra days. You were born in **${c.season}**, ${SEASONS[c.season]}.` },
      { name: `🗓️ ${c.name}`, value: `Your month is **${c.name}**, ${c.about}. This calendar is still used by the Coptic Church and Egyptian farmers today; its months carry the old Egyptian names.` },
      { name: "🔭 How the calendar worked", value: "Egypt's 365-day civil year had no leap day, so it slowly drifted against the seasons and only realigned every 1,460 years. The rising of Sirius before dawn marked the true new year and the coming flood. The Coptic calendar fixed the drift by adding a leap day, which is why your date stays put." },
    ],
    footer: FOOTER,
  };
  const end = {
    title: "⚖️ The weighing of the heart", color: GOLD,
    fields: [
      { name: "🪶 Ma'at", value: `Egyptians believed every heart would be weighed against the feather of Ma'at: truth, balance, right order. ${name}'s path to balance: ${g.kw[0]} without ${g.shadow.split(/[.:;]/)[0].toLowerCase()}.` },
      { name: "📖 About this reading", value: "The 'Egyptian zodiac' of twelve deity date ranges is a **modern reconstruction**, popular since the 20th century, not an ancient Egyptian system. The gods, myths and calendar here are genuinely ancient; the birthday assignments are not." },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, cal, end];
}

export async function run(o, ctx = {}) {
  if (!o.date) throw new Error("I need your birth date. Add it, or save it once with /profile set.");
  const b = parseBirth(o.date, "12:00");
  const name = godFor(b.month, b.day), c = coptic(b);
  const timed = !o.time_unknown && !!(o.time && String(o.time).trim());
  const moment = await optionalMoment(o, (known) => parseBirth(o.date, known ? o.time : "12:00"), ctx, geocode), reck = dayReckoning(moment);
  const extra = { moment, reck, detail: !!(o.private || ctx.birthDetail), timed };
  if (reck && reck.beforeSunrise) extra.alt = coptic(reck.fromSunrise);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const png = await cardPng({ title: "Egyptian Zodiac", subtitle: `${name} · reading for ${who}`, tag: "modern reconstruction · ancient gods and calendar", body: body(name, c),
    facts: [["Deity", name], ["Periods", rangeText(GODS[name].ranges)], ["Egyptian date", `${c.day} ${c.name}`], ["Season", c.season]] });
  const ins = analyse(name, c, b, who, extra);
  return { embeds: withInsight(readingEmbeds(name, c, { who }), ins), analysis: ins.analysis, files: [{ name: "egyptian.png", data: png }], ephemeral: !!o.private, reading: { god: name, coptic: c }, moment, headline: `${name}, ${GODS[name].title}` };
}
