// Sacred Geometry Builder: a room of the Oracle Chamber. The Oracle teaches a construction; the player draws it on the
// reading table with only a compass and a straightedge (tap two points), answers a question about the maths, and earns
// ✦ and 💎 Essence. Three tiers: Apprentice (the next move glows), Adept (written steps; "Show me" costs a star),
// Master (only the goal). Rules in engine.js, constructions in levels.js, solids in solids.js, guide in guide.js.
// Plugs into main.js ROOMS: room.open(ctx) with ctx = { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl }.
import { LEVELS, TIERS, byId, FRUIT } from "./levels.js";
import { makeBoard, place, undo, pointsOf, all, covers, goalsOf, progress, nextStep, objOf, par, starsFor, quizStars, complete, geo, levelsOf, unlocked, tierStars, titleOf, TITLES, totalStars } from "./engine.js";
import { SOLIDS, faceChoices, solidSvg } from "./solids.js";
import { GUIDE } from "./guide.js";
import { CSS } from "./style.js";
import { SETS, TALK, KIND, TAB, setOf } from "./shop.js";

let C = null;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = (id) => document.getElementById(id);
const P = () => C.state.prog;
const save = () => { try { C.saveProgress(); } catch {} };
const starRow = (n, of = 3) => `<span class="geo-stars" aria-label="${n} of ${of} stars">${"★".repeat(n)}<i>${"★".repeat(of - n)}</i></span>`;
const f1 = (n) => (Math.round(n * 10) / 10).toString();

function styleOnce() {
  if (document.getElementById("geo-style")) return;
  const st = document.createElement("style"); st.id = "geo-style"; st.textContent = CSS; document.head.append(st);
}

// ---- drawing the board ----
const VB = "-200 -150 400 300";
/** Zoom the board to the level's own figure (inside the default frame), so small figures fill a phone's narrow pane. */
function viewOf(level) {
  if (level._vb) return level._vb;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  const objs = [...(level.given.objs || []), ...level.steps].map(objOf);
  (level.given.pts || []).forEach((p) => add(p[0], p[1]));
  objs.forEach((o) => (o.t === "c" ? (add(o.c[0] - o.r, o.c[1] - o.r), add(o.c[0] + o.r, o.c[1] + o.r)) : (add(...o.a), add(...o.b))));
  const m = 14; x0 = Math.max(-200, x0 - m); y0 = Math.max(-150, y0 - m); x1 = Math.min(200, x1 + m); y1 = Math.min(150, y1 + m);
  return (level._vb = `${f1(x0)} ${f1(y0)} ${f1(x1 - x0)} ${f1(y1 - y0)}`);
}
function decor(set) {
  let s = "";
  if (set.grid) s += `<defs><pattern id="geo-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${set.grid}" stroke-width=".8"/></pattern></defs><rect x="-600" y="-400" width="1200" height="800" fill="url(#geo-grid)"/>`;
  if (set.stars) for (let i = 0; i < 60; i++) s += `<circle class="bigstar" cx="${((i * 137.5) % 400) - 200}" cy="${((i * 71.3) % 300) - 150}" r="${(i % 3) * 0.35 + 0.4}" opacity="${0.25 + (i % 5) * 0.12}"/>`;
  return s;
}
const objSvg = (o, cls, extra = "") => o.t === "c"
  ? `<circle class="o ${cls}" cx="${f1(o.c[0])}" cy="${f1(o.c[1])}" r="${f1(o.r)}" ${extra}/>`
  : `<line class="o ${cls}" x1="${f1(o.a[0])}" y1="${f1(o.a[1])}" x2="${f1(o.b[0])}" y2="${f1(o.b[1])}" ${extra}/>`;
