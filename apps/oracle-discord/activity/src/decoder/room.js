// Rune and Glyph Decoder: a room of the Oracle Chamber. The Oracle teaches each script; the inscription is laid on
// the reading table; the player taps sounds to decode it, answers what it means, and earns ✦ and 💎 Essence.
// Plugs into main.js ROOMS: room.open(ctx) with ctx = { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, ... }.
import { SCRIPTS, LEVELS, SCRIPT_ORDER, LONG_COUNT, levelsOf, byId } from "./levels.js";
import { glyphsOf, target, taught, tiles, check, hint, starsFor, deal, playCard, drawCard, needed, INK_DRAW, INK_MISS, HAND_MAX, writeIn, mayaOf, complete, unlocked, scriptStars, dec, signOf } from "./engine.js";
import { FONTS } from "./fonts.gen.js";
import { CSS } from "./style.js";
import { GUIDES } from "./guide.js";
import { SHOP, tabletOf } from "./shop.js";
import { play } from "./sfx.js";

export const room = { id: "decoder", row: "cards", label: "Rune & Glyph Decoder", emoji: "🗝️", blurb: "Card game: play sound cards onto real runes, Ogham, hieroglyphs and Maya numbers", open };

let C = null, board = null;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = (id) => document.getElementById(id);

// ---- study guide: shown in the reading area under the Oracle's text; free to read outside the decode step ----
export function guideHtml(k) {
  const g = GUIDES[k], s = SCRIPTS[k];
  const table = k === "maya" ? `<div class="dec-gtable maya">${s.signs.map((x) => `<span>${mayaSvg(+x.g, 30)}<b>${x.g}</b></span>`).join("")}</div>`
    : `<div class="dec-gtable">${s.signs.map((x) => `<span><i class="${s.font}">${esc(x.g)}</i><b>${esc(x.v)}</b><small>${esc(x.n)}: ${esc(x.gl)}</small></span>`).join("")}</div>`;
  return `<div class="dec-guide"><h3>📖 ${esc(g.title)}</h3>${g.sections.map((sec, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(sec.h)}</summary>${sec.p.map((t) => `<p>${glyphFont(t)}</p>`).join("")}</details>`).join("")}
    <details><summary>All the signs</summary>${table}</details></div>`;
}
/** Put runs of runes, Ogham or hieroglyphs inside the guide's prose into the matching glyph font. */
const glyphFont = (t) => t.replace(/[\u16A0-\u16FF]+/g, (m) => `<span class="dec-runic dec-in">${m}</span>`)
  .replace(/[\u1680-\u169F]+/g, (m) => `<span class="dec-ogham dec-in">${m}</span>`)
  .replace(/[\u{13000}-\u{1342F}]+/gu, (m) => `<span class="dec-egy dec-in">${m}</span>`);
function toggleGuide(k, btn) {
  const rb = $("reading-body"), on = !rb.querySelector(".dec-guide");
  rb.innerHTML = on ? guideHtml(k) : "";
  if (btn) btn.textContent = on ? "📖 Close study guide" : "📖 Study guide";
  if (on) rb.querySelector(".dec-guide").scrollIntoView({ behavior: "smooth", block: "start" });
}
const guideBtn = (k) => `<button class="c" type="button" id="dec-guide">📖 Study guide</button>`;
const wireGuide = (k) => { const b = $("dec-guide"); if (b) b.onclick = () => toggleGuide(k, b); };
const P = () => C.state.prog;

export function styleOnce() {
  if (document.getElementById("dec-style")) return;
  const f = (fam, b64) => `@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:block}`;
  const st = document.createElement("style"); st.id = "dec-style";
  st.textContent = f("dec-runic", FONTS.runic) + f("dec-ogham", FONTS.ogham) + f("dec-egy", FONTS.egy) + CSS;
  document.head.append(st);
}
// The board is drawn into the reading table (ctx.tableEl); the Chamber's greet() puts the table back.
function mountBoard() {
  const t = C.tableEl || $("table"); t.className = "table decoder"; t.dataset.tablet = tabletOf(C.state.prog.tablet);
  t.innerHTML = `<div class="dec-board" aria-live="polite"></div>`; board = t.firstChild;
  // Tap a card on the table to see it up close (Chamber's #zoom viewer); tap a script medal to open that script.
  board.onclick = (e) => {
    const m = e.target.closest(".dec-medal[data-s]"); if (m) return scriptMenu(m.dataset.s);
    const c = e.target.closest(".dec-card, .dec-reward"); if (c) zoomCard(c);
  };
}
function zoomCard(el) {
  const z = $("zoom"), art = $("zoom-art"); if (!z || !art) return;
  art.innerHTML = `<div class="dec-zoom">${el.innerHTML}</div>`; z.hidden = false; play("zoom"); $("zoom-close") && $("zoom-close").focus();
}
function leave() { C.greet(); }
const show = (html) => { board.innerHTML = html; };
const starRow = (n, of = 3, pop = false) => `<span class="dec-stars${pop ? " pop" : ""}" aria-label="${n} of ${of} stars">${Array.from({ length: n }, (_, i) => `<b style="--i:${i}">★</b>`).join("")}<i>${"★".repeat(of - n)}</i></span>`;
// A burst of sparks for a finished level (CSS animates them outward).
const sparks = (n = 14) => `<div class="dec-sparks" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="--a:${Math.round((i / n) * 360)}deg;--d:${(i % 3) * 0.05}s"></i>`).join("")}</div>`;
const save = () => { try { C.saveProgress(); } catch {} };

