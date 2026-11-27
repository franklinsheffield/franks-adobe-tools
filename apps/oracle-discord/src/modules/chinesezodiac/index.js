// /chinesezodiac: animal, element and yin/yang by the real lunar new year, plus the four pillars (BaZi) from solar terms.
import { geocode, timeZoneAt, localToUtc, parseBirth } from "../../birthplace.js";
import { zodiacYear, fourPillars, elementBalance, ymd, STEMS, BRANCHES } from "./calendar.js";
import { ANIMALS, ELEMENTS, DAY_MASTER, TRINES, TRINE_NAMES, HARMONY, clashOf, trineOf, yearRelation } from "./text.js";
import { cardPng, PAL, esc, GOLD, TEAL, FOOTER, cut, MONTHS } from "../../card.js";

export const command = {
  name: "chinesezodiac",
  description: "Your Chinese zodiac animal, element and four pillars from the real lunar calendar",
  options: [
    { type: 3, name: "date", description: "Birth date as year-month-day (uses your /profile if left out)", min_length: 8, max_length: 10 },
    { type: 3, name: "time", description: "Birth time, local clock (for the hour pillar). Leave out if unknown", max_length: 8 },
    { type: 3, name: "place", description: "Birth town/city and country (for the time zone)", max_length: 100 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

const plain = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const yy = (s) => (s.yin ? "Yin" : "Yang");
const nice = (d) => { const [y, m, dd] = ymd(d).split("-").map(Number); return `${dd} ${MONTHS[m - 1]} ${y}`; };

function body(z, p, bal) {
  const a = z.branch.animal, el = z.stem.el, E = ELEMENTS[el];
  let s = `<circle cx="300" cy="290" r="280" fill="url(#halo)"/>
  <circle cx="300" cy="290" r="200" fill="none" stroke="${PAL.gold}" stroke-width="3" filter="url(#glow)"/>
  <circle cx="300" cy="290" r="214" fill="none" stroke="${E.colour}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="3 9"/>`;
  BRANCHES.forEach((b, i) => {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2, x = 300 + Math.cos(ang) * 246, y = 290 + Math.sin(ang) * 246, on = b.animal === a;
    s += `<text x="${x.toFixed(1)}" y="${(y + 10).toFixed(1)}" font-family="Noto Serif SC" font-weight="700" font-size="${on ? 34 : 24}" fill="${on ? PAL.light : PAL.mute}" fill-opacity="${on ? 1 : 0.7}" text-anchor="middle"${on ? ' filter="url(#glow)"' : ""}>${b.hz}</text>`;
  });
  s += `<text x="300" y="340" font-family="Noto Serif SC" font-weight="700" font-size="170" fill="url(#goldfill)" text-anchor="middle" filter="url(#glow)">${z.branch.hz}</text>
  <text x="300" y="410" font-family="Cinzel" font-weight="900" font-size="34" fill="${PAL.light}" text-anchor="middle">${esc(a.toUpperCase())}</text>
  <text x="300" y="444" font-size="19" fill="${E.colour}" text-anchor="middle">${yy(z.stem)} ${el} · ${z.stem.hz}${z.branch.hz} ${z.stem.py} ${z.branch.py}</text>`;
  // four pillars, read right to left: year, month, day, hour
  const cols = [["HOUR", p.hour], ["DAY", p.day], ["MONTH", p.month], ["YEAR", p.year]];
  cols.forEach(([k, c], i) => {
    const x = 680 + i * 205, dm = k === "DAY";
    s += `<rect x="${x}" y="0" width="185" height="520" rx="18" fill="${PAL.ink}" fill-opacity="${dm ? 0.75 : 0.55}" stroke="${dm ? PAL.light : PAL.gold}" stroke-opacity="${dm ? 0.9 : 0.45}" stroke-width="${dm ? 2.5 : 1.5}"/>
    <text x="${x + 92}" y="38" font-size="17" letter-spacing="4" fill="${PAL.teal}" text-anchor="middle">${k}</text>`;
    if (!c) { s += `<text x="${x + 92}" y="270" font-size="20" fill="${PAL.mute}" text-anchor="middle">time</text><text x="${x + 92}" y="296" font-size="20" fill="${PAL.mute}" text-anchor="middle">unknown</text>`; return; }
    const ce = ELEMENTS[c.stem.el].colour, be = ELEMENTS[c.branch.el].colour;
    s += `<text x="${x + 92}" y="160" font-family="Noto Serif SC" font-weight="700" font-size="104" fill="${ce}" text-anchor="middle">${c.stem.hz}</text>
    <text x="${x + 92}" y="198" font-size="18" fill="${PAL.text}" text-anchor="middle">${c.stem.py} · ${yy(c.stem)} ${c.stem.el}</text>
    <line x1="${x + 30}" y1="226" x2="${x + 155}" y2="226" stroke="${PAL.gold}" stroke-opacity="0.35"/>
    <text x="${x + 92}" y="352" font-family="Noto Serif SC" font-weight="700" font-size="104" fill="${be}" text-anchor="middle">${c.branch.hz}</text>
    <text x="${x + 92}" y="390" font-size="18" fill="${PAL.text}" text-anchor="middle">${c.branch.py} · ${c.branch.animal}</text>
    <text x="${x + 92}" y="416" font-size="16" fill="${PAL.mute}" text-anchor="middle">${c.branch.el}</text>
    ${dm ? `<text x="${x + 92}" y="490" font-size="15" letter-spacing="2" fill="${PAL.light}" text-anchor="middle">DAY MASTER</text>` : ""}`;
  });
  // element balance
  const max = Math.max(...Object.values(bal), 1);
  s += `<text x="40" y="600" font-size="17" letter-spacing="3" fill="${PAL.teal}">ELEMENT BALANCE</text>`;
  Object.entries(bal).forEach(([k, v], i) => {
    const x = 40 + i * 300, w = 230 * (v / max);
    s += `<text x="${x}" y="640" font-size="19" fill="${PAL.text}">${k} <tspan fill="${PAL.mute}">${v % 1 ? v.toFixed(1) : v}</tspan></text>
    <rect x="${x}" y="652" width="230" height="16" rx="8" fill="${PAL.ink}" fill-opacity="0.7"/>
    <rect x="${x}" y="652" width="${Math.max(6, w)}" height="16" rx="8" fill="${ELEMENTS[k].colour}"/>`;
  });
  return s;
}

/** Reading from local birth data. */
export function compute({ birth, utc, timeKnown, now = new Date() }) {
  const z = zodiacYear(birth);
  const p = fourPillars(utc, birth, timeKnown);
  const bal = elementBalance(p);
  const today = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() };
  const cur = zodiacYear(today);
  return { z, p, bal, cur };
}

export function readingEmbeds({ z, p, bal, cur }, { who = "you", timeKnown = true } = {}) {
  const a = z.branch.animal, A = ANIMALS[a], el = z.stem.el, E = ELEMENTS[el];
  const dm = p.day.stem, DM = ELEMENTS[dm.el];
  const sorted = Object.entries(bal).sort((x, y) => y[1] - x[1]);
  const weak = sorted.filter(([, v]) => v === 0).map(([k]) => k), low = weak.length ? weak : [sorted[4][0]];
  const lichunDiff = p.year.b !== z.b;
  const main = {
    title: `${A.emoji} Chinese Zodiac · ${yy(z.stem)} ${el} ${a}`, color: GOLD,
    description: `**${z.stem.hz}${z.branch.hz} ${z.stem.py} ${z.branch.py}**, year ${z.index + 1} of the 60-year cycle. Your lunar year began on **${nice(z.newYear)}** and ran to ${nice(new Date(z.nextNewYear.getTime() - 86400000))}.`,
    fields: [
      { name: `${A.emoji} The ${a} · ${A.kw.join(", ")}`, value: A.about },
      { name: `${E.emoji} ${el} year · ${yy(z.stem)}`, value: `${E.year} ${z.stem.yin ? "Yin years turn the energy inward: receptive, careful, deep." : "Yang years push the energy outward: active, direct, initiating."} The ${el} ${a} is a ${yy(z.stem).toLowerCase()} expression of ${E.kw}.` },
      { name: "✨ Gifts", value: A.gifts },
      { name: "🌑 Shadow", value: A.shadow },
      { name: "💞 In love", value: A.love },
      ...(lichunDiff ? [{ name: "⚠️ Two new years", value: `You were born between the solar new year (Lichun, start of spring) and the lunar new year. Popular astrology makes you a **${a}**; the four pillars, which use the solar year, count you as a **${p.year.branch.animal}**. Both are part of your chart.` }] : []),
    ],
    image: { url: "attachment://chinesezodiac.png" }, footer: FOOTER,
  };
  const pil = (k, c) => (c ? `**${k}:** ${c.stem.hz}${c.branch.hz} ${c.stem.py} ${c.branch.py} · ${yy(c.stem)} ${c.stem.el} ${c.branch.animal}` : `**${k}:** unknown (needs birth time)`);
  const pillars = {
    title: "🏛️ The four pillars (BaZi)", color: TEAL,
    description: [pil("Year", p.year), pil("Month", p.month), pil("Day", p.day), pil("Hour", p.hour)].join("\n"),
    fields: [
      { name: `${DM.emoji} Day Master · ${dm.hz} ${dm.py} ${yy(dm)} ${dm.el}`, value: cut(`The day stem is *you* in BaZi.\n${DAY_MASTER[p.day.s]}\n${DM.dm}`) },
      { name: "🐾 Your other animals", value: `**Inner animal (month): ${p.month.branch.animal}.** How you are in private and in love.\n**Secret animal (hour): ${p.hour ? p.hour.branch.animal : "unknown"}.** ${p.hour ? "Your truest self, the one few people meet." : "Add your birth time to find it."}\n**Day animal: ${p.day.branch.animal}.** The ground your Day Master stands on: your partnerships.` },
      { name: "⚖️ Element balance", value: `${sorted.map(([k, v]) => `${ELEMENTS[k].emoji} ${k} ${v % 1 ? v.toFixed(1) : v}`).join(" · ")}\nStrongest: **${sorted[0][0]}** (${ELEMENTS[sorted[0][0]].kw}). ${weak.length ? `Missing: **${weak.join(", ")}**.` : `Lightest: **${low[0]}**.`}\n${low.map((k) => ELEMENTS[k].lack).join(" ")}` },
      ...(!timeKnown ? [{ name: "⏱️ Birth time unknown", value: "The hour pillar is left out and the balance counts six characters, not eight. Your animal, element and Day Master don't depend on the time (unless you were born near 11 pm, when the traditional day changes)." }] : []),
    ],
    footer: FOOTER,
  };
  const t = trineOf(a), friends = TRINES[t].filter((x) => x !== a), rel = yearRelation(a, cur.branch.animal);
  const ties = {
    title: "🔗 Allies, friction and this year", color: GOLD,
    fields: [
      { name: `🤝 Your trine · ${TRINE_NAMES[t]}`, value: `${a}, ${friends.join(" and ")}. You share a rhythm with these signs and tend to understand each other without much explaining.` },
      { name: "🌙 Secret friend", value: `**${HARMONY[a]}**: the quiet ally. This pairing balances each other out, often across very different temperaments.` },
      { name: "⚡ Clash", value: `**${clashOf(a)}** sits opposite you on the wheel. Not a curse: it's the sign that challenges you most, and pushes you to grow.` },
      { name: `${ANIMALS[cur.branch.animal].emoji} ${cur.lunarYear}: ${yy(cur.stem)} ${cur.stem.el} ${cur.branch.animal} · ${rel.kind}`, value: rel.text },
      { name: "🧪 Your experiment", value: `For one lunar month, feed your lightest element (**${low[0]}**) once a day: ${ELEMENTS[low[0]].lack.replace(/^More \w+: /, "")} Notice whether your ${dm.el} Day Master feels steadier.` },
    ],
    footer: { text: `${FOOTER.text} · lunar dates computed in China Standard Time · reading for ${who}` },
  };
  return [main, pillars, ties];
}

export async function run(o, ctx = {}) {
  if (!o.date) throw new Error("I need your birth date. Add it, or save it once with /profile set.");
  const timeKnown = !o.time_unknown && !!(o.time && String(o.time).trim());
  const birth = parseBirth(o.date, timeKnown ? o.time : "12:00");
  let utc;
  if (o.place) {
    const where = ctx.geocoded || await geocode(o.place, ctx.fetch || fetch);
    if (!where) throw new Error(`Couldn't find "${o.place}". Try "City, Country".`);
    utc = localToUtc(birth, timeZoneAt(where.lat, where.lon));
  } else utc = new Date(Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour - 8, birth.minute)); // no place: assume China time
  const r = compute({ birth, utc, timeKnown, now: ctx.now || new Date() });
  const who = ctx.user ? `@${ctx.user}` : "you";
  const dm = r.p.day.stem;
  const png = await cardPng({ title: "Chinese Zodiac", subtitle: `${yy(r.z.stem)} ${r.z.stem.el} ${r.z.branch.animal} · reading for ${who}${timeKnown ? "" : " · birth time unknown"}`,
    tag: "lunar calendar + solar terms, real astronomy", body: body(r.z, r.p, r.bal),
    facts: [["Lunar new year", nice(r.z.newYear)], ["Day Master", `${plain(dm.py)} ${dm.el}`], ["Inner animal", r.p.month.branch.animal], ["This year", `${r.cur.stem.el} ${r.cur.branch.animal}`]] });
  return { embeds: readingEmbeds(r, { who, timeKnown }), files: [{ name: "chinesezodiac.png", data: png }], ephemeral: !!o.private, reading: r,
    headline: `${yy(r.z.stem)} ${r.z.stem.el} ${r.z.branch.animal} · ${dm.py} ${dm.el} Day Master` };
}
