// /celtic: Celtic tree sign and ogham letter (Graves' tree calendar, a modern reconstruction), plus your fire festival season.
import { parseBirth } from "../../birthplace.js";
import { TREES, NAMELESS, FESTIVALS } from "./data.js";
import { analyse } from "./insight.js";
import { withInsight } from "../../insight.js";
import { cardPng, PAL, esc, para, GOLD, TEAL, FOOTER, MONTHS } from "../../card.js";

export const command = {
  name: "celtic",
  description: "Your Celtic tree sign and ogham letter (a modern reconstruction) from your birth date",
  options: [
    { type: 3, name: "date", description: "Birth date as DD/MM/YYYY (uses your /profile if left out)", min_length: 8, max_length: 10 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

const doy = (m, d) => Math.round((Date.UTC(2024, m - 1, d) - Date.UTC(2024, 0, 1)) / 86400000); // leap reference year
/** Tree for a month/day. Returns a TREES entry or NAMELESS. */
export function treeFor(month, day) {
  if (month === 12 && day === 23) return NAMELESS;
  const t = doy(month, day);
  let best = TREES[0];
  for (const tr of TREES.slice(1)) if (t >= doy(...tr.start)) best = tr;
  if (month === 12 && day >= 24) best = TREES[0];
  if (t < doy(...TREES[1].start)) best = TREES[0];
  return best;
}
const endOf = (tr) => { const i = TREES.indexOf(tr), n = TREES[(i + 1) % 13]; const d = new Date(Date.UTC(2024, n.start[0] - 1, n.start[1] - 1)); return i === 12 ? [12, 22] : [d.getUTCMonth() + 1, d.getUTCDate()]; };
export const rangeOf = (tr) => (tr === NAMELESS ? "Dec 23" : `${MONTHS[tr.start[0] - 1]} ${tr.start[1]} – ${MONTHS[endOf(tr)[0] - 1]} ${endOf(tr)[1]}`);

/** The fire festival season you were born into: the last cross-quarter day on or before your birthday. */
export function festivalSeason(month, day) {
  const t = doy(month, day);
  let f = FESTIVALS[3];
  for (const x of FESTIVALS) if (t >= doy(...x.date)) f = x;
  return f;
}

function body(tr, today) {
  let s = `<circle cx="310" cy="300" r="290" fill="url(#halo)"/>
  <circle cx="310" cy="290" r="200" fill="none" stroke="${PAL.gold}" stroke-width="3" filter="url(#glow)"/>`;
  TREES.forEach((x, i) => {
    const a = (i / 13) * Math.PI * 2 - Math.PI / 2, px = 310 + Math.cos(a) * 232, py = 290 + Math.sin(a) * 232, on = x === tr;
    s += `<text x="${px.toFixed(1)}" y="${(py + 10).toFixed(1)}" font-size="${on ? 34 : 24}" fill="${on ? PAL.light : PAL.mute}" text-anchor="middle"${on ? ' filter="url(#glow)"' : ""}>${x.ogham}</text>`;
  });
  // the letter, written up a vertical stem as on standing stones
  s += `<g transform="translate(310,290) rotate(-90)"><text x="0" y="40" font-size="150" fill="url(#goldfill)" text-anchor="middle" filter="url(#glow)">${tr.ogham}</text></g>
  <text x="310" y="604" font-family="Cinzel" font-weight="900" font-size="${tr.tree.length > 10 ? 40 : 56}" fill="${PAL.light}" text-anchor="middle">${esc(tr.tree.toUpperCase())}</text>
  <text x="310" y="644" font-size="22" fill="${PAL.teal}" text-anchor="middle">ogham ${esc(tr.letter)} · ${esc(rangeOf(tr))}</text>`;
  s += `<text x="680" y="20" font-size="17" letter-spacing="3" fill="${PAL.teal}">THE THIRTEEN TREE MONTHS</text>`;
  TREES.forEach((x, i) => {
    const col = i % 7, row = Math.floor(i / 7), X = 680 + col * 118, Y = 40 + row * 150, on = x === tr, now = x === today;
    s += `<rect x="${X}" y="${Y}" width="106" height="134" rx="14" fill="${on ? PAL.gold : PAL.ink}" fill-opacity="${on ? 0.9 : 0.55}" stroke="${now ? PAL.teal : PAL.gold}" stroke-opacity="${now ? 1 : 0.45}" stroke-width="${now ? 3 : 1.5}"/>
    <text x="${X + 53}" y="${Y + 74}" font-size="44" fill="${on ? PAL.ink : PAL.light}" text-anchor="middle">${x.ogham}</text>
    <text x="${X + 53}" y="${Y + 108}" font-size="16" font-weight="${on ? 700 : 400}" fill="${on ? PAL.ink : PAL.mute}" text-anchor="middle">${x.tree}</text>`;
  });
  s += `<text x="${680 + 6 * 118 + 53}" y="${40 + 150 + 74}" font-size="15" fill="${PAL.teal}" text-anchor="middle">teal frame</text><text x="${680 + 6 * 118 + 53}" y="${40 + 150 + 96}" font-size="15" fill="${PAL.teal}" text-anchor="middle">= today</text>`;
  s += `<rect x="680" y="350" width="824" height="250" rx="18" fill="${PAL.ink}" fill-opacity="0.55" stroke="${PAL.gold}" stroke-opacity="0.45"/>
  <text x="710" y="388" font-size="16" letter-spacing="3" fill="${PAL.teal}">TREE LORE</text>
  ${para(710, 428, tr.lore + " " + tr.about, { n: 72, size: 19, fill: PAL.text, max: 7 })}`;
  return s;
}

export function readingEmbeds(tr, fest, today, { who = "you" } = {}) {
  const main = {
    title: `🌳 Celtic Tree · ${tr.tree} (${tr.ogham} ${tr.letter})`, color: GOLD,
    description: `*${tr.kw.join(", ")}.* Your tree month: **${rangeOf(tr)}**.`,
    fields: [
      { name: "🍃 Tree lore", value: tr.lore },
      { name: `✨ ${tr.tree} in you`, value: tr.about },
      { name: "🌑 Shadow", value: tr.shadow },
      { name: `᚛ Your ogham letter · ${tr.letter} ${tr.ogham}`, value: `Ogham was early medieval Ireland's alphabet, cut as notches along the edge of a stone or stave and read from the bottom up. Each letter was named after a tree or plant, which is where this calendar takes its trees.` },
    ],
    image: { url: "attachment://celtic.png" }, footer: FOOTER,
  };
  const season = {
    title: `🔥 Your fire festival · ${fest.name}`, color: TEAL,
    fields: [
      { name: `Born in the season of ${fest.name}`, value: `The Celtic year turned on four fire festivals. You were born in the quarter that opens with **${fest.name}** (${MONTHS[fest.date[0] - 1]} ${fest.date[1]}): ${fest.about}. ${{ Imbolc: "Your season is about first light: hope, inspiration, quiet beginnings.", Beltane: "Your season is about growth in full bloom: passion, vitality, union.", Lughnasadh: "Your season is about the harvest: skill, reward and gratitude.", Samhain: "Your season is about the dark half: depth, ancestors, endings that make room." }[fest.name]}` },
      { name: `🌲 The tree month now: ${today.tree} ${today.ogham}`, value: today === tr ? "We're in your own tree month right now." : `${today.tree} time is associated with ${today.kw.join(", ")}.` },
      { name: "📖 About this reading", value: "The Celtic tree calendar is a **modern reconstruction**: Robert Graves built it in *The White Goddess* (1948) from medieval Irish ogham lore. The ogham alphabet and the tree lore are genuinely old; the birthday months are not attested in ancient sources." },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, season];
}

export async function run(o, ctx = {}) {
  if (!o.date) throw new Error("I need your birth date. Add it, or save it once with /profile set.");
  const b = parseBirth(o.date, "12:00");
  const tr = treeFor(b.month, b.day), fest = festivalSeason(b.month, b.day);
  const n = ctx.now || new Date(), tdy = treeFor(n.getUTCMonth() + 1, n.getUTCDate());
  const today = tdy === NAMELESS ? TREES[0] : tdy;
  const who = ctx.user ? `@${ctx.user}` : "you";
  const png = await cardPng({ title: "Celtic Tree Sign", subtitle: `${tr.tree} · reading for ${who}`, tag: "Graves' tree calendar · modern reconstruction", body: body(tr, today),
    facts: [["Tree", tr.tree], ["Ogham", `${tr.letter}`], ["Tree month", rangeOf(tr)], ["Fire festival", fest.name]] });
  const ins = analyse(tr, fest, today, b, who);
  return { embeds: withInsight(readingEmbeds(tr, fest, today, { who }), ins), analysis: ins.analysis, files: [{ name: "celtic.png", data: png }], ephemeral: !!o.private, reading: { tree: tr.tree, ogham: tr.letter, festival: fest.name }, headline: `${tr.tree} (${tr.letter})` };
}
