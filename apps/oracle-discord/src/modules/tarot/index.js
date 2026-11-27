// /tarot: shuffle the 78-card deck, deal a spread, and read it. Any card can land reversed.
import { DECK, SUITS, SPREADS } from "./data.js";
import { cardPng, PAL, esc, para, GOLD, TEAL, FOOTER, cut, wrap } from "../../card.js";

export const command = {
  name: "tarot",
  description: "Shuffle the tarot, deal a spread and receive a Science is Magic reading",
  options: [
    { type: 3, name: "question", description: "What you want guidance on (optional)", max_length: 200 },
    { type: 3, name: "spread", description: "Which spread (default: past, present, future)", choices: Object.entries(SPREADS).map(([value, s]) => ({ name: s.name, value })) },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

function rng() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }

/** Shuffle (Fisher-Yates) and deal `count` cards; each lands reversed with probability 1/3. */
export function deal(count, rand = rng) {
  const deck = DECK.map((c) => c.id);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck.slice(0, count).map((id) => ({ card: DECK[id], rev: rand() < 1 / 3 }));
}

const SUIT_ICON = {
  wands: (c) => `<path d="M0 -26 V26" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M0 -26 l-8 -6 M0 -26 l8 -6 M0 -12 l9 -4" stroke="#7fd67a" stroke-width="3" stroke-linecap="round"/>`,
  cups: (c) => `<path d="M-18 -22 H18 C18 0 10 8 0 8 C-10 8 -18 0 -18 -22Z M0 8 V20 M-12 24 H12" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  swords: (c) => `<path d="M0 -28 L5 -18 V14 H-5 V-18Z" fill="${c}"/><path d="M-14 14 H14 M0 14 V28" stroke="${PAL.gold}" stroke-width="4" stroke-linecap="round"/>`,
  pentacles: (c) => `<circle r="22" fill="none" stroke="${c}" stroke-width="4"/><path d="${star(16)}" fill="none" stroke="${c}" stroke-width="2.5"/>`,
};
function star(r) { let p = ""; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 4 * Math.PI / 5; p += `${k ? "L" : "M"}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; } return p + "Z"; }

