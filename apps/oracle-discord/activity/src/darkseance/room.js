// The Dark Séance: a room of the Oracle Chamber (and the Séance Parlour). You play a fake medium with the real
// methods, against the real controls that caught them: feet held, luminous bands, red light, searches, sealed knots,
// Faraday's indicator, and a flashlight you must dodge. Three eyes of suspicion and you're exposed. With friends,
// one player is the medium and the rest are the committee. No one contacts the dead: the medium is the trick.
import { EFFECTS, CONTROLS, METHODS, LEVELS, methodOf } from "./data.js";
import { room as dsOf, start, roundNow, choose, act, scoreOf, perfect, settle, dailyOf, beamAt, onSeat, EYES } from "./logic.js";
import { groupStart, groupAct, publicView, groupReward, methodsFor } from "./group.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { roomSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "../seance/sfx.js";
import { page, coins, glass } from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { canJoin, joinTable } from "../net.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("ds-style")) return; const s = document.createElement("style"); s.id = "ds-style"; s.textContent = CSS; document.head.append(s); };
const ctlChips = (cs, esc) => `<div class="ds-ctl">${cs.map((c) => `<span title="${esc(CONTROLS[c].what)}">${CONTROLS[c].e} ${esc(CONTROLS[c].name)}</span>`).join("") || "<span>No controls</span>"}</div>`;