/** This room's part of the 📜 Codex: one row per script. */
export function decoderCodex(prog, e = esc) {
  const d = dec(prog);
  return SCRIPT_ORDER.map((k) => { const ls = levelsOf(k), got = ls.filter((l) => d.codex.includes(l.codex)), st = scriptStars(prog, k), of = ls.length * 3;
    return `<div class="cx"><div class="cx-h"><span>${e(SCRIPTS[k].emoji)} Decoded: ${e(SCRIPTS[k].name)}</span><span class="note">${st} / ${of} ★</span></div>
      <div class="bar"><i style="width:${(st / of) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((l) => `<span>${e(l.codex)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}

function open(ctx) { C = ctx; styleOnce(); mountBoard(); home(); }

// ---- Maya numerals as SVG: dots (1), bars (5), shell (0) ----
export function mayaSvg(n, w = 64) {
  const h = w * 1.1, cx = w / 2; let s = "";
  if (n === 0) s = `<ellipse cx="${cx}" cy="${h * 0.6}" rx="${w * 0.38}" ry="${w * 0.2}" class="m-ink" fill="none" stroke-width="${w * 0.05}"/><path d="M${cx - w * 0.26},${h * 0.6} q${w * 0.26},${-w * 0.16} ${w * 0.52},0 M${cx - w * 0.18},${h * 0.66} q${w * 0.18},${-w * 0.1} ${w * 0.36},0" fill="none" class="m-ink" stroke-width="${w * 0.035}"/>`;
  else {
    const bars = Math.floor(n / 5), dots = n % 5; let y = h - w * 0.08;
    for (let i = 0; i < bars; i++) { s += `<rect x="${w * 0.08}" y="${y - w * 0.15}" width="${w * 0.84}" height="${w * 0.15}" rx="${w * 0.05}" class="m-fill"/>`; y -= w * 0.22; }
    for (let i = 0; i < dots; i++) s += `<circle cx="${cx + (i - (dots - 1) / 2) * w * 0.2}" cy="${y - w * 0.08}" r="${w * 0.075}" class="m-fill"/>`;
  }
  return `<svg class="m-num" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Maya numeral">${s}</svg>`;
}

// ---- home: the four scripts ----
function home() {
  C.clearReading(); C.cap("🗝️ Rune & Glyph Decoder");
  const p = P(), solved = Object.keys(dec(p).solved).length;
  show(`<div class="dec-home">${SCRIPT_ORDER.map((k) => { const s = SCRIPTS[k], n = levelsOf(k).length;
    return `<div class="dec-medal" data-s="${k}" role="button" tabindex="0" style="--i:${SCRIPT_ORDER.indexOf(k)}"><div class="dec-glyph ${s.font}">${k === "maya" ? mayaSvg(13, 40) : esc(sample(k))}</div><b>${esc(s.name)}</b><small>${scriptStars(p, k)} / ${n * 3} ★</small></div>`; }).join("")}</div>`);
  C.say(solved ? `Back to the old scripts. You've decoded ${solved} of ${LEVELS.length} so far. Which one calls to you?`
    : "Before the Oracle could read the stars, someone had to read the stones. Four scripts, four ancient peoples. Choose one, and I'll teach you its signs.");
  C.ui(`<div class="choices">${SCRIPT_ORDER.map((k) => `<button class="c" type="button" data-s="${k}">${esc(SCRIPTS[k].emoji)} ${esc(SCRIPTS[k].name)}</button>`).join("")}
    <button class="c" type="button" id="dec-out">↩ Back to the Oracle</button></div>`);
  $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => scriptMenu(b.dataset.s)));
  $("dec-out").onclick = leave;
}
const sample = (k) => ({ futhark: "ᚠᚢᚦᚨᚱᚲ", ogham: "᚛ᚁᚂᚃᚄᚅ᚜", egyptian: "𓊪𓏏𓍯𓃭" }[k] || "");

function scriptMenu(k) {
  const s = SCRIPTS[k], p = P(); C.cap(`${s.emoji} ${s.name}`); C.clearReading(); play("open", k);
  show(`<div class="dec-intro"><div class="dec-big ${s.font}">${k === "maya" ? [7, 0, 13].map((n) => mayaSvg(n, 48)).join("") : esc(sample(k))}</div><p>${esc(s.blurb)}</p><small>${esc(s.where)}</small></div>`);
  C.say(s.blurb);
  C.ui(`<div class="dec-levels">${levelsOf(k).map((l, i) => { const ok = unlocked(p, l.id), st = dec(p).solved[l.id] || 0;
    return `<button class="c dec-lv" type="button" data-l="${l.id}" ${ok ? "" : "disabled"}><span>${i + 1}. ${esc(l.title)}</span>${ok ? starRow(st) : "🔒"}</button>`; }).join("")}</div>
    <div class="choices">${guideBtn(k)}<button class="c" type="button" id="dec-home">↩ All scripts</button></div>`);
  wireGuide(k);
  $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => lesson(byId(b.dataset.l))));
  $("dec-home").onclick = home;
}