/** One card face, w x h at (x, y). Reversed cards are drawn upside down. */
function face(x, y, w, h, d, label, sub) {
  const c = d.card, s = SUITS.find((q) => q.key === c.suit), col = s ? s.col : PAL.light;
  const cx = w / 2, cy = h / 2;
  const nameLines = wrap(c.n.toUpperCase(), Math.max(8, Math.floor((w - 20) / 12)));
  const top = 50, bottom = h - 34 - nameLines.length * 20, mid = (top + bottom) / 2, span = bottom - top;
  let art;
  if (c.arcana === "major") {
    const r = Math.min(w * 0.3, span * 0.32);
    art = `<circle cx="${cx}" cy="${mid}" r="${r.toFixed(1)}" fill="url(#tc-sun)" opacity="0.9"/>
      ${Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<line x1="${(cx + Math.cos(a) * r * 1.15).toFixed(1)}" y1="${(mid + Math.sin(a) * r * 1.15).toFixed(1)}" x2="${(cx + Math.cos(a) * r * 1.4).toFixed(1)}" y2="${(mid + Math.sin(a) * r * 1.4).toFixed(1)}" stroke="${PAL.gold}" stroke-width="${w < 140 ? 2 : 3}" stroke-linecap="round"/>`; }).join("")}
      <text x="${cx}" y="${(mid + r * 0.3).toFixed(1)}" font-family="Cinzel" font-weight="900" font-size="${(r * (c.num.length > 3 ? 0.62 : 0.85)).toFixed(1)}" fill="${PAL.ink}" text-anchor="middle">${esc(c.num)}</text>`;
  } else if (/^\d+$/.test(c.num)) {
    const n = +c.num, cols = n <= 3 ? 1 : 2, rows = Math.ceil(n / cols), step = span / rows;
    const sc = Math.min(n === 1 ? 1.6 : 1, (step * 0.9) / 60, (w * (cols === 1 ? 0.7 : 0.38)) / 50);
    art = Array.from({ length: n }, (_, k) => { const cc = cols === 1 ? 0 : (k % 2 ? 1 : -1), row = cols === 1 ? k : Math.floor(k / 2);
      const px = cx + cc * w * 0.2, py = top + step * (row + 0.5);
      return `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${sc.toFixed(2)})">${SUIT_ICON[c.suit](col)}</g>`; }).join("");
  } else {
    const sc = Math.min(1.3, (span * 0.55) / 60);
    art = `<g transform="translate(${cx} ${(top + span * 0.36).toFixed(1)}) scale(${sc.toFixed(2)})">${SUIT_ICON[c.suit](col)}</g>
      <text x="${cx}" y="${(top + span * 0.92).toFixed(1)}" font-family="Cinzel" font-weight="900" font-size="${(w * 0.18).toFixed(1)}" fill="${PAL.light}" text-anchor="middle">${esc(c.rank.toUpperCase())}</text>`;
  }
  return `<g transform="translate(${x} ${y})">
    <rect x="6" y="${h - 4}" width="${w - 12}" height="16" rx="8" fill="#000" fill-opacity="0.35" filter="url(#soft)"/>
    <g transform="${d.rev ? `rotate(180 ${cx} ${cy})` : ""}">
      <rect width="${w}" height="${h}" rx="14" fill="url(#tc-face)" stroke="${PAL.gold}" stroke-width="3"/>
      <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="9" fill="none" stroke="${PAL.gold}" stroke-opacity="0.55" stroke-width="1.5"/>
      ${c.arcana === "major" ? "" : `<text x="${cx}" y="${w < 140 ? 30 : 38}" font-family="Cinzel" font-weight="700" font-size="${w < 140 ? 15 : 20}" fill="${PAL.gold}" text-anchor="middle">${esc(c.num)}</text>`}
      ${art}
      ${nameLines.map((l, i) => `<text x="${cx}" y="${h - 26 - (nameLines.length - 1 - i) * 20}" font-family="Cinzel" font-weight="700" font-size="${Math.min(w < 140 ? 13 : 18, (w - 20) / (l.length * 0.72)).toFixed(1)}" fill="${PAL.light}" text-anchor="middle">${esc(l)}</text>`).join("")}
    </g>
    <text x="${cx}" y="-14" font-size="${w < 140 ? 12 : 16}" letter-spacing="${w < 140 ? 1 : 2}" fill="${PAL.teal}" text-anchor="middle">${esc(label.toUpperCase())}${w < 140 && d.rev ? " ℞" : ""}</text>
    ${w < 140 ? "" : d.rev ? `<text x="${cx}" y="${h + 30}" font-size="16" fill="${PAL.teal}" text-anchor="middle">reversed</text>` : `<text x="${cx}" y="${h + 30}" font-size="15" fill="${PAL.mute}" text-anchor="middle">${esc(c.kw[0])}</text>`}
    ${sub ? `<text x="${cx}" y="-10" font-size="13" fill="${PAL.mute}" text-anchor="middle">${esc(sub)}</text>` : ""}
  </g>`;
}

function layout(n) {
  if (n === 1) return { w: 250, pos: [[635, 0]] };
  if (n === 3) return { w: 230, pos: [[300, 0], [645, 0], [990, 0]] };
  if (n === 5) return { w: 200, pos: [0, 1, 2, 3, 4].map((k) => [85 + k * 290, 0]) };
  // Celtic cross: the cross on the left, the staff of four on the right.
  return { w: 100, small: true, pos: [[480, 290], [600, 290], [540, 515], [330, 290], [540, 65], [750, 290], [1080, 625], [1080, 420], [1080, 215], [1080, 10]] };
}

function body(cast, spread, question) {
  const W = 1520, L = layout(cast.length), w = L.w, h = Math.round(w * 1.66);
  let s = `<ellipse cx="${W / 2}" cy="380" rx="720" ry="330" fill="url(#halo)"/>`;
  if (question) s += `<text x="${W / 2}" y="14" font-size="22" fill="${PAL.mute}" font-style="italic" text-anchor="middle">“${esc(question.length > 90 ? question.slice(0, 88) + "…" : question)}”</text>`;
  const off = 60;
  cast.forEach((d, k) => { const [x, y] = L.pos[k], [label] = spread.positions[k];
    s += face(x - (cast.length === 1 ? 0 : 0), y + off, w, h, d, L.small ? `${k + 1}. ${label}` : label, ""); });
  return s;
}

