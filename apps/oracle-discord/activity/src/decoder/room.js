// Rune and Glyph Decoder: a room of the Oracle Chamber. The Oracle teaches each script; the inscription is laid on
// the reading table; the player taps sounds to decode it, answers what it means, and earns ✦ and 💎 Essence.
// Plugs into main.js ROOMS: room.open(ctx) with ctx = { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, ... }.
import { SCRIPTS, LEVELS, SCRIPT_ORDER, LONG_COUNT, levelsOf, byId } from "./levels.js";
import { glyphsOf, target, taught, tiles, check, hint, starsFor, writeIn, mayaOf, complete, unlocked, scriptStars, dec, signOf } from "./engine.js";
import { FONTS } from "./fonts.gen.js";
import { CSS } from "./style.js";
import { GUIDES } from "./guide.js";

export const room = { id: "decoder", label: "Rune & Glyph Decoder", emoji: "🗝️", blurb: "Read runes, Ogham, hieroglyphs and Maya numbers", open };

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

function styleOnce() {
  if (document.getElementById("dec-style")) return;
  const f = (fam, b64) => `@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:block}`;
  const st = document.createElement("style"); st.id = "dec-style";
  st.textContent = f("dec-runic", FONTS.runic) + f("dec-ogham", FONTS.ogham) + f("dec-egy", FONTS.egy) + CSS;
  document.head.append(st);
}
// The board is drawn into the reading table (ctx.tableEl); the Chamber's greet() puts the table back.
function mountBoard() {
  const t = C.tableEl || $("table"); t.className = "table decoder";
  t.innerHTML = `<div class="dec-board" aria-live="polite"></div>`; board = t.firstChild;
}
function leave() { C.greet(); }
const show = (html) => { board.innerHTML = html; };
const starRow = (n, of = 3) => `<span class="dec-stars" aria-label="${n} of ${of} stars">${"★".repeat(n)}<i>${"★".repeat(of - n)}</i></span>`;
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
    return `<div class="dec-medal"><div class="dec-glyph ${s.font}">${k === "maya" ? mayaSvg(13, 40) : esc(sample(k))}</div><b>${esc(s.name)}</b><small>${scriptStars(p, k)} / ${n * 3} ★</small></div>`; }).join("")}</div>`);
  C.say(solved ? `Back to the old scripts. You've decoded ${solved} of ${LEVELS.length} so far. Which one calls to you?`
    : "Before the Oracle could read the stars, someone had to read the stones. Four scripts, four ancient peoples. Choose one, and I'll teach you its signs.");
  C.ui(`<div class="choices">${SCRIPT_ORDER.map((k) => `<button class="c" type="button" data-s="${k}">${esc(SCRIPTS[k].emoji)} ${esc(SCRIPTS[k].name)}</button>`).join("")}
    <button class="c" type="button" id="dec-out">↩ Back to the Oracle</button></div>`);
  $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => scriptMenu(b.dataset.s)));
  $("dec-out").onclick = leave;
}
const sample = (k) => ({ futhark: "ᚠᚢᚦᚨᚱᚲ", ogham: "᚛ᚁᚂᚃᚄᚅ᚜", egyptian: "𓊪𓏏𓍯𓃭" }[k] || "");

function scriptMenu(k) {
  const s = SCRIPTS[k], p = P(); C.cap(`${s.emoji} ${s.name}`); C.clearReading();
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
  const s = SCRIPTS[l.script]; C.cap(`${s.emoji} ${l.title}`); C.clearReading();
  if (l.kind === "write") return writeLevel(l);
  if (l.kind === "date") return dateLevel(l);
  const fresh = l.script === "maya" ? [] : Array.from(l.teach || "").map((g) => signOf(l.script, g));
  show(fresh.length ? `<div class="dec-learn">${fresh.map((x) => `<div class="dec-card"><span class="${s.font}">${esc(x.g)}</span><b>${esc(x.v)}</b><small>${esc(x.n)} · ${esc(x.gl)}</small></div>`).join("")}</div>`
    : l.script === "maya" ? `<div class="dec-learn">${[[0, "shell = 0"], [1, "dot = 1"], [5, "bar = 5"], [8, "5 + 3 = 8"], [19, "15 + 4 = 19"]].map(([n, t]) => `<div class="dec-card">${mayaSvg(n, 46)}<b>${n}</b><small>${t}</small></div>`).join("")}
      ${l.longCount ? `<div class="dec-lc-key">${LONG_COUNT.map(([n, d]) => `<span><b>${esc(n)}</b> ${d.toLocaleString("en-US")} days</span>`).join("")}</div>` : ""}</div>`
    : `<div class="dec-learn"><p class="dec-note">No new signs: you know them all. Decode it from memory.</p></div>`);
  C.say(l.lesson);
  C.ui(`<div class="choices"><button class="c main" type="button" id="dec-go">✦ I'm ready: decode</button>${guideBtn(l.script)}<button class="c" type="button" id="dec-back">↩ Levels</button></div>`);
  wireGuide(l.script);
  $("dec-go").onclick = () => puzzle(l); $("dec-back").onclick = () => scriptMenu(l.script);
}

