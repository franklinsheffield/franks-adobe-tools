// /numerology: Pythagorean core numbers from birth name + birth date, with a Science is Magic reading.
import { parseBirth } from "../../birthplace.js";
import { numerology } from "./calc.js";
import { N, POSITIONS, PERSONAL_YEAR, PERSONAL_MONTH, CHALLENGE, KARMIC_TEXT, BIRTHDAY } from "./text.js";
import { analyse } from "./insight.js";
import { withInsight } from "../../insight.js";
import { cardPng, PAL, esc, para, fit, GOLD, TEAL, FOOTER, cut, MONTHS } from "../../card.js";

export const command = {
  name: "numerology",
  description: "Your core numbers from birth name and date (Pythagorean), with a Science is Magic reading",
  options: [
    { type: 3, name: "name", description: "Full birth name as on your birth certificate (uses /profile if left out)", max_length: 100 },
    { type: 3, name: "date", description: "Birth date as year-month-day (uses /profile if left out)", min_length: 8, max_length: 10 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
    { type: 5, name: "show_name", description: "Print your name and its letter values on the card (default: hidden)" },
  ],
};

const fmt = (n) => (N[n].master ? `${n} (master)` : String(n));
const label = (r) => (r.karmic ? `${r.karmic}/${r.value}` : fmt(r.value));

function body(r, showName) {
  const lp = r.lifePath.value, t = N[lp];
  let s = `<circle cx="330" cy="330" r="300" fill="url(#halo)"/>
  <circle cx="330" cy="330" r="220" fill="none" stroke="${PAL.gold}" stroke-width="3" filter="url(#glow)"/>
  <circle cx="330" cy="330" r="236" fill="none" stroke="${PAL.gold}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 8"/>`;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, x = 330 + Math.cos(a) * 262, y = 330 + Math.sin(a) * 262; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 ? 3 : 6}" fill="${i % 3 ? PAL.teal : PAL.gold}"/>`; }
  s += `<text x="330" y="232" font-size="20" letter-spacing="5" fill="${PAL.teal}" text-anchor="middle">LIFE PATH</text>
  <text x="330" y="${lp > 9 ? 400 : 410}" font-family="Cinzel" font-weight="900" font-size="${lp > 9 ? 190 : 230}" fill="url(#goldfill)" text-anchor="middle" filter="url(#glow)">${lp}</text>
  <text x="330" y="462" font-family="Cinzel" font-weight="900" font-size="30" fill="${PAL.light}" text-anchor="middle">${esc(t.name.toUpperCase())}</text>
  <text x="330" y="650" font-size="20" fill="${PAL.mute}" text-anchor="middle">${esc(t.kw.join(" · "))}</text>`;
  const tiles = [["Expression", r.expression], ["Soul Urge", r.soulUrge], ["Personality", r.personality], ["Birthday", { value: r.birthday.value }]];
  tiles.forEach(([k, v], i) => {
    const x = 700 + (i % 2) * 400, y = 10 + Math.floor(i / 2) * 230, n = v.value, arche = N[n] ? N[n].name : N[r.birthday.reduced].name;
    s += `<rect x="${x}" y="${y}" width="370" height="200" rx="18" fill="${PAL.ink}" fill-opacity="0.55" stroke="${PAL.gold}" stroke-opacity="0.5"/>
    <text x="${x + 28}" y="${y + 42}" font-size="17" letter-spacing="3" fill="${PAL.teal}">${k.toUpperCase()}</text>
    <text x="${x + 28}" y="${y + 150}" font-family="Cinzel" font-weight="900" font-size="104" fill="${PAL.light}">${n}</text>
    <text x="${x + 345}" y="${y + 120}" font-size="${fit(arche, 20, n > 9 ? 150 : 230, 0.55)}" fill="${PAL.text}" text-anchor="end">${esc(arche)}</text>
    ${v.karmic ? `<text x="${x + 345}" y="${y + 150}" font-size="16" fill="${PAL.teal}" text-anchor="end">karmic ${v.karmic}</text>` : ""}`;
  });
  // pinnacle timeline
  const y0 = 500, x0 = 700, w = 770, ends = r.pinnacles.map((p) => (p.to == null ? Math.max(p.from + 20, r.age + 8) : p.to));
  const span = Math.min(100, ends[3]);
  s += `<text x="${x0}" y="${y0 - 14}" font-size="17" letter-spacing="3" fill="${PAL.teal}">PINNACLES · AGE ${r.age}</text>`;
  r.pinnacles.forEach((p, i) => {
    const a = x0 + (p.from / span) * w, b = x0 + ((i < 3 ? p.to + 1 : ends[3]) / span) * w, cur = p === r.current;
    s += `<rect x="${a + 2}" y="${y0}" width="${b - a - 4}" height="56" rx="10" fill="${cur ? PAL.gold : PAL.ink}" fill-opacity="${cur ? 0.9 : 0.6}" stroke="${PAL.gold}" stroke-opacity="0.6"/>
    <text x="${(a + b) / 2}" y="${y0 + 37}" font-family="Cinzel" font-weight="900" font-size="26" fill="${cur ? PAL.ink : PAL.light}" text-anchor="middle">${p.pinnacle}</text>
    <text x="${a + 4}" y="${y0 + 80}" font-size="15" fill="${PAL.mute}">${p.from}</text>`;
  });
  const ax = x0 + Math.min(1, Math.max(0, r.age) / span) * w;
  s += `<path d="M${ax},${y0 - 6} l-8,-12 h16 z" fill="${PAL.teal}"/>`;
  if (showName) {
    let x = 700, y = 625; const cell = 34;
    s += `<text x="700" y="${y - 16}" font-size="17" letter-spacing="3" fill="${PAL.teal}">NAME · <tspan fill="${PAL.gold}">vowels gold</tspan> · consonants violet</text>`;
    for (const word of r.letters) {
      if (x + word.length * cell > 1500) { x = 700; y += 60; }
      for (const l of word) {
        s += `<rect x="${x}" y="${y}" width="${cell - 4}" height="52" rx="6" fill="${l.vowel ? PAL.gold : PAL.dim}" fill-opacity="${l.vowel ? 0.9 : 0.7}"/>
        <text x="${x + 15}" y="${y + 24}" font-size="20" font-weight="700" fill="${l.vowel ? PAL.ink : PAL.light}" text-anchor="middle">${l.ch}</text>
        <text x="${x + 15}" y="${y + 45}" font-size="15" fill="${l.vowel ? PAL.ink : PAL.teal}" text-anchor="middle">${l.v}</text>`;
        x += cell;
      }
      x += 24;
    }
  } else {
    s += para(700, 640, `“${t.lp.split(". ")[0]}.”`, { n: 66, size: 22, fill: PAL.text, style: 'font-style="italic"', max: 3 });
  }
  return s;
}

