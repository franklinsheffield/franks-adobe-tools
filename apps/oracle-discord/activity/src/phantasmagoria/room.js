// Phantasmagoria: a room of the Oracle Chamber (and the Séance Parlour). You run a ghost show with the real optics:
// a magic lantern rolled back on smoke (Level 1), Pepper's ghost in tilted glass (Level 2) and a timed show where
// every cue lands on the music (Level 3). With friends: show night, where everyone stages a ghost and votes.
// Every ghost is light on smoke or glass, and the game shows how.
import { LEVELS, DIST, ANGLE, SHOW, CUE_KINDS, LANTERN_FACTS, PEPPER_FACTS, SHOW_FACTS, SLIDES, EFFECTS, ghostHeight, ghostTilt } from "./data.js";
import { room as phOf, start, roundNow, setTo, beginAct, tapAt, missedBy, endAct, scoreOf, perfect, settle, dailyOf, OIL, TRICK_IDS } from "./logic.js";
import { nightStart, nightMove, nightView, nightReward, slideOf, fxOf, NIGHT_ROUNDS } from "./group.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { sceneSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as ps from "./sfx.js";
import * as sfx from "../seance/sfx.js";
import { page, coins, glass } from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { canJoin, joinTable } from "../net.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("ph-style")) return; const s = document.createElement("style"); s.id = "ph-style"; s.textContent = CSS; document.head.append(s); };
export const TRICK_NAMES = { lantern: "The lantern on smoke", pepper: "Pepper's ghost", show: "The timed show" };
const cueOf = (id) => CUE_KINDS.find((c) => c.id === id);

