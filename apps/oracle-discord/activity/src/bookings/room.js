// Bookings: a room of the Oracle Chamber, and step 3 of the Séance Parlour's core loop. Tonight's Bill brings 3
// bookings a day, the same for everyone: expose a claim for a newspaper, perform a trick for a theatre, explain a
// method for a skeptics' society. Level 3 chains all three. Good shows raise your billing on the playbill, from
// Bottom of the Bill to Star Turn. Matinees are extra bookings at half pay. No booking asks you to contact the dead.
import { method, caseOf } from "../casefiles/data.js";
import { trickOf } from "../workshop/data.js";
import { BILLINGS, CLIENTS, venueOf, pitchOf } from "./bill.js";
import { room as bkOf, billFor, billing, nextBilling, matinee, start, partNow, answer, perfect, scoreOf, settle, billTotal } from "./logic.js";
import { room as wsOf } from "../workshop/logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { billSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "../seance/sfx.js";
import { page, coins, glass } from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { host } from "../hosts/index.js";
import { addTokens } from "../hosts/tokens.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("bk-style")) return; const s = document.createElement("style"); s.id = "bk-style"; s.textContent = CSS; document.head.append(s); };
const PART = { expose: "📰 Expose", perform: "🎭 Perform", explain: "🔬 Explain" };
const SAMPLE = { lv: 2, venue: "egyptian", client: "theatre", method: "palm", parts: [] };