export function readingEmbeds(r, { who = "you" } = {}) {
  const pos = (k) => {
    const P = POSITIONS[k], v = r[k], t = N[v.value];
    return { name: `${P.emoji} ${P.title} · ${label(v)} ${t.name}`, value: cut(`*${P.about} From ${P.from}.*\n${t[P.key]}${v.karmic ? "\n" + KARMIC_TEXT[v.karmic] : ""}`) };
  };
  const lp = N[r.lifePath.value];
  const main = {
    title: `🔢 Numerology · Life Path ${label(r.lifePath)}`, color: GOLD,
    description: `*${lp.name}: ${lp.kw.join(", ")}.*`,
    fields: [pos("lifePath"), pos("expression"), pos("soulUrge"), pos("personality"),
      { name: `🎂 Birthday · ${r.birthday.value}`, value: `Born on the ${ord(r.birthday.value)}: ${BIRTHDAY[r.birthday.value]}. Tradition reads the birth day as a talent that stays available whatever the path.` }],
    image: { url: "attachment://numerology.png" }, footer: FOOTER,
  };
  const cur = r.current;
  const blend = blendLine(r);
  const timing = {
    title: `⏳ Timing · Personal Year ${r.personalYear.value}`, color: TEAL,
    fields: [
      { name: `📅 ${r.personalYear.year}: Personal Year ${r.personalYear.value}`, value: `${PERSONAL_YEAR[r.personalYear.value]}\nThis month (Personal Month ${r.personalMonth}): ${PERSONAL_MONTH[r.personalMonth]}.` },
      { name: `⛰️ Pinnacle ${cur.n} of 4 · ${cur.pinnacle}${cur.to != null ? ` (age ${cur.from} to ${cur.to})` : ` (age ${cur.from} on)`}`, value: `${cap(N[cur.pinnacle].pin)}.\n**Challenge ${cur.challenge}:** ${CHALLENGE[cur.challenge]}.` },
      { name: "🧩 All four pinnacles", value: r.pinnacles.map((p) => `${p === cur ? "▶" : "·"} **${p.pinnacle}** (age ${p.from}${p.to != null ? `–${p.to}` : "+"}): ${N[p.pinnacle].pin}`).join("\n") },
      { name: `🌱 Maturity number · ${r.maturity}`, value: `What grows stronger after about 40: ${N[r.maturity].gift}. ${N[r.maturity].name} energy ripens late and steadies everything else.` },
    ],
    footer: FOOTER,
  };
  const synthesis = {
    title: "⚗️ Putting it together", color: GOLD,
    fields: [
      { name: "🔬 Core blend", value: cut(blend) },
      { name: "✨ Gifts", value: [...new Set([r.lifePath, r.expression, r.soulUrge].map((v) => N[v.value].gift))].map((g) => `• ${g}`).join("\n") },
      { name: "🌑 Shadow side", value: [...new Set([r.lifePath, r.expression, r.soulUrge].map((v) => N[v.value].shadow))].map((g) => `• ${g}`).join("\n") },
    ],
    footer: { text: `${FOOTER.text} · Pythagorean system · reading for ${who}` },
  };
  return [main, timing, synthesis];
}
const ord = (n) => n + ((n % 100 > 10 && n % 100 < 14) ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function blendLine(r) {
  const lp = r.lifePath.value, ex = r.expression.value, su = r.soulUrge.value;
  const base = (n) => (n > 9 ? [2, 4, 6][[11, 22, 33].indexOf(n)] : n);
  if (lp === ex && ex === su) return `Life Path, Expression and Soul Urge all say **${lp}**. That's rare: what you want, how you work and where you're headed point the same way. The risk tradition names is too much of one note; Personality ${r.personality.value} is where the contrast sits.`;
  const nm = (n) => N[n].name.replace(/^The /, "");
  const parts = [`You walk a **${nm(lp)}** road (${lp}) with the tools of the **${nm(ex)}** (${ex}), driven by a **${nm(su)}** heart (${su}).`];
  const odd = (n) => base(n) % 2 === 1;
  if (odd(lp) === odd(ex)) parts.push("Your path and your tools pull in the same direction, so progress comes naturally once you commit.");
  else parts.push(`Your path and your tools speak different languages (${odd(lp) ? "action and ideas" : "care and structure"} vs ${odd(ex) ? "action and ideas" : "care and structure"}). Tradition reads that friction as creative, each side checking the other.`);
  if ([r.lifePath, r.expression, r.soulUrge, r.personality].some((v) => N[v.value].master)) parts.push("A master number in your chart is read as raising both the ceiling and the voltage.");
  return parts.join(" ");
}

/** Discord options -> { embeds, files, ephemeral }. */
export async function run(o, ctx = {}) {
  if (!o.date || !o.name) throw new Error("I need your full birth name and birth date. Add them, or save them once with /profile set.");
  const b = parseBirth(o.date, "12:00");
  const r = numerology(o.name, b, ctx.now || new Date());
  const who = ctx.user ? `@${ctx.user}` : "you";
  const subtitle = o.show_name ? `${o.name} · ${b.day} ${MONTHS[b.month - 1]} ${b.year}` : `Personal numbers for ${who}`;
  const png = await cardPng({ title: "Numerology", subtitle, tag: "Pythagorean · masters 11 22 33 kept", body: body(r, !!o.show_name), H: 1000,
    facts: [["Personal year", `${r.personalYear.value} · ${r.personalYear.year}`], ["Personal month", r.personalMonth], ["Pinnacle", `${r.current.pinnacle} · age ${r.current.from}${r.current.to != null ? "–" + r.current.to : "+"}`], ["Maturity", r.maturity]] });
  const ins = analyse(r, !!o.show_name, who);
  return { embeds: withInsight(readingEmbeds(r, { who }), ins), analysis: ins.analysis, files: [{ name: "numerology.png", data: png }], ephemeral: !!o.private, reading: r,
    headline: `Life Path ${label(r.lifePath)} · ${N[r.lifePath.value].name}` };
}