// ---- a level: lesson, decode, meaning, reward ----
function lesson(l) {
  const s = SCRIPTS[l.script]; C.cap(`${s.emoji} ${l.title}`); C.clearReading(); play("page");
  if (l.kind === "write") return writeLevel(l);
  if (l.kind === "date") return dateLevel(l);
  const fresh = l.script === "maya" ? [] : Array.from(l.teach || "").map((g) => signOf(l.script, g));
  show(fresh.length ? `<div class="dec-learn">${fresh.map((x) => `<div class="dec-card" role="button" tabindex="0" title="Tap to zoom"><span class="${s.font}">${esc(x.g)}</span><b>${esc(x.v)}</b><small>${esc(x.n)} · ${esc(x.gl)}</small></div>`).join("")}</div>`
    : l.script === "maya" ? `<div class="dec-learn">${[[0, "shell = 0"], [1, "dot = 1"], [5, "bar = 5"], [8, "5 + 3 = 8"], [19, "15 + 4 = 19"]].map(([n, t]) => `<div class="dec-card" role="button" tabindex="0" title="Tap to zoom">${mayaSvg(n, 46)}<b>${n}</b><small>${t}</small></div>`).join("")}
      ${l.longCount ? `<div class="dec-lc-key">${LONG_COUNT.map(([n, d]) => `<span><b>${esc(n)}</b> ${d.toLocaleString("en-US")} days</span>`).join("")}</div>` : ""}</div>`
    : `<div class="dec-learn"><p class="dec-note">No new signs: you know them all. Decode it from memory.</p></div>`);
  C.say(l.lesson);
  C.ui(`<div class="choices"><button class="c main" type="button" id="dec-go">🎴 Deal the cards</button>${guideBtn(l.script)}<button class="c" type="button" id="dec-back">↩ Levels</button></div>`);
  wireGuide(l.script);
  $("dec-go").onclick = () => puzzle(l); $("dec-back").onclick = () => scriptMenu(l.script);
}