export const bookings = {
  id: "bookings", label: "Bookings", emoji: "🎟️",
  blurb: "Tonight's Bill: expose, perform and explain real tricks for real venues",
  shop: { kind: "bookings", label: "🎟️ Playbill & stage door", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table bookings";
      tableEl.innerHTML = billSvg(SAMPLE, { look: { ...DEFAULT_LOOK, [it.slot]: id }, name: "Star Turn", billing: 2 }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => bkOf(P());
    const rook = () => host().id === "parlour";
    const draw = (b, o = {}) => { tableEl.className = "table bookings"; tableEl.innerHTML = billSvg(b, { look: lookOf(P()), name: state.name || "You", billing: billing(P()).n, ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };

    function lobby(first) {
      clearReading(); cap("🎟️ Tonight's Bill"); draw(null);
      const r = R(), bill = billFor(P()), bl = billing(P()), nx = nextBilling(P()), ds = dailyState(P(), "bookings");
      say(first && !r.plays
        ? (rook() ? `Three bookings tonight, ${state.name}, the same three for everyone in the channel. Newspapers, theatres, skeptics. Nobody wants a ghost. They want the method.`
          : `These are tonight's bookings, ${state.name}: three a day, the same for everyone. Expose a claim, perform a trick, explain a method.`)
        : pick(rook() ? ["The bill's up, darling. Your name's on it, in letters this big.", "Curtain at eight. Don't be late.", `A full house tonight, ${state.name}. Let's give them the truth, beautifully.`]
          : ["Tonight's Bill is up.", "Three bookings are waiting.", "The stage door is open."]));
      const slot = (b, i) => { const done = bill.played[i], v = venueOf(b.venue), c = CLIENTS[b.client];
        return `<button class="c level${done ? " done" : ""}" type="button" data-slot="${i}" ${done ? "disabled" : ""}><b>${"★".repeat(b.lv)} ${v.e} ${esc(v.name)}${done ? (done.won ? ` · ✓ ${done.score} pts` : " · flopped") : ""}</b><span>${c.e} ${esc(c.name)} ${esc(c.ask)} · ${b.parts.map((p) => PART[p.kind]).join(" → ")}</span></button>`; };
      ui(`<div class="cx-top"><b>🎟️ ${esc(bl.name)}</b> · ${r.shows} shows${nx ? ` · ${nx.shows - r.shows} more for ${esc(nx.name)}` : " · top billing"} · pay ×${bl.mult}</div>
        <div class="group">Tonight's Bill${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</div><div class="bk-slots">${bill.bookings.map(slot).join("")}</div>
        <div class="note">Each part allows two tries. Performing a trick from your Workshop repertoire earns a bonus point.${rook() ? " A Level 3 booking pays a 🗝️ key." : ""}</div>
        <div class="group">Matinees (any time, half pay)</div><div class="choices">${[1, 2, 3].map((lv) => `<button class="c small" type="button" data-mat="${lv}">${"★".repeat(lv)} Level ${lv}</button>`).join("")}</div>
        <div class="choices"><button class="c" type="button" id="bk-hist">📜 Past shows</button><button class="c" type="button" id="bk-ws">🎩 Workshop</button><button class="c" type="button" id="bk-shop">🖼️ Playbill shop</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-slot]").forEach((b) => (b.onclick = () => { const i = +b.dataset.slot; begin(start(bill.bookings[i], { slot: i, day: bill.day })); }));
      $("ui").querySelectorAll("[data-mat]").forEach((b) => (b.onclick = () => begin(start(matinee(P(), +b.dataset.mat)))));
      $("bk-hist").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".bk-hist"); page(); rb.innerHTML = on ? histHtml(P(), esc) : ""; $("bk-hist").textContent = on ? "✕ Close" : "📜 Past shows"; };
      $("bk-ws").onclick = () => ctx.go?.("workshop"); $("bk-shop").onclick = shop; $("back").onclick = greet;
    }
    const begin = (run) => { clearReading(); sfx.knock(3); draw(run.b); say(pitchOf(run.b) + " " + venueOf(run.b.venue).fact); setTimeout(() => show(run), 10); };
    function show(run, line) {
      const b = run.b, part = partNow(run), n = b.parts.length;
      cap(`🎟️ ${venueOf(b.venue).name}${run.slot == null ? " · matinee" : ""}`); draw(b);
      const trail = `<div class="bk-parts">${b.parts.map((p, i) => `<span class="${i < run.i ? "ok" : i === run.i ? "now" : ""}">${i < run.i ? "✓ " : ""}${PART[p.kind]}</span>`).join("")}</div>`;
      const top = `<div class="cx-top">${"★".repeat(b.lv)} Level ${b.lv} · part ${run.i + 1} of ${n}${run.tries ? " · last try" : ""}</div>${trail}`;
      let q = "", opts = "";
      if (part.kind === "expose") { const c = caseOf(part.caseId);
        q = `<div class="ft-card"><b>${c.emoji} ${esc(c.name)} · ${c.year} · ${esc(c.place)}</b><p>${esc(c.who)}. ${esc(c.scene)}</p></div><div class="group">How was it done?</div>`;
        opts = part.options.map((id) => `<button class="c" type="button" data-o="${id}">${esc(method(id).name)}</button>`).join("");
        say(line || (rook() ? "The editor wants the method in tomorrow's paper. What was it?" : "Name the method behind this claim."));
      } else if (part.kind === "perform") {
        q = `<div class="ft-card"><b>🎭 The audience must see:</b><p>“${esc(part.brief)}”</p></div><div class="group">Which trick do you perform?</div>`;
        opts = part.options.map((id) => { const t = trickOf(id), rep = wsOf(P()).rep.includes(id); return `<button class="c" type="button" data-o="${id}">${t.emoji} ${esc(t.name)}${rep ? " · 🎴 rehearsed" : ""}</button>`; }).join("");
        say(line || (rook() ? "The manager wants that moment on stage tonight. Which act gives it to them?" : "Pick the trick that gives the audience this moment."));
      } else {
        const m = method(part.method);
        q = `<div class="ft-card"><b>🔬 Demonstrate: ${esc(m.name)}</b><p>The society wants to know why it fools people.</p></div><div class="group">Why does it work?</div>`;
        opts = part.options.map((id) => `<button class="c" type="button" data-o="${id}">${esc(method(id).how)}</button>`).join("");
        say(line || (rook() ? "Now the lecture, darling. Tell them how it really works." : "Explain how this method works."));
      }
      ui(`${top}${q}<div class="choices col">${opts}</div><div class="choices"><button class="c small" type="button" id="bk-leave">Cancel the booking</button></div>`);
      $("ui").querySelectorAll("[data-o]").forEach((btn) => (btn.onclick = () => { const res = answer(run, btn.dataset.o, P());
        if (res === "retry") { sfx.wrong(); ctx.emote?.("think", { quiet: true }); return show(run, pick(["Not quite. One more try.", "The front row is frowning. Try again.", "No. Think about the method."])); }
        if (res === "flop") { sfx.darkness(); return finish(run); }
        sfx.reveal(); if (run.over) { spark(); return finish(run); } page(); ctx.banter?.("mid"); show(run, pick(["Bravo. Next part.", "That landed. On to the next.", "Lovely. Keep going."])); }));
      $("bk-leave").onclick = () => lobby(false);
    }
    function finish(run) {
      const b = run.b, r = settle(P(), run, { parlour: rook() });
      if (r.keys) addTokens(P(), host(), r.keys);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("bookings", b.lv, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      draw(b, { state: run.won ? "won" : "flop" }); cap(`🎟️ ${venueOf(b.venue).name}`);
      if (run.won) chime(r.billingUp ? 2 : 1);
      say(run.won ? (r.billingUp ? (rook() ? `Darling! You're ${r.billingUp} now. Bigger letters, bigger halls.` : `You've moved up the bill: ${r.billingUp}.`) : rook() ? pick(["Sold out. They'll talk about it for weeks.", "A standing ovation, and not one ghost required.", "That's how you do it. Truth, with sequins."]) : "A good show.")
        : (rook() ? "Cancelled. It happens to the best of us. Houdini had flops too." : "The booking fell through. Try a matinee to practise."));
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}${run.slot == null ? " (matinee: half pay)" : ""}` : "no show tonight"];
      if (run.bonus) bits.push(`🎴 rehearsed trick bonus`); if (r.keys) bits.push(`🗝️ +${r.keys}`); if (perfect(run)) bits.push("✨ perfect");
      let board = "";
      if (r.billDone) { const total = billTotal(P()), res = { score: total, won: Object.values(R().bill).some((x) => x.won), detail: `${Object.values(R().bill).filter((x) => x.won).length}/3 shows` }, fd = finishDaily(P(), "bookings", res, run.day || undefined); saveProgress();
        const fill = (bd) => { const el = $("bk-board"); if (el) el.innerHTML = boardHtml(bd, esc, { unit: "pts", local: { score: total } }); };
        (fd.first ? postDaily(state, "bookings", res) : boardOf(state, "bookings")).then(fill);
        board = `<div class="group">📅 Tonight's Bill is done · ${total} pts</div><div id="bk-board" class="note">Loading the board…</div>`; }
      const m = method(b.method), t = b.parts.find((p) => p.kind === "perform");
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${r.billingUp ? `<div class="up">🎟️ New billing: <b>${esc(r.billingUp)}</b></div>` : ""}</div>${board}
        <div class="ft-card"><b>${esc(m.name)}</b><p>${esc(m.how)}</p>${t ? `<p><b>The act:</b> ${esc(trickOf(t.trickId).name)}. ${esc(trickOf(t.trickId).fact)}</p>` : ""}<p>${esc(venueOf(b.venue).fact)}</p></div>
        <div class="choices"><button class="c main" type="button" id="bk-lobby">🎟️ Tonight's Bill</button><button class="c" type="button" id="bk-mat">★ Another matinee</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("bk-lobby").onclick = () => lobby(false); $("bk-mat").onclick = () => begin(start(matinee(P(), b.lv))); $("back").onclick = greet;
    }
    function shop(msg) {
      clearReading(); cap("🖼️ Playbill shop"); const look = lookOf(P()); draw(SAMPLE);
      say(typeof msg === "string" ? msg : rook() ? `Playbills, lettering and lights, ${state.name}. Paid in Essence, naturally.` : `Playbill paper, poster type and stage-door lights, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="bk-lobby">🎟️ Back to the bill</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const res = buyOrUse(P(), b.dataset.b);
        if (res === "poor") return shop("Not enough Essence yet. Play a few more bookings first.");
        if (res) { saveProgress(); showStats(); res === "bought" ? coins() : glass(); shop(res === "bought" ? "Pasted up and looking marvellous." : "Swapped in."); } }));
      $("bk-lobby").onclick = () => lobby(false);
    }
    lobby(true);
  },
};

/** Your last shows (reading area). */
export function histHtml(p, esc) {
  const r = bkOf(p);
  return `<div class="bk-hist"><h3>📜 Past shows · ${r.shows} played well</h3>${r.hist.length ? r.hist.map((h) => `<div>${h.won ? "✓" : "✗"} ${h.day} · ${"★".repeat(h.lv)} ${esc(venueOf(h.venue)?.name || h.venue)} · ${esc(method(h.method)?.name || h.method)}${h.matinee ? " · matinee" : ""}${h.won ? ` · ${h.score} pts` : ""}</div>`).join("") : `<p class="note">No shows yet. Tonight's Bill is waiting.</p>`}</div>`;
}
/** This room's part of the 📜 Codex. */
export function bookingsCodex(p, esc) {
  const r = bkOf(p), b = billing(p), next = BILLINGS[b.n + 1], pct = next ? ((r.shows - b.shows) / (next.shows - b.shows)) * 100 : 100;
  return `<div class="cx"><div class="cx-h"><span>🎟️ Bookings</span><span class="note">${esc(b.name)} · ${r.shows} shows</span></div><div class="bar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>
    <div class="chips">${BILLINGS.map((x) => `<span${x.n <= b.n ? "" : ' class="off"'}>${x.n <= b.n ? "✓ " : ""}${esc(x.name)}</span>`).join("")}</div></div>`;
}
