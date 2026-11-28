// Archivist Wren's toys in the Scriptorium: no scores, just things to make, keep and share.
//   🪶 Name in runes: your name inked stroke by stroke in the Elder Futhark, Ogham and an uncial hand, sealed in wax.
//   📜 Ex libris: design your own bookplate; it is pasted inside your profile card.
//   🕯️ The reading nook: a candle-lit corner with real lines from real manuscripts.
// They sit on the House's "Just for fun" tab (row "toy", house "scriptorium"); progress in prog.rooms[id].
import { FUTHARK, toFuthark, toOgham, runeOf, oghamOf, oghamPath, oghamWidth, sealRune, shareLines, cleanName, futharkText, oghamText } from "./runes.js";
import { QUOTES, MOTTOES } from "./manuscripts.js";
import { TOY_CSS } from "./style.js";
import { shareToy } from "./share.js";
import * as sfx from "./sfx.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("toy-style")) return; const s = document.createElement("style"); s.id = "toy-style"; s.textContent = TOY_CSS; document.head.append(s); };
export const toyOf = (p, id) => { const r = ((p.rooms ||= {})[id] ||= { plays: 0 }); return r; };
// Wren and the Oracle are the same person, which Wren hides badly.
const SLIPS = ["I don't do readings, of course. That's the Oracle's job. She tells me. We talk. Separately.", "This quill? Borrowed. From a colleague. With one eye. Never mind.",
  "Strictly speaking I've never been to the Oracle Chamber. I only know where everything is."];

/** Real sealing-wax colours: [id, name, hex, note]. */
export const WAX = [["red", "Vermilion red", "#b3261e", "Plain beeswax was the everyday seal; red, coloured with vermilion, marked the important ones."],
  ["green", "Verdigris green", "#2f6e3a", "Some medieval chanceries sealed certain grants in green wax."],
  ["black", "Mourning black", "#1d1a1c", "Black wax was used for letters in mourning."],
  ["gold", "Gilt", "#b88a2a", "Gold seals (bullae) were for the grandest documents, like the Golden Bull of 1356."]];
const waxOf = (id) => WAX.find((w) => w[0] === id) || WAX[0];

// ---- drawing ----
const VELLUM = `<defs><radialGradient id="ty-vel" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#f6ead0"/><stop offset=".8" stop-color="#e2cfa4"/><stop offset="1" stop-color="#b8996a"/></radialGradient>
  <filter id="ty-rough"><feTurbulence baseFrequency=".9" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter></defs>`;
