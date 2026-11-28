// History of Magic: a timeline room of the Oracle Chamber. The Oracle deals real events from the history of magic,
// stage conjuring, science and skepticism; the player puts each one in its place on the timeline. Level 1 spans all of
// history, level 2 two neighbouring eras, level 3 a single era with close dates. Each era has a 📖 study guide.
// Rules in logic.js, the deck in events.js, guides in guide.js, store themes in shop.js. Mounted via ROOMS (main.js).
import { ERAS, KINDS, EVENTS, eraOf, eventsOf } from "./events.js";
import { LEVELS, DAILY, DECK, SANDS, TOTAL, MYTH_PTS, room as tlOf, chronicled, titleOf, nextTitle, levelOf, pts, deal, start, current, place, perfect, scoreOf, settle, rng, pinRange, pinpoint, answerMyth, yearText } from "./logic.js";
import { DECKS, deckOf, MYTHS, mythById, LINKS } from "./events2.js";
import { dailySeed, dailyState, finishDaily, postDaily, boardOf, boardHtml, dayNumber } from "../daily.js";
import { GUIDES } from "./guide.js";
import { themeOf, SHOP, TALK } from "./shop.js";
import { openFactFib } from "./factfib-room.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const RIGHT = ["Exactly right. The Chronicle approves.", "Yes! You know your centuries.", "Perfectly placed. History clicks into place.", "Right where it belongs. The scroll hums."];
const WRONG = ["Not quite. The sand slips… the card slides to where it really goes.", "Close, but history disagrees. One hourglass runs out.", "Ah, a time traveller's mistake. Here's where it really belongs.", "The scroll rustles crossly. That one goes elsewhere."];