/** The whole board as SVG. o = { level, board, set, sel, ghost, done, showGoal } */
export function boardSvg({ level, board, set, sel = null, ghost = null, done = false, showGoal = false }) {
  const goals = goalsOf(level), pts = pointsOf(board), hit = (x) => goals.some((g) => covers(x, g));
  const cls = ["geo-svg", done ? "done" : "", set.glow ? "glow" : "", set.chalk ? "chalk" : "", set.jewels ? "jewels" : ""].join(" ");
  const style = `--geo-ink:${set.ink};--geo-given:${set.given};--geo-pt:${set.pt};--geo-done:${set.done}`;
  let jw = 0;
  const drawn = board.drawn.map((o) => { const j = set.jewels && o.t === "c" ? set.jewels[jw++ % set.jewels.length] : null;
    return objSvg(o, `drw${hit(o) ? " hit" : ""}${j ? " jewel" : ""}`, j ? `style="stroke:${j};fill:${j}"` : ""); }).join("");
  const given = board.given.objs.map((o) => objSvg(o, "giv")).join("");
  const goal = showGoal && !done ? goals.filter((g) => !all(board).some((o) => covers(o, g))).map((g) => objSvg(g, "goal")).join("") : "";
  const gh = ghost ? objSvg(objOf(ghost), "ghost") + [ghost.t === "c" ? ghost.c : ghost.a, ghost.t === "c" ? ghost.p : ghost.b].map((p) => `<circle class="ghost-pt" cx="${f1(p[0])}" cy="${f1(p[1])}" r="7"/>`).join("") : "";
  const labels = [...board.given.pts, ...(level.names || [])].filter((p) => p[2] && pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1));
  const isGiven = (q) => board.given.pts.some((p) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1);
  const dots = pts.map((q) => `<circle class="pt${isGiven(q) ? " giv-pt" : ""}" cx="${f1(q[0])}" cy="${f1(q[1])}" r="${isGiven(q) ? 3.6 : 2.6}"/>`).join("");
  const lbl = labels.map((p) => `<text class="lbl" x="${f1(p[0] + 6)}" y="${f1(p[1] - 6)}">${esc(p[2])}</text>`).join("");
  const sl = sel ? `<circle class="sel" cx="${f1(sel[0])}" cy="${f1(sel[1])}" r="8"/>` : "";
  return `<svg class="${cls}" viewBox="${viewOf(level)}" preserveAspectRatio="xMidYMid meet" style="${style}" role="img" aria-label="Drawing board: ${esc(level.title)}">
    ${decor(set)}<rect class="geo-hit" x="-600" y="-400" width="1200" height="800" fill="transparent"/>
    <g>${goal}${given}${drawn}${gh}</g><line class="o rubber" id="geo-rubber" x1="0" y1="0" x2="0" y2="0" visibility="hidden"/><circle class="o rubber" id="geo-rubberc" cx="0" cy="0" r="0" visibility="hidden"/>
    <g pointer-events="none">${dots}${lbl}${sl}</g></svg>`;
}
function mount(set) {
  const t = C.tableEl || $("table"); t.className = "table geometry"; t.style.setProperty("--geo-bg", set.bg); return t;
}

// ---- Codex ----
export function geometryCodex(prog, e = esc) {
  const g = geo(prog), t = titleOf(prog);
  return `<div class="cx"><div class="cx-h"><span>📐 Sacred Geometry: ${e(t.name)}</span><span class="note">${totalStars(prog)} / ${LEVELS.length * 3} ★</span></div>
    <div class="bar"><i style="width:${(totalStars(prog) / (LEVELS.length * 3)) * 100}%"></i></div>
    ${g.codex.length ? `<div class="chips">${g.codex.map((c) => `<span>${e(c)}</span>`).join("")}</div>` : ""}</div>`;
}