export const darkseance = {
  id: "darkseance", label: "The Dark Séance", emoji: "🕯️",
  blurb: "Play a fake medium with the real methods, and try not to get caught",
  shop: { kind: "darkseance", label: "🕯️ Séance room", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table darkseance";
      tableEl.innerHTML = roomSvg({ look: { ...DEFAULT_LOOK, [it.slot]: id }, controls: ["bands"], effect: "trumpet" }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl, reduced } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => dsOf(P());
    const rook = () => host().id === "parlour";
    const draw = (o = {}) => { tableEl.className = "table darkseance"; tableEl.innerHTML = roomSvg({ look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    let spin = 0; const stopSpin = () => { if (spin) cancelAnimationFrame(spin); spin = 0; };

    function lobby(first) {
      stopSpin(); clearReading(); cap("🕯️ The Dark Séance"); draw({ controls: [] });
      const r = R(), ds = dailyState(P(), "darkseance"), dd = dailyOf();
      say(first && !r.plays
        ? (rook() ? `Tonight you're the medium, ${state.name}. I'll teach you exactly how we did it, and exactly how we got caught. That's the only honest way to learn it.`
          : `Here you play a fake medium of the 1800s, ${state.name}, with the real methods. Pick a method the investigators' controls can't beat. Three eyes of suspicion and you're exposed.`)
        : pick(rook() ? ["Lights down. Hands on the table. Feet where I can feel them.", "Every medium had a method. Every committee had a control. Let's see who wins.", "I used to do this for a living, darling. Don't tell anyone."]
          : ["The circle is waiting.", "The lights go down…", "The committee is seated."]));
      ui(`<div class="cx-top"><b>🕯️ Dark Séance</b> · ${r.learned.length} / ${METHODS.length} methods used · caught by ${r.caught.length}</div>
        <div class="levels">${LEVELS.map((L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🕯️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.rounds} requests · points ×${L.mult}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`).join("")}</div>
        <div class="note">Pick a method that makes the effect and that none of tonight's controls beats. When an investigator has a flashlight, act while the beam points away from you.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="ds-daily"><b>📅 Daily séance${ds.played ? " · done ✓" : ""}</b><span>The same séance for everyone today · Level ${dd.L.n}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="ds-group">👥 Committee night (friends)</button><button class="c" type="button" id="ds-book">📒 Methods & controls</button><button class="c" type="button" id="ds-shop">💫 Séance room shop</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => begin(start(LEVELS[+b.dataset.l - 1]))));
      $("ds-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, { seed: d.seed, daily: d.day })); };
      $("ds-book").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".ds-log"); page(); rb.innerHTML = on ? methodsHtml(P(), esc) : ""; $("ds-book").textContent = on ? "✕ Close" : "📒 Methods & controls"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("ds-group").onclick = group; $("ds-shop").onclick = shop; $("back").onclick = greet;
    }
    const begin = (run) => { clearReading(); sfx.snuff(2); setTimeout(sfx.darkness, 250); say(run.L.open); show(run, run.L.open); };
    function show(run, line, fx = {}) {
      stopSpin(); const rd = roundNow(run), E = EFFECTS[rd.effect], L = run.L;
      cap(`🕯️ Level ${L.n} · request ${run.i + 1} of ${run.rounds.length}${run.daily ? " · 📅 daily" : ""}`);
      draw({ controls: rd.controls, eyes: run.eyes, ...fx });
      if (line) say(line);
      ui(`<div class="cx-top">Level ${L.n} · suspicion ${"👁️".repeat(EYES - run.eyes)}${"·".repeat(run.eyes)} · ${run.pts} pts</div>
        <div class="ft-card"><b>${E.e} The sitters: “${esc(E.ask)}”</b><p>They want: ${esc(E.name.toLowerCase())}.</p></div>
        <div class="group">Tonight's controls</div>${ctlChips(rd.controls, esc)}
        <div class="group">Your method</div><div class="choices col">${rd.options.map((id) => { const m = methodOf(id), tried = run.tried.includes(id);
          return `<button class="c" type="button" data-m="${id}" ${tried ? "disabled" : ""}>${tried ? "✗ " : ""}${m.e} ${esc(m.name)}</button>`; }).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="ds-leave">End the séance</button></div>`);
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => outcome(run, b.dataset.m, choose(run, b.dataset.m))));
      $("ds-leave").onclick = () => lobby(false);
    }
    function outcome(run, mid, res) {
      const m = methodOf(mid), rd = roundNow(run), E = rd ? EFFECTS[rd.effect] : null;
      if (res === "timing") return timing(run, mid);
      if (res === "caught" || res === "lit") { sfx.wrong(); sfx.knock(1); ctx.emote?.("surprise", { quiet: true });
        return show(run, res === "lit" ? `The flashlight snaps on, mid-trick! ${m.caught}` : `Caught! ${m.caught}`, { caught: true }); }
      if (res === "nothing") { sfx.snuff(1); return show(run, rook() ? `Nothing happens, darling. ${m.name} can't make ${E.name.toLowerCase()}. The sitters shift in their seats.` : `Nothing happens: ${m.name.toLowerCase()} can't produce ${E.name.toLowerCase()}. The sitters start to doubt.`); }
      if (res === "exposed") { sfx.darkness(); return finish(run); }
      const done = run.rounds[run.i - 1]; sfx.reveal(); if (done.effect === "rap") sfx.knock(3); spark(); ctx.banter?.("mid");
      if (res === "won") { draw({ controls: done.controls, eyes: run.eyes, effect: done.effect }); return setTimeout(() => finish(run), 900); }
      draw({ controls: done.controls, eyes: run.eyes, effect: done.effect });
      say(`${EFFECTS[done.effect].e} ${EFFECTS[done.effect].name}! The sitters gasp. (${m.name}: ${pick(["nobody noticed", "the committee saw nothing", "not a whisper of suspicion"])}.)`);
      ui(`<div class="cx-top">Level ${run.L.n} · ${run.pts} pts</div><div class="ft-card"><b>${m.e} How it was caught in history</b><p>${esc(m.caught)}</p></div>
        <div class="choices"><button class="c main" type="button" id="ds-next">🕯️ Next request</button></div>`);
      $("ds-next").onclick = () => show(run, `The sitters again: “${EFFECTS[roundNow(run).effect].ask}”`);
    }
    function timing(run, mid) {
      const rd = roundNow(run), t0 = performance.now(), slow = reduced ? 2 : 1;
      say(rook() ? "An investigator has a flashlight, darling. Wait until the beam swings away, then do it." : "🔦 An investigator is sweeping a flashlight. Act when the beam points away from you.");
      ui(`<div class="cx-top">🔦 The flashlight sweeps the circle</div><div class="note">The beam must not be on you (the chair at the front) when you act.</div>
        <div class="choices"><button class="c main ds-act" type="button" id="ds-act">${methodOf(mid).e} Do it now</button></div>`);
      const deg = () => beamAt((performance.now() - t0) / slow, run.L);
      const tick = () => { const b = document.getElementById("ds-beam"); if (b) b.setAttribute("transform", `rotate(${deg().toFixed(1)} 160 120)`); spin = requestAnimationFrame(tick); };
      tick();
      $("ds-act").onclick = () => { const inBeam = onSeat(deg()); stopSpin(); outcome(run, mid, act(run, inBeam)); };
    }
    function finish(run) {
      stopSpin(); const L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("darkseance", L.n, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      const last = run.rounds[Math.min(run.i, run.rounds.length - 1)];
      draw({ controls: last.controls, eyes: run.eyes, exposed: !run.won, effect: run.won ? "form" : null });
      cap(run.won ? "🕯️ The committee is baffled" : "🕯️ Exposed!");
      if (run.won) chime(perfect(run) ? 2 : 1);
      say(run.won ? (rook() ? "Baffled! Not one of them saw a thing. Now you know why it took magicians to catch us." : "The committee is baffled. You fooled them, and now you know exactly how mediums did it.")
        : (rook() ? "Exposed! The lights are up and the papers will have it by morning. Every real medium ended this way, darling." : "Exposed! The committee caught the method, just as real investigators did."));
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}` : "caught this time"];
      if (r.fresh.length) bits.push(`📒 new methods tried: ${r.fresh.length}`); if (perfect(run)) bits.push("✨ no suspicion at all");
      let board = "";
      if (run.daily) { const res = { score: r.score, won: run.won, detail: L.name }, fd = finishDaily(P(), "darkseance", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("ds-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); };
        (fd.first ? postDaily(state, "darkseance", res) : boardOf(state, "darkseance")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="ds-board" class="note">Loading the board…</div>`; }
      const used = [...new Set(run.used)], caught = run.caughtBy ? methodOf(run.caughtBy) : null;
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}
        <div class="ft-card"><b>How each method was really caught</b>${[...used, ...(caught && !used.includes(caught.id) ? [caught.id] : [])].map((id) => `<p><b>${methodOf(id).e} ${esc(methodOf(id).name)}:</b> ${esc(methodOf(id).caught)}</p>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="ds-again">🕯️ Another Level ${L.n} séance</button><button class="c" type="button" id="ds-lobby">🕯️ The séance room</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ds-again").onclick = () => begin(start(L)); $("ds-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }
    function shop(msg) {
      stopSpin(); clearReading(); cap("💫 Séance room shop"); const look = lookOf(P()); draw({ controls: ["bands"], effect: "trumpet" });
      say(typeof msg === "string" ? msg : rook() ? `Glow paint, tables and cabinets, ${state.name}. Paid in Essence, naturally.` : `Luminous paint, séance tables and spirit cabinets, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="ds-lobby">🕯️ Back to the séance</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const res = buyOrUse(P(), b.dataset.b);
        if (res === "poor") return shop("Not enough Essence yet. Hold a few more séances first.");
        if (res) { saveProgress(); showStats(); res === "bought" ? coins() : glass(); shop(res === "bought" ? "Installed. Lights down, please." : "Swapped in."); } }));
      $("ds-lobby").onclick = () => lobby(false);
    }

    /* ---------- Committee night: one medium, the rest investigators (net.js table; host runs group.js) ---------- */
    let T = null, G = null, paid = 0;
    const gone = () => state.inRoom !== "darkseance" || !T;
    function leaveGroup() { if (T) { const t = T; T = null; G = null; t.leave(); } }
    async function group() {
      if (!canJoin(state)) return say("Committee night needs friends: open the Chamber inside a Discord voice call, and everyone who opens the Dark Séance joins the same table.");
      say("Seating the committee…");
      try { T = await joinTable("darkseance", state); } catch (e) { T = null; return say(`The committee won't sit: ${e.message}`); }
      const t = T;
      t.on("msg", ({ from, m }) => { if (T !== t) return; if (state.inRoom !== "darkseance") return leaveGroup();
        if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); } else if (m && m.k === "st") got(m.st, m.ev); });
      t.on("members", () => { if (T !== t) return; if (state.inRoom !== "darkseance") return leaveGroup(); if (t.isHost()) broadcast(); else gpaint(); });
      t.on("host", (snap) => { if (T !== t) return; if (snap && snap.effects) G = snap; say("The host left. You run the séance now."); broadcast(); });
      t.on("close", () => { if (T !== t) return; T = null; G = null; say("The séance broke up (connection lost)."); lobby(false); });
      sfx.summon(); gpaint();
      say(t.isHost() ? "You host committee night. Start a game: the medium rotates each game." : `You join ${t.nameOf(t.host)}'s committee night. Wait for the first request.`);
    }
    function broadcast(ev = "") { if (!T || !T.isHost()) return; for (const m of T.members) T.to(m.id, { k: "st", st: G && publicView(G, m.id), ev }); T.snap(G); gpaint(ev); }
    function hostAct(who, a) { if (!G) return; const ev = groupAct(G, who, a, T.members, T.host); if (ev) broadcast(ev); }
    function gact(a) { if (!T) return; if (T.isHost()) hostAct(T.me.id, a); else T.up({ k: "act", act: a }); }
    function got(st, ev) { G = st; gpaint(ev); }
    function gpaint(ev = "") {
      if (gone()) return; const t = T, me = t.me.id, who = t.members.map((m) => `<span>${G && m.id === G.medium ? "🕯️ " : m.id === t.host ? "👑 " : ""}${esc(m.name)}${m.id === me ? " (you)" : ""}</span>`).join("");
      const head = `<div class="cx-top"><b>👥 Committee night</b> · ${t.members.length} at the table</div><div class="chips">${who}</div>`, leave = `<div class="choices"><button class="c small" type="button" id="ds-gleave">Leave the table</button></div>`;
      if (ev === "round" || ev === "over") { const l = G.log[0]; l.ok ? (sfx.reveal(), sfx.knock(2)) : (sfx.wrong(), sfx.knock(1)); draw({ controls: l.controls, effect: l.ok ? l.effect : null, caught: !l.ok }); }
      if (!G) { draw({ controls: [] }); ui(`${head}${t.isHost() ? `<div class="choices"><button class="c main" type="button" id="ds-gstart">🕯️ Start committee night</button></div>` : `<div class="note">Waiting for ${esc(t.nameOf(t.host))} to start…</div>`}<div class="note">One player is the medium and picks a method in secret. Everyone else picks one control. If a control beats the method, the committee scores.</div>${leave}`); return gwire(); }
      const medium = G.medium === me, E = EFFECTS[G.effects[Math.min(G.i, G.effects.length - 1)]], score = `<div class="note">🕯️ Medium ${G.score.medium} · 🔎 Committee ${G.score.table} · round ${Math.min(G.i + 1, G.effects.length)} of ${G.effects.length}</div>`;
      const log = G.log.length ? `<div class="ds-log">${G.log.map((l) => `<div>${l.ok ? "🕯️" : "🔎"} ${EFFECTS[l.effect].e} ${esc(methodOf(l.method).name)} vs ${l.controls.map((c) => CONTROLS[c].e).join(" ") || "no controls"}: ${l.ok ? "it worked" : l.beat.length ? `caught by ${esc(l.by.join(", "))}` : "it couldn't make that effect"}</div>`).join("")}</div>` : "";
      let body;
      if (G.over) { const rw = groupReward(G, me); if (paid !== G.game) { paid = G.game; award(rw.xp, rw.essence); R().plays++; saveProgress(); showStats(); rw.won ? chime(1) : sfx.darkness(); }
        body = `<div class="reward"><div><b>${G.score.medium > G.score.table ? `The medium, ${esc(t.nameOf(G.medium))}, fooled the committee` : "The committee exposed the medium"}</b></div><div>${rw.won ? "Your side won" : "Your side lost"} · +${rw.xp} ✦ · +${rw.essence} 💎</div></div>${t.isHost() ? `<div class="choices"><button class="c main" type="button" id="ds-gstart">🕯️ Next game (new medium)</button></div>` : ""}`; }
      else if (medium) { say(`You're the medium. The sitters ask: “${E.ask}”`);
        body = `<div class="ft-card"><b>${E.e} ${esc(E.name)}</b><p>Pick your method in secret. ${G.pick ? `Chosen: ${esc(methodOf(G.pick).name)}. Waiting for the committee…` : ""}</p></div><div class="choices col">${methodsFor(G.effects[G.i]).map((id) => `<button class="c${G.pick === id ? " main" : ""}" type="button" data-gp="${id}">${methodOf(id).e} ${esc(methodOf(id).name)}</button>`).join("")}</div>`; }
      else { const mine = G.ctl[me]; say(`The medium is ${t.nameOf(G.medium)}. The sitters ask: “${E.ask}” Pick one control.`);
        body = `<div class="ft-card"><b>${E.e} ${esc(E.name)}</b><p>${G.pick ? "The medium is ready." : "The medium is choosing…"} Choose the control you'll bring.</p></div><div class="choices col">${Object.entries(CONTROLS).map(([k, c]) => `<button class="c${mine === k ? " main" : ""}" type="button" data-gc="${k}" title="${esc(c.what)}">${c.e} ${esc(c.name)}</button>`).join("")}</div>${t.isHost() && G.pick ? `<div class="choices"><button class="c small" type="button" id="ds-greveal">💡 Lights up now</button></div>` : ""}`; }
      ui(`${head}${score}${body}${log}${leave}`); gwire();
    }
    function gwire() {
      $("ds-gleave").onclick = () => { leaveGroup(); lobby(false); };
      if ($("ds-gstart")) $("ds-gstart").onclick = () => { if (!T || !T.isHost()) return; G = groupStart(T.members, (G ? G.game : 0) + 1); sfx.darkness(); broadcast("start"); };
      if ($("ds-greveal")) $("ds-greveal").onclick = () => gact({ a: "reveal" });
      $("ui").querySelectorAll("[data-gp]").forEach((b) => (b.onclick = () => { glass(); gact({ a: "pick", m: b.dataset.gp }); }));
      $("ui").querySelectorAll("[data-gc]").forEach((b) => (b.onclick = () => { page(); gact({ a: "ctl", c: b.dataset.gc }); }));
    }
    lobby(true);
  },
};