function strip(l, picks, { wrongAt = -1, peek = false } = {}) {
  const s = SCRIPTS[l.script], cells = []; let k = 0;
  if (l.script === "maya") {
    l.text.forEach((n, i) => { const v = picks[k]; cells.push(`<div class="dec-cell${k === picks.length ? " now" : ""}${k === wrongAt ? " bad" : ""}">${l.longCount ? `<em>${esc(LONG_COUNT[i][0])}</em>` : ""}${mayaSvg(n, l.longCount ? 44 : 56)}<b>${v ?? "&nbsp;"}</b></div>`); k++; });
    return `<div class="dec-strip maya${l.longCount ? " lc" : ""}">${cells.join("")}</div>${l.round ? `<div class="dec-round">${esc(l.round)}</div>` : ""}`;
  }
  for (const g of Array.from(l.text)) {
    const sg = signOf(l.script, g);
    if (!sg) { cells.push(`<div class="dec-cell sep ${s.font}">${g === " " ? "&#x1680;" : esc(g)}<b>&nbsp;</b></div>`); continue; }
    const v = picks[k]; cells.push(`<div class="dec-cell${k === picks.length ? " now" : ""}${k === wrongAt ? " bad" : ""}"><span class="${s.font}">${esc(g)}</span><b>${v ? esc(v) : peek ? `<i>${esc(sg.v)}</i>` : "&nbsp;"}</b></div>`); k++;
  }
  return `<div class="dec-strip ${l.script}${l.cartouche ? " cartouche" : ""}${k > 8 ? " long" : ""}">${cells.join("")}</div>`;
}

