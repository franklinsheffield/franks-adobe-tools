// Star Lore Navigator: a room of the Oracle Chamber. The Oracle names something in the sky and how to find it; the
// player taps it on a real star chart (Hipparcos positions) in the table pane, then hears the myths different cultures
// told and the real astronomy, and answers one question on it. Rules and sky maths in engine.js, decks in lore.js.
// Mounted via main.js ROOMS; sells sky themes on the Essence store's "🔭 Star Lore" shelf (store.js registerShelf).
import { LINES, CON_NAMES } from "./sky.gen.js";
import { GUIDE } from "./guide.js";
import { domeOpen, ping, gutter, shimmer, discover, darkness, verdict } from "./sfx.js";
import { LEVELS, ALL, LANTERNS, keyOf, room as starsOf, foundCount, titleOf, nextTitle, byId, nextTarget, start, useHint, tap, quizChoices, answer,
  settle, findPts, quizPts, viewFor, chartStars, toScreen, toSky, nearestStar, targetStars, targetCentre, galacticEquator, bestMonth, seenFrom,
  conName, nameOf, sep, KIND, THEMES, themeOf } from "./engine.js";

let W = 400, H = 300;
/** Fit the chart to the table pane's shape (400 units wide). */
function fit(el) { const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; W = 400; H = r && r.width > 50 ? Math.round(Math.max(220, Math.min(520, (400 * r.height) / r.width))) : 300; }
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const f1 = (n) => n.toFixed(1);

// ---- the chart ----
const PAL = {
  "st-classic": { bg: ["#16246a", "#070b24"], line: "#7f95ff", grid: "#3a4c9e", lab: "#FADE8C", found: "#FADE8C", ink: null },
  "st-redlight": { bg: ["#2a0606", "#0b0101"], line: "#a3242a", grid: "#5a1214", lab: "#ff6b5e", found: "#ff8a7a", ink: "#ff4a3d" },
  "st-chalk": { bg: ["#24342c", "#141e19"], line: "#dfe7df", grid: "#4c5e54", lab: "#fff6c9", found: "#fff6c9", ink: "#f2f2ea" },
  "st-atlas": { bg: ["#efe0b9", "#cdb27c"], line: "#7a4f22", grid: "#a98552", lab: "#5a1a0a", found: "#9b1c0c", ink: "#2a1a0c" },
};
PAL["st-twinkle"] = PAL["st-grid"] = PAL["st-meteors"] = PAL["st-milkyway"] = PAL["st-classic"];
const bvColour = (bv) => bv < 0 ? "#a9c4ff" : bv < 0.3 ? "#e8eeff" : bv < 0.6 ? "#fff6e0" : bv < 1.0 ? "#ffe3a8" : bv < 1.4 ? "#ffc47a" : "#ff9a5c";

