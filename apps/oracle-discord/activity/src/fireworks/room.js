// Fireworks Workshop: a room of the Oracle Chamber (Alchemist's House game). Pack a shell with real metal salts, an
// oxidiser, a chlorine donor, tail compositions and a star pattern to match a target burst, then launch it over the
// lab. Level 1 one colour; level 2 two-stage stars with tails and patterns; level 3 a timed show to a beat.
// Show Night: everyone in the call launches a shell to the same show and votes for the best burst.
import { COLOURS, COLOURANTS, OXIDISERS, DONOR, TAILS, PATTERNS, SIZES, LEVELS, TRIES, HISTORY, colourant, tail as tailOf, size as sizeOf } from "./data.js";
import { room as fwOf, deal, burstOf, check, tryPoints, timingPoints, cueTimes, describe, settle, dailyOf, tally } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { skySvg, burstSvg, rocketSvg, shellSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "./sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { joinTable } from "../net.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("fw-style")) return; const s = document.createElement("style"); s.id = "fw-style"; s.textContent = CSS; document.head.append(s); };
const HINT = {
  c1: (t) => `The first colour is off. Which salt burns ${COLOURS[t.c1].name}?`,
  c2: (t) => t.c2 ? `The stars should change to ${COLOURS[t.c2].name}. Check the core layer.` : "This one is a single colour: no second layer.",
  ox: () => "Dull stars! Saltpetre is for the lift and burst charges. Colour stars want potassium perchlorate.",
  cl: () => "Pale and whitish: copper's blue needs a chlorine donor to form copper chloride in the flame.",
  tail: (t) => `Wrong tail. This one is a ${tailOf(t.tail).effect}.`,
  pat: (t) => `Look at the shape: the stars should make a ${t.pat === "ring" ? "ring" : "round ball"}.`,
  size: (t) => `Wrong height. This cue needs a ${sizeOf(t.size).name}.`,
};
const SHOW_WIN = 20, SHOW_PLAY = 5;