export const phantasmagoria = {
  id: "phantasmagoria", label: "Phantasmagoria", emoji: "🏮",
  blurb: "Run a ghost show with magic lanterns, smoke and Pepper's ghost",
  shop: { kind: "phantasmagoria", label: "🏮 Ghost show", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table phantasmagoria"; const look = { ...DEFAULT_LOOK, [it.slot]: id };
      tableEl.innerHTML = it.slot === "glass" ? sceneSvg({ mode: "pepper", look, angle: 45, showGhost: true }) : sceneSvg({ mode: "lantern", look, dist: 4, showGhost: true }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl, reduced } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => phOf(P());
    const rook = () => host().id === "parlour";
    const draw = (o = {}) => { tableEl.className = "table phantasmagoria"; tableEl.innerHTML = sceneSvg({ look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    let raf = 0, stopMusic = () => {}; const halt = () => { if (raf) cancelAnimationFrame(raf); raf = 0; stopMusic(); stopMusic = () => {}; };

    function lobby(first) {
      halt(); clearReading(); cap("🏮 Phantasmagoria"); draw({ mode: "show", cue: "appear" });
      const r = R(), ds = dailyState(P(), "phantasmagoria"), dd = dailyOf();
      say(first && !r.plays
        ? (rook() ? `Ghosts made of light, ${state.name}. Lanterns, smoke and a sheet of glass. Not one of them was ever a spirit, and the crowds loved them anyway.` : `Here you run a ghost show, ${state.name}: a magic lantern on smoke, Pepper's ghost in glass, and a show timed to music.`)
        : pick(rook() ? ["Light the lamp, darling. Mind the smoke.", "Every ghost here is a picture. That's the beauty of it.", "Robertson made Paris scream with a lantern on wheels."] : ["The smoke is rising.", "The lamp is lit.", "The hall goes dark…"]));
      ui(`<div class="cx-top"><b>🏮 Phantasmagoria</b> · ${r.tricks.length} / ${TRICK_IDS.length} illusions mastered</div>
        <div class="levels">${LEVELS.map((L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🏮".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.rounds} ${L.kind === "show" ? "acts" : "ghosts"} · points ×${L.mult}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`).join("")}</div>
        <div class="note">You have 3 🕯️ of lamp oil. A wrong-sized ghost, a wrong tilt, an early cue or a missed cue burns one.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="ph-daily"><b>📅 Daily show${ds.played ? " · done ✓" : ""}</b><span>The same show for everyone today · Level ${dd.L.n}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="ph-group">👥 Show night (friends)</button><button class="c" type="button" id="ph-book">📒 How the illusions work</button><button class="c" type="button" id="ph-shop">🎞️ Ghost show shop</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => begin(start(LEVELS[+b.dataset.l - 1]))));
      $("ph-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, { seed: d.seed, daily: d.day })); };
      $("ph-book").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".ph-log"); page(); rb.innerHTML = on ? illusionsHtml(P(), esc) : ""; $("ph-book").textContent = on ? "✕ Close" : "📒 How the illusions work"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("ph-group").onclick = group; $("ph-shop").onclick = shop; $("back").onclick = greet;
    }
    const begin = (run) => { clearReading(); ps.shutter(); say(run.L.open); show(run); };
    const head = (run) => `<div class="cx-top">Level ${run.L.n} · oil ${"🕯️".repeat(run.oil)}${"·".repeat(OIL - run.oil)} · ${run.pts} pts</div>`;
    function show(run, line) {
      halt(); const rd = roundNow(run), L = run.L; if (line) say(line);
      cap(`🏮 Level ${L.n} · ${rd.kind === "show" ? `act ${run.i + 1}` : `ghost ${run.i + 1}`} of ${run.rounds.length}${run.daily ? " · 📅 daily" : ""}`);
      if (rd.kind === "show") return act(run);
      const lan = rd.kind === "lantern", lim = lan ? DIST : ANGLE, v0 = lan ? 2 : 30;
      const paint = (v, ghost = false, got = null) => draw(lan ? { mode: "lantern", dist: v, showGhost: ghost, h: got } : { mode: "pepper", angle: v, showGhost: ghost, tilt: got });
      paint(v0);
      ui(`${head(run)}<div class="ft-card"><b>${lan ? "🏮 Size the ghost" : "🪞 Tilt the glass"}</b><p>${esc(rd.ask)}</p><p class="note">${lan ? "Every metre you roll the lantern back adds half a metre of ghost." : "The actor lies flat in the pit. Tilt the glass so the reflection stands at the angle asked."}</p></div>
        <div class="ph-ctl"><span>${lan ? "🏮 Lantern" : "🪞 Glass"}</span><input id="ph-v" type="range" min="${lim.min}" max="${lim.max}" step="${lim.step}" value="${v0}" aria-label="${lan ? "Lantern distance in metres" : "Glass angle in degrees"}"><b id="ph-val">${lan ? v0.toFixed(1) + " m" : v0 + "°"}</b></div>
        <div class="choices"><button class="c main" type="button" id="ph-go">${lan ? "🏮 Open the shutter" : "💡 Light the actor"}</button><button class="c small" type="button" id="ph-leave">End the show</button></div>`);
      const inp = $("ph-v"), val = () => +inp.value;
      inp.oninput = () => { $("ph-val").textContent = lan ? val().toFixed(1) + " m" : val() + "°"; paint(val()); };
      $("ph-go").onclick = () => {
        const v = val(), res = setTo(run, v); if (!res) return; ps.shutter();
        paint(v, true, lan ? ghostHeight(v) : ghostTilt(v));
        if (res === "flop") { ps.thunder(); return setTimeout(() => finish(run, rd), 900); }
        if (res === "wrong") { sfx.wrong(); const l = run.last; say(lan ? `The ghost comes out ${l.h} m tall: too ${l.big ? "big" : "small"}. ${l.big ? "Roll the lantern in." : "Roll it back."}` : `The ghost leans at ${l.tilt}°: ${l.back ? "too far back. Tilt the glass up" : "too far forward. Tilt the glass down"}.`);
          ui(`${head(run)}<div class="ft-card"><b>A murmur in the hall</b><p>${esc(rd.ask)}</p></div><div class="choices"><button class="c main" type="button" id="ph-retry">🔁 Try again</button></div>`); $("ph-retry").onclick = () => show(run); return; }
        ps.harmonica(run.i); ps.whoosh(); spark(); ctx.banter?.("mid");
        if (res === "won") return setTimeout(() => finish(run, rd), 1200);
        say(pick(["A scream from the third row!", "Someone faints. Theatrically.", "The hall gasps!"]));
        const facts = lan ? LANTERN_FACTS : PEPPER_FACTS;
        ui(`${head(run)}<div class="ft-card"><b>💡 How it works</b><p>${esc(facts[(run.i - 1) % facts.length])}</p></div><div class="choices"><button class="c main" type="button" id="ph-next">🏮 Next ghost</button></div>`);
        $("ph-next").onclick = () => show(run);
      };
      $("ph-leave").onclick = () => lobby(false);
    }
    function act(run) {
      const rd = roundNow(run), slow = reduced ? 1.6 : 1, len = SHOW.len * slow;
      draw({ mode: "show" });
      say(rook() ? `Act ${rd.act}, darling. Fire every cue as the needle reaches it.` : `Act ${rd.act}. Press Cue! as the needle reaches each mark.`);
      ui(`${head(run)}<div class="ft-card"><b>🎼 Act ${rd.act}: the cue sheet</b><p>${rd.cues.map((c) => cueOf(c.kind).e).join(" ")} · ${SHOW.pass} of ${rd.cues.length} cues to pass</p></div>
        <div class="ph-track" id="ph-track">${rd.cues.map((c, k) => `<span class="cue" id="ph-c${k}" style="left:${(c.t / SHOW.len) * 100}%">${cueOf(c.kind).e}</span>`).join("")}<i class="needle" id="ph-needle"></i></div>
        <div class="choices"><button class="c main ph-cue" type="button" id="ph-cue">🎬 Cue!</button></div>`);
      beginAct(run); const t0 = performance.now(); stopMusic = ps.music(len, 750 * slow);
      const now = () => (performance.now() - t0) / slow;
      const hit = (k, ok) => { const el = $(`ph-c${k}`); if (el) el.classList.add(ok ? "hit" : "miss"); };
      const tick = () => { const t = now(), n = $("ph-needle"); if (!n) return halt(); n.style.left = `${Math.min(100, (t / SHOW.len) * 100)}%`;
        for (const k of missedBy(run, t)) { hit(k, false); sfx.wrong(); }
        if (run.over && !run.won) { halt(); return finish(run, rd); }
        if (t >= SHOW.len) { halt(); return done(); } raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      $("ph-cue").onclick = () => { const t = now(), before = run.act ? [...run.act.hit] : [], res = tapAt(run, t); if (!res) return;
        if (res === "flop") { halt(); ps.thunder(); return finish(run, rd); }
        if (res === "early") { sfx.wrong(); return; }
        const k = run.act.hit.findIndex((x, i) => x !== before[i]), c = rd.cues[k]; hit(k, true);
        c.kind === "thunder" ? ps.thunder() : c.kind === "grow" ? ps.whoosh() : ps.shutter(); draw({ mode: "show", cue: c.kind }); if (res === "perfect") spark(); };
      function done() {
        const res = endAct(run);
        if (res === "flop") return finish(run, rd);
        if (res === "won") { spark(); return setTimeout(() => finish(run, rd), 600); }
        if (res === "wrong") { say("Not enough cues landed. Run the act again."); ui(`${head(run)}<div class="choices"><button class="c main" type="button" id="ph-retry">🔁 Again</button></div>`); $("ph-retry").onclick = () => show(run); return; }
        ps.harmonica(5); ctx.banter?.("mid"); say(pick(["Curtain on the act! Applause!", "The hall roars.", "Bravo!"]));
        ui(`${head(run)}<div class="ft-card"><b>💡 Behind the scenes</b><p>${esc(SHOW_FACTS[(run.i - 1) % SHOW_FACTS.length])}</p></div><div class="choices"><button class="c main" type="button" id="ph-next">🎼 Next act</button></div>`);
        $("ph-next").onclick = () => show(run);
      }
    }
    function finish(run, rd) {
      halt(); const L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("phantasmagoria", L.n, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      draw({ mode: rd && rd.kind !== "show" ? rd.kind : "show", cue: run.won ? "appear" : null, dist: rd && rd.answer, angle: rd && rd.answer, showGhost: run.won, state: run.won ? "won" : "flop" });
      cap(run.won ? "🏮 A triumph" : "🏮 The lamp is out");
      if (run.won) chime(perfect(run) ? 2 : 1);
      say(run.won ? (rook() ? "A triumph, darling. All light and glass, and they screamed anyway." : "A triumph! Every ghost was light on smoke or glass, and now you know how.")
        : (rook() ? "The lamp's out, darling. Trim the wick and go again." : "Out of lamp oil. Check how the illusion works, then go again."));
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}` : "the show stopped early"];
      if (r.fresh.length) bits.push(`📒 mastered: ${TRICK_NAMES[r.fresh[0]]}`); if (perfect(run)) bits.push("✨ not a drop of oil wasted");
      let board = "";
      if (run.daily) { const res = { score: r.score, won: run.won, detail: L.name }, fd = finishDaily(P(), "phantasmagoria", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("ph-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); };
        (fd.first ? postDaily(state, "phantasmagoria", res) : boardOf(state, "phantasmagoria")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="ph-board" class="note">Loading the board…</div>`; }
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}
        <div class="ft-card"><b>${esc(TRICK_NAMES[L.kind])}</b><p>${esc(trickLine(L.kind))}</p></div>
        <div class="choices"><button class="c main" type="button" id="ph-again">🏮 Another Level ${L.n} show</button><button class="c" type="button" id="ph-lobby">🏮 The hall</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ph-again").onclick = () => begin(start(L)); $("ph-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }
    function shop(msg) {
      halt(); clearReading(); cap("🎞️ Ghost show shop"); const look = lookOf(P()); draw({ mode: "lantern", dist: 4, showGhost: true });
      say(typeof msg === "string" ? msg : rook() ? `Slides, glass and lanterns, ${state.name}. Paid in Essence.` : `Lantern slides, stage glass and lanterns, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="ph-lobby">🏮 Back to the hall</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const res = buyOrUse(P(), b.dataset.b);
        if (res === "poor") return shop("Not enough Essence yet. A few more shows first.");
        if (res) { saveProgress(); showStats(); res === "bought" ? coins() : glass(); shop(res === "bought" ? "Loaded. Lights down." : "Swapped in."); } }));
      $("ph-lobby").onclick = () => lobby(false);
    }

    /* ---------- Show night: everyone stages a ghost, everyone votes (net.js table; host runs group.js) ---------- */
    let T = null, G = null, paid = 0;
    const gone = () => state.inRoom !== "phantasmagoria" || !T;
    function leaveGroup() { if (T) { const t = T; T = null; G = null; t.leave(); } }
    async function group() {
      halt();
      if (!canJoin(state)) return say("Show night needs friends: open the Chamber inside a Discord voice call, and everyone who opens Phantasmagoria joins the same hall.");
      say("Opening the hall…");
      try { T = await joinTable("phantasmagoria", state); } catch (e) { T = null; return say(`The hall won't open: ${e.message}`); }
      const t = T;
      t.on("msg", ({ from, m }) => { if (T !== t) return; if (state.inRoom !== "phantasmagoria") return leaveGroup();
        if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); } else if (m && m.k === "st") { G = m.st; gpaint(m.ev); } });
      t.on("members", () => { if (T !== t) return; if (state.inRoom !== "phantasmagoria") return leaveGroup(); if (t.isHost()) broadcast(); else gpaint(); });
      t.on("host", (snap) => { if (T !== t) return; if (snap && snap.total) G = snap; say("The host left. You run show night now."); broadcast(); });
      t.on("close", () => { if (T !== t) return; T = null; G = null; say("Show night broke up (connection lost)."); lobby(false); });
      ps.shutter(); gpaint();
      say(t.isHost() ? "You host show night. Start when the showmen are here." : `You join ${t.nameOf(t.host)}'s show night. Wait for the first round.`);
    }
    function broadcast(ev = "") { if (!T || !T.isHost()) return; for (const m of T.members) T.to(m.id, { k: "st", st: G && nightView(G, m.id), ev }); T.snap(G); gpaint(ev); }
    function hostAct(who, a) { if (!G) return; const ev = nightMove(G, who, a, T.members); if (ev) broadcast(ev); }
    function gact(a) { if (!T) return; if (T.isHost()) hostAct(T.me.id, a); else T.up({ k: "act", act: a }); }
    let pickSlide = SLIDES[0].id;
    function gpaint(ev = "") {
      if (gone()) return; const t = T, me = t.me.id, nm = (id) => esc(t.nameOf(id));
      const who = t.members.map((m) => `<span>${m.id === t.host ? "👑 " : ""}${esc(m.name)}${m.id === me ? " (you)" : ""}${G && !G.over ? (G.phase === "stage" ? (G.staged[m.id] ? " ✓" : " …") : G.votes[m.id] ? " 🗳️" : " …") : ""}</span>`).join("");
      const head = `<div class="cx-top"><b>👥 Show night</b> · ${t.members.length} showmen</div><div class="chips">${who}</div>`, leave = `<div class="choices"><button class="c small" type="button" id="ph-gleave">Leave the hall</button></div>`;
      if (ev === "round" || ev === "over") { ps.harmonica(2); spark(); } if (ev === "vote") ps.whoosh();
      const log = G && G.log.length ? `<div class="ph-log">${G.log.map((l) => `<div><b>Round ${l.round}</b> · ${l.ghosts.map((g) => `${slideOf(g.slide).e}${fxOf(g.fx).e} ${esc(g.name)}: ${g.votes} 🗳️`).join(" · ")}</div>`).join("")}</div>` : "";
      if (!G) { draw({ mode: "hall" }); ui(`${head}${t.isHost() ? (t.members.length >= 2 ? `<div class="choices"><button class="c main" type="button" id="ph-gstart">🏮 Start show night</button></div>` : `<div class="note">Waiting for at least one more showman…</div>`) : `<div class="note">Waiting for ${nm(t.host)} to start…</div>`}<div class="note">Each round everyone stages one ghost: a slide and an effect. Then everyone votes for the best ghost that isn't their own. ${NIGHT_ROUNDS} rounds; most votes wins.</div>${leave}`); return gwire(); }
      let body;
      if (G.over) { const rw = nightReward(G, me); if (paid !== G.game) { paid = G.game; award(rw.xp, rw.essence); R().plays++; saveProgress(); showStats(); rw.won ? chime(1) : sfx.darkness(); }
        const top = Math.max(...Object.values(G.total)); draw({ mode: "hall", cue: "appear", state: rw.won ? "won" : null });
        body = `<div class="reward"><div><b>${Object.entries(G.total).filter(([, n]) => n === top).map(([id]) => nm(id)).join(" & ")} ${top ? "steals the show" : "and nobody voted"}</b></div><div>${rw.won ? "You won" : "Not this time"} · +${rw.xp} ✦ · +${rw.essence} 💎</div></div>${t.isHost() ? `<div class="choices"><button class="c main" type="button" id="ph-gstart">🏮 Another show night</button></div>` : ""}`; }
      else if (G.phase === "stage") { const mine = G.staged[me]; draw({ mode: "hall", cue: mine ? (mine.fx === "rush" || mine.fx === "grow" ? "grow" : "appear") : null });
        body = `<div class="ft-card"><b>🎞️ Round ${G.round} of ${NIGHT_ROUNDS}: stage your ghost</b><p>${mine ? `Staged: ${slideOf(mine.slide).e} ${esc(slideOf(mine.slide).name)}, ${esc(fxOf(mine.fx).name.toLowerCase())}. Waiting for the others…` : "Pick a slide, then an effect."}</p></div>
          ${mine ? "" : `<div class="group">Slide</div><div class="choices">${SLIDES.map((s) => `<button class="c${pickSlide === s.id ? " main" : ""}" type="button" data-gs="${s.id}">${s.e} ${esc(s.name)}</button>`).join("")}</div>
          <div class="group">Effect</div><div class="choices col">${EFFECTS.map((f) => `<button class="c" type="button" data-gf="${f.id}">${f.e} ${esc(f.name)} <small>(${esc(f.how)})</small></button>`).join("")}</div>`}`; }
      else { const mine = G.votes[me]; draw({ mode: "hall", cue: "dissolve" });
        body = `<div class="ft-card"><b>🗳️ Round ${G.round}: vote for the best ghost</b><p>${mine ? "Vote cast. Waiting for the others…" : "Not your own, of course."}</p></div>
          ${mine ? "" : `<div class="choices col">${Object.entries(G.staged).filter(([id]) => id !== me).map(([id, g]) => `<button class="c" type="button" data-gv="${id}">${slideOf(g.slide).e} ${esc(slideOf(g.slide).name)}, ${esc(fxOf(g.fx).name.toLowerCase())} <small>by ${nm(id)}</small></button>`).join("")}</div>`}`; }
      ui(`${head}${body}${log}${leave}`); gwire();
    }
    function gwire() {
      $("ph-gleave").onclick = () => { leaveGroup(); lobby(false); };
      if ($("ph-gstart")) $("ph-gstart").onclick = () => { if (!T || !T.isHost() || T.members.length < 2) return; G = nightStart(T.members, (G ? G.game : 0) + 1); ps.shutter(); broadcast("start"); };
      $("ui").querySelectorAll("[data-gs]").forEach((b) => (b.onclick = () => { page(); pickSlide = b.dataset.gs; gpaint(); }));
      $("ui").querySelectorAll("[data-gf]").forEach((b) => (b.onclick = () => { ps.shutter(); gact({ a: "stage", slide: pickSlide, fx: b.dataset.gf }); }));
      $("ui").querySelectorAll("[data-gv]").forEach((b) => (b.onclick = () => { glass(); gact({ a: "vote", for: b.dataset.gv }); }));
    }
    lobby(true);
  },
};