const CSS = `
.table.timeline{background:none}
.tl-card{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--gold);border-radius:12px;background:linear-gradient(135deg,rgba(226,176,74,.16),rgba(102,224,200,.06));animation:btnin .35s ease-out both}
.tl-card .tl-e{font-size:1.8rem;line-height:1}.tl-card b{color:var(--gold2);font-family:var(--display);letter-spacing:.03em}.tl-card p{margin:3px 0 0;font-size:.9rem}
.tl-card .tl-k{font-size:.72rem;color:var(--muted)}
.tl-line{display:flex;flex-direction:column;gap:4px;margin:8px 0}
.tl-row{display:flex;gap:8px;align-items:baseline;padding:5px 10px;border-left:3px solid var(--gold);background:rgba(243,227,195,.05);border-radius:0 8px 8px 0;font-size:.88rem}
.tl-row .tl-y{color:var(--teal);font-weight:700;min-width:88px;font-variant-numeric:tabular-nums}
.tl-row.new{border-left-color:var(--teal);background:rgba(102,224,200,.12)}.tl-row.bad{border-left-color:#ff6b8a;background:rgba(255,107,138,.1)}
.c.tl-slot{border-style:dashed;padding:4px 12px;font-size:.82rem;align-self:flex-start;border-color:rgba(102,224,200,.6)}
.tl-eras{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}
.tl-eras .c{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border-radius:12px;text-align:left}
.tl-eras .c span{font-size:.75rem;color:var(--muted)}
.tl-guide{margin:8px 0;padding:6px 12px;border:1px solid var(--line);border-radius:12px;background:rgba(22,16,48,.6)}
.tl-guide h3{font-family:var(--display);color:var(--gold2);margin:6px 0}.tl-guide summary{cursor:pointer;color:var(--gold2);padding:4px 0}.tl-guide p{font-size:.88rem;margin:6px 0}
.tl-fact{font-size:.9rem;margin:6px 0;padding:8px 12px;border-radius:12px;background:rgba(243,227,195,.06);border:1px solid rgba(250,222,140,.3)}
.tl-scene *{transform-box:fill-box}
.tl-scene.unroll .tl-band{transform-origin:left center;animation:tl-unroll .5s cubic-bezier(.3,1.2,.5,1) var(--d) both}
.tl-scene.unroll .tl-frame{transform-origin:left center;animation:tl-unroll .7s ease-out both}
.tl-pin.drop{animation:tl-drop .45s cubic-bezier(.3,1.5,.5,1) var(--d) both}
.tl-pin.fly .tl-flyer{animation:tl-fly .75s cubic-bezier(.4,0,.2,1) both}
.tl-pin.fly circle,.tl-pin.fly line{animation:tl-pop .4s .65s cubic-bezier(.3,1.8,.5,1) both;transform-origin:center}
.tl-pin.bad circle{animation:tl-pop .4s .65s cubic-bezier(.3,1.8,.5,1) both,tl-blink .3s .9s 3 alternate}
.tl-burst{opacity:0;animation:tl-show 0s .75s forwards}
.tl-burst circle{transform-origin:center;animation:tl-ring .8s .75s ease-out both}
.tl-spark{transform-origin:center;animation:tl-spark .8s .75s ease-out both}
.tl-ribbon.shake{animation:tl-shake .45s .75s ease-in-out}
.tl-hand{transform-origin:center;animation:tl-deal .5s cubic-bezier(.3,1.4,.5,1) both,tl-bob 2.6s .5s ease-in-out infinite}
.tl-glass.full .tl-top{transform-origin:center bottom;animation:tl-drain 6s linear infinite}
.tl-stream{animation:tl-flow .6s linear infinite}
.tl-glass.lost{transform-origin:center;animation:tl-flip .7s .75s ease-in-out both}
.tl-twinkle{animation:tl-tw 3s var(--d) ease-in-out infinite}
.tl-grid{animation:tl-pan 8s linear infinite}
.tl-neon{animation:tl-pulse 2.4s ease-in-out infinite}
.tl-march{animation:tl-dash 4s linear infinite}
.tl-dust{animation:tl-rise 7s var(--d) linear infinite;opacity:0}
.tl-conf{animation:tl-fall 2.6s var(--d) cubic-bezier(.3,.1,.6,1) both}
.tl-card{animation:tl-cardin .5s cubic-bezier(.3,1.3,.5,1) both}
.tl-row.new,.tl-row.bad{animation:tl-rowin .5s ease-out both}.tl-row.bad{animation:tl-rowin .5s ease-out both,tl-wobble .4s .5s}
.c.tl-slot{transition:transform .15s,background .15s}.c.tl-slot:hover{transform:translateX(4px);background:rgba(102,224,200,.15)}
.tl-fact{animation:tl-rowin .5s ease-out both}
@keyframes tl-unroll{from{transform:scaleX(0);opacity:0}}
@keyframes tl-drop{from{transform:translateY(-30px);opacity:0}}
@keyframes tl-fly{from{transform:translate(var(--dx),var(--dy)) scale(1.6)}}
@keyframes tl-pop{from{transform:scale(0)}}
@keyframes tl-blink{to{opacity:.35}}
@keyframes tl-show{to{opacity:1}}
@keyframes tl-ring{from{transform:scale(.5);opacity:1}to{transform:scale(4);opacity:0}}
@keyframes tl-spark{from{transform:translate(0,0) scale(.4);opacity:1}to{transform:translate(var(--sx),var(--sy)) scale(1.2) rotate(90deg);opacity:0}}
@keyframes tl-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
@keyframes tl-deal{from{transform:translateY(-60px) rotate(-12deg) scale(.6);opacity:0}}
@keyframes tl-bob{50%{transform:translateY(-4px) rotate(1.5deg)}}
@keyframes tl-drain{from{transform:scaleY(1)}to{transform:scaleY(.25)}}
@keyframes tl-flow{to{stroke-dashoffset:-7}}
@keyframes tl-flip{50%{transform:rotate(180deg)}to{transform:rotate(180deg);opacity:.3}}
@keyframes tl-tw{50%{opacity:.1}}
@keyframes tl-pan{to{transform:translate(20px,15px)}}
@keyframes tl-pulse{50%{opacity:.55}}
@keyframes tl-dash{to{stroke-dashoffset:-60}}
@keyframes tl-rise{10%{opacity:.7}to{transform:translateY(-120px);opacity:0}}
@keyframes tl-fall{from{transform:translateY(0) rotate(0);opacity:1}to{transform:translateY(330px) rotate(var(--r));opacity:.8}}
@keyframes tl-cardin{from{transform:rotateX(80deg) translateY(-10px);opacity:0}}
@keyframes tl-rowin{from{transform:translateX(-14px);opacity:0}}
@keyframes tl-wobble{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.tl-pin-box{margin:8px 0;padding:10px 12px;border:1px dashed rgba(102,224,200,.6);border-radius:12px;background:rgba(102,224,200,.06);animation:tl-rowin .4s ease-out both}
.tl-pin-box input[type=range]{width:100%;accent-color:var(--teal)}.tl-pin-yr{font-size:1.4rem;font-weight:700;color:var(--gold2);text-align:center;font-variant-numeric:tabular-nums}
.tl-pin-ends{display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted)}
.tl-myth{margin:8px 0;padding:12px 14px;border:1px solid #ff4fb3;border-radius:12px;background:linear-gradient(135deg,rgba(255,79,179,.14),rgba(102,224,200,.06));animation:tl-cardin .5s cubic-bezier(.3,1.3,.5,1) both}
.tl-myth b{font-family:var(--display);color:var(--gold2)}.tl-myth p{margin:6px 0 0;font-size:1rem}
.tl-share{width:100%;min-height:66px;font:inherit;font-size:.85rem;background:rgba(0,0,0,.3);color:inherit;border:1px solid var(--line);border-radius:8px;padding:6px}
.tl-badges{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.tl-badges span{font-size:.78rem;padding:3px 8px;border:1px solid var(--line);border-radius:999px}.tl-badges span.on{border-color:var(--gold);color:var(--gold2)}
@media (prefers-reduced-motion:reduce){.tl-scene *,.tl-card,.tl-row,.tl-fact{animation:none!important;opacity:revert}.tl-burst{display:none}}
@media (max-width:520px){.tl-eras{grid-template-columns:1fr}.tl-row .tl-y{min-width:72px}}
`;
function styleOnce() {
  if (document.getElementById("tl-style")) return;
  const st = document.createElement("style"); st.id = "tl-style"; st.textContent = CSS; document.head.append(st);
}

const svgEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** Where a year sits on the ribbon: the run's eras share the width equally, each scaled to its own span. */
export function xOf(year, eras, x0 = 24, w = 352) {
  const bw = w / eras.length;
  let i = eras.findIndex((id) => year < eraOf(id).to); if (i < 0) i = eras.length - 1;
  const E = eraOf(eras[i]), f = Math.min(1, Math.max(0, (year - E.from) / (E.to - E.from)));
  return x0 + i * bw + f * bw;
}

