// /runes: draw Elder Futhark runes from the bag into a spread. Reversible runes can land merkstave (upside down).
import { RUNES, SPREADS, AETTIR } from "./data.js";
import { cardPng, PAL, esc, para, GOLD, TEAL, FOOTER, cut } from "../../card.js";

export const command = {
  name: "runes",
  description: "Draw Elder Futhark runes from the bag and receive a Science is Magic reading",
  options: [
    { type: 3, name: "question", description: "What you want guidance on (optional)", max_length: 200 },
    { type: 3, name: "spread", description: "How many runes (default: the three Norns)", choices: [
      { name: "One rune: Odin's rune", value: "one" }, { name: "Three runes: the Norns (past, present, becoming)", value: "three" }, { name: "Five runes: the cross", value: "five" }] },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

function rng() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }

/** Draw `count` runes without replacement; reversible runes land merkstave half the time. */
export function draw(count, rand = rng) {
  const bag = RUNES.map((r, i) => i), out = [];
  for (let k = 0; k < count; k++) {
    const j = Math.floor(rand() * bag.length), i = bag.splice(j, 1)[0], r = RUNES[i];
    const merk = r.rev && rand() < 0.5;
    out.push({ i, rune: r, merk, aett: Math.floor(i / 8) });
  }
  return out;
}

function stone(x, y, w, h, d, label, sub) {
  const r = d.rune;
  return `<g>
    <ellipse cx="${x + w / 2}" cy="${y + h - 6}" rx="${w * 0.46}" ry="16" fill="#000" fill-opacity="0.35" filter="url(#soft)"/>
    <path d="M${x + w * 0.12},${y + h * 0.18} Q${x + w * 0.5},${y - 14} ${x + w * 0.88},${y + h * 0.16} Q${x + w + 10},${y + h * 0.55} ${x + w * 0.84},${y + h * 0.9} Q${x + w * 0.5},${y + h + 14} ${x + w * 0.16},${y + h * 0.88} Q${x - 12},${y + h * 0.5} ${x + w * 0.12},${y + h * 0.18} Z" fill="url(#stone)" stroke="${PAL.gold}" stroke-opacity="0.6" stroke-width="2"/>
    <g transform="translate(${x + w / 2},${y + h / 2})${d.merk ? " rotate(180)" : ""}"><text x="0" y="${h * 0.2}" font-family="Noto Sans Runic" font-size="${h * 0.58}" fill="${d.merk ? PAL.teal : PAL.light}" text-anchor="middle" filter="url(#glow)">${r.ch}</text></g>
    <text x="${x + w / 2}" y="${y + h + 46}" font-family="Cinzel" font-weight="900" font-size="28" fill="${PAL.light}" text-anchor="middle">${esc(r.n.toUpperCase())}</text>
    <text x="${x + w / 2}" y="${y + h + 74}" font-size="17" fill="${d.merk ? PAL.teal : PAL.mute}" text-anchor="middle">${esc(d.merk ? "merkstave" : r.gloss)}</text>
    <text x="${x + w / 2}" y="${y - 26}" font-size="16" letter-spacing="2" fill="${PAL.teal}" text-anchor="middle">${esc(label.toUpperCase())}</text>
    ${sub ? `<text x="${x + w / 2}" y="${y - 6}" font-size="14" fill="${PAL.mute}" text-anchor="middle">${esc(sub)}</text>` : ""}
  </g>`;
}

function body(cast, spread, question) {
  const n = cast.length, W = 1520, w = n === 1 ? 300 : n === 3 ? 280 : 220, h = w * 1.18;
  const gap = n === 1 ? 0 : (W - n * w) / (n + 1);
  let s = `<ellipse cx="${W / 2}" cy="430" rx="720" ry="300" fill="url(#halo)"/>`;
  if (question) s += `<text x="${W / 2}" y="14" font-size="22" fill="${PAL.mute}" font-style="italic" text-anchor="middle">“${esc(question.length > 90 ? question.slice(0, 88) + "…" : question)}”</text>`;
  cast.forEach((d, k) => {
    const x = n === 1 ? (W - w) / 2 : gap + k * (w + gap), y = n === 5 ? 150 : 120;
    const [label] = spread.positions[k];
    const [a, b] = label.split(" · ");
    s += stone(x, y, w, h, d, b ? a : label, b || "");
  });
  // futhark strip
  s += `<g transform="translate(0,615)">`;
  RUNES.forEach((r, i) => {
    const on = cast.some((d) => d.i === i), x = 40 + i * 60 + Math.floor(i / 8) * 30;
    s += `<text x="${x}" y="40" font-family="Noto Sans Runic" font-size="34" fill="${on ? PAL.light : PAL.dim}" text-anchor="middle"${on ? ' filter="url(#glow)"' : ""}>${r.ch}</text>`;
  });
  AETTIR.forEach((a, k) => { s += `<text x="${40 + k * 510 + 210}" y="74" font-size="14" letter-spacing="2" fill="${PAL.mute}" text-anchor="middle">${a.toUpperCase()}</text>`; });
  return s + "</g>";
}

const AETT_TEXT = [
  "Freyr's aett leads: the reading is about the material and the growing: resources, strength, joy, the journey.",
  "Hagal's aett leads: the reading is about forces bigger than you: weather, need, timing, fate. Work with them rather than against.",
  "Tyr's aett leads: the reading is about people and principle: justice, partnership, the self and what you inherit.",
];

export function readingEmbeds(cast, spreadKey, question, { who = "you" } = {}) {
  const sp = SPREADS[spreadKey];
  const fields = cast.map((d, k) => {
    const [label, about] = sp.positions[k], r = d.rune;
    return { name: `${r.ch} ${label}: ${r.n}${d.merk ? " · merkstave" : ""}`, value: cut(`*${about}* · ${r.gloss} · ${r.kw.join(", ")}\n${d.merk ? r.mk : r.up}`) };
  });
  const main = {
    title: `ᚱ Runes · ${sp.name}: ${cast.map((d) => d.rune.n + (d.merk ? "᛫" : "")).join(" · ")}`.slice(0, 250), color: GOLD,
    description: question ? `**Question:** ${cut(question, 200)}` : "*An open reading.*",
    fields, image: { url: "attachment://runes.png" }, footer: FOOTER,
  };
  const counts = [0, 0, 0]; cast.forEach((d) => counts[d.aett]++);
  const lead = counts.indexOf(Math.max(...counts)), tie = counts.filter((c) => c === counts[lead]).length > 1;
  const merk = cast.filter((d) => d.merk).length;
  const tone = merk === 0 ? "Every rune landed upright: the current runs with you." : merk === cast.length ? "Every reversible rune landed merkstave: this is a reading about blocks. Name them and the work begins." : `${merk} of ${cast.length} landed merkstave: mixed weather. The upright runes show your strengths; the reversed ones show where to take care.`;
  const last = cast[cast.length - 1];
  const synth = {
    title: "🪨 Reading the cast", color: TEAL,
    fields: [
      { name: "⚖️ Balance", value: `${tone}\n${tie ? "No single aett dominates: the question touches every part of life." : AETT_TEXT[lead]}` },
      { name: "🔮 Core message", value: cut(cast.length === 1 ? `${last.rune.n} is the whole answer: ${last.rune.kw[0]}. ${last.merk ? "Upside down, it asks what's blocking that." : "Lean into it."}` : `From **${cast[0].rune.n}** (${cast[0].rune.kw[0]}) toward **${last.rune.n}** (${last.rune.kw[0]}). ${last.merk ? `The end of the cast is reversed, so the outcome isn't fixed: change the middle and you change the ending.` : `The cast ends upright: if you keep going as you are, ${last.rune.kw[0]} is where this lands.`}`) },
      { name: "🧪 Your experiment", value: `Carve, draw or doodle **${last.rune.ch} ${last.rune.n}** somewhere you'll see it daily for nine days (nine nights is how long Odin hung on the world tree to win the runes). Note each time its theme, ${last.rune.kw[0]}, shows up.` },
      { name: "📖 About the runes", value: "The Elder Futhark is the oldest runic alphabet, carved roughly 150 to 800 CE. The Roman writer Tacitus describes Germanic peoples casting lots on strips of fruitwood; the meanings used today come from later Norwegian, Icelandic and Old English rune poems and modern practice." },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, synth];
}

export async function run(o = {}, ctx = {}) {
  const key = SPREADS[o.spread] ? o.spread : "three", question = (o.question || "").trim();
  const cast = draw(SPREADS[key].positions.length, ctx.rand);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const defs = `<radialGradient id="stone" cx="0.4" cy="0.3" r="0.9"><stop offset="0" stop-color="#4a3d86"/><stop offset="0.6" stop-color="#2a2058"/><stop offset="1" stop-color="#140f2c"/></radialGradient>`;
  const png = await cardPng({ title: "Runes", subtitle: `${SPREADS[key].name} · drawn for ${who}`, tag: "Elder Futhark · 24 runes · merkstave", body: body(cast, SPREADS[key], question), defs, H: 900 });
  return { embeds: readingEmbeds(cast, key, question, { who }), files: [{ name: "runes.png", data: png }], ephemeral: !!o.private,
    reading: { spread: key, runes: cast.map((d) => ({ name: d.rune.n, merkstave: d.merk })) }, headline: cast.map((d) => d.rune.n + (d.merk ? " (merkstave)" : "")).join(", ") };
}