export const fireworks = {
  id: "fireworks", label: "Fireworks Workshop", emoji: "🎆",
  blurb: "Pack real shells with metal salts and launch them over the lab",
  shop: { kind: "fireworks", label: "🎆 Fireworks Workshop", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table fireworks"; const look = { ...DEFAULT_LOOK, [it.slot]: id };
      tableEl.innerHTML = skySvg({ look, shots: [{ b: { c1: "red", c2: "green", effect: "chrysanthemum", pat: "sphere" }, x: 160, y: 80 }], shell: it.slot === "casing" ? { c1: "red", c2: "green", effect: "chrysanthemum", pat: "sphere" } : null }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => fwOf(P());
    const vell = () => host().id === "alchemist";
    const alive = () => document.body.dataset.room === "fireworks";
    const sky = (o = {}) => { tableEl.className = "table fireworks"; tableEl.innerHTML = skySvg({ look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    let run = null, table = null, night = null, showTimer = null;
    const stopShow = () => { if (showTimer) { clearInterval(showTimer); showTimer = null; } };
    const blank = () => ({ c1: null, c2: null, ox: null, cl: false, tail: "none", pat: "sphere", size: null });

    function lobby(first) {
      stopShow(); clearReading(); cap("🎆 Fireworks Workshop"); run = null; sky({ shots: first ? [{ b: { c1: "red", c2: "yellow", effect: "willow", pat: "sphere" }, x: 120, y: 70 }, { b: { c1: "green", c2: null, effect: "peony", pat: "ring" }, x: 210, y: 90, delay: 0.8 }] : [] });
      if (first) { sfx.thump(); sfx.burstAt(0.9, "peony"); setTimeout(() => sfx.burstAt(0.9, "peony"), 800); }
      const r = R(), ds = dailyState(P(), "fireworks"), dd = dailyOf();
      say(first && !r.plays ? (vell() ? `The Fireworks Workshop, ${state.name}! Every colour up there is a metal salt glowing, the same physics as the Flame Test Lab. Pack a shell, match the target, and light it.`
        : `The Fireworks Workshop, ${state.name}. Pack a shell with real metal salts to match a target burst, then launch it.`)
        : pick(vell() ? ["Safety glasses on. What are we launching?", "The mortars are loaded. Well, they will be.", "Fireworks are chemistry you can see from three miles away!"] : ["The workshop is ready.", "Which shell tonight?", `${pick(HISTORY)}`]));
      ui(`<div class="cx-top"><b>🎆 Fireworks Workshop</b> · ${r.shots} shells launched${r.wins ? ` · ${r.wins} shows won` : ""}</div>
        <div class="levels">${LEVELS.map((L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🎆".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.sub)}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`).join("")}
        <button class="c level${ds.played ? " done" : ""}" type="button" id="fw-daily"><b>📅 Daily shell${ds.played ? " · done ✓" : ""}</b><span>${esc(describe(dd.target))}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button></div>
        <div class="choices"><button class="c" type="button" id="fw-free">🧪 Free launch</button><button class="c" type="button" id="fw-night">🌃 Show Night</button><button class="c" type="button" id="fw-shop">🧨 Kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => start(+b.dataset.l)));
      $("fw-daily").onclick = () => { const d = dailyOf(); run = { level: 2, daily: true, targets: [d.target], i: 0, tries: 0, score: 0, max: 10, misses: 0 }; sfx.pack(); build(); };
      $("fw-free").onclick = () => { run = { free: true, level: 3, targets: [null], i: 0 }; sfx.pack(); build(); };
      $("fw-night").onclick = () => nightRoom(); $("fw-shop").onclick = shop; $("back").onclick = () => { stopShow(); if (table) { table.leave(); table = null; } greet(); };
    }
    function start(level) {
      const seed = (Math.random() * 2 ** 31) >>> 0, targets = deal(level, seed);
      run = { level, targets, i: 0, tries: 0, score: 0, max: targets.length * 10 * (level === 3 ? 2 : 1), misses: 0, built: [] };
      sfx.pack(); build();
    }

    // ---- the packing bench: choose what goes in the shell ----
    function build(line) {
      const L = run.level, t = run.targets[run.i], b = (run.b ||= blank()), free = run.free;
      cap(free ? "🧪 Free launch" : run.daily ? "📅 Daily shell" : `🎆 Level ${L} · ${L === 3 ? `cue ${run.i + 1} of ${run.targets.length}` : `shell ${run.i + 1} of ${run.targets.length}`}`);
      const bb = b.c1 ? burstOf(b) : null; sky({ shell: bb ? { ...bb, c1: bb.c1, c2: bb.c2 } : null });
      if (line !== " ") say(line || (free ? "Pack anything you like and light it." : `Target: ${describe(t)}.`));
      const chip = (k, v, label, extra = "", on = b[k] === v) => `<button class="c small${on ? " on" : ""}" type="button" data-k="${k}" data-v="${v}" aria-pressed="${on}">${extra}${esc(label)}</button>`;
      const dot = (c) => `<i style="background:${COLOURS[c].hex};color:${COLOURS[c].hex}"></i>`;
      const showC2 = L >= 2, showTail = L >= 2, showSize = L === 3;
      ui(`${t ? `<div class="fw-target">🎯 <b>${esc(describe(t))}</b>${run.tries ? ` · tries left ${TRIES - run.tries}` : ""}</div>` : ""}<div class="fw-build">
        <div class="group">${showC2 ? "Outer layer (first colour)" : "Colour stars"}</div><div class="fw-chips">${COLOURANTS.map((c) => chip("c1", c.id, `${c.name} ${c.f}`, dot(c.colour))).join("")}</div>
        ${showC2 ? `<div class="group">Core layer (second colour)</div><div class="fw-chips">${chip("c2", "", "None", "", !b.c2)}${COLOURANTS.map((c) => chip("c2", c.id, c.name, dot(c.colour))).join("")}</div>` : ""}
        <div class="group">Oxidiser</div><div class="fw-chips">${OXIDISERS.map((o) => chip("ox", o.id, `${o.name} ${o.f}`)).join("")}</div>
        <div class="group">Chlorine donor</div><div class="fw-chips"><button class="c small${b.cl ? " on" : ""}" type="button" id="fw-cl" aria-pressed="${b.cl}">🧪 ${b.cl ? "Added" : "None"}: ${esc(DONOR.name)}</button></div>
        ${showTail ? `<div class="group">Tail</div><div class="fw-chips">${TAILS.map((x) => chip("tail", x.id, `${x.name} (${x.effect})`)).join("")}</div>
        <div class="group">Pattern</div><div class="fw-chips">${PATTERNS.map((x) => chip("pat", x.id, x.name)).join("")}</div>` : ""}
        ${showSize ? `<div class="group">Shell size</div><div class="fw-chips">${SIZES.map((x) => chip("size", String(x.id), x.name)).join("")}</div>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="fw-go" ${b.c1 && b.ox && (!showSize || b.size || free) ? "" : "disabled"}>🚀 ${L === 3 && !free ? "Pack it for the show" : "Launch"}</button>${t && L >= 2 ? `<button class="c" type="button" id="fw-peek">👁 Show me the target</button>` : ""}<button class="c small" type="button" id="fw-about">📖 What does what?</button><button class="c small" type="button" id="fw-leave">Leave</button></div>`);
      $("ui").querySelectorAll("[data-k]").forEach((x) => (x.onclick = () => { const k = x.dataset.k, v = x.dataset.v; b[k] = k === "size" ? (v ? +v : null) : v || null; if (k === "tail" || k === "pat") b[k] = v; sfx.pack(); build(" "); }));
      $("fw-cl").onclick = () => { b.cl = !b.cl; sfx.pack(); build(" "); };
      $("fw-go").onclick = () => (L === 3 && !free ? packCue() : launch());
      if ($("fw-peek")) $("fw-peek").onclick = () => { sky({ shots: [{ b: { ...t, effect: tailOf(t.tail).effect }, x: 160, y: 80, label: "the target" }] }); sfx.thump(); sfx.burstAt(0.9, tailOf(t.tail).effect); say("That's the target. Now build it."); };
      $("fw-about").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".fw-guide"); rb.innerHTML = on ? guideHtml(esc) : ""; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("fw-leave").onclick = () => lobby(false);
    }
    function launch() {
      const t = run.targets[run.i], b = run.b, bb = burstOf(b);
      R().shots++; sfx.thump(); sfx.whistle(0.9); sfx.burstAt(0.9, bb.effect);
      sky({ shots: [{ b: bb, x: 160, y: 78 }] }); ctx.banter?.("mid");
      if (run.free) { saveProgress(); say(`${describe({ c1: bb.c1, c2: bb.c2, tail: b.tail, pat: b.pat })}${bb.dull ? ", but dull: wrong oxidiser" : ""}.`);
        return setTimeout(() => alive() && build(" "), 2600); }
      const miss = check(b, t); ui(`<div class="note">🚀 Launching…</div>`);
      setTimeout(() => { if (!alive() || !run) return;
        if (!miss.length) { const pts = tryPoints(run.tries + 1); run.score += pts; sfx.right(); spark(); chime(1); return next(`Beautiful! ${describe(t)}. +${pts}`); }
        run.tries++; run.misses++; sfx.wrong(); ctx.emote?.("think", { quiet: true });
        if (run.tries >= TRIES) return next(`Not quite. It needed: ${answerOf(t)}.`);
        build(HINT[miss[0]](t)); }, 2300);
    }
    const answerOf = (t) => [colourant(COLOURANTS.find((c) => c.colour === t.c1).id).name, t.c2 ? `then ${COLOURANTS.find((c) => c.colour === t.c2).name}` : "", "potassium perchlorate", [t.c1, t.c2].some((c) => c === "blue" || c === "purple") ? "a chlorine donor" : "", t.tail !== "none" ? tailOf(t.tail).name.toLowerCase() : "", t.pat === "ring" ? "a ring" : "", t.size ? sizeOf(t.size).name : ""].filter(Boolean).join(", ");
    function next(line) {
      run.i++; run.tries = 0; run.b = blank();
      if (run.daily) return dailyDone(line);
      if (run.i >= run.targets.length) return finish(line);
      say(line); ui(`<div class="choices"><button class="c main" type="button" id="fw-next">🧨 Next shell</button></div>`); $("fw-next").onclick = () => build();
    }

    // ---- level 3: pack four cues, then light them to the beat ----
    function packCue() {
      const t = run.targets[run.i], miss = check(run.b, t); sfx.pack();
      if (!miss.length) { run.score += tryPoints(run.tries + 1); run.built.push({ ok: true }); sfx.right(); }
      else { run.tries++; run.misses++; sfx.wrong(); if (run.tries < TRIES) return build(HINT[miss[0]](t)); run.built.push({ ok: false }); }
      run.i++; run.tries = 0; run.b = blank();
      if (run.i < run.targets.length) return build(miss.length ? `That cue will be a dud. It needed: ${answerOf(t)}. Next cue.` : "Packed. Next cue.");
      showPlay();
    }
    function showPlay() {
      const T = cueTimes(run.targets.length), cues = run.targets.map((t, i) => ({ t, at: T[i], rise: sizeOf(t.size).rise, lit: null, pts: 0, ok: run.built[i].ok })), END = T[T.length - 1] + 3;
      let k = 0; const t0 = performance.now() + 800, now = () => (performance.now() - t0) / 1000;
      cap("🎶 The show"); sky({}); say(vell() ? "Music! Light each shell early enough that it bursts on its beat. Bigger shells climb longer." : "Light each shell so it bursts on its beat. Bigger shells take longer to climb.");
      const draw = () => { const s = Math.max(0, now());
        ui(`<div class="fw-cues">${cues.map((c, i) => `<span class="${i === k ? "on" : ""}">${i + 1}. ${esc(describe(c.t))} · bursts at ${c.at}s · climbs ${c.rise}s${c.lit != null ? ` · ${c.pts ? `+${c.pts}` : "missed"}` : ""}</span>`).join("")}</div>
          <div class="fw-meter" aria-hidden="true"><b style="width:${Math.min(100, (s / END) * 100)}%"></b>${cues.map((c) => `<i style="left:${(c.at / END) * 100}%"></i>`).join("")}</div>
          <div class="note">⏱ ${s.toFixed(1)}s${k < cues.length ? ` · next: shell ${k + 1}, bursts at ${cues[k].at}s` : ""}</div>
          <div class="choices"><button class="c main" type="button" id="fw-light" ${k >= cues.length ? "disabled" : ""}>🔥 Light shell ${Math.min(k + 1, cues.length)}</button></div>`);
        const lb = $("fw-light"); if (lb) lb.onclick = light; };
      function light() {
        const c = cues[k]; if (!c) return; const s = now(); c.lit = s; const err = s + c.rise - c.at; c.pts = c.ok ? timingPoints(err) : 0; run.score += c.pts; k++;
        sfx.thump(); sfx.whistle(c.rise);
        const svg = tableEl.querySelector("svg"), x = 80 + ((k * 67) % 160), y = 110 - sizeOf(c.t.size).m / 3;
        if (svg) { const bb = c.ok ? { ...c.t, effect: tailOf(c.t.tail).effect } : { c1: "white", effect: "peony", pat: "sphere", dull: true };
          svg.insertAdjacentHTML("beforeend", rocketSvg(x, y, c.rise) + burstSvg(bb, x, y, { delay: c.rise, scale: 0.7 + sizeOf(c.t.size).id / 10, label: c.ok ? (Math.abs(err) <= 0.4 ? "on the beat!" : err < 0 ? `${(-err).toFixed(1)}s early` : `${err.toFixed(1)}s late`) : "dud" })); }
        if (c.ok) sfx.burstAt(c.rise, tailOf(c.t.tail).effect); else setTimeout(sfx.fizzle, c.rise * 1000);
        draw();
      }
      let lastBeat = -1; stopShow();
      showTimer = setInterval(() => { if (!alive()) return stopShow(); const s = now(), sec = Math.floor(s);
        if (sec >= 0 && sec !== lastBeat) { lastBeat = sec; sfx.beat(T.includes(sec)); }
        for (const c of cues) if (c.lit == null && s > c.at + 2) { c.lit = -1; c.pts = 0; if (cues[k] === c) k++; }
        draw(); if (s > END + 1.5) { stopShow(); finish("The show is over!"); } }, 250);
      draw();
    }

    function finish(line) {
      stopShow(); const L = run.level, lv = LEVELS[L - 1], st = settle(P(), L, run.score, run.max), pay = Math.round((run.score * lv.mult) / 2);
      award(pay, pay); ctx.trophy?.("fireworks", L, { won: st.won, perfect: st.perfect }); // Trophy Case: levels 1-3
      ctx.banter?.(st.won ? "win" : "lose"); saveProgress(); showStats(); if (st.won) { spark(); chime(2); sfx.boom(0, 1.3); }
      cap(`🎆 Level ${L} · ${run.score} / ${run.max}`);
      say(`${line ? line + " " : ""}${st.perfect ? (vell() ? "A perfect show! The whole street is clapping!" : "A perfect show.") : st.won ? (vell() ? "Lovely work. Smell that? That's success. And sulfur." : "Well launched.") : "The crowd's still waiting for the big one. Try again."}`);
      ui(`<div class="reward"><div><b>+${pay} ✦ · +${pay} 💎</b> · ${run.score} / ${run.max}${st.best ? " · new best!" : ""}</div></div>
        <div class="choices"><button class="c main" type="button" id="fw-again">🎆 Again</button><button class="c" type="button" id="fw-lobby">🧨 The workshop</button></div>`);
      $("fw-again").onclick = () => start(L); $("fw-lobby").onclick = () => lobby(false); run = null;
    }
    function dailyDone(line) {
      const score = run.score, fd = finishDaily(P(), "fireworks", { score, won: score > 0, detail: describe(run.targets[0]) }); saveProgress();
      if (fd.first) { award(score, score); postDaily(state, "fireworks", { score, won: score > 0, detail: describe(run.targets[0]) }).then(fill); } else boardOf(state, "fireworks").then(fill);
      function fill(bd) { const el = $("fw-board"); if (el) el.innerHTML = boardHtml(bd, esc, { unit: "pts", local: { score } }); }
      say(line); showStats();
      ui(`<div class="reward"><div>${fd.first ? `<b>📅 Daily shell: +${score} ✦ 💎</b> · streak ${fd.streak}` : "Already counted today."}</div></div><div class="group">📅 Today's board</div><div id="fw-board" class="note">Loading the board…</div>
        <div class="choices"><button class="c" type="button" id="fw-lobby">🧨 The workshop</button></div>`);
      $("fw-lobby").onclick = () => lobby(false); run = null;
    }

    // ---- Show Night: everyone in the call sends a shell, the show plays for all, then everyone votes ----
    const nightTop = () => `<div class="cx-top">🌃 Show Night · ${table ? table.members.length : 0} in the call${table && table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
    async function nightRoom(line) {
      stopShow();
      if (!table) {
        say("Setting up the launch site…"); ui(`<div class="note">Joining the call's table…</div>`);
        try { table = await joinTable("fireworks", state); wireNight(); }
        catch (e) { say(e.message || "Show Night needs a Discord voice call."); ui(`<div class="choices"><button class="c" type="button" id="fw-lobby">🧨 The workshop</button></div>`); $("fw-lobby").onclick = () => lobby(false); return; }
      }
      night ||= { shells: {}, votes: {}, phase: "build" };
      const isHost = table.isHost(), mine = night.shells[table.me.id], n = Object.keys(night.shells).length;
      say(line || (mine ? `Your shell is in. ${isHost ? "Start the show when everyone has sent one." : `Waiting for ${table.nameOf(table.host)} to start the show.`}` : "Build one shell for tonight's show. Make it your best."));
      ui(`${nightTop()}<div class="chips">${table.members.map((m) => `<span>${night.shells[m.id] ? "🎆 " : "⏳ "}${esc(m.name)}</span>`).join("")}</div>
        <div class="choices">${mine ? "" : `<button class="c main" type="button" id="fw-nb">🧨 Build my shell</button>`}${isHost ? `<button class="c main" type="button" id="fw-ns" ${n < 2 ? "disabled" : ""}>🎆 Start the show (${n})</button>` : ""}<button class="c" type="button" id="fw-nl">Leave Show Night</button></div>`);
      if ($("fw-nb")) $("fw-nb").onclick = () => { run = { free: true, night: true, level: 2, targets: [null], i: 0, b: blank() }; nightBuild(); };
      if ($("fw-ns")) $("fw-ns").onclick = () => { table.to("*", { k: "show", shells: night.shells }); playNight(night.shells); };
      $("fw-nl").onclick = () => { table.leave(); table = null; night = null; lobby(false); };
    }
    function nightBuild() {
      build("Pack your Show Night shell: anything you like.");
      const go = $("fw-go"); if (go) { go.textContent = "🌃 Send it to the show"; go.onclick = () => { const s = { name: state.name, b: { ...run.b } }; sfx.pack(); if (table.isHost()) addShell(table.me.id, s); else table.up({ k: "shell", s }); night.shells[table.me.id] = s; run = null; nightRoom("Sent! It's on the launch rack."); }; }
      const lv = $("fw-leave"); if (lv) lv.onclick = () => nightRoom();
    }
    function addShell(id, s) { if (!night || !s || !s.b || !COLOURANTS.some((c) => c.id === s.b.c1)) return; night.shells[id] = { name: table.nameOf(id), b: s.b }; if ($("fw-nl")) nightRoom(" "); }
    function wireNight() {
      table.on("members", () => { if ($("fw-nl")) nightRoom(" "); });
      table.on("msg", ({ from, m }) => {
        if (!m || typeof m !== "object" || !night) return;
        if (m.k === "shell" && table.isHost()) addShell(from, m.s);
        else if (m.k === "show" && from === table.host) playNight(m.shells || {});
        else if (m.k === "vote" && table.isHost() && night.phase === "vote") { night.votes[from] = m.who; maybeTally(); }
        else if (m.k === "result" && from === table.host) nightResult(m.rows || []);
      });
      table.on("close", () => { table = null; night = null; });
    }
    function playNight(shells) {
      night.shells = shells; night.phase = "show"; const ids = Object.keys(shells); cap("🌃 Show Night"); sky({});
      say("Lights down. Here they come!"); ui(`${nightTop()}<div class="note">The show is playing…</div>`);
      ids.forEach((id, i) => setTimeout(() => { if (!alive()) return; const svg = tableEl.querySelector("svg"), s = shells[id], x = 70 + ((i * 83) % 180), bb = burstOf(s.b);
        if (svg) svg.insertAdjacentHTML("beforeend", rocketSvg(x, 80, 1) + burstSvg(bb, x, 80, { delay: 1, label: s.name })); sfx.thump(); sfx.burstAt(1, bb.effect); }, i * 2600));
      setTimeout(() => { if (!alive() || !night) return; night.phase = "vote"; say("Which burst was best? You can't vote for your own.");
        ui(`${nightTop()}<div class="choices col">${ids.filter((id) => !table || id !== table.me.id).map((id) => `<button class="c" type="button" data-vote="${id}">🎆 ${esc(shells[id].name)}: ${esc(describe({ ...shells[id].b, c1: burstOf(shells[id].b).c1, c2: burstOf(shells[id].b).c2, tail: shells[id].b.tail || "none", pat: shells[id].b.pat || "sphere" }))}</button>`).join("")}</div>`);
        $("ui").querySelectorAll("[data-vote]").forEach((b) => (b.onclick = () => { if (!table) return; const who = b.dataset.vote; if (table.isHost()) { night.votes[table.me.id] = who; maybeTally(); } else table.up({ k: "vote", who }); ui(`${nightTop()}<div class="note">Vote sent. Waiting for the others…</div>`); }));
        if (table && table.isHost()) setTimeout(() => night && night.phase === "vote" && finishVote(), 30000); }, ids.length * 2600 + 2600);
    }
    function maybeTally() { if (!table || !night) return; const here = table.members.map((m) => m.id).filter((id) => night.shells[id]); if (here.every((id) => night.votes[id])) finishVote(); }
    function finishVote() { if (!table || !night || night.phase !== "vote") return; night.phase = "done"; const rows = tally(night.shells, night.votes); table.to("*", { k: "result", rows }); nightResult(rows); }
    function nightResult(rows) {
      if (!night) night = { shells: {}, votes: {} }; night.phase = "done";
      const me = table && rows.find((r) => r.id === table.me.id), win = me && rows[0] && rows[0].id === me.id && rows[0].votes > 0;
      if (me) { const pay = SHOW_PLAY + (win ? SHOW_WIN : 0); award(pay, pay); R().shots++; if (win) R().wins++; saveProgress(); showStats(); }
      if (win) { spark(); chime(2); sfx.boom(0, 1.3); }
      say(win ? `The crowd chose your shell, ${state.name}!` : rows[0] ? `${rows[0].name}'s burst wins the night.` : "The show is over.");
      ui(`${nightTop()}<ol class="ft-rank">${rows.map((r) => `<li>${esc(r.name)} · ${r.votes} vote${r.votes === 1 ? "" : "s"}${r === rows[0] && r.votes ? " 🏆" : ""}</li>`).join("")}</ol>
        ${me ? `<div class="reward"><div><b>+${SHOW_PLAY + (win ? SHOW_WIN : 0)} ✦ 💎</b>${win ? ` · +${SHOW_WIN} for the best burst` : ""}</div></div>` : ""}
        <div class="choices"><button class="c main" type="button" id="fw-again">🌃 Another show</button><button class="c" type="button" id="fw-lobby">🧨 The workshop</button></div>`);
      $("fw-again").onclick = () => { night = null; nightRoom(); }; $("fw-lobby").onclick = () => { if (table) { table.leave(); table = null; } night = null; lobby(false); };
    }

    function shop(msg) {
      stopShow(); clearReading(); cap("🧨 Workshop kit"); const look = lookOf(P()); sky({ shots: [{ b: { c1: "purple", c2: "white", effect: "chrysanthemum", pat: "sphere" }, x: 160, y: 80 }] });
      say(typeof msg === "string" ? msg : `Casings, mortars and skies, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="fw-lobby">🧨 Back to the workshop</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A good show or two will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.pack(); shop(r === "bought" ? "It's in the workshop now." : "Swapped in."); } }));
      $("fw-lobby").onclick = () => lobby(false);
    }
    lobby(true);
  },
};

/** The study sheet: what each ingredient does (reading area). */
export function guideHtml(esc) {
  const row = (x) => `<div class="ft-card"><b>${esc(x.name)}${x.f ? ` (${esc(x.f)})` : ""}${x.colour ? ` · ${esc(x.colour)}` : x.effect ? ` · ${esc(x.effect)}` : ""}</b><p>${esc(x.note)}</p></div>`;
  return `<div class="fw-guide"><h3>📖 What does what</h3><div class="group">Colour stars</div>${COLOURANTS.map(row).join("")}<div class="group">Oxidisers</div>${OXIDISERS.map(row).join("")}<div class="group">Chlorine donor</div>${row(DONOR)}
    <div class="group">Tails</div>${TAILS.map(row).join("")}<div class="group">Patterns</div>${PATTERNS.map(row).join("")}<div class="group">Shell sizes</div>${SIZES.map(row).join("")}
    <div class="group">History</div>${HISTORY.map((h) => `<p>${esc(h)}</p>`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function fireworksCodex(p, esc) {
  const r = fwOf(p), done = [1, 2, 3].filter((n) => r.best[n]).length;
  return `<div class="cx"><div class="cx-h"><span>🎆 Fireworks Workshop</span><span class="note">${r.shots} shells · ${done} / 3 levels</span></div><div class="bar"><i style="width:${(done / 3) * 100}%"></i></div></div>`;
}