// ---- study guide ----
export const guideHtml = () => `<div class="geo-guide"><h3>📖 ${esc(GUIDE.title)}</h3>${GUIDE.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${esc(t)}</p>`).join("")}</details>`).join("")}</div>`;
function toggleGuide(btn) {
  const rb = $("reading-body"), on = !rb.querySelector(".geo-guide");
  rb.innerHTML = on ? guideHtml() : "";
  if (btn) btn.textContent = on ? "📖 Close study guide" : "📖 Study guide";
  if (on) rb.querySelector(".geo-guide").scrollIntoView({ behavior: "smooth", block: "start" });
}
const guideBtn = `<button class="c" type="button" id="geo-guide">📖 Study guide</button>`;
const wireGuide = () => { const b = $("geo-guide"); if (b) b.onclick = () => toggleGuide(b); };

// ---- the room ----
function open(ctx) { C = ctx; styleOnce(); const p = P(); if (!p.geo) p.geo = SETS[0].id; home(); }
function leave() { stopSpin(); C.greet(); }

function home() {
  stopSpin(); C.clearReading(); C.cap("📐 Sacred Geometry Builder");
  const set = setOf(P()), t = mount(set), fl = byId("m2"), b = makeBoard(fl);
  fl.steps.forEach((s) => b.drawn.push(objOf(s)));
  t.innerHTML = boardSvg({ level: fl, board: b, set, done: true });
  const n = totalStars(P());
  C.say(n ? `Back at the drawing table. ${n} stars so far, ${titleOf(P()).name}. Choose your circle of study.`
    : "No measuring, no numbers: only a compass and a straightedge, like Euclid's students in Alexandria. Every figure on this table can be drawn that way. Choose your circle of study.");
  C.ui(`<div class="choices">${TIERS.map((T) => `<button class="c" type="button" data-t="${T.n}">${["①", "②", "③"][T.n - 1]} ${esc(T.name)}: ${esc(T.what)} <span class="note">${tierStars(P(), T.n)} / ${levelsOf(T.n).length * 3} ★</span></button>`).join("")}
    ${guideBtn}<button class="c" type="button" id="geo-out">↩ Back to the Oracle</button></div>`);
  $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => tierMenu(+b.dataset.t)));
  wireGuide(); $("geo-out").onclick = leave;
}

function tierMenu(n) {
  stopSpin(); const T = TIERS[n - 1], p = P(); C.clearReading(); C.cap(`📐 ${T.name}: ${T.what}`);
  C.say(`${T.name}. ${T.note}`);
  C.ui(`<div class="geo-levels">${levelsOf(n).map((l, i) => { const ok = unlocked(p, l.id), st = geo(p).solved[l.id] || 0;
    return `<button class="c geo-lv" type="button" data-l="${l.id}" ${ok ? "" : "disabled"}><span>${l.emoji} ${i + 1}. ${esc(l.title)}</span>${ok ? starRow(st) : "🔒"}</button>`; }).join("")}</div>
    <div class="choices">${guideBtn}<button class="c" type="button" id="geo-home">↩ All circles</button></div>`);
  $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => start(byId(b.dataset.l))));
  wireGuide(); $("geo-home").onclick = home;
}

function start(l) { return l.kind === "solids" ? solids(l) : build(l); }