function pathOf(view, pts) {
  let d = "", pen = false;
  for (const [r, de] of pts) { const p = toScreen(view, W, H, r, de); if (!p.front || Math.abs(p.X) > 4 * W || Math.abs(p.Y) > 4 * H) { pen = false; continue; }
    d += (pen ? "L" : "M") + f1(p.X) + " " + f1(p.Y); pen = true; }
  return d;
}
function gridSvg(view, P) {
  let g = "";
  for (let de = -60; de <= 60; de += 30) g += `<path d="${pathOf(view, Array.from({ length: 73 }, (_, i) => [i * 5, de]))}"/>`;
  g += `<path d="${pathOf(view, Array.from({ length: 73 }, (_, i) => [i * 5, 0]))}" stroke-width="1.3" stroke-dasharray="6 4"/>`;
  for (let ra = 0; ra < 360; ra += 30) g += `<path d="${pathOf(view, Array.from({ length: 35 }, (_, i) => [ra, -85 + i * 5]))}"/>`;
  return `<g fill="none" stroke="${P.grid}" stroke-width=".7" opacity=".8">${g}</g>`;
}
/** The whole chart for a view. o = { g (target), lines, found, hint, misses, theme } */
export function skySvg(view, o = {}) {
  const th = o.theme || "st-classic", P = PAL[th], stars = chartStars(view, W, H);
  const defs = `<defs><radialGradient id="sl-bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${P.bg[0]}"/><stop offset="1" stop-color="${P.bg[1]}"/></radialGradient>
    <filter id="sl-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>`;
  let body = `<rect x="-600" y="-400" width="1600" height="1100" fill="${P.bg[1]}"/><rect width="${W}" height="${H}" fill="url(#sl-bg)"/>`;
  if (th === "st-milkyway") { const d = pathOf(view, galacticEquator(3));
    body += `<g filter="url(#sl-blur)" fill="none" stroke-linecap="round"><path d="${d}" stroke="#9fb0ff" stroke-width="54" opacity=".16"/><path d="${d}" stroke="#dfe4ff" stroke-width="20" opacity=".16"/></g>`; }
  if (th === "st-grid" || th === "st-atlas") body += gridSvg(view, P);
  const tgt = o.g ? new Set(targetStars(o.g).map((s) => s[4])) : new Set();
  if (o.lines) body += `<g fill="none" stroke="${P.line}" stroke-width="1" opacity=".55"${o.intro ? ` class="sl-lines-in"` : ""}>${Object.entries(LINES).map(([k, ls]) =>
    (o.found && o.g && o.g.target.con === k) ? "" : ls.map((l) => `<path d="${pathOf(view, l)}"/>`).join("")).join("")}</g>`;
  if (o.found && o.g && o.g.target.con && LINES[o.g.target.con]) body += `<g fill="none" stroke="${P.found}" stroke-width="2" class="sl-trace">${LINES[o.g.target.con].map((l) => `<path d="${pathOf(view, l)}"/>`).join("")}</g>`;
  const tw = th === "st-twinkle";
  body += `<g>${stars.map(({ s, X, Y, r }, i) => { const hit = o.found && tgt.has(s[4]);
    const cls = [tw && s[2] < 3.6 ? "sl-tw" : "", o.intro ? "sl-in" : ""].filter(Boolean).join(" "), dl = o.intro ? 0.35 + Math.max(0, s[2] + 1.5) * 0.22 : (i * 0.37) % 3;
    return `<circle cx="${f1(X)}" cy="${f1(Y)}" r="${f1(hit ? r + 0.8 : r)}" fill="${P.ink || bvColour(s[3])}"${cls ? ` class="${cls}" style="animation-delay:${dl.toFixed(2)}s"` : ""}${hit ? ` stroke="${P.found}" stroke-width="1.4"` : ""}/>`; }).join("")}</g>`;
  if (o.hint && o.g) { const [ra, de] = targetCentre(o.g), c = toScreen(view, W, H, ra, de), rr = o.g.target.near ? o.g.target.near[2] : Math.min(22, Math.max(5, ...targetStars(o.g).map((s) => sep(s[0], s[1], ra, de))) + 2);
    const e = toScreen(view, W, H, ra, Math.min(89, de + rr)); body += `<circle class="sl-hint" cx="${f1(c.X)}" cy="${f1(c.Y)}" r="${f1(Math.max(14, Math.hypot(e.X - c.X, e.Y - c.Y)))}" fill="none" stroke="${P.lab}" stroke-width="1.5" stroke-dasharray="5 5"/>`; }
  for (const m of o.misses || []) body += `<path d="M${f1(m[0] - 5)} ${f1(m[1] - 5)}l10 10m0-10l-10 10" stroke="#ff5a7a" stroke-width="2" opacity=".85"/>`;
  if (o.found && o.g) { const [ra, de] = targetCentre(o.g), c = toScreen(view, W, H, ra, de), lab = o.g.name;
    if (o.g.target.near) body += `<circle cx="${f1(c.X)}" cy="${f1(c.Y)}" r="22" fill="none" stroke="${P.found}" stroke-width="2"/>`;
    body += `<g class="sl-label"><rect x="${f1(Math.min(W - 10, Math.max(10, c.X)) - lab.length * 3.6 - 8)}" y="${f1(Math.min(H - 26, Math.max(6, c.Y + 16)))}" width="${f1(lab.length * 7.2 + 16)}" height="20" rx="5" fill="#0b0820" fill-opacity=".8" stroke="${P.found}"/>
      <text x="${f1(Math.min(W - 10, Math.max(10, c.X)))}" y="${f1(Math.min(H - 26, Math.max(6, c.Y + 16)) + 14)}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="12" fill="${P.found}">${esc(lab)}</text></g>`; }
  if (o.found && o.g && !o.out) { const [ra, de] = targetCentre(o.g), c = toScreen(view, W, H, ra, de);
    body += `<g class="sl-burst" transform="translate(${f1(c.X)} ${f1(c.Y)})">${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, d = 26 + (i % 3) * 12;
      return `<path class="sl-spark" style="--dx:${f1(Math.cos(a) * d)}px;--dy:${f1(Math.sin(a) * d)}px;animation-delay:${(i % 4) * 0.05}s" d="M0 -4L1 -1L4 0L1 1L0 4L-1 1L-4 0L-1 -1Z" fill="${P.found}"/>`; }).join("")}</g>
      <g transform="translate(${W - 30} 24)"><path class="sl-shoot" d="M0 0 l-70 28" stroke="url(#sl-mt)" stroke-width="2.4" stroke-linecap="round"/></g>`; }
  if (th === "st-meteors") body += `<g class="sl-meteors">${[[330, 40, 0], [220, 20, 2.4], [380, 120, 4.9]].map(([x, y, d]) => `<g transform="translate(${x} ${y})"><path class="sl-m" style="animation-delay:${d}s" d="M0 0 l-46 18" stroke="url(#sl-mt)" stroke-width="2" stroke-linecap="round"/></g>`).join("")}</g>`;
  const mt = `<linearGradient id="sl-mt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>`;
  body += `<text x="8" y="${H - 8}" font-size="9" fill="${P.lab}" opacity=".7" font-family="Cinzel, Georgia, serif">N ↑ · E ←</text>`;
  if (o.intro) body += `<g class="sl-dome" pointer-events="none"><rect class="sl-door l" x="-600" y="-400" width="${600 + W / 2}" height="1100" fill="#05030c"/><rect class="sl-door r" x="${W / 2}" y="-400" width="${600 + W / 2}" height="1100" fill="#05030c"/></g>`;
  return { svg: `<svg id="sl-sky" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Star chart">${defs.replace("</defs>", mt + "</defs>")}${body}</svg>`, stars };
}