function runeRow(vals, x0, y0, s = 1.5, delay = 0) {
  let x = x0, k = 0; const out = [];
  for (const v of vals) {
    if (v === " ") { out.push(`<g transform="translate(${x + 2} ${y0 + 10 * s})"><circle r="1.6" cy="-4" fill="#2b1d12"/><circle r="1.6" cy="4" fill="#2b1d12"/></g>`); x += 10; continue; }
    const r = runeOf(v); out.push(`<path class="ty-ink" d="${r.d}" transform="translate(${x} ${y0}) scale(${s})" pathLength="1" style="--d:${(delay + k * 0.22).toFixed(2)}s"/>`); x += 14 * s; k++;
  }
  return { svg: out.join(""), w: x - x0, n: k };
}
function oghamRow(vals, x0, y0, delay = 0) {
  const w = vals.reduce((a, v) => a + oghamWidth(v), 0); let x = x0, k = 0; const out = [];
  out.push(`<path class="ty-ink ty-stem" d="M${x0 - 8} ${y0}H${x0 + w + 8}" pathLength="1" style="--d:${delay.toFixed(2)}s"/>`);
  out.push(`<path class="ty-ink" d="M${x0 - 14} ${y0}l6 -6m-6 6l6 6" pathLength="1" style="--d:${delay.toFixed(2)}s"/>`); // the feather mark that opens an Ogham line
  for (const v of vals) { if (v !== " ") { out.push(`<path class="ty-ink" d="${oghamPath(v, oghamWidth(v))}" transform="translate(${x} ${y0})" pathLength="1" style="--d:${(delay + 0.3 + k * 0.2).toFixed(2)}s"/>`); k++; } x += oghamWidth(v); }
  return { svg: out.join(""), w, n: k };
}
/** A wax seal with an embossed rune. */
export function sealSvg(rune, wax, cls = "") {
  const pts = Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, r = 30 + (i % 3 === 0 ? 3 : i % 2 ? -1 : 1.5); return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(" ");
  return `<g class="ty-seal ${cls}"><polygon points="${pts}" fill="${wax[2]}" stroke="#000" stroke-opacity=".35"/><circle r="22" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>
    <circle r="22" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1" transform="translate(1 1)"/>
    <path d="${rune.d}" transform="translate(-9 -18) scale(1.5)" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${rune.d}" transform="translate(-10 -19) scale(1.5)" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse rx="12" ry="5" cx="-10" cy="-18" fill="#fff" opacity=".18"/></g>`;
}
export function runeSheetSvg(name, waxId = "red", { sealed = false, done = false } = {}) {
  const f = toFuthark(name), o = toOgham(name), nm = cleanName(name) || "Wren";
  const fr = runeRow(f.runes, 0, 0), or = oghamRow(o.letters, 0, 0), fs = Math.min(1, 300 / Math.max(1, fr.w)), os = Math.min(1, 280 / Math.max(1, or.w + 16));
  const tEnd = 0.2 + fr.n * 0.22, oEnd = tEnd + 0.4 + or.n * 0.2;
  return `<svg viewBox="0 0 360 250" class="ty-sheet${done ? " done" : ""}" role="img" aria-label="${nm} written in runes, Ogham and an uncial hand">${VELLUM}
  <rect x="6" y="6" width="348" height="238" rx="6" fill="url(#ty-vel)" filter="url(#ty-rough)"/>
  ${[52, 118, 182].map((y) => `<path d="M24 ${y}H336" stroke="#9c7b4a" stroke-opacity=".35" stroke-width=".6"/>`).join("")}
  <text x="24" y="20" class="ty-lbl">ELDER FUTHARK</text><text x="24" y="84" class="ty-lbl">OGHAM</text><text x="24" y="146" class="ty-lbl">UNCIAL HAND</text>
  <g transform="translate(${180 - (fr.w * fs) / 2} 24) scale(${fs})">${runeRow(f.runes, 0, 0, 1.5, 0.2).svg}</g>
  <g transform="translate(${180 - (or.w * os) / 2} 104) scale(${os})">${oghamRow(o.letters, 0, 0, tEnd + 0.2).svg}</g>
  <g class="ty-uncial" style="--d:${oEnd.toFixed(2)}s"><rect x="${180 - nm.length * 6.4 - 12}" y="152" width="28" height="30" rx="2" fill="#c99a2e" opacity=".85"/>
    <text x="180" y="176" text-anchor="middle" font-family="'Uncial Antiqua', serif" font-size="22" fill="#2b1d12"><tspan fill="#b3261e" font-size="30">${nm[0]}</tspan>${nm.slice(1)}</text></g>
  <g transform="translate(316 212)">${sealed ? sealSvg(sealRune(name), waxOf(waxId), "on") : `<circle r="26" fill="none" stroke="#9c7b4a" stroke-dasharray="3 4" opacity=".6"/>`}</g>
</svg>`;
}