function puzzle(l) {
  C.clearReading(); // the study guide closes while decoding: only the codebook (one star) helps here
  const s = SCRIPTS[l.script], st = { picks: [], peeks: 0, hints: 0, misses: 0, book: false };
  const draw = (wrongAt = -1) => {
    show(strip(l, st.picks, { wrongAt }) + (st.book ? codebook(l) : `<div class="dec-progress">${st.picks.length} / ${target(l).length}</div>`));
    const now = board.querySelector(".now"); now && now.scrollIntoView && now.scrollIntoView({ block: "nearest" });
  };
  C.say(l.script === "maya" ? "Read each number on the table. Tap its value." : "Tap the sound of each sign, in order. Use the codebook if memory fails you. It costs a star.");
  C.ui(`<div class="dec-tiles ${l.script === "maya" ? "nums" : ""}">${tiles(l).map((v) => `<button class="c dec-tile" type="button" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>
    <div class="choices"><button class="c" type="button" id="dec-book">📖 Codebook</button><button class="c" type="button" id="dec-hint">💡 Hint</button><button class="c" type="button" id="dec-undo">⌫ Undo</button><button class="c" type="button" id="dec-quit">↩ Leave</button></div>`);
  const tap = (v) => {
    const r = check(l, [...st.picks, v]);
    if (!r.ok) { st.misses++; draw(st.picks.length); C.say(st.misses > 2 ? "Not that one. Open the codebook, there's no shame in it." : "Not quite. Look again."); return; }
    st.picks.push(v); draw();
    if (r.done) { C.chime && C.chime(); return solved(l, st); }
  };
  $("ui").querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => tap(b.dataset.v)));
  $("dec-book").onclick = () => { st.book = !st.book; if (st.book) st.peeks++; $("dec-book").textContent = st.book ? "📖 Close codebook" : "📖 Codebook"; draw(); };
  $("dec-hint").onclick = () => { const v = hint(l, st.picks); if (v == null) return; st.hints++; C.say(`The next one is “${v}”.`); tap(v); };
  $("dec-undo").onclick = () => { st.picks.pop(); draw(); };
  $("dec-quit").onclick = () => scriptMenu(l.script);
  draw();
}
function codebook(l) {
  const s = SCRIPTS[l.script];
  if (l.script === "maya") return `<div class="dec-book"><b>Codebook</b> dot = 1 · bar = 5 · shell = 0</div>`;
  return `<div class="dec-book"><b>Codebook</b><div>${taught(l).map((x) => `<span><i class="${s.font}">${esc(x.g)}</i>${esc(x.v)}</span>`).join("")}</div></div>`;
}

function solved(l, st) {
  const stars = starsFor(st), read = l.script === "maya" ? target(l).join(l.longCount ? "." : ", ") : target(l).join("");
  show(strip(l, st.picks) + `<div class="dec-done">Decoded: <b>${esc(read)}</b> ${starRow(stars)}</div>`);
  C.say(`Yes! “${read}”. Now: what does it tell us?`);
  setTimeout(() => meaning(l, stars), 400);
}
function meaning(l, stars) {
  const q = l.q, order = shuffle(q.choices.map((_, i) => i), l.id);
  C.ui(`<div class="dec-q"><p>${esc(q.ask)}</p>${order.map((i) => `<button class="c" type="button" data-a="${i}">${esc(q.choices[i])}</button>`).join("")}</div><div class="choices">${guideBtn(l.script)}</div>`);
  wireGuide(l.script);
  $("ui").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
    if (+b.dataset.a !== q.right) { b.disabled = true; C.say("Hmm, no. The stones say otherwise. Try again."); return; }
    reward(l, stars, q.why);
  }));
}
const shuffle = (a, seed) => { let h = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7); return a.map((x) => [x, (h = (h * 1103515245 + 12345) >>> 0)]).sort((x, y) => x[1] - y[1]).map((x) => x[0]); };

function reward(l, stars, why) {
  const p = P(), r = complete(p, l.id, stars);
  const a = (r.xp || r.essence) && C.award ? C.award(r.xp, r.essence) || {} : {};
  save(); C.showStats && C.showStats();
  const next = levelsOf(l.script)[levelsOf(l.script).indexOf(l) + 1];
  board.insertAdjacentHTML("beforeend", `<div class="dec-reward">${starRow(r.best)}${r.newCodex ? `<div>📜 Codex: <b>${esc(r.newCodex)}</b></div>` : ""}
    ${r.xp ? `<div>+${r.xp} ✦ · +${r.essence} 💎</div>` : `<div class="dec-note">Replay: practice only</div>`}${l.src ? `<small>Source: ${esc(l.src)}</small>` : ""}</div>`);
  C.say(why + (a.rankUp ? ` And… you've risen to ${a.rankUp}!` : ""));
  C.ui(`<div class="choices">${next ? `<button class="c main" type="button" id="dec-next">✦ Next: ${esc(next.title)}</button>` : ""}${stars < 3 ? `<button class="c" type="button" id="dec-again">↻ Try for ★★★</button>` : ""}
    <button class="c" type="button" id="dec-lv">↩ Levels</button></div>`);
  next && ($("dec-next").onclick = () => lesson(next));
  $("dec-again") && ($("dec-again").onclick = () => lesson(l));
  $("dec-lv").onclick = () => scriptMenu(l.script);
}

// ---- make-your-own levels ----
function writeLevel(l) {
  const s = SCRIPTS[l.script];
  const draw = (name) => { const w = writeIn(l.script, name), sep = l.script === "ogham" ? " " : s.gap || " ";
    const txt = l.script === "ogham" ? s.start + w.join(sep) + s.end : w.join(sep);
    show(`<div class="dec-write ${s.font}${l.script === "egyptian" ? " cartouche" : ""}">${w.length ? esc(txt) : "<small>Type a name below</small>"}</div>`); return w; };
  C.say(l.lesson);
  C.ui(`<form class="form one" id="dec-wf"><label for="dec-name">Your name<input id="dec-name" maxlength="24" autocomplete="off" value="${esc(C.state.name && C.state.name !== "traveller" ? C.state.name : "")}"></label></form>
    <div class="choices"><button class="c main" type="submit" form="dec-wf">✦ Carve it</button><button class="c" type="button" id="dec-back">↩ Levels</button></div>`);
  const inp = $("dec-name"); inp.oninput = () => draw(inp.value); draw(inp.value);
  $("dec-wf").onsubmit = (e) => { e.preventDefault(); const w = draw(inp.value); if (!w.length) { C.say("Give me a name with letters in it."); return; }
    C.chime && C.chime(); reward(l, 3, `There: ${inp.value.trim()}, as a ${s.name} carver might have written it.`); };
  $("dec-back").onclick = () => scriptMenu(l.script);
}
function dateLevel(l) {
  const p0 = (C.state.profile && C.state.profile.date) || "";
  const draw = (iso) => { const m = mayaOf(iso);
    show(m ? `<div class="dec-strip maya lc">${m.longCount.map((n, i) => `<div class="dec-cell"><em>${esc(LONG_COUNT[i][0])}</em>${mayaSvg(n, 44)}<b>${n}</b></div>`).join("")}</div>
      <div class="dec-round">${m.tone} ${esc(m.signName)} · ${esc(m.haabName)}</div><div class="dec-progress">${m.days.toLocaleString("en-US")} days since the creation date</div>` : `<div class="dec-learn"><p class="dec-note">Enter a date as year-month-day.</p></div>`); return m; };
  C.say(l.lesson);
  C.ui(`<form class="form one" id="dec-df"><label for="dec-date">Birth date<input id="dec-date" placeholder="1990-04-09" value="${esc(p0)}" autocomplete="off"></label></form>
    <div class="choices"><button class="c main" type="submit" form="dec-df">✦ Count the days</button><button class="c" type="button" id="dec-back">↩ Levels</button></div>`);
  const inp = $("dec-date"); inp.oninput = () => draw(inp.value); draw(inp.value);
  $("dec-df").onsubmit = (e) => { e.preventDefault(); const m = draw(inp.value); if (!m) { C.say("That date doesn't fit the count. Try year-month-day, like 1990-04-09."); return; }
    C.chime && C.chime(); reward(l, 3, `${m.longCount.join(".")}: ${m.days.toLocaleString("en-US")} days since 4 Ajaw 8 Kumk'u. Your day sign is ${m.tone} ${m.signName}.`); };
  $("dec-back").onclick = () => scriptMenu(l.script);
}