const CSS = `
.table.stars{background:#070b24;cursor:crosshair;pointer-events:auto}.table.stars svg{width:100%;height:100%;display:block;touch-action:manipulation}
.sl-tw{animation:sl-tw 3s ease-in-out infinite}@keyframes sl-tw{0%,100%{opacity:1}40%{opacity:.45}60%{opacity:.9}}
.sl-hint{animation:sl-pulse 1.6s ease-in-out infinite}@keyframes sl-pulse{50%{opacity:.35}}
.sl-trace path{stroke-dasharray:400;stroke-dashoffset:400;animation:sl-draw 1.6s ease-out forwards}@keyframes sl-draw{to{stroke-dashoffset:0}}
.sl-label{animation:sl-in .6s ease-out}@keyframes sl-in{from{opacity:0}}
.sl-m{opacity:0;animation:sl-met 7s linear infinite}
@keyframes sl-met{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}9%{opacity:0;transform:translate(-120px,47px)}100%{opacity:0;transform:translate(-120px,47px)}}
.sl-lore{margin:6px 0}.sl-lore b{color:var(--gold2,#FADE8C)}
.sl-facts{display:grid;gap:4px;margin:6px 0;font-size:.85rem}.sl-facts span{border:1px solid var(--line,#3a2f6a);border-radius:8px;padding:5px 8px;background:rgba(22,16,48,.6)}
.sl-in{opacity:0;animation:sl-fade .7s ease-out forwards}@keyframes sl-fade{to{opacity:1}}
.sl-lines-in{opacity:0;animation:sl-lines 1.4s ease-out 1.2s forwards}@keyframes sl-lines{to{opacity:.55}}
.sl-door{animation:sl-door-l 1.2s cubic-bezier(.6,0,.3,1) .1s forwards}.sl-door.r{animation-name:sl-door-r}
@keyframes sl-door-l{to{transform:translateX(-700px)}}@keyframes sl-door-r{to{transform:translateX(700px)}}
.sl-spark{opacity:0;animation:sl-spark 1.1s ease-out forwards}@keyframes sl-spark{0%{opacity:1;transform:translate(0,0) scale(.4)}70%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.3)}}
.sl-shoot{opacity:0;animation:sl-shoot 1.1s ease-in .5s forwards}@keyframes sl-shoot{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-220px,88px)}}
.sl-shake{animation:sl-shake .45s ease-in-out}@keyframes sl-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.sl-ripple{fill:none;stroke-width:2;animation:sl-ripple .7s ease-out forwards}@keyframes sl-ripple{from{r:3;opacity:1}to{r:26;opacity:0}}
.sl-lant{display:inline-block;animation:sl-flick 1.3s ease-in-out infinite}@keyframes sl-flick{0%,100%{transform:scale(1) rotate(0)}30%{transform:scale(1.08) rotate(-3deg)}60%{transform:scale(.96) rotate(2deg)}}
.sl-out{opacity:.35;filter:grayscale(1)}
@media (prefers-reduced-motion: reduce){.sl-tw,.sl-hint,.sl-m,.sl-trace path,.sl-label,.sl-lant,.sl-shake,.sl-spark,.sl-shoot,.sl-ripple{animation:none}.sl-trace path{stroke-dashoffset:0}.sl-m,.sl-spark,.sl-shoot,.sl-ripple,.sl-dome{display:none}.sl-in,.sl-lines-in{animation:none;opacity:1}}
`;
function styleOnce() {
  if (document.getElementById("sl-style")) return;
  const st = document.createElement("style"); st.id = "sl-style"; st.textContent = CSS; document.head.append(st);
}