function strip(l, picks, { wrongAt = -1, peek = false, won = false } = {}) {
  const just = (k) => (!won && picks.length && k === picks.length - 1 ? " just" : ""), wave = (k) => ` style="--n:${k}${won ? `;--i:${k}` : ""}"`;
  const s = SCRIPTS[l.script], cells = []; let k = 0;
  if (l.script === "maya") {
    l.text.forEach((n, i) => { const v = picks[k]; cells.push(`<div class="dec-cell${k === picks.length ? " now" : ""}${k === wrongAt ? " bad" : ""}${just(k)}"${wave(k)}>${l.longCount ? `<em>${esc(LONG_COUNT[i][0])}</em>` : ""}${mayaSvg(n, l.longCount ? 44 : 56)}<b>${v ?? "&nbsp;"}</b></div>`); k++; });
    return `<div class="dec-strip maya${l.longCount ? " lc" : ""}${won ? " won" : ""}">${cells.join("")}</div>${l.round ? `<div class="dec-round">${esc(l.round)}</div>` : ""}`;
  }
  for (const g of Array.from(l.text)) {
    const sg = signOf(l.script, g);
    if (!sg) { cells.push(`<div class="dec-cell sep ${s.font}">${g === " " ? "&#x1680;" : esc(g)}<b>&nbsp;</b></div>`); continue; }
    const v = picks[k]; cells.push(`<div class="dec-cell${k === picks.length ? " now" : ""}${k === wrongAt ? " bad" : ""}${just(k)}"${wave(k)}><span class="${s.font}">${esc(g)}</span><b>${v ? esc(v) : peek ? `<i>${esc(sg.v)}</i>` : "&nbsp;"}</b></div>`); k++;
  }
  return `<div class="dec-strip ${l.script}${l.cartouche ? " cartouche" : ""}${k > 8 ? " long" : ""}${won ? " won" : ""}">${cells.join("")}</div>`;
}