// ---- bookplates ----
export const MOTIFS = [["quill", "🪶 Quill"], ["owl", "🦉 Owl"], ["key", "🗝️ Key"], ["book", "📖 Open book"], ["star", "✶ Star"], ["lamp", "🪔 Lamp"]];
export const BORDERS = [["rule", "Double rule"], ["laurel", "Laurel"], ["knot", "Knotwork"], ["arch", "Gothic arch"]];
export const INKS = [["iron", "Iron-gall ink", "#2b1d12"], ["vermilion", "Vermilion", "#b3261e"], ["lapis", "Ultramarine (lapis)", "#1f3f9a"], ["verdigris", "Verdigris", "#2e7a5e"], ["gold", "Shell gold", "#a77a1c"]];
const MOTIF_ART = {
  quill: `<path d="M18 -26C4 -14 -6 4 -12 22L-8 22C-2 6 8 -8 18 -26Z"/><path d="M18 -26C10 -10 -2 4 -10 18" fill="none" stroke="currentColor" stroke-width="1"/><path d="M-12 22L-14 28" stroke="currentColor" stroke-width="2"/>`,
  owl: `<ellipse rx="16" ry="20"/><circle cx="-6" cy="-6" r="6" fill="#f3e6c8"/><circle cx="6" cy="-6" r="6" fill="#f3e6c8"/><circle cx="-6" cy="-6" r="2.6"/><circle cx="6" cy="-6" r="2.6"/><path d="M-3 2L0 7L3 2Z" fill="#f3e6c8"/><path d="M-14 -18L-8 -14M14 -18L8 -14" stroke="currentColor" stroke-width="3"/>`,
  key: `<circle cy="-16" r="9" fill="none" stroke="currentColor" stroke-width="4"/><path d="M0 -7V24M0 14H8M0 20H6" stroke="currentColor" stroke-width="4" fill="none"/>`,
  book: `<path d="M0 -10C-8 -16 -18 -16 -26 -12V16C-18 12 -8 12 0 18C8 12 18 12 26 16V-12C18 -16 8 -16 0 -10Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M0 -10V18" stroke="currentColor" stroke-width="2"/><path d="M-20 -4H-6M-20 2H-6M6 -4H20M6 2H20" stroke="currentColor" stroke-width="1"/>`,
  star: `<path d="M0 -24L6 -6L24 -6L10 5L15 23L0 12L-15 23L-10 5L-24 -6L-6 -6Z"/>`,
  lamp: `<path d="M-22 8C-22 0 -8 -2 6 0L22 -6L16 6C10 14 -14 16 -22 8Z"/><path d="M22 -6C26 -14 22 -22 20 -26C18 -20 16 -14 22 -6Z" fill="#e8a33a"/><path d="M-6 14V20H6V14" fill="none" stroke="currentColor" stroke-width="2"/>`,
};
function borderSvg(kind, col) {
  if (kind === "laurel") { const leaf = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3" transform="rotate(${a} ${x} ${y})" fill="${col}" opacity=".85"/>`;
    const L = []; for (let i = 0; i < 9; i++) { const y = 230 - i * 24; L.push(leaf(22, y, -60), leaf(178, y, 60)); } return `<rect x="14" y="14" width="172" height="232" rx="4" fill="none" stroke="${col}" stroke-width="1.2"/>${L.join("")}`; }
  if (kind === "knot") { const loops = []; for (let x = 24; x <= 176; x += 16) loops.push(`<path d="M${x - 8} 16c4 -8 12 -8 16 0s-12 8 -16 0" /><path d="M${x - 8} 244c4 8 12 8 16 0s-12 -8 -16 0"/>`);
    for (let y = 32; y <= 228; y += 16) loops.push(`<path d="M16 ${y - 8}c-8 4 -8 12 0 16s8 -12 0 -16"/><path d="M184 ${y - 8}c8 4 8 12 0 16s-8 -12 0 -16"/>`);
    return `<g fill="none" stroke="${col}" stroke-width="1.6">${loops.join("")}</g><rect x="22" y="22" width="156" height="216" fill="none" stroke="${col}" stroke-width="1"/>`; }
  if (kind === "arch") return `<path d="M20 244V96C20 50 60 20 100 12C140 20 180 50 180 96V244Z" fill="none" stroke="${col}" stroke-width="3"/><path d="M28 238V98C28 58 62 32 100 22C138 32 172 58 172 98V238Z" fill="none" stroke="${col}" stroke-width="1"/>`;
  return `<rect x="12" y="12" width="176" height="236" fill="none" stroke="${col}" stroke-width="3"/><rect x="20" y="20" width="160" height="220" fill="none" stroke="${col}" stroke-width="1"/>`;
}
export const DEFAULT_PLATE = { motif: "quill", border: "rule", ink: "iron", motto: 0 };
/** The bookplate as SVG. `esc` escapes the name. */
export function plateSvg(plate, name, esc, cls = "") {
  const P = { ...DEFAULT_PLATE, ...(plate || {}) }, ink = (INKS.find((i) => i[0] === P.ink) || INKS[0])[2], m = MOTTOES[P.motto] || MOTTOES[0];
  const nm = esc(cleanName(name) || "Reader"), fsz = Math.max(13, Math.min(22, 300 / Math.max(6, nm.length)));
  return `<svg viewBox="0 0 200 260" class="ty-plate ${cls}" role="img" aria-label="Bookplate: ex libris ${nm}"><rect width="200" height="260" rx="4" fill="#f3e6c8"/>
  ${borderSvg(P.border, ink)}<text x="100" y="${P.border === "arch" ? 74 : 52}" text-anchor="middle" font-family="'Cinzel', serif" font-size="13" letter-spacing="3" fill="${ink}">EX LIBRIS</text>
  <g class="ty-motif" transform="translate(100 ${P.border === "arch" ? 122 : 112})" fill="${ink}" style="color:${ink}">${MOTIF_ART[P.motif] || MOTIF_ART.quill}</g>
  <text x="100" y="178" text-anchor="middle" font-family="'Uncial Antiqua', serif" font-size="${fsz.toFixed(0)}" fill="${ink}">${nm}</text>
  <path d="M50 190H150" stroke="${ink}" stroke-width=".8"/><text x="100" y="208" text-anchor="middle" font-family="'IM Fell English', serif" font-style="italic" font-size="12" fill="${ink}">${esc(m[0])}</text>
  <text x="100" y="224" text-anchor="middle" font-family="'IM Fell English', serif" font-size="8.5" fill="${ink}" opacity=".8">${esc(m[1])}</text></svg>`;
}