/** The table pane: the era ribbon, the cards placed so far as pins, the hourglasses, and the card in hand.
 * Animation options: unroll (ribbon unrolls, pins drop in), hi (just placed: flies in from the hand, sparkles if
 * right, the ribbon shakes and an hourglass flips if wrong), hand (card waiting to be placed, floats), party (confetti). */
export function sceneSvg(run, theme, { hi = null, bad = false, hand = null, unroll = false, party = false, hide = null } = {}) {
  const T = themeOf(theme), eras = run ? run.eras : ERAS.map((e) => e.id), bw = 352 / eras.length;
  const bands = eras.map((id, i) => { const E = eraOf(id), x = 24 + i * bw;
    return `<g class="tl-band" style="--d:${(i * 0.18).toFixed(2)}s"><rect x="${x}" y="150" width="${bw}" height="22" fill="${T.band[ERAS.indexOf(E) % 4]}" opacity=".85"/>
      <text x="${x + bw / 2}" y="190" font-size="${eras.length > 2 ? 9 : 11}" fill="${T.ribbon}" text-anchor="middle" font-family="${T.font}">${E.emoji} ${svgEsc(eras.length > 2 ? E.short : E.name)}</text>
      <text x="${x + bw / 2}" y="203" font-size="8" fill="${T.ribbon}" opacity=".7" text-anchor="middle" font-family="${T.font}">${svgEsc(E.span)}</text></g>`; }).join("");
  const line = run ? run.line : [];
  const pins = line.map((c, i) => { const x = xOf(c.year, eras), up = i % 2 === 0, y = up ? 118 : 224, on = c.id === hi;
    const col = on ? (bad ? "#ff6b8a" : "#66E0C8") : T.pin;
    const cls = on ? (bad ? " on fly bad" : " on fly good") : unroll ? " drop" : "";
    const style = on ? `--dx:${(200 - x).toFixed(1)}px;--dy:${(69 - (up ? 112 : 218)).toFixed(1)}px` : `--d:${(0.5 + i * 0.12).toFixed(2)}s`;
    const fx = on && !bad ? `<g class="tl-burst"><circle cx="${x}" cy="161" r="8" fill="none" stroke="#66E0C8" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map((k) => { const a = k * 1.047;
        return `<path class="tl-spark" style="--sx:${(Math.cos(a) * 26).toFixed(1)}px;--sy:${(Math.sin(a) * 26).toFixed(1)}px" d="M${x} ${157} l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5Z" fill="#FADE8C"/>`; }).join("")}</g>` : "";
    return `<g class="tl-pin${cls}" style="${style}"><line x1="${x}" y1="${up ? 132 : 172}" x2="${x}" y2="${up ? 150 : 210}" stroke="${col}" stroke-width="${on ? 2.5 : 1.5}"/>
      <circle cx="${x}" cy="161" r="${on ? 6 : 4.5}" fill="${col}" stroke="${T.ink}" stroke-width="1.5"/>
      <g class="tl-flyer"><text x="${x}" y="${y}" font-size="16" text-anchor="middle">${c.emoji}</text>
      <text x="${x}" y="${up ? 132 : 240}" font-size="8.5" font-weight="700" fill="${col}" text-anchor="middle" font-family="${T.font}">${c.id === hide ? "? ? ?" : svgEsc(c.when.replace("c. ", "~"))}</text></g>${fx}</g>`; }).join("");
  const sand = Array.from({ length: SANDS }, (_, i) => { const full = run ? i < run.sands : true, x = 356 - i * 20, lost = bad && run && i === run.sands;
    return `<g transform="translate(${x} 22)"><g class="tl-glass${full ? " full" : ""}${lost ? " lost" : ""}" opacity="${full || lost ? 1 : 0.3}"><path d="M-6 -10 H6 L1 0 L6 10 H-6 L-1 0Z" fill="none" stroke="${T.ribbon}" stroke-width="1.5"/>
      ${full ? `<path class="tl-top" d="M-4 -8 H4 L0 -2Z" fill="${T.sand}"/><path d="M-4 8 H4 L0 3Z" fill="${T.sand}"/><path class="tl-stream" d="M0 -2 V8" stroke="${T.sand}" stroke-width="1" stroke-dasharray="1.5 2"/>` : lost ? `<path d="M-4 -8 H4 L0 -2Z" fill="${T.sand}"/>` : ""}</g></g>`; }).join("");
  const deco = T.deco === "stars" ? Array.from({ length: 40 }, (_, i) => `<circle class="tl-twinkle" style="--d:${((i * 0.37) % 3).toFixed(2)}s" cx="${(i * 97) % 400}" cy="${(i * 53) % 300}" r="${(i % 3) * 0.5 + 0.5}" fill="#fff" opacity=".6"/>`).join("")
    : T.deco === "grid" ? `<g class="tl-grid">${Array.from({ length: 22 }, (_, i) => `<path d="M${i * 20 - 20} -15V315M-20 ${i * 15 - 15}H420" stroke="#dff1ff" stroke-width=".4" opacity=".25"/>`).join("")}</g>`
    : T.deco === "neon" ? `<g class="tl-neon"><path d="M0 260 H400 M0 278 H400" stroke="#ff4fb3" stroke-width="1" opacity=".5"/><path d="M200 300 L0 255 M200 300 L400 255 M200 300 L100 255 M200 300 L300 255" stroke="#b06cff" opacity=".4"/></g>`
    : T.deco === "filigree" ? `<rect x="8" y="8" width="384" height="284" rx="10" fill="none" stroke="#FADE8C" stroke-width="1.2" opacity=".6"/><rect class="tl-march" x="14" y="14" width="372" height="272" rx="8" fill="none" stroke="#FADE8C" stroke-width=".6" stroke-dasharray="2 4" opacity=".6"/>`
    : `<path d="M14 140 q-10 21 0 42 M386 140 q10 21 0 42" stroke="${T.ribbon}" stroke-width="3" fill="none" opacity=".6"/>${Array.from({ length: 12 }, (_, i) => `<circle class="tl-dust" style="--d:${(i * 0.6).toFixed(1)}s" cx="${30 + ((i * 71) % 340)}" cy="${240 + ((i * 13) % 50)}" r="1" fill="${T.pin}"/>`).join("")}`;
  const card = hand ? `<g class="tl-hand"><rect x="168" y="38" width="64" height="62" rx="8" fill="${T.ribbon}" stroke="${T.pin}" stroke-width="2"/>
      <text x="200" y="76" font-size="28" text-anchor="middle">${hand.emoji}</text><text x="200" y="94" font-size="10" font-weight="700" fill="${T.ink}" text-anchor="middle" font-family="${T.font}">? ? ?</text></g>` : "";
  const confetti = party ? `<g class="tl-party">${Array.from({ length: 36 }, (_, i) => `<rect class="tl-conf" style="--d:${((i * 0.13) % 1.6).toFixed(2)}s;--r:${(i * 47) % 360}deg" x="${(i * 113) % 400}" y="-12" width="5" height="9" rx="1" fill="${[T.pin, "#66E0C8", "#ff4fb3", T.ribbon][i % 4]}"/>`).join("")}</g>` : "";
  const glow = T.deco === "neon" ? `<filter id="tl-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : "";
  return `<svg class="tl-scene${unroll ? " unroll" : ""}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="tl-bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${T.bg[0]}"/><stop offset="1" stop-color="${T.bg[1]}"/></radialGradient>${glow}</defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="${T.bg[1]}"/><rect x="-200" width="800" height="300" fill="url(#tl-bg)"/>${deco}
<text x="20" y="28" font-size="12" font-weight="700" fill="${T.ribbon}" font-family="${T.font}" letter-spacing="1">HISTORY OF MAGIC</text>
${sand}<g class="tl-ribbon${bad ? " shake" : ""}"${glow ? ' filter="url(#tl-glow)"' : ""}><rect class="tl-frame" x="20" y="146" width="360" height="30" rx="4" fill="none" stroke="${T.ribbon}" stroke-width="1.5"/>${bands}${pins}</g>${card}${confetti}
</svg>`;
}

/** Study guide markup for an era, shown in the reading area. */
export function guideHtml(id, esc) {
  const g = GUIDES[id]; if (!g) return "";
  return `<div class="tl-guide"><h3>📖 ${esc(g.title)}</h3>${g.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

const SAMPLE = { eras: ERAS.map((e) => e.id), sands: 2, line: ["delphi", "ficino", "fox", "csicop"].map((id) => EVENTS.find((e) => e.id === id)) };

export const timeline = {
  id: "timeline", label: "History of Magic", emoji: "⏳",
  blurb: "Put real events from Delphi to the skeptics in order on the timeline",
  // Essence store shelf (store.js registerShelf). Try-on draws a sample timeline in that theme on the table.
  shop: { kind: "timeline", label: "⏳ Timeline", items: SHOP, talk: TALK,
    preview(id, { tableEl, cap }) { tableEl.className = "table timeline"; tableEl.innerHTML = sceneSvg(SAMPLE, id); cap("⏳ History of Magic · " + (SHOP.find((x) => x.id === id) || {}).name); } },
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const prog = () => tlOf(state.prog), theme = () => state.prog.timeline;
    const draw = (run, o) => { tableEl.className = "table timeline"; tableEl.innerHTML = sceneSvg(run, theme(), o); };
    const stats = () => { const n = chronicled(state.prog), t = titleOf(n), nx = nextTitle(n), m = Object.keys(prog().myths).length;
      return `<div class="cx-top"><b>⏳ ${esc(t.name)}</b> · ${n} / ${TOTAL} events in your Chronicle${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}${m ? ` · 🧐 ${m} myths sorted` : ""}${prog().bulls ? ` · 🎯 ${prog().bulls} bullseyes` : ""}</div>`; };
    const label = (id) => { const E = eraOf(id); if (E) return `${E.emoji} ${esc(E.name)}`; const d = deckOf(id.replace("deck-", "")); return d ? `${d.emoji} ${esc(d.name)}` : esc(id); };
    const guide = (id) => { const rb = $("reading-body"), on = !rb.querySelector(`.tl-guide[data-era="${id}"]`);
      rb.innerHTML = on ? guideHtml(id, esc).replace('class="tl-guide"', `class="tl-guide" data-era="${id}"`) : "";
      if (on) rb.firstChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
    const guideBtns = (ids) => `<div class="group">📖 Study guides</div><div class="choices">${ids.map((id) => `<button class="c small" type="button" data-g="${id}">${label(id)}</button>`).join("")}</div>`;
    const wireGuides = () => $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => guide(b.dataset.g)));
    const modeName = (L, run) => (L.n === DAILY.n ? `📅 Daily Chronicle #${dayNumber()}` : L.n === DECK.n ? `${deckOf(run.deck).emoji} ${deckOf(run.deck).name}` : `Level ${L.n}`);

    function lobby(first) {
      clearReading(); cap("⏳ History of Magic"); draw(null, { unroll: true });
      say(first && !prog().plays
        ? `Welcome to the History of Magic, ${state.name}. Every card is a real moment: oracles, alchemists, stage magicians and the skeptics who caught the frauds. I deal them, you put them in order, then guess the year for a bonus. Three hourglasses per game. Read a study guide first if you like; I won't tell.`
        : chronicled(state.prog) >= TOTAL ? `Your Chronicle is complete, ${state.name}. You know magic's history better than most magicians. Play again to beat your best.` : `Which stretch of history shall we sort today, ${state.name}?`);
      const best = (k) => prog().best[k] ? ` · best ${prog().best[k]}${prog().perfect[k] ? " ★" : ""}` : "";
      const d = dailyState(state.prog, "timeline");
      const deckBtn = (D) => { const have = D.ids.filter((id) => prog().cards[id]).length;
        return `<button class="c" type="button" data-d="${D.id}"><b>${D.emoji} ${esc(D.name)}${prog().decks[D.id] ? " 🏅" : ""}</b><span>${esc(D.what)} · ${have} / ${D.ids.length}${best("deck-" + D.id)}</span></button>`; };
      ui(`${stats()}
        <div class="group">📅 Daily Chronicle #${dayNumber()}</div><div class="levels"><button class="c level" type="button" id="tl-daily"><b>${d.played ? "🔁 Replay today's Chronicle" : "📅 Play today's Chronicle"}</b><span>The same 6 cards for everyone today${d.played ? ` · your score: ${d.today.score} (replays don't count)` : " · your first run counts"}${d.streak ? ` · 🔥 ${d.streak}-day streak` : ""}</span></button></div>
        <div class="group">🎭 Party round</div><div class="levels"><button class="c level" type="button" id="tl-fib"><b>🎭 Fact or Fib</b><span>Real events, hidden years. Write a fake year, then find the true one. Plays with everyone in your voice call, or solo against the House</span></button></div>
        <div class="group">⏳ Levels</div><div class="levels">${LEVELS.map((L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⏳".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.cards} cards · ${pts(L)} per card${best(L.n)}</span></button>`).join("")}</div>
        <div class="group">🃏 Themed decks</div><div class="tl-eras">${DECKS.map(deckBtn).join("")}</div>
        <div class="note">The first card is laid down for you. For each next card, tap the gap where it belongs, then 🎯 pinpoint its year for bonus points. One 🧐 Myth or Fact? card turns up each game. A wrong place empties an hourglass; lose all ${SANDS} and the game ends.</div>
        ${guideBtns([...ERAS.map((e) => e.id), ...DECKS.map((D) => "deck-" + D.id)])}
        <div class="choices"><button class="c small" type="button" id="tl-board">🏆 Today's board</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = levelOf(+b.dataset.l); L.n === 1 ? begin(L) : chooseEra(L); }));
      $("ui").querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => begin(DECK, { deck: b.dataset.d })));
      $("tl-fib").onclick = () => openFactFib(ctx, { draw, onBack: () => lobby(false) });
      $("tl-daily").onclick = () => begin(DAILY, { daily: true }); $("tl-board").onclick = () => showBoard();
      wireGuides(); $("back").onclick = greet;
    }

    async function showBoard(scroll) {
      const rb = $("reading-body"), d = dailyState(state.prog, "timeline");
      rb.innerHTML = `<div class="tl-guide"><h3>🏆 Daily Chronicle #${dayNumber()}</h3><div class="note">Loading the board…</div></div>`;
      const b = await boardOf(state, "timeline");
      rb.innerHTML = `<div class="tl-guide"><h3>🏆 Daily Chronicle #${dayNumber()}</h3>${boardHtml(b, esc, { unit: "pts", local: d.today })}<div class="note">Same 6 cards and the same myth for everyone. New cards every day at midnight UTC.</div></div>`;
      if (scroll) rb.firstChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function chooseEra(L) {
      say(L.n === 2 ? "Pick an era. I'll mix in its neighbour, so the dates get closer together." : "Pick one era. Every card will come from it, and some are only a few years apart.");
      ui(`<div class="tl-eras">${ERAS.map((E) => `<button class="c" type="button" data-e="${E.id}"><b>${E.emoji} ${esc(E.name)}${prog().seals[E.id] ? " 🏅" : ""}</b><span>${esc(E.span)} · ${chronicled(state.prog, E.id)} / ${eventsOf(E.id).length} chronicled</span></button>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="tl-any">🎲 Surprise me</button><button class="c small" type="button" id="tl-lobby">↩ Levels</button></div>`);
      $("ui").querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => begin(L, { era: b.dataset.e })));
      $("tl-any").onclick = () => begin(L); $("tl-lobby").onclick = () => lobby(false);
    }

    function begin(L, { era, deck, daily } = {}) {
      const r = daily ? rng(dailySeed("timeline")) : Math.random;
      const run = start(L, deal(L, { era, deck, seen: daily ? {} : prog().cards, r })), first = run.line[0];
      run.daily = !!daily;
      clearReading(); cap(`⏳ ${modeName(L, run)}${L.n <= 3 ? " · " + run.eras.map((id) => eraOf(id).name).join(" + ") : ""}`); draw(run, { hi: first.id, unroll: true });
      const intro = daily ? `Today's Chronicle: the same ${L.cards} cards for everyone in the server. Only your first run counts.` : deck ? `${deckOf(run.deck).name}: ${L.cards} cards from one story.` : `${L.cards} cards.`;
      talkThrough([pick(["The scroll unrolls. The centuries are waiting.", "Dust off your sandals, time traveller.", "Hourglasses turned. Let history begin."]) + ` ${intro} I'll lay the first one down for you.`,
        `${first.emoji} ${first.title}, ${first.when}. ${first.fact}`], () => turn(L, run));
    }

    const cardBox = (c) => `<div class="tl-card"><span class="tl-e">${c.emoji}</span><div><b>${esc(c.title)}</b><div class="tl-k">${KINDS[c.kind].emoji} ${esc(KINDS[c.kind].name)}</div><p>${esc(c.what)}</p></div></div>`;
    const row = (c, cls = "", hide = false) => `<div class="tl-row ${cls}"><span class="tl-y">${hide ? "? ? ?" : esc(c.when)}</span><span>${c.emoji} ${esc(c.title)}</span></div>`;
    const bar = (L, run) => `<div class="cx-top">${modeName(L, run)} · ⏳ ${"●".repeat(run.sands)}${"○".repeat(SANDS - run.sands)} · card ${Math.min(run.line.length + (run.done ? 0 : 1), L.cards)} of ${L.cards} · ${scoreOf(run)} points</div>`;

    function turn(L, run) {
      const c = current(run); draw(run, { hand: c }); cap(`⏳ ${modeName(L, run)} · where does this go?`);
      say(pick(["Where does this one belong?", "Here's your next card. Before or after?", "Into the timeline it goes. Where?", "Think about what came first."]));
      const slot = (i) => `<button class="c tl-slot" type="button" data-s="${i}">⤵ ${i === 0 ? "Earliest" : i === run.line.length ? "Latest" : "Here"}</button>`;
      ui(`${bar(L, run)}${cardBox(c)}<div class="tl-line">${slot(0)}${run.line.map((x, i) => row(x) + slot(i + 1)).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="tl-leave">End the game</button></div>`);
      $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => placed(L, run, place(run, +b.dataset.s))));
      $("tl-leave").onclick = () => lobby(false);
    }

    // After placing: right or wrong first, then 🎯 pinpoint the year between its new neighbours, then the reveal.
    function placed(L, run, r) {
      if (!r) return; chime(r.ok ? 1 : 0); draw(run, { hi: r.card.id, bad: !r.ok, hide: r.card.id });
      const { lo, hi } = pinRange(run, r.card), mid = Math.round((lo + hi) / 2);
      say(`${r.ok ? pick(RIGHT) : pick(WRONG)} Now, can you pinpoint the year?`);
      ui(`${bar(L, run)}<div class="tl-line">${run.line.map((x) => row(x, x.id === r.card.id ? (r.ok ? "new" : "bad") : "", x.id === r.card.id)).join("")}</div>
        <div class="tl-pin-box"><b>🎯 ${r.card.emoji} ${esc(r.card.title)}</b><div class="tl-pin-yr" id="tl-yr">${yearText(mid)}</div>
          <input type="range" id="tl-range" min="${lo}" max="${hi}" value="${mid}" step="1" aria-label="Year">
          <div class="tl-pin-ends"><span>${yearText(lo)}</span><span>${yearText(hi)}</span></div>
          <div class="note">Bullseye: ${Math.round(6 * L.mult)} points and 2 💎. Close: ${Math.round(3 * L.mult)} points.</div></div>
        <div class="choices"><button class="c main" type="button" id="tl-pin">🎯 Lock in the year</button><button class="c small" type="button" id="tl-nopin">Skip</button></div>`);
      const rg = $("tl-range"); rg.oninput = () => { $("tl-yr").textContent = yearText(+rg.value); };
      rg.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); $("tl-pin").click(); } };
      $("tl-pin").onclick = () => reveal(L, run, r, pinpoint(run, r.card, +rg.value));
      $("tl-nopin").onclick = () => reveal(L, run, r, null);
    }

    function reveal(L, run, r, pin) {
      draw(run, { hi: r.card.id, bad: !r.ok });
      const pinLine = !pin ? "" : pin.grade === "bull" ? `🎯 Bullseye! ${pin.err ? `Only ${pin.err} year${pin.err === 1 ? "" : "s"} off.` : "Spot on."} +${pin.pts}.` : pin.grade === "close" ? `Close: ${pin.err} years off. +${pin.pts}.` : `${pin.err} years off. No bonus this time.`;
      if (pin && pin.grade === "bull") chime(2);
      say(`${r.card.title}: ${r.card.when}. ${pinLine}`);
      const myth = run.myth && run.myth.said === null && !run.done && run.line.length >= 3;
      const next = run.done ? (run.sands <= 0 && run.queue.length ? "⌛ Out of sand: see results" : "✦ See results") : myth ? "🧐 Myth or fact?" : "▸ Next card";
      ui(`${bar(L, run)}<div class="tl-fact"><b>${r.card.emoji} ${esc(r.card.title)} · ${esc(r.card.when)}</b><br>${esc(r.card.fact)}</div>
        <div class="tl-line">${run.line.map((x) => row(x, x.id === r.card.id ? (r.ok ? "new" : "bad") : "")).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="tl-next">${next}</button></div>`);
      $("tl-next").onclick = () => (run.done ? finish(L, run) : myth ? mythTurn(L, run) : turn(L, run));
    }

    function mythTurn(L, run) {
      const m = mythById(run.myth.id); draw(run); cap(`⏳ ${modeName(L, run)} · myth or fact?`);
      say(pick(["Before the next card, a story. Did this really happen?", "Time for a little myth-busting. True or tall tale?", "Everyone's heard this one. But is it true?"]));
      ui(`${bar(L, run)}<div class="tl-myth"><b>🧐 Myth or fact?</b><p>${m.emoji} ${esc(m.claim)}</p></div>
        <div class="choices"><button class="c main" type="button" id="tl-fact">✅ Fact</button><button class="c main" type="button" id="tl-mythb">🦄 Myth</button></div>
        <div class="note">Right answer: +${Math.round(MYTH_PTS * L.mult)} points, and 3 💎 the first time.</div>`);
      const go = (said) => { const ok = answerMyth(run, said); chime(ok ? 2 : 0);
        say(`${ok ? pick(["Correct!", "Exactly right.", "Well spotted."]) : pick(["Not quite.", "Ah, the story fooled you.", "History is sneakier than that."])} ${m.truth.split(".")[0]}.`);
        ui(`${bar(L, run)}<div class="tl-myth"><b>${m.fact ? "✅ Fact" : "🦄 Myth"}</b><p>${esc(m.truth)}</p></div><div class="choices"><button class="c main" type="button" id="tl-next">▸ Next card</button></div>`);
        $("tl-next").onclick = () => turn(L, run); };
      $("tl-fact").onclick = () => go(true); $("tl-mythb").onclick = () => go(false);
    }

    const shareText = (L, run, res) => {
      const marks = (run.log || []).map((x) => (x ? "✅" : "❌")).join("") + "⬛".repeat(run.queue.length);
      const pins = (run.pins || []).map((x) => (x.grade === "bull" ? "🎯" : x.grade === "close" ? "🟡" : "⚪")).join("");
      return `⏳ History of Magic · Daily Chronicle #${dayNumber()}\n${marks}${pins ? "\n" + pins : ""}${run.myth && run.myth.said !== null ? (run.myth.right ? " 🧐✅" : " 🧐❌") : ""}\n${scoreOf(run)} pts${res && res.streak ? ` · 🔥 ${res.streak}` : ""}`;
    };
    const GHOST_NAMES = { roberthoudin: "Robert-Houdin", pepper: "John Henry Pepper", dee: "John Dee", newton: "Isaac Newton", faraday: "Michael Faraday", galileo: "Galileo", kepler: "Kepler", paracelsus: "Paracelsus", maskelyne: "Maskelyne", houdini: "Houdini", benfranklin: "Benjamin Franklin" };
    const linkBtns = (run) => {
      const seen = new Set(), out = [];
      for (const c of run.line) { const l = LINKS[c.id]; if (!l) continue;
        if (l.seance && !seen.has("s" + l.seance)) { seen.add("s" + l.seance); out.push(`<button class="c small" type="button" data-go="seance" data-arg="${l.seance}">🕯️ Meet ${esc(GHOST_NAMES[l.seance] || "the ghost")} in the Séance</button>`); }
        if (l.decoder && !seen.has("d" + l.decoder)) { seen.add("d" + l.decoder); out.push(`<button class="c small" type="button" data-go="decoder" data-arg="${l.decoder}">🗝️ Read ${esc({ egyptian: "hieroglyphs", futhark: "runes", ogham: "Ogham", maya: "Maya numbers" }[l.decoder])} in the Decoder</button>`); } }
      return out.length ? `<div class="group">🔗 Meet them in other rooms</div><div class="choices">${out.join("")}</div>` : "";
    };

    function finish(L, run) {
      const before = chronicled(state.prog), r = settle(state.prog, run);
      let dl = null;
      if (run.daily) { const score = scoreOf(run), won = run.queue.length === 0, detail = `${run.right.length}/${L.cards - 1} placed · ${(run.pins || []).filter((x) => x.grade === "bull").length} 🎯`;
        dl = { score, ...finishDaily(state.prog, "timeline", { score, won, detail }) };
        if (dl.first) postDaily(state, "timeline", { score, won, detail }).then(() => showBoard(false)); else showBoard(false); }
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      const after = chronicled(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name, all = perfect(run);
      ctx.trophy?.("timeline", Math.min(L.n, 3) === L.n ? L.n : 2, { won: all || run.right.length * 2 >= L.cards - 1, perfect: all }); // Trophy Case (trophies.js)
      draw(run, { party: all || r.seals.length + r.decks.length > 0 }); cap(`⏳ ${modeName(L, run)} · ${all ? "a perfect chronicle" : "the scroll rolls up"}`);
      say(all ? `Every card in its place, ${state.name}. Herodotus would weep with joy.` : run.queue.length ? `The sand has run out, ${state.name}. History will wait for you.` : `${run.right.length} of ${L.cards - 1} placed right. Not bad for a time traveller.`);
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`, `score ${r.score}${r.best ? " · new best" : ""}`];
      if (r.fresh.length) bits.push(`${r.fresh.length} new in your Chronicle`);
      if (r.bulls) bits.push(`🎯 ${r.bulls} bullseye${r.bulls === 1 ? "" : "s"}`);
      const ups = [r.perfectFirst ? `★ First perfect game at Level ${L.n}: +${10 * L.n} 💎` : "", r.mythNew ? "🧐 Myth sorted, added to your Codex: +3 💎" : "",
        ...r.seals.map((id) => `🏅 Era seal: <b>${esc(eraOf(id).name)}</b>, every card chronicled! +25 💎`), ...r.decks.map((id) => `🏅 Deck badge: <b>${esc(deckOf(id).name)}</b> complete! +25 💎`),
        titled ? `⏳ Chronicle title: <b>${esc(t.name)}</b>` : "", aw.rankUp ? `🏅 You are now <b>${esc(aw.rankUp)}</b>` : "",
        dl ? `📅 Daily Chronicle #${dayNumber()}: <b>${dl.score} pts</b>${dl.first ? ` · 🔥 ${dl.streak}-day streak` : " · practice run (your first run today counts)"}` : ""].filter(Boolean).map((x) => `<div class="up">${x}</div>`).join("");
      const share = run.daily ? `<div class="group">📣 Share your result</div><textarea class="tl-share" id="tl-share" readonly>${esc(shareText(L, run, dl))}</textarea><div class="choices"><button class="c small" type="button" id="tl-copy">📋 Copy</button></div>` : "";
      const again = run.daily ? "" : `<button class="c main" type="button" id="tl-again">⏳ Play again</button>`;
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${ups}</div>${share}
        <div class="tl-line">${run.line.map((x) => row(x, run.wrong.includes(x.id) ? "bad" : run.right.includes(x.id) ? "new" : "")).join("")}</div>
        ${linkBtns(run)}${guideBtns(run.deck ? ["deck-" + run.deck] : run.eras)}
        <div class="choices">${again}<button class="c" type="button" id="tl-lobby">📜 Choose a game</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp || all) chime(2);
      wireGuides();
      if ($("tl-copy")) $("tl-copy").onclick = async () => { const ta = $("tl-share"); let ok = false;
        try { await navigator.clipboard.writeText(ta.value); ok = true; } catch { ta.select(); try { ok = document.execCommand("copy"); } catch {} }
        $("tl-copy").textContent = ok ? "✓ Copied: paste it in chat" : "Select the text and copy it"; };
      $("ui").querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => (ctx.go ? ctx.go(b.dataset.go, b.dataset.go === "seance" ? { ghost: b.dataset.arg } : { script: b.dataset.arg }) : greet())));
      if ($("tl-again")) $("tl-again").onclick = () => (L.n === 1 ? begin(L) : run.deck ? begin(DECK, { deck: run.deck }) : begin(L, { era: run.eras[0] === run.eras.at(-1) ? run.eras[0] : undefined }));
      $("tl-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: events chronicled by era (🏅 = era seal), themed-deck badges and myths sorted. */
export function codexHtml(p, esc) {
  const r = tlOf(p);
  const eras = ERAS.map((E) => { const list = eventsOf(E.id), have = list.filter((e) => r.cards[e.id]);
    return `<div class="cx"><div class="cx-h"><span>⏳ ${E.emoji} ${esc(E.name)}${r.seals[E.id] ? " 🏅" : ""}</span><span class="note">${have.length} / ${list.length}</span></div>
    <div class="bar"><i style="width:${(have.length / list.length) * 100}%"></i></div>${have.length ? `<div class="chips">${have.map((e) => `<span title="${esc(e.when)}">${e.emoji} ${esc(e.title)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
  const decks = `<div class="cx"><div class="cx-h"><span>⏳ 🃏 Themed deck badges</span><span class="note">${Object.keys(r.decks).length} / ${DECKS.length}</span></div><div class="tl-badges">${DECKS.map((d) => `<span class="${r.decks[d.id] ? "on" : ""}">${r.decks[d.id] ? "🏅" : "○"} ${d.emoji} ${esc(d.name)} · ${d.ids.filter((id) => r.cards[id]).length}/${d.ids.length}</span>`).join("")}</div></div>`;
  const myths = MYTHS.filter((m) => r.myths[m.id]);
  const mythRow = `<div class="cx"><div class="cx-h"><span>⏳ 🧐 Myths and facts sorted</span><span class="note">${myths.length} / ${MYTHS.length}</span></div>${myths.length ? `<div class="chips">${myths.map((m) => `<span title="${esc(m.truth)}">${m.fact ? "✅" : "🦄"} ${esc(m.claim)}</span>`).join("")}</div>` : ""}</div>`;
  return eras + decks + mythRow;
}
export { EVENTS };
