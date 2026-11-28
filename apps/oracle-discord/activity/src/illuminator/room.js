// The Illuminator: a room of the Oracle Chamber (Scriptorium game). Make a manuscript page in the style of a real
// book: put the workshop stages in their real order, then choose each pigment from what it was made of. The page
// builds up as you go. A finished page earns Wren's illuminator's mantle (grantMantle, hosts/scriptorium-desk.js).
import { STEPS, PAGES, LEVELS, INK, ZONE_NAMES, pigmentOf } from "./data.js";
import { room as ilOf, start, placeStep, zone, paint, perfect, settle, maxScore, pageOf, dailyOf } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { deskHtml, CSS } from "./scene.js";
import * as sfx from "../cipherdesk/sfx.js";
import { host } from "../hosts/index.js";
import { grantMantle, MANTLE } from "../hosts/scriptorium-desk.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("il-style")) return; const s = document.createElement("style"); s.id = "il-style"; s.textContent = CSS(); document.head.append(s); };
const drops = (n) => "●".repeat(Math.max(0, n)) + "○".repeat(Math.max(0, INK - n));
const stepOf = (id) => STEPS.find((s) => s.id === id);

export const illuminator = {
  id: "illuminator", label: "Illuminator", emoji: "🎨",
  blurb: "Make a manuscript page with real pigments, in the real order",
  shop: { kind: "illuminator", label: "🎨 Illuminator", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table illuminator";
      tableEl.innerHTML = deskHtml({ look: { ...DEFAULT_LOOK, [it.slot]: id }, sample: true }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => ilOf(P());
    const draw = (s) => { tableEl.className = "table illuminator"; tableEl.innerHTML = deskHtml({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const wren = () => host().id === "scriptorium";

    function lobby(first) {
      clearReading(); cap("🎨 The Illuminator"); draw({ sample: true, letter: "W", label: `${R().pages.length} / ${PAGES.length} pages made` }); sfx.unfold();
      say(first && !R().plays
        ? (wren() ? `The illuminators' desk, ${state.name}. A page was a team job: rule it, write it, gild it, paint it, outline it, in that order. Get the order right, then pick each colour by what it's made of. Lapis, insects, mercury, the odd bit of dung.`
          : `Welcome to the Illuminator, ${state.name}. Make a manuscript page the medieval way: the stages in their real order, then the real pigments.`)
        : pick([`Fresh vellum, ${state.name}. Smells faintly of calf.`, "The gold leaf's ready. Don't breathe on it.", "Which book shall we copy today?"]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "illuminator");
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🎨".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${PAGES.filter((p) => p.lvl === L.n).map((p) => `${r.pages.includes(p.id) ? "✓ " : ""}${esc(p.name)}`).join(", ")}</span></button>`;
      ui(`<div class="cx-top"><b>🎨 Illuminator</b> · ${r.pages.length} / ${PAGES.length} pages made${P().houses?.scriptorium?.illuminated ? " · 🧥 illuminator's mantle" : ""}</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${INK} drops of ink a page. A stage out of order or a wrong pigment costs one.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="il-daily"><b>📅 Daily Page${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same page for everyone${ds.streak ? ` · streak ${ds.streak}` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="il-shop">🧰 Workshop kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => steps(start(LEVELS[+b.dataset.l - 1]))));
      $("il-daily").onclick = () => { const d = dailyOf(); steps(start(d.L, { seed: d.seed, daily: d.day })); };
      $("il-shop").onclick = shop;
      $("back").onclick = greet;
    }
    const bar = (g) => `<div class="cx-top">Level ${g.L.n} · ${esc(pageOf(g.page).name)} · ink ${drops(g.drops)}${g.daily ? " · 📅 daily" : ""}</div>`;

    function steps(g, line) {
      const pg = pageOf(g.page); clearReading(); cap(`🎨 ${pg.name}`); draw({ g, letter: pg.letter, label: pg.when });
      if (!line) sfx.unfold();
      say(line || (g.done.length ? "Good. What comes next?" : `A page in the style of ${pg.name}. Which job comes first?`));
      ui(`${bar(g)}<div class="il-order">${g.done.map((id, i) => `<span>${i + 1}. ${stepOf(id).e} ${esc(stepOf(id).name)}</span>`).join("")}</div>
        <div class="choices col il-steps">${g.deck.map((id) => { const s = stepOf(id), d = g.done.includes(id); return `<button class="c${d ? " done" : ""}" type="button" data-s="${id}" ${d ? "disabled" : ""}>${d ? "✓ " : ""}${s.e} ${esc(s.name)}</button>`; }).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="il-leave">Leave the desk</button></div>`);
      $("il-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => {
        const r = placeStep(g, b.dataset.s), s = stepOf(b.dataset.s);
        if (r === "right") { sfx.scratch(); if (s.id === "gild") setTimeout(() => sfx.seal(), 200); if (g.stage === "colours") { spark(); ctx.banter?.("mid"); return colours(g, `All the stages in order. ${s.fact} Now the colours.`); } return steps(g, s.fact); }
        sfx.wrong(); ctx.emote?.("think", { quiet: true }); if (r === "ruined") return done(g);
        steps(g, pick(["Not yet. Something else has to happen first.", "That would ruin the page. What comes before it?", "Too soon for that."]));
      }));
    }
    function colours(g, line) {
      const pg = pageOf(g.page), z = zone(g); draw({ g, letter: pg.letter, label: pg.when });
      const want = pigmentOf(z.pig);
      say(line || `Now ${ZONE_NAMES[z.part]}. Which pigment is this? “${want.clue}”`);
      ui(`${bar(g)}<div class="note">🎨 ${esc(ZONE_NAMES[z.part])}: <i>${esc(want.clue)}</i></div>
        <div class="choices col">${z.choices.map((id) => { const p = pigmentOf(id), bad = z.tried.includes(id); return `<button class="c" type="button" data-p="${id}" ${bad ? "disabled" : ""}><span class="il-swatch" style="background:${p.hex}"></span>${bad ? "✗ " : ""}${esc(p.name)}</button>`; }).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="il-leave">Leave the desk</button></div>`);
      $("il-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => {
        const p = pigmentOf(b.dataset.p), r = paint(g, b.dataset.p);
        if (r === "right") { sfx.decode(3); if (g.over) return done(g); return colours(g, `${p.name}. ${p.fact} Next, ${ZONE_NAMES[zone(g).part]}: “${pigmentOf(zone(g).pig).clue}”`); }
        sfx.wrong(); if (r === "ruined") return done(g);
        colours(g, `That's ${p.name}: ${p.clue} Not what we need here.`);
      }));
    }
    function done(g) {
      const pg = pageOf(g.page), r = settle(P(), g); let mantle = false;
      if (g.won && !(P().owned || []).includes(MANTLE)) mantle = true;
      if (g.won) grantMantle(P()); // a finished page earns Wren's illuminator's mantle (Houses, hosts/scriptorium-desk.js)
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("illuminator", g.L.n, { won: r.won, perfect: perfect(g) }); // Trophy Case (trophies.js)
      draw({ g: g.won ? g : g, letter: pg.letter, label: g.won ? "finished" : "ruined", state: g.won ? "done" : "" });
      sfx.finale(g.won); if (g.won) { spark(); chime(perfect(g) ? 3 : 1); ctx.banter?.("win"); } else ctx.banter?.("lose");
      say(g.won ? pick(["A finished page. Let the gold catch the light.", "Ruled, written, gilded, painted, outlined. Lovely.", "That page will outlast all of us."]) : "Out of ink, and the page is spoiled. Every workshop had a pile of those.");
      let board = "";
      if (g.daily) { const res = { score: g.score, won: g.won, detail: `Level ${g.L.n} · ${pg.name}` }, fd = finishDaily(P(), "illuminator", res, g.daily); saveProgress();
        const fill = (b) => { const e = $("il-board"); if (e) e.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: g.score } }); };
        (fd.first ? postDaily(state, "illuminator", res) : boardOf(state, "illuminator")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="il-board" class="note">Loading the board…</div>`; }
      ui(`<div class="reward"><div><b>+${r.xp} ✦ · +${r.essence} 💎</b> · score ${g.score} / ${maxScore(g.L)}${perfect(g) ? " · ✨ no blots" : ""}</div>${r.newPage ? `<div class="up">📖 New page: ${esc(pg.name)}</div>` : ""}${mantle ? `<div class="up">🧥 Wren gives you the illuminator's mantle</div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="in-card"><b>📖 ${esc(pg.name)} · ${esc(pg.when)}</b><p>${esc(pg.fact)}</p><p class="note">Order: ${g.order.map((id) => stepOf(id).e).join(" → ")}</p></div>${board}
        <div class="choices"><button class="c main" type="button" id="il-again">🎨 Another Level ${g.L.n} page</button><button class="c" type="button" id="il-lobby">🗂 Choose a level</button></div>`);
      $("il-again").onclick = () => steps(start(g.L)); $("il-lobby").onclick = () => lobby(false);
    }

    function shop(msg) {
      clearReading(); cap("🧰 Workshop kit"); const look = lookOf(P()); draw({ sample: true, letter: "W" });
      say(typeof msg === "string" ? msg : `Brushes, burnishers and colour pots, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><br><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="il-lobby">🎨 Back to the desk</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A page or two will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.click(); shop(r === "bought" ? "Good kit. It's on your desk." : "Swapped in."); } }));
      $("il-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** Codex page: pages made and the pigments you've learned. */
export function illuminatorCodex(p, esc) {
  const r = ilOf(p);
  return `<div class="note">🎨 Illuminator: ${r.pages.length} / ${PAGES.length} pages made · best ${LEVELS.map((L) => `L${L.n} ${r.best[L.n] || 0}`).join(", ")}</div>
    <div class="chips">${PAGES.map((x) => `<span>${r.pages.includes(x.id) ? "✓" : "·"} ${esc(x.name)}</span>`).join("")}</div>`;
}