export function guideHtml() {
  return `<div class="dec-guide sl-guide"><h3>📖 ${esc(GUIDE.title)}</h3>${GUIDE.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

// ---- the store shelf ----
export const shop = {
  kind: KIND, label: "🔭 Star Lore", items: THEMES,
  talk: {
    open: ["Sky charts! I collect them. The stars never complain about the frame.", "Dress the heavens, darling. They've worn the same outfit for 4 billion years."],
    tryon: ["The {item}. Even Ptolemy would approve.", "Ooh, the {item}. The constellations look thinner already."],
    buy: ["The {item} is yours. The cosmos thanks you for your patronage.", "Sold! The {item}. Carry it to the Star Lore room and look up."],
  },
  preview(id, ctx) { styleOnce(); const g = ALL[0].g, t = ctx.tableEl; t.className = "table stars"; fit(t); t.innerHTML = skySvg(viewFor(g, 1), { lines: true, theme: id }).svg; if (ctx.cap) ctx.cap("🔭 " + (THEMES.find((x) => x.id === id) || {}).name); },
};

export const stars = {
  id: "stars", label: "Star Lore Navigator", emoji: "🔭", blurb: "Find constellations and learn their myths and real astronomy", shop,
  open(ctx) {
    const { $, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const prog = () => starsOf(state.prog), theme = () => themeOf(state.prog);
    const stats = () => { const n = foundCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🔭 ${esc(t.name)}</b> · ${n} / ${ALL.length} found${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };
    const toggleGuide = (btn) => { const rb = $("reading-body"), on = !rb.querySelector(".sl-guide"); rb.innerHTML = on ? guideHtml() : "";
      if (btn) btn.textContent = on ? "📖 Close study guide" : "📖 Study guide"; if (on) rb.querySelector(".sl-guide").scrollIntoView({ behavior: "smooth", block: "start" }); };
    const guideBtn = `<button class="c" type="button" id="sl-guide">📖 Study guide</button>`;
    const wireGuide = () => { const b = $("sl-guide"); if (b) b.onclick = () => toggleGuide(b); };
    const draw = (view, o) => { tableEl.className = "table stars"; fit(tableEl); const r = skySvg(view, { ...o, theme: theme() }); tableEl.innerHTML = r.svg; return r.stars; };

    function lobby(first) {
      clearReading(); cap("🔭 Star Lore Navigator"); draw(viewFor(LEVELS[0].deck[0], 3), { lines: true });
      say(first && !prog().plays
        ? `Welcome to the observatory, ${state.name}. Every people on Earth looked up and told stories about the same stars. I'll name something in the sky and tell you how to find it. Tap it on the chart. Then I'll tell you the myths, and what the stars really are. Three lanterns per search; a wrong tap or a hint costs one.`
        : foundCount(state.prog) >= ALL.length ? `You've found the whole sky, ${state.name}. Search again any time to beat your scores.` : `Clear skies tonight, ${state.name}. Where shall we look?`);
      const lvl = (L) => { const n = foundCount(state.prog, L);
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"⭐".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${n} / ${L.deck.length} found · points ×${L.mult}</span></button>`; };
      const known = ALL.filter(({ L, g }) => prog().found[keyOf(L, g)]);
      ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">Level 1 shows the stick figures. Levels 2 and 3 hide them: star-hop from shapes you know. The chart is north up, east left, as the sky looks overhead.</div>
        <div class="choices">${guideBtn}<button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        ${known.length ? `<div class="group">Found so far</div><div class="choices">${known.map(({ L, g }) => `<button class="c small" type="button" data-k="${L.n}:${g.id}">${g.emoji} ${esc(g.name)} <span class="note">· L${L.n} · best ${prog().found[keyOf(L, g)]}</span></button>`).join("")}</div>` : ""}`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; search(L, nextTarget(state.prog, L, prog().last)); }));
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { const [n, id] = b.dataset.k.split(":"), L = LEVELS[+n - 1]; search(L, byId(id, L)); }));
      $("back").onclick = greet; wireGuide();
    }

    const bar = (L, run) => `<div class="cx-top">Level ${L.n} · ${Array.from({ length: LANTERNS }, (_, i) => `<span class="${i < run.lanterns ? "sl-lant" : "sl-out"}" style="animation-delay:${i * 0.3}s">🏮</span>`).join("")} · finding it now scores ${Math.round(4 * run.lanterns * L.mult)}</div>`;
    const heading = (L, g) => L.n === 3 ? `${g.emoji} ${g.name} · ${g.culture}` : `${g.emoji} Find ${g.name}`;

    function search(L, g) {
      const run = start(g, L), view = viewFor(g, run.seed), misses = [];
      clearReading(); cap(heading(L, g));
      let stars = draw(view, { g, lines: L.lines, intro: true }); domeOpen();
      const controls = (line) => {
        if (line) say(line);
        ui(`${bar(L, run)}<div class="note">${esc(g.find)}</div>
          <div class="choices">${!run.hinted && run.lanterns > 1 ? `<button class="c" type="button" id="sl-hint">🏮 Hint (costs a lantern)</button>` : ""}${guideBtn}<button class="c small" type="button" id="sl-leave">↩ Levels</button></div>`);
        if ($("sl-hint")) $("sl-hint").onclick = () => { if (useHint(run)) { shimmer(); stars = draw(view, { g, lines: L.lines, hint: true, misses }); controls(g.hint); wire(); } };
        $("sl-leave").onclick = () => lobby(false); wireGuide();
      };
      const wire = () => {
        const svg = tableEl.querySelector("svg"); if (!svg) return;
        svg.onclick = (e) => {
          const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
          const m = svg.getScreenCTM(); if (!m) return; const p = pt.matrixTransform(m.inverse());
          const near = nearestStar(stars, p.x, p.y), sky = toSky(view, W, H, p.x, p.y);
          if (!g.target.near && !near) return; // taps on empty sky don't count, except for the dark-cloud targets
          if (near) ping(near.s[2]);
          const r = tap(run, g, near && near.s, sky);
          if (r === "found") { discover(); return found(L, g, run, view); }
          misses.push([near ? near.X : p.x, near ? near.Y : p.y]);
          if (r === "out") { darkness(); return found(L, g, run, view, true); }
          setTimeout(gutter, 120); stars = draw(view, { g, lines: L.lines, hint: run.hinted, misses }); wire();
          const sv = tableEl.querySelector("svg"), last = misses[misses.length - 1];
          if (sv) { sv.classList.add("sl-shake"); sv.insertAdjacentHTML("beforeend", `<circle class="sl-ripple" cx="${f1(last[0])}" cy="${f1(last[1])}" r="3" stroke="#ff5a7a"/>`); }
          const what = near ? (nameOf(near.s) ? `That's ${nameOf(near.s)}, in ${conName(near.s[5])}.` : `That star is in ${conName(near.s[5])}.`) : "Nothing there but sky.";
          controls(`${what} ${pick(["Not this one. A lantern gutters.", "Close, but the stars say no. One lantern fewer.", "Keep looking. One lantern gone."])}`);
        };
      };
      say(`${pick(["Let your eyes adjust to the dark…", "The dome opens. Look up.", "Clear skies. Here is your challenge."])} ${g.find}`);
      controls(); wire();
    }

    function found(L, g, run, view, out) {
      draw(view, { g, lines: L.lines, found: true, out });
      const [ra, de] = targetCentre(g);
      cap(heading(L, g).replace("Find ", ""));
      const pages = [out ? `The last lantern goes out… so I'll show you. There it is: ${g.name}.` : pick([`Yes! You found ${g.name}.`, `There it is: ${g.name}. Well spotted.`, `${g.name}! Your eyes are sharper than an owl's.`])];
      for (const x of g.lore) pages.push(`${x.c}: ${x.t}`);
      pages.push("And now the real astronomy.", ...g.science);
      talkThrough(pages, () => {
        $("reading-body").innerHTML = `<div class="sl-facts"><span>🗓️ Best seen in the evening: around <b>${bestMonth(ra)}</b></span><span>🌍 ${esc(seenFrom(de))}</span>${g.target.con ? `<span>✳️ IAU constellation: <b>${esc(CON_NAMES[g.target.con])}</b></span>` : ""}</div>`;
        quiz(L, g, run);
      });
    }

    function quiz(L, g, run) {
      say(`One question before you go. ${g.quiz.q}`);
      ui(`<div class="choices col">${quizChoices(g).map((c, i) => `<button class="c" type="button" data-q="${i}">${esc(c)}</button>`).join("")}</div><div class="note">+${Math.round(5 * L.mult)} for the right answer.</div>`);
      const cs = quizChoices(g);
      $("ui").querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { const ok = answer(run, g, cs[+b.dataset.q]); verdict(ok);
        finish(L, g, run, ok ? `Correct: ${g.quiz.a}.` : `Not quite. The answer is: ${g.quiz.a}.`); }));
    }

    function finish(L, g, run, line) {
      const before = foundCount(state.prog), r = settle(state.prog, run);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      const t = titleOf(foundCount(state.prog)), titled = titleOf(before).name !== t.name;
      say(line);
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (run.found) bits.push(`found ${findPts(run)} + quiz ${quizPts(run)} = ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${prog().found[keyOf(L, g)]}`}`);
      else bits.push("not found this time");
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🔭 Star title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="sl-go">🔭 Next Level ${L.n} search</button>${run.found ? "" : `<button class="c" type="button" id="sl-again">↻ Try again</button>`}<button class="c" type="button" id="sl-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp) chime(2);
      $("sl-go").onclick = () => search(L, nextTarget(state.prog, L, g.id));
      if ($("sl-again")) $("sl-again").onclick = () => search(L, g);
      $("sl-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: what you've found, by level. */
export function starsCodex(p, e = esc) {
  const r = starsOf(p);
  return LEVELS.map((L) => { const got = L.deck.filter((g) => r.found[keyOf(L, g)]);
    return `<div class="cx"><div class="cx-h"><span>🔭 Star Lore level ${L.n}: ${e(L.what)}</span><span class="note">${got.length} / ${L.deck.length}</span></div>
    <div class="bar"><i style="width:${(got.length / L.deck.length) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((g) => `<span>${g.emoji} ${e(g.name)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}
