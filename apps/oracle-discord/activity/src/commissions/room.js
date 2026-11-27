// Commissions: a room of the Oracle Chamber (step 3 of the Alchemist's House core loop). Three jobs a day, the same
// for everyone: real clients ask for real products you discover at the Discovery Bench. Deliver them for 💎,
// philosopher's stones and reputation, and climb from the Village to the Guild to the Royal Society.
import { TIERS, JOBS, tierOf } from "./data.js";
import { room as cmOf, repOf, rankOf, nextRank, jobsOf, doneToday, statusOf, deliver, productName } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { boardSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as ft from "../flametest/sfx.js";
import * as al from "../alchemy/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { HOSTS, host } from "../hosts/index.js";
import { addTokens, tokenIcon } from "../hosts/tokens.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("cm-style")) return; const s = document.createElement("style"); s.id = "cm-style"; s.textContent = CSS; document.head.append(s); };
const VELL = () => HOSTS.find((h) => h.id === "alchemist");
const WHY = { locked: "Your reputation doesn't reach that client yet.", missing: "You haven't discovered that at the Discovery Bench yet.", done: "Already delivered today.", gone: "That job has gone." };

export const commissions = {
  id: "commissions", label: "Commissions", emoji: "📋",
  blurb: "Deliver real products to real clients, three jobs a day",
  shop: { kind: "commissions", label: "📋 Commissions", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table commissions";
      tableEl.innerHTML = boardSvg({ jobs: jobsOf().map((j, i) => ({ ...j, state: i === 0 ? "done" : "ok" })), look: { ...DEFAULT_LOOK, [it.slot]: id } }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog;
    const vell = () => host().id === "alchemist";
    const stone = () => { const v = VELL(); return v ? tokenIcon(v.token) : "🪨"; };
    const jobsNow = () => jobsOf().map((j) => ({ ...j, state: statusOf(P(), j) }));
    const draw = (o = {}) => { tableEl.className = "table commissions"; tableEl.innerHTML = boardSvg({ jobs: jobsNow(), look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };

    function lobby(first, line) {
      clearReading(); cap("📋 Commissions"); draw();
      const rk = rankOf(P()), nx = nextRank(P()), rep = repOf(P()), js = jobsNow(), ds = dailyState(P(), "commissions");
      say(line || (first && !cmOf(P()).total
        ? (vell() ? `Clients, ${state.name}! Three letters on the board every day, the same for every alchemist. Make what they ask for at the Discovery Bench, then deliver it here.`
          : `The Commissions board, ${state.name}. Three jobs a day, the same for everyone. Each client wants something you can make at the Discovery Bench.`)
        : pick(vell() ? ["The post came! Three new letters.", "Someone needs our chemistry today.", "Seal at the ready. Who shall we help?"] : ["Today's letters are on the board.", "Three clients are waiting.", "Who will you work for today?"])));
      const row = (j) => { const t = tierOf(j.tier), st = j.state;
        return `<button class="c level cm-job${st === "done" ? " done" : ""}" type="button" data-j="${j.id}" ${st === "locked" ? "disabled" : ""}><b>${j.e} ${esc(j.who)} · ${t.emoji} ${esc(t.name)}${st === "done" ? " · delivered ✓" : ""}</b>
          <span>${st === "locked" ? `🔒 Needs ${t.at} reputation (you have ${rep})` : `Wants: ${esc(productName(j.wants))} · 💎 ${t.pay} + ${stone()} ${t.stones}`}</span>
          ${st === "missing" ? `<small>Not discovered yet: make it at the 🧫 Discovery Bench</small>` : ""}</button>`; };
      ui(`<div class="cx-top"><b>${rk.emoji} ${esc(rk.name)} reputation</b> · ${rep}${nx ? ` · ${nx.at - rep} to ${esc(nx.name)}` : " · top of the ladder"}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</div>
        ${nx ? `<div class="cm-rep" aria-hidden="true"><i style="width:${Math.min(100, ((rep - rk.at) / (nx.at - rk.at)) * 100)}%"></i></div>` : ""}
        <div class="choices col">${js.map(row).join("")}</div>
        <div class="choices"><button class="c" type="button" id="cm-ledger">📒 Ledger</button><button class="c" type="button" id="cm-shop">🔴 Seals and boards</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-j]").forEach((b) => (b.onclick = () => open(b.dataset.j)));
      $("cm-ledger").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".cm-list"); al.page(); rb.innerHTML = on ? ledgerHtml(P(), esc) : ""; $("cm-ledger").textContent = on ? "✕ Close" : "📒 Ledger"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("cm-shop").onclick = shop; $("back").onclick = greet;
    }
    function open(id) {
      const js = jobsNow(), i = js.findIndex((j) => j.id === id), j = js[i]; if (!j) return lobby(false);
      const t = tierOf(j.tier); ft.page(); draw({ focus: i }); cap(`${j.e} ${j.who}`);
      say(`"${j.ask}"`);
      ui(`<div class="ft-card"><b>${j.e} ${esc(j.who)} · ${t.emoji} ${esc(t.name)}</b><p>Wants: <b>${esc(productName(j.wants))}</b></p><p class="note">${esc(j.why)}</p><p>Pays 💎 ${t.pay} + ${stone()} ${t.stones} philosopher's stone${t.stones === 1 ? "" : "s"} + ${t.rep} reputation</p></div>
        <div class="choices"><button class="c main" type="button" id="cm-go" ${j.state === "ok" ? "" : "disabled"}>📦 Deliver</button><button class="c" type="button" id="cm-back">📋 The board</button></div>
        ${j.state !== "ok" ? `<div class="note">${esc(WHY[j.state])}</div>` : ""}`);
      $("cm-go").onclick = () => send(j, i); $("cm-back").onclick = () => lobby(false, " ");
    }
    function send(j, i) {
      const res = deliver(P(), j.id); if (!res.ok) { al.wrong(); return lobby(false, WHY[res.why]); }
      const v = VELL(); if (v) addTokens(P(), v, res.stones);
      award(res.rep * 4, res.pay); al.whoosh(); setTimeout(() => ft.clunk(), 500); setTimeout(() => { ft.coins(); chime(res.job.tier); spark(); }, 900);
      draw({ focus: i, stamp: true, product: productName(j.wants) });
      ctx.trophy?.("commissions", res.job.tier, { won: true, perfect: res.allDone }); // Trophy Case: level = the client's tier
      ctx.banter?.("mid");
      const bits = [`<b>+💎 ${res.pay} · +${stone()} ${res.stones} · +${res.rep} reputation</b>`];
      if (res.rankUp) bits.push(`${res.rankUp.emoji} You're known to the ${res.rankUp.name} now!`);
      let board = "";
      if (res.allDone) {
        const score = doneToday(P()).reduce((n, id) => n + tierOf(JOBS.find((x) => x.id === id).tier).rep, 0), detail = `${doneToday(P()).length} delivered`;
        const fd = finishDaily(P(), "commissions", { score, won: true, detail });
        if (fd.first) { bits.push(`📅 Every open job done · streak ${fd.streak}`); postDaily(state, "commissions", { score, won: true, detail }).then(fill); } else boardOf(state, "commissions").then(fill);
        board = `<div class="group">📅 Today's board</div><div id="cm-board" class="note">Loading the board…</div>`;
        function fill(b) { const el = $("cm-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "rep", local: { score } }); }
        setTimeout(() => ft.finale(true), 1300);
      }
      saveProgress(); showStats(); cap(`📦 Delivered to ${j.who}`);
      say(res.rankUp ? (vell() ? `The ${res.rankUp.name}, ${state.name}! They've heard of us!` : `Your name reaches the ${res.rankUp.name}.`)
        : vell() ? pick([`Sealed and delivered! ${j.who} will be thrilled.`, "Another happy client. Chemistry pays!", `That ${productName(j.wants).toLowerCase()} was perfect.`]) : `${j.who} is pleased.`);
      ui(`<div class="reward"><div>${bits.join(" · ")}</div></div>${board}
        <div class="choices"><button class="c main" type="button" id="cm-back">📋 The board</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("cm-back").onclick = () => lobby(false, " "); $("back").onclick = greet;
    }
    function shop(msg) {
      clearReading(); cap("🔴 Seals and boards"); const look = lookOf(P()); draw();
      say(typeof msg === "string" ? msg : `Seals and boards for your Commissions, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="cm-back">📋 Back to the board</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A delivery or two will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? ft.coins() : ft.clunk(); shop(r === "bought" ? "Lovely. It's on your board." : "Swapped in."); } }));
      $("cm-back").onclick = () => lobby(false, " ");
    }
    lobby(true);
  },
};

/** The ledger: every client you've served, by tier (reading area). */
export function ledgerHtml(p, esc) {
  const r = cmOf(p), served = new Set(Object.values(r.done).flat());
  return `<div class="cm-list"><h3>📒 Ledger · ${r.total} deliveries · ${repOf(p)} reputation</h3><p class="note">Every client asks for a real product, for the job it really did.</p>
    ${TIERS.map((t) => `<div class="group">${t.emoji} ${esc(t.name)} (from ${t.at} reputation)</div>${JOBS.filter((j) => j.tier === t.n && served.has(j.id)).map((j) => `<div class="ft-card"><b>${j.e} ${esc(j.who)}: ${esc(productName(j.wants))}</b><p class="note">${esc(j.why)}</p></div>`).join("") || `<p class="bk-empty">No ${esc(t.name)} clients served in the last month.</p>`}`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function commissionsCodex(p, esc) {
  const rk = rankOf(p), nx = nextRank(p), rep = repOf(p);
  return `<div class="cx"><div class="cx-h"><span>📋 Commissions</span><span class="note">${rk.emoji} ${esc(rk.name)} · ${cmOf(p).total} delivered</span></div><div class="bar"><i style="width:${nx ? Math.min(100, (rep / nx.at) * 100) : 100}%"></i></div></div>`;
}