// ---- the rooms ----
const toyBase = (id, label, emoji, blurb) => ({ id, label, emoji, blurb, row: "toy", house: "scriptorium" });

export const runename = {
  ...toyBase("runename", "Name in runes", "🪶", "Your name inked in futhark, Ogham and an uncial hand, with a wax seal"),
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, greet, tableEl, emote } = ctx; styleOnce();
    const R = toyOf(state.prog, "runename"); let name = R.last || state.name || "", wax = R.wax || "red", timers = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const draw = (sealed, done = sealed) => { tableEl.className = "table toy-table"; tableEl.innerHTML = runeSheetSvg(name, wax, { sealed, done }); };
    const ink = () => { clear(); draw(false); const n = toFuthark(name).runes.filter((v) => v !== " ").length + toOgham(name).letters.filter((v) => v !== " ").length;
      sfx.dip(); for (let k = 0; k < n; k++) timers.push(setTimeout(() => sfx.quill(0.12 + Math.random() * 0.1), 200 + k * 210)); };
    function view(first) {
      clearReading(); cap("🪶 Name in runes");
      say(first && !R.plays ? `Give me a name, ${state.name}, and I'll ink it three ways: the Elder Futhark, Ogham and an insular uncial hand. Then a seal. Every letter is the real one, and where a script has no letter for your sound, I'll tell you what scribes used instead.`
        : pick(["Fresh vellum, sharp quill. Whose name?", "A name, please. I promise not to footnote it.", Math.random() < 0.25 ? pick(SLIPS) : "The ink's still wet. It's always still wet."]));
      const f = toFuthark(name), o = toOgham(name), notes = [...f.notes, ...o.notes];
      ui(`<form class="form one" id="ty-f"><label for="ty-n">A name (letters only)<input id="ty-n" maxlength="24" autocomplete="off" value="${esc(name)}" placeholder="Your name"></label></form>
        <div class="choices"><button class="c main" type="button" id="ty-ink">✒️ Ink it</button><button class="c" type="button" id="ty-seal">🔴 Seal it</button></div>
        <div class="choices ty-wax" role="group" aria-label="Wax colour">${WAX.map(([id, nm, hex]) => `<button class="c small${id === wax ? " main" : ""}" type="button" data-wax="${id}" title="${esc(nm)}"><i class="ty-sw" style="background:${hex}"></i>${esc(nm)}</button>`).join("")}</div>
        ${name ? `<div class="note ty-read"><b>${esc(futharkText(f.runes))}</b> · ${f.runes.map((v) => (v === " " ? "·" : esc(runeOf(v).name))).join(" ")}<br><b>${esc(oghamText(o.letters))}</b> · ${o.letters.map((v) => (v === " " ? "·" : esc(oghamOf(v).name))).join(" ")}</div>` : ""}
        ${notes.length ? `<div class="note">📝 ${notes.map(esc).join(" ")}</div>` : ""}
        <details class="note"><summary>The 24 runes of the Elder Futhark</summary><p>${FUTHARK.map(([v, ch, nm]) => `${ch} ${esc(nm)} (${v})`).join(" · ")}</p><p>Named after its first six letters, f-u-th-a-r-k. Carved in wood, stone and metal from about AD 150 to 800. Its rune names are reconstructed by scholars from later poems.</p></details>
        <div class="choices"><button class="c" type="button" id="ty-post">📤 Post to the channel</button><button class="c" type="button" id="back">✦ Back</button></div><p class="note" id="ty-msg" aria-live="polite"></p>`);
      const read = () => { const v = cleanName($("ty-n").value); if (v !== name) { name = v; R.last = name; } };
      $("ty-f").onsubmit = (e) => { e.preventDefault(); $("ty-ink").click(); };
      $("ty-ink").onclick = () => { read(); if (!name) { say("I need at least one letter. Even a monogram."); return; } R.plays++; saveProgress(); view(); ink(); emote && emote("nod", { quiet: true }); };
      $("ty-seal").onclick = () => { read(); if (!name) return; clear(); draw(true); sfx.seal(); R.sealed = (R.sealed || 0) + 1; R.plays++; saveProgress();
        say(`${waxOf(wax)[1]}, pressed with ${sealRune(name).ch} ${sealRune(name).name}, your first rune. ${waxOf(wax)[3]}`); };
      $("ui").querySelectorAll("[data-wax]").forEach((b) => (b.onclick = () => { read(); wax = b.dataset.wax; R.wax = wax; saveProgress(); view(); draw(true); sfx.seal(); }));
      $("ty-post").onclick = () => { read(); if (!name) return; shareToy(state, { title: `${name}, in runes`, lines: shareLines(name), color: waxOf(wax)[2] }, (t) => { $("ty-msg").textContent = t; }); sfx.seal(); };
      $("back").onclick = () => { clear(); greet(); };
    }
    view(true); if (name) ink(); else draw(false);
  },
};