/** Every method, what it makes, what beats it, and how it was caught (reading area). */
export function methodsHtml(p, esc) {
  const r = dsOf(p);
  return `<div class="ds-log"><h3>📒 Methods & controls · ${r.learned.length} / ${METHODS.length} used</h3>${METHODS.map((m) => { const on = r.learned.includes(m.id) || r.caught.includes(m.id);
    return `<div><b>${on ? m.e : "❔"} ${esc(m.name)}</b> · makes ${m.makes.map((e) => EFFECTS[e].e).join(" ")} · beaten by ${m.beaten.map((c) => `${CONTROLS[c].e} ${esc(CONTROLS[c].name)}`).join(", ")}${on ? `<br><small>${esc(m.caught)}</small>` : ""}</div>`; }).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function darkseanceCodex(p, esc) {
  const r = dsOf(p);
  return `<div class="cx"><div class="cx-h"><span>🕯️ The Dark Séance</span><span class="note">${r.learned.length} / ${METHODS.length} methods used · ${Object.values(r.wins).reduce((a, b) => a + b, 0)} séances survived</span></div><div class="bar"><i style="width:${(r.learned.length / METHODS.length) * 100}%"></i></div>
    ${r.learned.length ? `<div class="chips">${r.learned.map((id) => `<span>${esc(methodOf(id)?.name || id)}</span>`).join("")}</div>` : ""}</div>`;
}
