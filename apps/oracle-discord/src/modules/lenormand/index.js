// /lenormand: shuffle the 36-card Lenormand and read it the traditional way, in pairs and lines (no reversals).
import { CARDS, SPREADS } from "./data.js";
import { cardPng, PAL, esc, GOLD, TEAL, FOOTER, cut, wrap } from "../../card.js";

export const command = {
  name: "lenormand",
  description: "Shuffle the 36-card Lenormand and read the cards in pairs",
  options: [
    { type: 3, name: "question", description: "What you want guidance on (optional)", max_length: 200 },
    { type: 3, name: "spread", description: "Which spread (default: three-card sentence)", choices: Object.entries(SPREADS).map(([value, s]) => ({ name: s.name, value })) },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

function rng() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }

/** Shuffle (Fisher-Yates) and deal `count` cards. Lenormand cards are never reversed. */
export function deal(count, rand = rng) {
  const deck = CARDS.map((c) => c.id);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck.slice(0, count).map((id) => ({ card: CARDS[id] }));
}

const RED = "#c8324a";
export const SUIT_PATH = {
  h: "M0 8 C-14 -2 -12 -14 -5 -14 C-2 -14 0 -11 0 -9 C0 -11 2 -14 5 -14 C12 -14 14 -2 0 8Z",
  d: "M0 -14 L10 -2 L0 10 L-10 -2Z",
  s: "M0 -14 C-14 -2 -12 8 -5 8 C-2 8 -1 6 -1 5 L-3 12 H3 L1 5 C1 6 2 8 5 8 C12 8 14 -2 0 -14Z",
  c: "M0 -14 A5 5 0 1 1 0 -4 A5 5 0 1 1 5 4 A5 5 0 1 1 -5 4 A5 5 0 1 1 0 -4Z M-1 2 L-3 12 H3 L1 2Z",
};
const inset = (pc, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-17" y="-26" width="34" height="46" rx="4" fill="#fffaf0" stroke="#7a5a2a" stroke-width="1.2"/><text x="0" y="-6" font-family="Cinzel" font-weight="900" font-size="15" fill="${pc[1] === "h" || pc[1] === "d" ? RED : "#1a1430"}" text-anchor="middle">${pc[0]}</text><g transform="translate(0 8) scale(.62)"><path d="${SUIT_PATH[pc[1]]}" fill="${pc[1] === "h" || pc[1] === "d" ? RED : "#1a1430"}"/></g></g>`;

/** One Lenormand card face, w x h at (x, y): cream card, number medallion, playing-card inset, name. */
function face(x, y, w, h, d, label, k = 0) {
  const c = d.card, cx = w / 2, small = w < 140, r = w * 0.26;
  const tone = c.tone > 0 ? "#2f8a5a" : c.tone < 0 ? "#9a3a4a" : "#6a5a8a";
  const lines = wrap(c.n.toUpperCase(), Math.max(8, Math.floor((w - 20) / 12)));
  return `<g transform="translate(${x} ${y})"><g class="dk-card" style="--i:${k}">
    <rect x="6" y="${h - 4}" width="${w - 12}" height="16" rx="8" fill="#000" fill-opacity="0.35" filter="url(#soft)"/>
    <rect width="${w}" height="${h}" rx="12" fill="url(#ln-face)" stroke="${PAL.gold}" stroke-width="3"/>
    <rect x="9" y="9" width="${w - 18}" height="${h - 18}" rx="8" fill="none" stroke="#7a5a2a" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="2 4"/>
    <circle class="dk-medal" cx="${cx}" cy="${h * 0.42}" r="${r}" fill="${tone}" fill-opacity="0.16" stroke="${tone}" stroke-width="2"/>
    <text x="${cx}" y="${h * 0.42 + r * 0.32}" font-family="Cinzel" font-weight="900" font-size="${(r * 0.95).toFixed(1)}" fill="${tone}" text-anchor="middle">${c.num}</text>
    ${inset(c.pc, w - (small ? 20 : 30), small ? 30 : 42, small ? 0.62 : 0.95)}
    ${lines.map((l, i) => `<text x="${cx}" y="${h - 22 - (lines.length - 1 - i) * 20}" font-family="Cinzel" font-weight="700" font-size="${Math.min(small ? 14 : 19, (w - 20) / (l.length * 0.72)).toFixed(1)}" fill="#3a2410" text-anchor="middle">${esc(l)}</text>`).join("")}
    <text x="${cx}" y="-14" font-size="${small ? 12 : 16}" letter-spacing="${small ? 1 : 2}" fill="${PAL.teal}" text-anchor="middle">${esc(label.toUpperCase())}</text>
    ${small ? "" : `<text x="${cx}" y="${h + 30}" font-size="15" fill="${PAL.mute}" text-anchor="middle">${esc(c.kw[0])}</text>`}
  </g></g>`;
}

function layout(n) {
  if (n === 2) return { w: 240, pos: [[480, 0], [800, 0]] };
  if (n === 3) return { w: 230, pos: [[300, 0], [645, 0], [990, 0]] };
  return { w: 150, small: true, pos: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => [455 + (k % 3) * 210, 10 + Math.floor(k / 3) * 300]) };
}
function body(cast, spread, question) {
  const W = 1520, L = layout(cast.length), w = L.w, h = Math.round(w * 1.45);
  let s = `<ellipse cx="${W / 2}" cy="380" rx="720" ry="330" fill="url(#halo)"/>`;
  if (question) s += `<text x="${W / 2}" y="14" font-size="22" fill="${PAL.mute}" font-style="italic" text-anchor="middle">“${esc(question.length > 90 ? question.slice(0, 88) + "…" : question)}”</text>`;
  cast.forEach((d, k) => { const [x, y] = L.pos[k]; s += face(x, y + 60, w, h, d, L.small ? `${k + 1}` : spread.positions[k][0], k); });
  return s;
}

/** Read two cards as a phrase: the first is the subject, the second describes it. */
export const pairLine = (a, b) => `**${a.n} + ${b.n}:** ${a.noun} ${b.mod}.`;

export function readingEmbeds(cast, key, question, { who = "you" } = {}) {
  const sp = SPREADS[key], cards = cast.map((d) => d.card), tone = cards.reduce((t, c) => t + c.tone, 0);
  const fields = key === "square"
    ? [["Past", 0], ["Now", 3], ["Next", 6]].map(([row, i]) => ({ name: `${row}: ${cards[i].n} · ${cards[i + 1].n} · ${cards[i + 2].n}`, value: cut(`${pairLine(cards[i], cards[i + 1])}\n${pairLine(cards[i + 1], cards[i + 2])}`) }))
    : cast.map((d, k) => { const [label, about] = sp.positions[k], c = d.card; return { name: `${k + 1}. ${label}: ${c.n} (${c.num})`, value: cut(`*${about}* · ${c.kw.join(", ")}\n${c.up}`) }; });
  const main = {
    title: `🎴 Lenormand · ${sp.name.split(":")[0]}: ${cards.map((c) => c.n).join(" · ")}`.slice(0, 250), color: GOLD,
    description: question ? `**Question:** ${cut(question, 200)}` : "*An open reading.*",
    fields, image: { url: "attachment://lenormand.png" }, footer: FOOTER,
  };
  const core = key === "square" ? cards[4] : cards[key === "line" ? 1 : 0];
  const pairs = cards.slice(0, -1).map((c, i) => pairLine(c, cards[i + 1])).slice(0, key === "square" ? 0 : 2);
  const lean = tone >= 2 ? "Leaning **yes**: most of these cards are kind." : tone <= -2 ? "Leaning **not yet**: there are hard cards here. Clear them first." : "**Mixed:** it depends on what you do next.";
  const synth = {
    title: "🎴 Reading the cards together", color: TEAL,
    fields: [
      { name: "🔑 The core", value: cut(`**${core.n}** is the centre of it: ${core.up}${key === "square" ? `\nAround it: ${pairLine(cards[3], cards[4])} ${pairLine(cards[4], cards[5])} ${pairLine(cards[1], cards[4])} ${pairLine(cards[4], cards[7])}` : ""}`) },
      ...(pairs.length ? [{ name: "🔗 Pairs", value: cut(pairs.join("\n")) }] : []),
      { name: "⚖️ Overall", value: lean },
      { name: "📖 About Lenormand", value: "The Petit Lenormand began as a 36-card parlour game sold in the 1800s under the name of Marie Anne Lenormand, a famous Paris fortune teller who died in 1843. Its cards are read in pairs, like words in a sentence. These readings are for reflection and fun, not prediction." },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, synth];
}

export async function run(o = {}, ctx = {}) {
  const key = SPREADS[o.spread] ? o.spread : "line", question = (o.question || "").trim();
  const cast = deal(SPREADS[key].positions.length, ctx.rand);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const defs = `<linearGradient id="ln-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf1da"/><stop offset="1" stop-color="#e9d6ae"/></linearGradient>`;
  const png = await cardPng({ title: "Lenormand", subtitle: `${SPREADS[key].name} · dealt for ${who}`, tag: "36 cards · read in pairs", body: body(cast, SPREADS[key], question), defs, H: key === "square" ? 1120 : 760 });
  return { embeds: readingEmbeds(cast, key, question, { who }), files: [{ name: "lenormand.png", data: png }], ephemeral: !!o.private,
    reading: { spread: key, cards: cast.map((d) => ({ name: d.card.n })) }, headline: cast.map((d) => d.card.n).join(", ") };
}