export function readingEmbeds(cast, key, question, { who = "you" } = {}) {
  const sp = SPREADS[key];
  const fields = cast.map((d, k) => { const [label, about] = sp.positions[k], c = d.card;
    return { name: `${k + 1}. ${label}: ${c.n}${d.rev ? " · reversed" : ""}`, value: cut(`*${about}* · ${c.kw.join(", ")}\n${d.rev ? c.rv : c.up}`) }; });
  const main = {
    title: `🃏 Tarot · ${sp.name.split(":")[0]}: ${cast.map((d) => d.card.n + (d.rev ? " ℞" : "")).join(" · ")}`.slice(0, 250), color: GOLD,
    description: question ? `**Question:** ${cut(question, 200)}` : "*An open reading.*",
    fields: fields.slice(0, 25), image: { url: "attachment://tarot.png" }, footer: FOOTER,
  };
  const majors = cast.filter((d) => d.card.arcana === "major").length, revs = cast.filter((d) => d.rev).length;
  const suitCount = Object.fromEntries(SUITS.map((s) => [s.key, cast.filter((d) => d.card.suit === s.key).length]));
  const top = SUITS.slice().sort((a, b) => suitCount[b.key] - suitCount[a.key])[0];
  const last = cast[cast.length - 1];
  const weight = majors === 0 ? "No Major Arcana: this is everyday business, fully in your hands." : majors >= Math.ceil(cast.length / 2) ? `${majors} Major Arcana: big forces and life lessons are in play. Go with the current.` : `${majors} Major Arcana: one or two big themes, with plenty you can steer.`;
  const suit = suitCount[top.key] >= 2 ? `${top.n} lead (${top.el}): the reading is mostly about ${top.theme}.` : "No suit dominates: the question touches every part of life.";
  const rev = revs === 0 ? "Every card upright: energy flows freely." : revs === cast.length ? "Every card reversed: something is blocked or turned inward. Start there." : `${revs} of ${cast.length} reversed: those are the places to slow down and look inside.`;
  const synth = {
    title: "🃏 Reading the spread", color: TEAL,
    fields: [
      { name: "⚖️ Balance", value: `${weight}\n${suit}\n${rev}` },
      { name: "🔮 Core message", value: cut(cast.length === 1 ? `${last.card.n} is the whole answer: ${last.card.kw[0]}. ${last.rev ? "Reversed, it asks what's in the way." : "Lean into it."}` : `From **${cast[0].card.n}** (${cast[0].card.kw[0]}) to **${last.card.n}** (${last.card.kw[0]}). ${last.rev ? "The last card is reversed: the outcome is still soft clay. Change the middle and the ending changes." : `The last card is upright: keep going as you are and ${last.card.kw[0]} is where this lands.`}`) },
      { name: "🧪 Your experiment", value: `Put **${last.card.n}** somewhere you'll see it this week (a sketch, a phone wallpaper, a sticky note). Each time ${last.card.kw[0]} shows up in your day, jot it down. Seven days, then compare notes with the cards.` },
      { name: "📖 About tarot", value: "Tarot cards began as a 15th-century Italian card game (tarocchi). They were tied to divination in 18th-century France, and the 1909 Rider-Waite-Smith deck shaped most modern meanings. These readings are original to Science is Magic." },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, synth];
}

export async function run(o = {}, ctx = {}) {
  const key = SPREADS[o.spread] ? o.spread : "three", question = (o.question || "").trim();
  const cast = deal(SPREADS[key].positions.length, ctx.rand);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const defs = `<linearGradient id="tc-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2690"/><stop offset="1" stop-color="#1a1240"/></linearGradient>
    <radialGradient id="tc-sun" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="#FFF1B8"/><stop offset="0.7" stop-color="${PAL.gold}"/><stop offset="1" stop-color="#b07a20"/></radialGradient>`;
  const png = await cardPng({ title: "Tarot", subtitle: `${SPREADS[key].name} · dealt for ${who}`, tag: "78 cards · upright and reversed", body: body(cast, SPREADS[key], question), defs, H: key === "celtic" ? 1060 : key === "one" ? 760 : 720 });
  return { embeds: readingEmbeds(cast, key, question, { who }), files: [{ name: "tarot.png", data: png }], ephemeral: !!o.private,
    reading: { spread: key, cards: cast.map((d) => ({ name: d.card.n, reversed: d.rev })) }, headline: cast.map((d) => d.card.n + (d.rev ? " (reversed)" : "")).join(", ") };
}