// ---- a construction ----
function build(l) {
  stopSpin(); C.clearReading(); C.cap(`${l.emoji} ${l.title}`);
  const set = setOf(P()), t = mount(set);
  const st = { board: makeBoard(l), tool: l.steps[0].t === "c" ? "compass" : "ruler", sel: null, ghostFor: -1, done: false };
  const tier = l.tier;
  let svg = null, pts = [];
  const ghost = () => { const n = nextStep(l, st.board); if (!n || st.done) return null; return tier === 1 || st.ghostFor === n.i ? n : null; };
  const draw = () => {
    const g = ghost(); if (tier === 1 && g) st.tool = g.t === "c" ? "compass" : "ruler";
    t.innerHTML = boardSvg({ level: l, board: st.board, set, sel: st.sel, ghost: g, done: st.done, showGoal: tier < 3 });
    svg = t.querySelector("svg"); svg.classList.add("tool-" + st.tool); pts = pointsOf(st.board);
    svg.onpointerdown = tap; svg.onpointermove = hover; svg.onpointerleave = () => rubber(null);
    toolButtons(); status();
  };
  const toSvg = (e) => { const m = svg.getScreenCTM(); return m ? [(e.clientX - m.e) / m.a, (e.clientY - m.f) / m.d, 24 / m.a] : null; };
  const snap = (e) => { const s = toSvg(e); if (!s) return null; let best = null, bd = s[2];
    for (const q of pts) { const d = Math.hypot(q[0] - s[0], q[1] - s[1]); if (d < bd) { bd = d; best = q; } } return best; };
  const rubber = (q) => {
    const L = svg && svg.querySelector("#geo-rubber"), R = svg && svg.querySelector("#geo-rubberc"); if (!L) return;
    L.setAttribute("visibility", "hidden"); R.setAttribute("visibility", "hidden");
    if (!q || !st.sel) return;
    if (st.tool === "compass") { R.setAttribute("cx", st.sel[0]); R.setAttribute("cy", st.sel[1]); R.setAttribute("r", Math.hypot(q[0] - st.sel[0], q[1] - st.sel[1])); R.setAttribute("visibility", "visible"); }
    else { L.setAttribute("x1", st.sel[0]); L.setAttribute("y1", st.sel[1]); L.setAttribute("x2", q[0]); L.setAttribute("y2", q[1]); L.setAttribute("visibility", "visible"); }
  };
  function hover(e) { if (st.sel) rubber(snap(e)); }
  function tap(e) {
    if (st.done) return; e.preventDefault();
    const q = snap(e);
    if (!q) { if (st.sel) { st.sel = null; draw(); } else C.cap("Tap a point: a dot where lines or circles start or cross"); return; }
    if (!st.sel) { st.sel = q; draw(); C.cap(st.tool === "compass" ? "🧭 Centre set: now tap a point the circle passes through" : "📏 Now tap the second point"); return; }
    if (Math.hypot(q[0] - st.sel[0], q[1] - st.sel[1]) < 1) { st.sel = null; draw(); C.cap(`${l.emoji} ${l.title}`); return; }
    const o = place(st.board, st.tool, st.sel, q); st.sel = null;
    if (!o) C.say("That one's already on the table.");
    C.cap(`${l.emoji} ${l.title}`); draw();
    if (progress(l, st.board).complete) finish();
  }
  const toolButtons = () => { const c = $("geo-compass"), r = $("geo-ruler"); if (c) c.classList.toggle("on", st.tool === "compass"); if (r) r.classList.toggle("on", st.tool === "ruler"); };
  const status = () => {
    const pr = progress(l, st.board), rb = $("reading-body"); if (rb.querySelector(".geo-guide")) return;
    rb.innerHTML = `<div class="geo-card"><h3>${l.emoji} ${esc(l.title)}</h3><div class="geo-goal">Goal: <b>${pr.done} / ${pr.total}</b> drawn · moves ${st.board.moves} (par ${par(l)})${st.board.hints ? ` · hints ${st.board.hints}` : ""}</div>
      ${tier < 3 ? `<ol class="geo-how">${l.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ol>` : `<p class="note">Master: work out the moves yourself. 💡 Show me costs a star.</p>`}</div>`;
  };
  C.say(l.lesson);
  C.ui(`<div class="choices geo-tools"><button class="c" type="button" id="geo-compass">🧭 Compass</button><button class="c" type="button" id="geo-ruler">📏 Straightedge</button>
    ${tier > 1 ? `<button class="c" type="button" id="geo-hint">💡 Show me</button>` : ""}<button class="c" type="button" id="geo-undo">⌫ Undo</button><button class="c" type="button" id="geo-reset">↺ Start over</button>
    ${guideBtn}<button class="c" type="button" id="geo-back">↩ Levels</button></div>`);
  $("geo-compass").onclick = () => { st.tool = "compass"; st.sel = null; draw(); };
  $("geo-ruler").onclick = () => { st.tool = "ruler"; st.sel = null; draw(); };
  if ($("geo-hint")) $("geo-hint").onclick = () => { const n = nextStep(l, st.board); if (!n || st.done) return;
    if (st.ghostFor !== n.i) { st.ghostFor = n.i; st.board.hints++; }
    st.tool = n.t === "c" ? "compass" : "ruler"; C.say(n.t === "c" ? "Here: put the compass point on the first glowing dot, and open it to the second." : "Here: lay the straightedge between the two glowing dots."); draw(); };
  $("geo-undo").onclick = () => { if (st.done) return; undo(st.board); st.sel = null; draw(); };
  $("geo-reset").onclick = () => build(l);
  $("geo-guide").onclick = () => { toggleGuide($("geo-guide")); if (!$("reading-body").innerHTML) status(); };
  $("geo-back").onclick = () => tierMenu(l.tier);
  // Apprentice: the ghost is always on and picks the tool for the next move
  draw();

  function finish() {
    st.done = true; draw(); C.chime && C.chime();
    const stars = starsFor({ hints: st.board.hints, moves: st.board.moves, par: par(l) });
    C.say(`There it is: ${l.title}, drawn true. Now, what does it tell us?`);
    setTimeout(() => quiz(l, stars), 500);
  }
}

// ---- the question, then the reward ----
const shuffle = (a, seed) => { let h = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7); return a.map((x) => [x, (h = (h * 1103515245 + 12345) >>> 0)]).sort((x, y) => x[1] - y[1]).map((x) => x[0]); };
function quiz(l, stars, onWrong) {
  const q = l.q, order = shuffle(q.choices.map((_, i) => i), l.id);
  C.ui(`<div class="geo-q"><p>${esc(q.ask)}</p><div class="choices">${order.map((i) => `<button class="c" type="button" data-a="${i}">${esc(q.choices[i])}</button>`).join("")}</div></div><div class="choices">${guideBtn}</div>`);
  wireGuide();
  $("ui").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
    if (+b.dataset.a !== q.right) { b.disabled = true; onWrong && onWrong(); C.say("Not quite. Measure twice, as the masons say. Try again."); return; }
    reward(l, typeof stars === "function" ? stars() : stars);
  }));
}
function reward(l, stars) {
  const p = P(), r = complete(p, l.id, stars);
  const a = (r.xp || r.essence) && C.award ? C.award(r.xp, r.essence) || {} : {};
  save(); C.showStats && C.showStats();
  const list = levelsOf(l.tier), next = list[list.indexOf(l) + 1];
  $("reading-body").innerHTML = `<div class="geo-card"><h3>${l.emoji} ${esc(l.title)} ${starRow(r.best)}</h3><p>${esc(l.q.why)}</p>
    ${r.newCodex ? `<p>📜 Codex: <b>${esc(r.newCodex)}</b></p>` : ""}<p>${r.xp ? `+${r.xp} ✦ · +${r.essence} 💎` : `<span class="note">Replay: practice only</span>`}</p><small>Source: ${esc(l.src)}</small></div>`;
  C.say(l.fact + (a.rankUp ? ` And… you've risen to ${a.rankUp}!` : ""));
  C.ui(`<div class="choices">${next ? `<button class="c main" type="button" id="geo-next">✦ Next: ${esc(next.title)}</button>` : ""}${r.stars < 3 ? `<button class="c" type="button" id="geo-again">↻ Try for ★★★</button>` : ""}
    <button class="c" type="button" id="geo-lv">↩ Levels</button></div>`);
  next && ($("geo-next").onclick = () => start(next));
  $("geo-again") && ($("geo-again").onclick = () => start(l));
  $("geo-lv").onclick = () => tierMenu(l.tier);
}

