// /magicdeck: the Science is Magic deck. 44 original cards, each a reflection plus a real science fact.
import { DECK, SUITS, SPREADS } from "./data.js";
import { cardPng, PAL, esc, GOLD, TEAL, FOOTER, cut, wrap } from "../../card.js";

export const command = {
  name: "magicdeck",
  description: "Draw from the Science is Magic deck: 44 cards, each with a real science fact",
  options: [
    { type: 3, name: "question", description: "What you want guidance on (optional)", max_length: 200 },
    { type: 3, name: "spread", description: "Which spread (default: hypothesis, test, result)", choices: Object.entries(SPREADS).map(([value, s]) => ({ name: s.name, value })) },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

function rng() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }

/** Shuffle (Fisher-Yates) and deal `count` distinct cards. */
export function deal(count, rand = rng) {
  const deck = DECK.map((c) => c.id);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck.slice(0, count).map((id) => ({ card: DECK[id] }));
}

/** Suit emblems, drawn around (0, 0) at about 60 units across. */
export const EMBLEM = {
  atoms: (c) => `<g fill="none" stroke="${c}" stroke-width="3"><ellipse rx="28" ry="10"/><ellipse rx="28" ry="10" transform="rotate(60)"/><ellipse rx="28" ry="10" transform="rotate(-60)"/></g><circle r="5" fill="${c}"/>`,
  moons: (c) => `<path d="M4 -26 A26 26 0 0 0 4 26 A15 26 0 0 1 4 -26Z" fill="${c}"/><circle cx="16" cy="-12" r="2.2" fill="${c}"/><circle cx="22" cy="6" r="1.6" fill="${c}"/>`,
  potions: (c) => `<path d="M-6 -26 H6 V-10 L20 18 Q22 26 14 26 H-14 Q-22 26 -20 18 L-6 -10Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M-15 12 H15 L19 20 Q20 23 14 23 H-14 Q-20 23 -19 20Z" fill="${c}"/><circle cx="-3" cy="4" r="2.5" fill="${c}"/><circle cx="4" cy="-2" r="1.8" fill="${c}"/>`,
  stars: (c) => { let p = ""; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 11 : 27; p += `${k ? "L" : "M"}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; } return `<path d="${p}Z" fill="${c}"/>`; },
};

function face(x, y, w, h, d, label) {
  const c = d.card, s = SUITS.find((q) => q.key === c.suit), cx = w / 2, small = w < 160;
  const lines = wrap(c.n.toUpperCase(), Math.max(8, Math.floor((w - 20) / 12)));
  const sc = Math.min(1.9, w / 120), keeper = c.num === "K";
  return `<g transform="translate(${x} ${y})">
    <rect x="6" y="${h - 4}" width="${w - 12}" height="16" rx="8" fill="#000" fill-opacity="0.35" filter="url(#soft)"/>
    <rect width="${w}" height="${h}" rx="14" fill="url(#md-face)" stroke="${PAL.gold}" stroke-width="3"/>
    <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="9" fill="none" stroke="${s.col}" stroke-opacity="0.6" stroke-width="1.5"/>
    <text x="22" y="${small ? 34 : 42}" font-family="Cinzel" font-weight="900" font-size="${small ? 18 : 24}" fill="${s.col}">${keeper ? "✦" : c.num}</text>
    <circle cx="${cx}" cy="${h * 0.42}" r="${(w * 0.3).toFixed(1)}" fill="${s.col}" fill-opacity="0.1"/>
    <g transform="translate(${cx} ${(h * 0.42).toFixed(1)}) scale(${sc.toFixed(2)})">${EMBLEM[c.suit](s.col)}</g>
    ${keeper ? `<circle cx="${cx}" cy="${h * 0.42}" r="${(w * 0.36).toFixed(1)}" fill="none" stroke="${PAL.gold}" stroke-width="2" stroke-dasharray="3 5"/>` : ""}
    ${lines.map((l, i) => `<text x="${cx}" y="${h - 26 - (lines.length - 1 - i) * 20}" font-family="Cinzel" font-weight="700" font-size="${Math.min(small ? 14 : 18, (w - 20) / (l.length * 0.72)).toFixed(1)}" fill="${PAL.light}" text-anchor="middle">${esc(l)}</text>`).join("")}
    <text x="${cx}" y="-14" font-size="${small ? 13 : 16}" letter-spacing="2" fill="${PAL.teal}" text-anchor="middle">${esc(label.toUpperCase())}</text>
    <text x="${cx}" y="${h + 30}" font-size="15" fill="${PAL.mute}" text-anchor="middle">${esc(c.kw[0])}</text>
  </g>`;
}

function layout(n) {
  if (n === 1) return { w: 250, pos: [[635, 0]] };
  if (n === 3) return { w: 230, pos: [[300, 0], [645, 0], [990, 0]] };
  return { w: 200, pos: [0, 1, 2, 3, 4].map((k) => [85 + k * 290, 0]) };
}
function body(cast, spread, question) {
  const W = 1520, L = layout(cast.length), w = L.w, h = Math.round(w * 1.6);
  let s = `<ellipse cx="${W / 2}" cy="380" rx="720" ry="330" fill="url(#halo)"/>`;
  if (question) s += `<text x="${W / 2}" y="14" font-size="22" fill="${PAL.mute}" font-style="italic" text-anchor="middle">“${esc(question.length > 90 ? question.slice(0, 88) + "…" : question)}”</text>`;
  cast.forEach((d, k) => { const [x, y] = L.pos[k]; s += face(x, y + 60, w, h, d, spread.positions[k][0]); });
  return s;
}

export function readingEmbeds(cast, key, question, { who = "you" } = {}) {
  const sp = SPREADS[key], cards = cast.map((d) => d.card);
  const fields = cast.map((d, k) => { const [label, about] = sp.positions[k], c = d.card, s = SUITS.find((q) => q.key === c.suit);
    return { name: `${k + 1}. ${label}: ${c.n} (${s.n})`, value: cut(`*${about}* · ${c.kw.join(", ")}\n${c.up}\n🔬 ${c.fact}`) }; });
  const count = Object.fromEntries(SUITS.map((s) => [s.key, cards.filter((c) => c.suit === s.key).length]));
  const top = SUITS.slice().sort((a, b) => count[b.key] - count[a.key])[0], keepers = cards.filter((c) => c.num === "K").length;
  const last = cards[cards.length - 1];
  const main = {
    title: `✦ Science is Magic deck · ${sp.name.split(":")[0]}: ${cards.map((c) => c.n).join(" · ")}`.slice(0, 250), color: GOLD,
    description: question ? `**Question:** ${cut(question, 200)}` : "*An open reading.*",
    fields, image: { url: "attachment://magicdeck.png" }, footer: FOOTER,
  };
  const synth = {
    title: "✦ Lab notes", color: TEAL,
    fields: [
      { name: "⚖️ Balance", value: `${count[top.key] >= 2 ? `${top.n} lead: this is mostly about ${top.theme}.` : "No suit leads: every part of life has a say."}${keepers ? `\n${keepers} Keeper${keepers > 1 ? "s" : ""}: someone with real know-how is part of this.` : ""}` },
      { name: "🔮 Conclusion", value: cut(cards.length === 1 ? `${last.n}: ${last.up}` : `From **${cards[0].n}** (${cards[0].kw[0]}) to **${last.n}** (${last.kw[0]}). ${last.up}`) },
      { name: "🧪 Your experiment", value: `Test **${last.kw[0]}** for one week. Write down one thing a day that fits it, then compare notes with your hypothesis.` },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, synth];
}

export async function run(o = {}, ctx = {}) {
  const key = SPREADS[o.spread] ? o.spread : "three", question = (o.question || "").trim();
  const cast = deal(SPREADS[key].positions.length, ctx.rand);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const defs = `<linearGradient id="md-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241a5c"/><stop offset="1" stop-color="#0f0a26"/></linearGradient>`;
  const png = await cardPng({ title: "Science is Magic deck", subtitle: `${SPREADS[key].name} · dealt for ${who}`, tag: "44 cards · each with a real science fact", body: body(cast, SPREADS[key], question), defs, H: key === "one" ? 760 : 720 });
  return { embeds: readingEmbeds(cast, key, question, { who }), files: [{ name: "magicdeck.png", data: png }], ephemeral: !!o.private,
    reading: { spread: key, cards: cast.map((d) => ({ name: d.card.n })) }, headline: cast.map((d) => d.card.n).join(", ") };
}