/** One line on how each illusion works. */
export function trickLine(k) {
  return { lantern: "A magic lantern behind smoke or a thin screen: roll it back and the ghost grows in proportion, since twice the distance makes twice the height.",
    pepper: "A big sheet of glass tilted over the stage reflects a brightly lit actor hidden below. Tilt the glass by θ and the reflection turns by 2θ, so 45° makes them stand.",
    show: "A cue sheet timed to music: every slide, shutter and thunder sheet goes on the beat, so the ghosts seem to answer the music." }[k] || "";
}
/** The illusions, how they work, and the facts behind them (reading area). */
export function illusionsHtml(p, esc) {
  const r = phOf(p);
  return `<div class="ph-log"><h3>📒 How the illusions work · ${r.tricks.length} / ${TRICK_IDS.length} mastered</h3>${TRICK_IDS.map((k) => `<div><b>${r.tricks.includes(k) ? "✅" : "🏮"} ${esc(TRICK_NAMES[k])}</b><br><small>${esc(trickLine(k))}</small></div>`).join("")}
    ${[...LANTERN_FACTS, ...PEPPER_FACTS, ...SHOW_FACTS].map((f) => `<div><small>${esc(f)}</small></div>`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function phantasmagoriaCodex(p, esc) {
  const r = phOf(p);
  return `<div class="cx"><div class="cx-h"><span>🏮 Phantasmagoria</span><span class="note">${r.tricks.length} / ${TRICK_IDS.length} illusions · ${Object.values(r.wins).reduce((a, b) => a + b, 0)} shows</span></div><div class="bar"><i style="width:${(r.tricks.length / TRICK_IDS.length) * 100}%"></i></div>
    ${r.tricks.length ? `<div class="chips">${r.tricks.map((id) => `<span>${esc(TRICK_NAMES[id])}</span>`).join("")}</div>` : ""}</div>`;
}