// ---- the five Platonic solids ----
let spin = 0;
function stopSpin() { if (spin) cancelAnimationFrame(spin); spin = 0; }
function solids(l) {
  stopSpin(); C.clearReading(); C.cap(`${l.emoji} ${l.title}`);
  const set = setOf(P()), t = mount(set), st = { i: 0, show: 0, wrong: 0, seen: [] };
  const style = `--geo-ink:${set.ink};--geo-given:${set.given};--geo-pt:${set.pt};--geo-done:${set.done}`;
  t.innerHTML = `<svg class="geo-svg${set.glow ? " glow" : ""}" viewBox="${VB}" preserveAspectRatio="xMidYMid meet" style="${style}" role="img" aria-label="A turning Platonic solid">${decor(set)}<g id="geo-solid"></g></svg>`;
  const g = t.querySelector("#geo-solid"), reduced = C.reduced, t0 = performance.now();
  const frame = (now) => { if (!g.isConnected) { spin = 0; return; } const s = SOLIDS[st.show];
    g.innerHTML = solidSvg(s, reduced ? 0.6 : (now - t0) / 2200, 110); if (!reduced) spin = requestAnimationFrame(frame); };
  spin = requestAnimationFrame(frame);
  const info = () => { $("reading-body").innerHTML = `<div class="geo-card"><h3>Solids counted</h3><div class="geo-solid-info">${st.seen.map((s) =>
    `<span><b>${esc(s.name)}</b><br>${s.faces} ${esc(s.face)}, ${s.meet} at each corner<br>V ${s.v.length} · E ${s.e.length} · F ${s.faces}<br>Plato: ${esc(s.element)}</span>`).join("")}</div></div>`; };
  const ask = () => {
    const s = SOLIDS[st.i]; if (!s) { C.say(l.how[1].replace("Then: ", "Last one. ")); return quiz(l, () => quizStars(st.wrong), () => st.wrong++); }
    st.show = st.i; if (reduced) { stopSpin(); spin = requestAnimationFrame(frame); }
    C.cap(`${l.emoji} ${st.i + 1} of 5: ${s.name}`);
    C.say(st.i === 0 ? l.lesson + ` First, the ${s.name.toLowerCase()}. How many faces?` : `Next, the ${s.name.toLowerCase()}. How many faces?`);
    C.ui(`<div class="choices">${faceChoices(s).map((n) => `<button class="c" type="button" data-f="${n}">${n} faces</button>`).join("")}</div>
      <div class="choices">${guideBtn}<button class="c" type="button" id="geo-back">↩ Levels</button></div>`);
    wireGuide(); $("geo-back").onclick = () => { stopSpin(); tierMenu(l.tier); };
    $("ui").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
      if (+b.dataset.f !== s.faces) { b.disabled = true; st.wrong++; C.say("Count again. Follow one face to its neighbours, all the way round."); return; }
      C.chime && C.chime(); st.seen.push(s); info(); C.say(`Yes, ${s.faces} ${s.face}. ${s.why}`);
      st.i++; C.ui(`<div class="choices"><button class="c main" type="button" id="geo-on">✦ ${st.i < 5 ? "Next solid" : "One last question"}</button></div>`); $("geo-on").onclick = ask;
    }));
  };
  ask();
}

// ---- store shelf: Geometer's sets ----
function preview(id, ctx) {
  styleOnce(); const set = SETS.find((s) => s.id === id) || SETS[0], t = ctx.tableEl, l = byId("g5"), b = makeBoard(l);
  l.steps.forEach((s) => b.drawn.push(objOf(s))); [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]].forEach(([i, j]) => b.drawn.push({ t: "s", a: l.steps[i].c, b: l.steps[j].c }));
  t.className = "table geometry"; t.style.setProperty("--geo-bg", set.bg);
  t.innerHTML = boardSvg({ level: l, board: b, set, done: true });
}
export const shop = { kind: KIND, label: TAB[1], items: SETS, talk: TALK, preview };

export const room = { id: "geometry", label: "Sacred Geometry Builder", emoji: "📐", blurb: "Draw the Flower of Life, φ and the Platonic solids with compass and straightedge", open, codexHtml: geometryCodex, shop };
export { TITLES, FRUIT };