export const exlibris = {
  ...toyBase("exlibris", "Ex libris", "📜", "Design your own bookplate. It's pasted inside your profile card"),
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, greet, tableEl } = ctx; styleOnce();
    const R = toyOf(state.prog, "exlibris"); const plate = { ...DEFAULT_PLATE, ...(R.plate || {}) };
    const draw = (pop) => { tableEl.className = "table toy-table"; tableEl.innerHTML = `<div class="ty-plate-wrap${pop ? " pop" : ""}">${plateSvg(plate, state.name, esc)}</div>`; };
    const opt = (key, list, lab) => `<div class="ty-opt"><b>${lab}</b><div class="choices">${list.map((it, i) => { const v = key === "motto" ? i : it[0]; return `<button class="c small${plate[key] === v ? " main" : ""}" type="button" data-k="${key}" data-v="${v}">${key === "ink" ? `<i class="ty-sw" style="background:${it[2]}"></i>` : ""}${esc(key === "motto" ? it[0] : it[1])}</button>`; }).join("")}</div></div>`;
    function view(first) {
      clearReading(); cap("📜 Ex libris");
      const m = MOTTOES[plate.motto] || MOTTOES[0];
      say(first && !R.plate ? `'Ex libris' means 'from the books of'. People have pasted bookplates inside their books since the 1400s, so a borrowed book finds its way home. Make yours, ${state.name}. I'll paste it inside your profile card.`
        : `${m[0]}: "${m[1]}". ${m[2]}.`);
      ui(`${opt("motif", MOTIFS, "Emblem")}${opt("border", BORDERS, "Border")}${opt("ink", INKS, "Ink")}${opt("motto", MOTTOES, "Motto")}
        <div class="choices"><button class="c main" type="button" id="ty-paste">🖌️ Paste it in my card</button><button class="c" type="button" id="back">✦ Back</button></div>
        <div class="note">${R.plate ? "Your bookplate is in your profile card (🪪 My card)." : "Nothing is saved until you paste it."} Ultramarine was ground from lapis lazuli and cost more than gold. Iron-gall ink, made from oak galls, was the everyday ink for over a thousand years.</div>`);
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { const k = b.dataset.k; plate[k] = k === "motto" ? +b.dataset.v : b.dataset.v; sfx.quill(0.14); view(); draw(true); }));
      $("ty-paste").onclick = () => { R.plate = { ...plate }; R.plays++; saveProgress(); sfx.seal(); setTimeout(sfx.page, 260); view(); draw(true); say(pick([`Pasted. Every book you open here is now from the books of ${state.name}.`, "Pasted, pressed and drying. Look in your profile card.", "Done. A librarian's favourite sight: a book that knows where it lives."])); };
      $("back").onclick = greet;
    }
    view(true); draw(true);
  },
};