// The card game (Scribe's Hand): the inscription lies on the table as glyph cards, the player holds sound cards.
// Tap a card to play it onto the glyph that glows; tap the deck to draw (1 ink). A wrong card costs 2 ink, a right one
// refills 1. Run dry and the level is lost. Rules live in engine.js (deal, playCard, drawCard).
function puzzle(l) {
  C.clearReading(); // the study guide closes while decoding: only the codebook (one star) helps here
  const g = deal(l, l.id + ":" + Date.now()); g.book = false; let busy = false, first = true;
  const cardFace = (c) => `<button class="dec-hcard${l.script === "maya" ? " num" : ""}" type="button" data-c="${c.id}" aria-label="Play ${esc(c.v)}"><b>${esc(c.v)}</b></button>`;
  const inkRow = () => `<span class="dec-ink" aria-label="${g.ink} ink">${Array.from({ length: g.well }, (_, i) => `<i class="${i < g.ink ? "on" : ""}"></i>`).join("")}</span>`;
  const drawBoard = (wrongAt = -1) => {
    show(`<div class="dec-cardtable${first ? " deal" : ""}">${strip(l, g.picks, { wrongAt })}</div>` + (g.book ? codebook(l) : `<div class="dec-progress">${g.picks.length} / ${target(l).length} · deck ${g.deck.length}</div>`));
    first = false; const now = board.querySelector(".now"); now && now.scrollIntoView && now.scrollIntoView({ block: "nearest" });
  };
  const drawHand = (fresh = []) => {
    C.ui(`<div class="dec-play"><button class="dec-deck" type="button" id="dec-draw" ${g.deck.length && g.ink >= INK_DRAW ? "" : "disabled"} aria-label="Draw a card for ${INK_DRAW} ink">
        <span class="dec-back"></span><span class="dec-back"></span><b>${g.deck.length}</b><small>Draw · ${INK_DRAW}🪶</small></button>
      <div class="dec-hand">${g.hand.map((c, i) => cardFace(c).replace('class="dec-hcard', `style="--i:${i}" class="dec-hcard${fresh.includes(c.id) ? " fresh" : ""}`)).join("")}</div></div>
      <div class="dec-inkbar">${inkRow()}<span class="note">ink · wrong card −${INK_MISS} · right card +1</span></div>
      <div class="choices"><button class="c" type="button" id="dec-book">${g.book ? "📖 Close codebook" : "📖 Codebook"}</button><button class="c" type="button" id="dec-hint">💡 Hint</button><button class="c" type="button" id="dec-quit">↩ Leave</button></div>`);
    $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => play(+b.dataset.c, b)));
    $("dec-draw").onclick = () => { if (busy) return; const c = drawCard(l, g); if (!c) return; play_("draw"); drawHand([c.id]); drawBoard(); if (g.lost) return dry(); };
    $("dec-book").onclick = () => { play_("page"); g.book = !g.book; if (g.book) g.peeks++; drawBoard(); drawHand(); };
    $("dec-hint").onclick = () => { const v = needed(l, g); if (v == null) return; g.hints++; const c = g.hand.find((x) => x.v === v);
      if (c) { const el = $("ui").querySelector(`[data-c="${c.id}"]`); el && el.classList.add("hinted"); C.say(`Play the “${v}” card.`); }
      else C.say(`You don't hold “${v}” yet. Draw from the deck.`); };
    $("dec-quit").onclick = () => scriptMenu(l.script);
  };
  const fly = (el, done) => {
    const to = board.querySelector(".now"); if (!el || !to || C.reduced) return done();
    const a = el.getBoundingClientRect(), b = to.getBoundingClientRect(), ghost = el.cloneNode(true);
    ghost.classList.add("dec-flying"); Object.assign(ghost.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
    document.body.appendChild(ghost); el.style.visibility = "hidden";
    requestAnimationFrame(() => { ghost.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) rotate(8deg) scale(.6)`; ghost.style.opacity = ".2"; });
    setTimeout(() => { ghost.remove(); done(); }, 300);
  };
  const play = (id, el) => {
    if (busy || g.lost) return; busy = true; play_("flick");
    fly(el, () => {
      busy = false; const r = playCard(l, g, id);
      if (!r.ok) { play_("wrong"); drawBoard(g.picks.length); drawHand(); C.say(g.lost ? "" : g.misses > 2 ? "Not that one. Open the codebook, there's no shame in it." : "Not quite. That card goes to the bottom of the deck."); if (r.lost) dry(); return; }
      play_("carve", l.script, g.picks.length - 1); drawBoard(); drawHand([g.hand[g.hand.length - 1]?.id]);
      if (r.done) { setTimeout(() => play_("solve"), 200); return solved(l, g); }
    });
  };
  const dry = () => {
    show(`<div class="dec-cardtable">${strip(l, g.picks)}</div><div class="dec-done">🪶 The ink ran dry at ${g.picks.length} / ${target(l).length}.</div>`);
    play_("dry"); C.say("The ink well is empty. A scribe's lot. Fresh ink, fresh deck: try again?");
    C.ui(`<div class="choices"><button class="c main" type="button" id="dec-retry">🪶 Fresh ink, new deal</button>${guideBtn(l.script)}<button class="c" type="button" id="dec-lv">↩ Levels</button></div>`);
    wireGuide(l.script); $("dec-retry").onclick = () => puzzle(l); $("dec-lv").onclick = () => scriptMenu(l.script);
  };
  C.say(l.script === "maya" ? "The numbers are dealt. Play the card with each one's value, top to bottom." : "The inscription is dealt. Play the sound card for the glowing sign. No card for it? Draw, but ink is precious.");
  play_("deal", target(l).length); drawBoard(); drawHand(g.hand.map((c) => c.id));
}
const play_ = (name, ...a) => play(name, ...a);
function codebook(l) {
  const s = SCRIPTS[l.script];
  if (l.script === "maya") return `<div class="dec-book"><b>Codebook</b> dot = 1 · bar = 5 · shell = 0</div>`;
  return `<div class="dec-book"><b>Codebook</b><div>${taught(l).map((x) => `<span><i class="${s.font}">${esc(x.g)}</i>${esc(x.v)}</span>`).join("")}</div></div>`;
}

function solved(l, st) {
  const stars = starsFor(st), read = l.script === "maya" ? target(l).join(l.longCount ? "." : ", ") : target(l).join("");
  show(strip(l, st.picks, { won: true }) + `<div class="dec-done">Decoded: <b>${esc(read)}</b> ${starRow(stars)}</div>`);
  C.say(`Yes! “${read}”. Now: what does it tell us?`);
  setTimeout(() => meaning(l, stars), 900);
}
function meaning(l, stars) {
  const q = l.q, order = shuffle(q.choices.map((_, i) => i), l.id);
  C.ui(`<div class="dec-q"><p>${esc(q.ask)}</p>${order.map((i) => `<button class="c" type="button" data-a="${i}">${esc(q.choices[i])}</button>`).join("")}</div><div class="choices">${guideBtn(l.script)}</div>`);
  wireGuide(l.script);
  $("ui").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
    if (+b.dataset.a !== q.right) { b.disabled = true; play("wrong"); b.classList.add("dec-no"); C.say("Hmm, no. The stones say otherwise. Try again."); return; }
    play("right"); reward(l, stars, q.why);
  }));
}
const shuffle = (a, seed) => { let h = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7); return a.map((x) => [x, (h = (h * 1103515245 + 12345) >>> 0)]).sort((x, y) => x[1] - y[1]).map((x) => x[0]); };

function reward(l, stars, why) {
  const p = P(), r = complete(p, l.id, stars);
  const a = (r.xp || r.essence) && C.award ? C.award(r.xp, r.essence) || {} : {};
  { const ls = levelsOf(l.script), li = ls.indexOf(l); C.trophy?.("decoder", 1 + Math.floor(Math.max(0, li) * 3 / ls.length), { won: true, perfect: stars === 3 }); } // Trophy Case (trophies.js)
  save(); C.showStats && C.showStats();
  const next = levelsOf(l.script)[levelsOf(l.script).indexOf(l) + 1];
  board.insertAdjacentHTML("beforeend", `<div class="dec-reward">${sparks()}${starRow(r.best, 3, true)}${r.newCodex ? `<div>📜 Codex: <b>${esc(r.newCodex)}</b></div>` : ""}
    ${r.xp ? `<div>+${r.xp} ✦ · +${r.essence} 💎</div>` : `<div class="dec-note">Replay: practice only</div>`}${l.src ? `<small>Source: ${esc(l.src)}</small>` : ""}</div>`);
  play("stars", r.best); if (r.xp && C.chime) setTimeout(() => C.chime(r.first ? 2 : 1), 300 + r.best * 220);
  C.say(why + (a.rankUp ? ` And… you've risen to ${a.rankUp}!` : ""));
  C.ui(`<div class="choices">${next ? `<button class="c main" type="button" id="dec-next">✦ Next: ${esc(next.title)}</button>` : ""}${stars < 3 ? `<button class="c" type="button" id="dec-again">↻ Try for ★★★</button>` : ""}
    <button class="c" type="button" id="dec-lv">↩ Levels</button></div>`);
  next && ($("dec-next").onclick = () => lesson(next));
  $("dec-again") && ($("dec-again").onclick = () => lesson(l));
  $("dec-lv").onclick = () => scriptMenu(l.script);
}

// ---- make-your-own levels ----
// Discord's Activity iframe is sandboxed without allow-forms, so a <form> never submits: use a button plus Enter.
function onGo(btnId, inputId, fn) { $(btnId).onclick = fn; $(inputId).onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); fn(); } }; }
function writeLevel(l) {
  const s = SCRIPTS[l.script];
  const draw = (name) => { const w = writeIn(l.script, name), sep = l.script === "ogham" ? " " : s.gap || " ";
    const txt = l.script === "ogham" ? s.start + w.join(sep) + s.end : w.join(sep);
    show(`<div class="dec-write ${s.font}${l.script === "egyptian" ? " cartouche" : ""}">${w.length ? esc(txt) : "<small>Type a name below</small>"}</div>`); return w; };
  C.say(l.lesson);
  C.ui(`<div class="form one" id="dec-wf"><label for="dec-name">Your name<input id="dec-name" maxlength="24" autocomplete="off" value="${esc(C.state.name && C.state.name !== "traveller" ? C.state.name : "")}"></label></div>
    <div class="choices"><button class="c main" type="button" id="dec-wf-go">✦ Carve it</button><button class="c" type="button" id="dec-back">↩ Levels</button></div>`);
  const inp = $("dec-name"); let had = 0; inp.oninput = () => { const w = draw(inp.value); if (w.length > had) play("carve", l.script, w.length - 1); had = w.length; }; draw(inp.value);
  onGo("dec-wf-go", "dec-name", () => { const w = draw(inp.value); if (!w.length) { C.say("Give me a name with letters in it."); return; }
    play("solve"); reward(l, 3, `There: ${inp.value.trim()}, as a ${s.name} carver might have written it.`); });
  $("dec-back").onclick = () => scriptMenu(l.script);
}
function dateLevel(l) {
  const p0 = (C.state.profile && C.state.profile.date) || "";
  const draw = (iso) => { const m = mayaOf(iso);
    show(m ? `<div class="dec-strip maya lc">${m.longCount.map((n, i) => `<div class="dec-cell"><em>${esc(LONG_COUNT[i][0])}</em>${mayaSvg(n, 44)}<b>${n}</b></div>`).join("")}</div>
      <div class="dec-round">${m.tone} ${esc(m.signName)} · ${esc(m.haabName)}</div><div class="dec-progress">${m.days.toLocaleString("en-US")} days since the creation date</div>` : `<div class="dec-learn"><p class="dec-note">Enter a date as year-month-day.</p></div>`); return m; };
  C.say(l.lesson);
  C.ui(`<div class="form one" id="dec-df"><label for="dec-date">Birth date<input id="dec-date" placeholder="1990-04-09" value="${esc(p0)}" autocomplete="off"></label></div>
    <div class="choices"><button class="c main" type="button" id="dec-df-go">✦ Count the days</button><button class="c" type="button" id="dec-back">↩ Levels</button></div>`);
  const inp = $("dec-date"); inp.oninput = () => draw(inp.value); draw(inp.value);
  onGo("dec-df-go", "dec-date", () => { const m = draw(inp.value); if (!m) { C.say("That date doesn't fit the count. Try year-month-day, like 1990-04-09."); return; }
    play("solve"); reward(l, 3, `${m.longCount.join(".")}: ${m.days.toLocaleString("en-US")} days since 4 Ajaw 8 Kumk'u. Your day sign is ${m.tone} ${m.signName}.`); });
  $("dec-back").onclick = () => scriptMenu(l.script);
}

// Try-on in the Essence store: lay a sample inscription on the tablet being tried.
export function tabletPreview(id, { tableEl } = {}) {
  styleOnce(); const it = SHOP.items.find((x) => x.id === id) || SHOP.items[0], l = byId(it.sample) || LEVELS[0];
  const t = tableEl || document.getElementById("table"); t.className = "table decoder"; t.dataset.tablet = tabletOf(it.id);
  t.innerHTML = `<div class="dec-board">${strip(l, target(l).slice(0, 4))}<div class="dec-progress">${esc(it.name)} · ${esc(l.title)}</div></div>`;
}
room.shop = { ...SHOP, preview: tabletPreview };
