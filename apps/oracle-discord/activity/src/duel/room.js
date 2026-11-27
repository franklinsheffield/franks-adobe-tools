// Element Duel: a room of the Oracle Chamber. A 1-player card battle against the Oracle with the periodic table.
// Cards are atoms; put them on the bench and React to make a real compound, whose power (set by its real enthalpy of
// formation, the round's lab condition and the bonus) hits the Oracle. First to 0 Stability, or to 5 discoveries, loses
// (or wins). Every compound you make goes into your Codex with its real facts.
// Mounted via ROOMS (main.js): room.open(ctx), codexHtml, shop. Rules in logic.js, data in elements.js/compounds.js,
// drawing in scene.js, sounds in sfx.js, cosmetics in shop.js.
import { EL, FAMILY, isNoble } from "./elements.js";
import { COMPOUNDS, BY_ID, CHAINS, pretty } from "./compounds.js";
import { LEVELS, CONDITIONS, COND, GOAL, START, SHIELD, newGame, place, unplace, clearBench, playBench, raiseShield, recycle, oracleTurn, glowing, bestHint, cardsFor, compoundOf, room as duelRoom, codexCount, titleOf, nextTitle, settle } from "./logic.js";
import { sceneSvg, kindOf, KIND } from "./scene.js";
import { SHOP, SLOTS, SHELF_TALK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { CSS } from "./style.js";
import { SFX } from "./sfx.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sign = (o) => (o > 0 ? "+" + o : String(o));
function styleOnce() {
  if (document.getElementById("du-style")) return;
  const st = document.createElement("style"); st.id = "du-style"; st.textContent = CSS; document.head.append(st);
}
const TAUNT = {
  hit: ["The Oracle reels. Its robes smell faintly of {c}.", "A clean hit. The crystal ball flickers.", "The Oracle sways. 'Lucky stoichiometry,' it mutters.", "Boom. Somewhere, Lavoisier nods approvingly."],
  ohit: ["The Oracle fuses {f}: {n}! Your bench rattles.", "'{n},' the Oracle purrs, sliding {f} across the table.", "From its sleeve, the Oracle makes {f}, {n}. It stings.", "The Oracle forms {f}. {n}. 'I read this in your future,' it says."],
  orecycle: ["The Oracle frowns at its hand and swaps cards.", "The Oracle shuffles {k} cards back into its deck, muttering about valence.", "No reaction. The Oracle recycles {k} cards."],
};
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
const ph = { s: "solid", l: "liquid", g: "gas" };
// Bench formulas are written the usual way round: metals first, then the non-metals in the conventional order.
const NONMETAL_ORDER = ["B", "Si", "C", "Sb", "As", "P", "N", "H", "Se", "S", "I", "Br", "Cl", "O", "F"];
const rank = (s) => { const i = NONMETAL_ORDER.indexOf(s); return i >= 0 ? 100 + i : EL[s] ? EL[s].z / 200 : 99; };

/** A Codex page for a compound: formula, name, its real enthalpy of formation, phase and fact. */
export function pageHtml(c, esc, extra = "") {
  const hot = c.dh < 0, tags = [
    `<span class="du-tag ${hot ? "hot" : "cold"}">${hot ? "🔥 exothermic" : "❄️ endothermic"} · ΔHf° ${c.dh > 0 ? "+" : ""}${c.dh} kJ/mol</span>`,
    `<span class="du-tag">${ph[c.ph]} at room temperature</span>`,
    ...c.tags.map((t) => `<span class="du-tag">${{ acid: "🧪 acid in water", base: "🧼 base in water", cat: "⚗️ made over a catalyst", spark: "⚡ made by sparks" }[t]}</span>`),
  ];
  return `<div class="du-page"><h3>${esc(pretty(c.f))} · ${esc(c.name)}</h3><div class="du-tags">${extra}${tags.join("")}</div>
    <div class="du-sec"><b class="h">🔬 Fact</b>${esc(c.fact)}</div>
    <div class="du-sec"><b class="h">⚛️ Atoms</b>${Object.entries(c.atoms).map(([s, n]) => `${n} × ${esc(EL[s].name)} (${s}, ${EL[s].ox.filter((o) => o).slice(0, 3).map(sign).join("/")})`).join(" + ")}</div></div>`;
}
const GUIDE = [
  ["How you win", ["Each side starts with <b>20 Stability</b>. Bring the Oracle to 0, or be first to discover <b>5 different compounds</b> in one duel."]],
  ["Your turn", ["Tap element cards to put them on the bench. Each card is one atom, so water is H + H + O.", "Press <b>React</b>. If the bench is a real compound, it hits the Oracle. If not, it fizzles: free at Apprentice, −1 Stability at Chemist, −2 at Master (and at Master the cards are lost).", "A <b>noble gas</b> alone on the bench can be raised as an inert shield (free, once a turn) that blocks 4 damage from the next hit. Noble gases have full outer electron shells, so they hardly react.", "<b>Recycle</b> discards the bench cards and draws new ones, and ends your turn. With an empty bench it's a pass."]],
  ["Power", ["Power = the number of atoms + a bonus for how exothermic the compound is (its real standard enthalpy of formation, ΔHf°). Aluminium oxide (−1676 kJ/mol) hits far harder than hydrogen sulfide (−21).", "Endothermic compounds (positive ΔHf°, like NO or acetylene) soak up energy to form, so making one costs you 1 Stability, unless the lab has High heat or a Spark.", "The ★ bonus compound gives +2 power and +3 💎 Essence."]],
  ["Lab conditions", CONDITIONS.map((c) => `${c.emoji} <b>${c.name}</b>: ${c.rule} <i>${c.why}</i>`)],
  ["Levels", LEVELS.map((L) => `<b>${L.n} · ${L.name}</b>: ${L.what}. Recycle up to ${L.recycle} cards. Points ×${L.mult}.`)],
  ["Reaction chains (Master)", ["Make the steps of a real industrial process on your turns in a row for +2 power per step:", ...CHAINS.map((ch) => `<b>${ch.name}</b>: ${ch.steps.map(pretty).join(" → ")}. <i>${ch.what}</i>`)]],
  ["Oxidation states", ["Each card shows its usual charges (oxidation states) in the corner. In a compound they add up to zero: Na is +1 and Cl is −1, so NaCl. Mg is +2 and Cl −1, so MgCl₂. Use them to work out formulas at Chemist and Master."]],
];
const guideHtml = () => `<div class="du-guide"><h3 style="font-family:var(--display);color:var(--gold2);margin:0 0 6px">⚛️ How to play Element Duel</h3>${GUIDE.map(([h, ps], i) => `<details${i < 2 ? " open" : ""}><summary>${h}</summary>${ps.map((p) => `<p>${p}</p>`).join("")}</details>`).join("")}</div>`;

export const room = {
  id: "duel", row: "cards", label: "Element Duel", emoji: "⚛️",
  blurb: "A card battle with the periodic table: make real compounds to out-react the Oracle",
  shop: { kind: "duel", label: "⚛️ Element Duel", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce();
      const look = { back: "db-atom", bench: "bn-school", [it.slot]: id }, g = newGame(1, 7);
      tableEl.className = "table duel"; tableEl.innerHTML = sceneSvg({ look, g, fx: { kind: "react", side: "you", c: BY_ID.NaCl, dmg: 5 } }); cap("👁 Trying on: " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    let g = null, L = LEVELS[0], gen = 0, fx = null, hintId = null, busy = false;
    const live = (my) => my === gen && state.inRoom === "duel";
    const later = (ms, fn) => { const my = gen; setTimeout(() => live(my) && fn(), ms); };
    const look = () => lookOf(state.prog);
    const draw = () => { tableEl.className = "table duel"; tableEl.innerHTML = sceneSvg({ look: look(), g, fx }); };
    const statsTop = () => { const n = codexCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>⚛️ ${esc(t.name)}</b> · ${n} / ${COMPOUNDS.length} compounds in your Codex${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };
    const leave = () => { gen++; greet(); };

    function lobby(first) {
      gen++; g = null; fx = null; clearReading(); cap("⚛️ Element Duel"); draw();
      const r = duelRoom(state.prog);
      say(first && !r.plays
        ? `Welcome to Element Duel, ${state.name}. Your cards are atoms. Put them together into real compounds, salt, water, rust, and hurl them at me. More exothermic means more power. Bring me to zero Stability, or discover five compounds before I do.`
        : pick([`Back for more chemistry, ${state.name}? Pick your level.`, "The deck is shuffled. The bench is clean. Which level?", `My atoms are ready, ${state.name}. Are yours?`]));
      ui(`${statsTop()}<div class="levels">${LEVELS.map((x) => `<button class="c level" type="button" data-l="${x.n}"><b>${"⚛️".repeat(x.n)} ${x.n} · ${esc(x.name)}</b><span>${esc(x.what)} · won ${r.wins[x.n] || 0} of ${r.played[x.n] || 0} · points ×${x.mult}</span></button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="du-how">📖 How to play</button><button class="c small" type="button" id="du-codex">📒 My compounds</button><button class="c small" type="button" id="du-shop">🧪 Lab supplies</button></div>
        <div class="note">Every compound is real, and its power comes from its real enthalpy of formation. Cards show each element's usual charges.</div>
        <div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => start(LEVELS[+b.dataset.l - 1])));
      $("du-how").onclick = () => toggle(guideHtml);
      $("du-codex").onclick = () => toggle(codexPage);
      $("du-shop").onclick = () => shop();
      $("back").onclick = leave;
    }
    const toggle = (fn) => { const rb = $("reading-body"), html = fn(); const on = rb.dataset.v !== fn.name; rb.innerHTML = on ? html : ""; rb.dataset.v = on ? fn.name : ""; if (on) rb.firstElementChild?.scrollIntoView({ behavior: "smooth", block: "start" }); };
    function codexPage() {
      const r = duelRoom(state.prog);
      return `<div class="du-guide"><h3 style="font-family:var(--display);color:var(--gold2);margin:0 0 6px">📒 My compounds</h3>${LEVELS.map((x) => { const got = COMPOUNDS.filter((c) => c.tier === x.n && r.codex[c.id]), all = COMPOUNDS.filter((c) => c.tier === x.n);
        return `<details open><summary>${esc(x.name)} · ${got.length} / ${all.length}</summary>${got.length ? `<div class="du-chips">${got.map((c) => `<span title="${esc(c.name + ": " + c.fact)}">${esc(pretty(c.f))} ${esc(c.name)}</span>`).join("")}</div>` : "<p>None yet.</p>"}</details>`; }).join("")}
        <details><summary>Chains completed · ${Object.keys(r.chains).length} / ${CHAINS.length}</summary><div class="du-chips">${CHAINS.map((ch) => `<span>${r.chains[ch.id] ? "✅" : "▫️"} ${esc(ch.name)}</span>`).join("")}</div></details></div>`;
    }
    function shop(msg) {
      gen++; g = null; fx = null; draw(); cap("🧪 Lab supplies");
      say(msg || pick(SHELF_TALK.open).replace("{name}", state.name));
      const lk = look();
      ui(`<div class="cx-top">💎 ${state.prog.essence || 0} Essence</div>${SLOTS.map(([slot, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === slot).map((s) => {
        const own = owns(state.prog, s.id), on = lk[slot] === s.id;
        return `<button class="c" type="button" data-buy="${s.id}" ${on ? "disabled" : ""}>${on ? "✓ " : ""}<b>${esc(s.name)}</b> <span class="note">· ${own ? (on ? "in use" : "owned, tap to use") : s.price + " 💎"} · ${esc(s.note)}</span></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="du-lobby">⚛️ Back to Element Duel</button></div>`);
      $("ui").querySelectorAll("[data-buy]").forEach((b) => (b.onmouseenter = () => { const it = shopItem(b.dataset.buy); tableEl.innerHTML = sceneSvg({ look: { ...look(), [it.slot]: it.id }, g: null }); },
        b.onclick = () => { const r = buyOrUse(state.prog, b.dataset.buy);
          if (r === "poor") return shop("Not enough Essence yet. Win a few duels and come back.");
          if (r) { saveProgress(); showStats(); r === "bought" ? SFX.discover() : SFX.place(2); shop(r === "bought" ? pick(SHELF_TALK.buy).replace("{item}", shopItem(b.dataset.buy).name) : "Swapped in."); } }));
      $("du-lobby").onclick = () => lobby(false);
    }

    function start(level) {
      L = level; gen++; g = newGame(L.n); fx = null; hintId = null; busy = false; clearReading();
      cap(`⚛️ ${L.name} duel`); SFX.deal(7); draw();
      const c = COND[g.cond];
      say(`${pick(["I shuffle my deck. You shuffle yours.", "Seven atoms each. Let's see what you can make.", "The bench is set. Your move, chemist."])} Round 1: ${c.emoji} ${c.name}. ${c.rule}`);
      turn();
    }
    const cardHtml = (c, where, cls = "") => { const e = EL[c.s], col = FAMILY[e.fam].col;
      return `<button class="du-card ${cls}" type="button" data-${where}="${c.id}" style="--fam:${col}" title="${esc(e.name)} · ${esc(FAMILY[e.fam].name)} · ${esc(e.fact)}" aria-label="${esc(e.name)}"><span class="z">${e.z}</span><span class="ox">${e.ox.filter((o) => o).slice(0, 2).map(sign).join(" ") || "0"}</span><span class="sym">${c.s}</span><span class="nm">${esc(e.name)}</span><span class="fam"></span></button>`; };

    /** Your turn: stats, condition, bench, hand, actions. */
    function turn(line, keepTable = false) {
      if (line) say(line);
      if (!keepTable) draw();
      const glow = glowing(g), hint = hintId ? BY_ID[hintId] : null, hintCards = hint ? new Set(cardsFor([...g.bench, ...g.you.hand], hint).map((c) => c.id)) : new Set();
      const c = COND[g.cond], lone = g.bench.length === 1 && isNoble(g.bench[0].s), made = g.bench.length ? compoundOf(g.bench, L) : null;
      const benchF = made && L.hints ? made.f : g.bench.length ? Object.entries(g.bench.reduce((o, x) => ((o[x.s] = (o[x.s] || 0) + 1), o), {})).sort(([a], [b]) => rank(a) - rank(b)).map(([s, n]) => s + (n > 1 ? n : "")).join("") : "";
      const n = Math.min(g.bench.length, L.recycle);
      ui(`<div class="du-stats"><span>Round <b>${g.round}</b></span><span>🛡 You <b>${g.you.hp}</b>${g.you.shield ? ` (+${g.you.shield} shield)` : ""}</span><span>🔮 Oracle <b>${g.oracle.hp}</b>${g.oracle.shield ? ` (+${g.oracle.shield} shield)` : ""}</span><span>◆ Discoveries <b>${g.you.found.length}</b> vs ${g.oracle.found.length} of ${GOAL}</span></div>
        <div class="du-cond-line">${c.emoji} <b>${esc(c.name)}</b>: ${esc(c.rule)} <i>${esc(c.why)}</i></div>
        <div class="du-bench" id="du-bench">${g.bench.length ? g.bench.map((x) => cardHtml(x, "b", "small" + (hintCards.has(x.id) ? " hint" : ""))).join("") + `<span class="formula${made && L.hints ? " ok" : ""}">${esc(pretty(benchF))}${made && L.hints ? " ✓" : ""}</span>` : `<span class="empty">The bench is empty. Tap cards below to put atoms on it.</span>`}</div>
        <div class="du-hand">${g.you.hand.map((x) => cardHtml(x, "h", (glow.has(x.id) ? "glow" : "") + (hintCards.has(x.id) ? " hint" : ""))).join("")}</div>
        <div class="choices">${lone && !g.you.shieldUsed ? `<button class="c main" type="button" id="du-shield">🛡 Raise ${esc(EL[g.bench[0].s].name)} shield (blocks ${SHIELD * (g.cond === "argon" ? 2 : 1)})</button>` : `<button class="c main" type="button" id="du-react" ${g.bench.length ? "" : "disabled"}>⚗️ React</button>`}
          ${L.undo && g.bench.length ? `<button class="c" type="button" id="du-clear">↺ Clear bench</button>` : ""}
          <button class="c" type="button" id="du-recycle">${g.bench.length ? `♻ Recycle ${n} card${n === 1 ? "" : "s"} &amp; end turn` : "⏭ Pass turn"}</button>
          ${L.hints ? `<button class="c" type="button" id="du-hint">💡 Hint</button>` : ""}</div>
        <div class="note">${L.hints ? "Glowing cards can make something together. " : ""}${L.undo ? "Tap a bench card to take it back. " : "Master: cards on the bench stay there. "}Fizzles ${L.fizzle ? `cost ${L.fizzle} Stability` : "are free"}. Recycle up to ${L.recycle}.</div>
        <div class="choices"><button class="c small" type="button" id="du-how">📖 Rules</button><button class="c small" type="button" id="du-quit">Leave the duel</button></div>`);
      $("ui").querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => { if (busy) return; if (place(g, +b.dataset.h)) { SFX.place(g.bench.length - 1); turn(null, true); } }));
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { if (busy) return; if (unplace(g, +b.dataset.b)) { SFX.unplace(); turn(null, true); } }));
      if ($("du-react")) $("du-react").onclick = () => !busy && go();
      if ($("du-shield")) $("du-shield").onclick = () => { if (busy) return; const r = raiseShield(g); if (r) { SFX.shield(); turn(`${EL[r.s].name}'s full outer shell makes a perfect inert shield: it will block ${r.shield} from my next hit. Now make something.`, true); } };
      if ($("du-clear")) $("du-clear").onclick = () => { if (busy) return; clearBench(g); SFX.unplace(); turn(null, true); };
      $("du-recycle").onclick = () => { if (busy) return; const r = recycle(g); SFX.deal(Math.max(1, r.n)); fx = null; draw(); say(r.n ? `You recycle ${r.n} card${r.n === 1 ? "" : "s"} and draw fresh atoms.` : "You pass. The Oracle smiles."); busy = true; later(1100, oracleGo); };
      if ($("du-hint")) $("du-hint").onclick = () => { const h = bestHint(g); hintId = h ? h.id : null; turn(h ? `Psst: you could make ${pretty(h.f)}, ${h.name}. The gold cards make it.` : "Nothing in your hand reacts. Recycle a few cards, or raise a noble-gas shield.", true); };
      $("du-how").onclick = () => toggle(guideHtml);
      $("du-quit").onclick = () => lobby(false);
    }

    /** React with the bench. */
    function go() {
      const out = playBench(g); if (!out) return; hintId = null;
      if (!out.ok) {
        fx = { kind: "fizz", cards: out.cards }; SFX.fizz(); draw();
        const msg = `It fizzles. ${out.why}${out.cost ? ` That cost you ${out.cost} Stability.` : ""}`;
        if (g.over) return end();
        if (out.lost) { busy = true; ui(`<div class="note">The bench fizzles away. Master level: no take-backs.</div>`); say(msg + " At Master level the cards are lost, and it's my turn.", () => later(500, oracleGo)); }
        else later(300, () => turn(msg));
        return;
      }
      busy = true; show(out); ui(`<div class="du-stats"><span>Round <b>${g.round}</b></span><span>🛡 You <b>${g.you.hp}</b></span><span>🔮 Oracle <b>${g.oracle.hp}</b></span><span>◆ Discoveries <b>${g.you.found.length}</b> of ${GOAL}</span></div><div class="note">⚗️ Reacting… its Codex page is open below.</div>`);
      const c = out.c, bits = [];
      bits.push(`${pretty(c.f)}, ${c.name}! Power ${out.power}${out.notes.length ? ` (${out.notes.join(", ")})` : ""}.`);
      if (out.blocked) bits.push(`My shield blocks ${out.blocked}.`);
      bits.push(out.dmg ? fill(pick(TAUNT.hit), { c: c.name.toLowerCase() }) : "Not a scratch.");
      if (out.cost) bits.push("Endothermic: making it cost you 1 Stability.");
      if (out.chain && out.chain.k > 0) bits.push(out.chainDone ? `Chain complete: the ${out.chain.chain.name}!` : `Chain step ${out.chain.k + 1} of the ${out.chain.chain.name}.`);
      if (out.isNew) bits.push(`New discovery: ${g.you.found.length} of ${GOAL}.`);
      say(bits.join(" "), () => later(700, () => (g.over ? end() : oracleGo())));
    }
    /** Animate a reaction and open its Codex page. */
    function show(out) {
      fx = { kind: "react", side: out.side, c: out.c, cards: out.cards, dmg: out.dmg, blocked: out.blocked, hit: out.dmg ? (out.side === "you" ? "oracle" : "you") : null }; draw();
      SFX.react(out.power, kindOf(out.c), out);
      if (out.side === "you" && out.isNew) setTimeout(() => SFX.discover(), 1300); if (out.chain && out.chain.k > 0) SFX.chain(out.chain.k);
      $("reading-body").innerHTML = pageHtml(out.c, esc, out.side === "you" && out.isNew && !duelRoom(state.prog).codex[out.c.id] ? `<span class="du-tag new">✨ new for your Codex</span>` : out.side === "oracle" ? `<span class="du-tag">🔮 the Oracle made it</span>` : "");
    }
    /** The Oracle's turn, then the next round. */
    function oracleGo() {
      busy = true; fx = null; cap("🔮 The Oracle's turn"); draw();
      ui(`<div class="du-stats"><span>Round <b>${g.round}</b></span><span>🛡 You <b>${g.you.hp}</b></span><span>🔮 Oracle <b>${g.oracle.hp}</b></span></div><div class="note">The Oracle studies its hand…</div>`);
      later(900, () => {
        const prev = g.round, out = oracleTurn(g); if (!out) return turn();
        const lines = [];
        if (out.shield) { SFX.shield(); lines.push(`The Oracle raises a ${EL[out.shield.s].name} shield (blocks ${out.shield.shield}).`); }
        if (out.ok) { show(out); const c = out.c; lines.push(fill(pick(TAUNT.ohit), { f: pretty(c.f), n: c.name }) + ` Power ${out.power}${out.blocked ? `, your shield blocks ${out.blocked}` : ""}${out.dmg ? `: you lose ${out.dmg}.` : "."}`);
          if (out.chain && out.chain.k > 0) lines.push(`That's step ${out.chain.k + 1} of the ${out.chain.chain.name}.`); }
        else { fx = null; draw(); SFX.deal(Math.max(1, out.recycled)); lines.push(fill(pick(TAUNT.orecycle), { k: out.recycled })); }
        say(lines.join(" "), () => later(out.ok ? 900 : 400, () => {
          if (g.over) return end();
          busy = false; fx = null; cap(`⚛️ ${L.name} duel`);
          if (g.round !== prev) { const c = COND[g.cond], b = BY_ID[g.bonus]; SFX.flip(); turn(`Round ${g.round}: ${c.emoji} ${c.name}. ${c.rule} Bonus: ${pretty(b.f)}.`); }
          else turn();
        }));
      });
    }
    function end() {
      busy = true; const won = g.over.winner === "you", draw_ = g.over.winner === "draw";
      fx = { kind: won ? "win" : "lose", draw: draw_ }; draw(); won ? SFX.win() : SFX.lose();
      const before = codexCount(state.prog), r = settle(state.prog, g), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("duel", g.level, { won, perfect: won && g.over.how !== "time" }); // Trophy Case (trophies.js)
      const t = titleOf(codexCount(state.prog)), titled = titleOf(before).name !== t.name;
      const how = { stability: won ? "The Oracle's Stability hits zero." : "Your Stability hits zero.", discovery: won ? `You discovered ${GOAL} compounds first.` : `The Oracle discovered ${GOAL} compounds first.`, time: "Thirty rounds: the higher Stability takes it." }[g.over.how];
      say(won ? `${how} ${pick(["Well reacted, chemist.", "I am… destabilised. You win.", "Mendeleev would be proud."])}` : draw_ ? "A perfect stalemate. Even the atoms are confused." : `${how} ${pick(["Better luck next reaction.", "The Oracle's chemistry prevails. This time.", "Back to the textbooks, then come back."])}`);
      if (titled || aw.rankUp) chime(2);
      ui(`<div class="reward"><div><b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b> · ${g.you.found.length} discover${g.you.found.length === 1 ? "y" : "ies"} this duel${g.you.bonusHits ? ` · ${g.you.bonusHits} bonus compound${g.you.bonusHits > 1 ? "s" : ""}` : ""}</div>
        ${r.newCodex.length ? `<div class="up">📒 New in your Codex: ${r.newCodex.map((id) => esc(pretty(id))).join(", ")}</div>` : ""}
        ${r.newChains.length ? `<div class="up">🏭 Chain completed: ${r.newChains.map((id) => esc(CHAINS.find((c) => c.id === id).name)).join(", ")}</div>` : ""}
        ${titled ? `<div class="up">⚛️ Duel title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="du-again">⚛️ Rematch (${esc(L.name)})</button><button class="c" type="button" id="du-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("du-again").onclick = () => start(L); $("du-lobby").onclick = () => lobby(false); $("back").onclick = leave;
    }

    lobby(true);
  },
};

/** For the Codex page: compounds discovered by level. */
export function duelCodex(prog, esc) {
  const r = duelRoom(prog);
  return LEVELS.map((L) => { const all = COMPOUNDS.filter((c) => c.tier === L.n), got = all.filter((c) => r.codex[c.id]);
    return `<div class="cx"><div class="cx-h"><span>⚛️ Element Duel: ${esc(L.name)}</span><span class="note">${got.length} / ${all.length}</span></div>
    <div class="bar"><i style="width:${(got.length / all.length) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((c) => `<span>${esc(pretty(c.f))} ${esc(c.name)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}