export const nook = {
  ...toyBase("nook", "The reading nook", "🕯️", "A candle-lit corner with real lines from real manuscripts"),
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, greet, tableEl } = ctx; styleOnce();
    const R = toyOf(state.prog, "nook"); R.seen ||= []; let i = Math.max(0, QUOTES.findIndex((q) => !R.seen.includes(q.id))), lit = true;
    const alive = () => tableEl.classList.contains("toy-nook");
    const motes = Array.from({ length: 12 }, (_, k) => `<i style="left:${(10 + Math.random() * 80).toFixed(0)}%;--d:${(Math.random() * 9).toFixed(1)}s;--t:${(8 + Math.random() * 8).toFixed(1)}s"></i>`).join("");
    const draw = (flip) => { const q = QUOTES[i]; tableEl.className = "table toy-table toy-nook" + (lit ? "" : " dark");
      tableEl.innerHTML = `<div class="ty-nook" aria-hidden="true"><div class="ty-win"><b></b></div><div class="ty-motes">${motes}</div>
        <div class="ty-book${flip ? " flip" : ""}"><div class="ty-pg"><p>${esc(q.orig || q.en)}</p><small>${esc(q.when)}</small></div><div class="ty-pg r"><p>${esc(q.src)}</p></div></div>
        <div class="ty-candle"><span class="ty-fl"></span><span class="ty-cwax"></span><span class="ty-glow"></span></div></div>`; };
    function view(first) {
      const q = QUOTES[i]; if (!R.seen.includes(q.id)) { R.seen.push(q.id); R.plays++; saveProgress(); }
      clearReading(); cap(`🕯️ The reading nook · ${R.seen.length} / ${QUOTES.length} pages read`);
      say(first && R.seen.length <= 1 ? `Sit. The candle's lit. Everything on this desk was really written by someone, ${state.name}, usually a tired monk. I've translated the old words plainly.`
        : q.hoax ? "Ah. This one is famous, and it's fake. I keep it to remind myself to check sources." : pick(["Another page.", "Mind the wax.", "Listen to that. Nothing. Perfect.", Math.random() < 0.3 ? pick(SLIPS) : "Turn gently. This one's old."]));
      ui(`<div class="ty-quote">${q.orig ? `<p class="ty-orig">“${esc(q.orig)}”</p>` : ""}<p>${q.hoax ? "" : "“"}${esc(q.en)}${q.hoax ? "" : "”"}</p>
        <p class="ty-src"><b>${esc(q.src)}</b> · ${esc(q.when)}<br>${esc(q.where)}</p><p class="note">${esc(q.note)}</p></div>
        <div class="choices"><button class="c main" type="button" id="ty-turn">📖 Turn the page</button><button class="c" type="button" id="ty-cdl">${lit ? "🕯️ Snuff the candle" : "🕯️ Light the candle"}</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ty-turn").onclick = () => { i = (i + 1) % QUOTES.length; sfx.page(); if (QUOTES[i].hoax) setTimeout(sfx.bell, 500); draw(true); view(); };
      $("ty-cdl").onclick = () => { lit = !lit; draw(); view(); if (lit) sfx.flame(); };
      $("back").onclick = greet;
    }
    draw(); view(true); sfx.hush(alive); sfx.bell();
  },
};

export const SCRIPTORIUM_TOYS = [runename, exlibris, nook];
