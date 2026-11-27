// Possession: a party room of the Oracle Chamber that works in every House. The players "possess" the host.
// True tales (main mode, true.js): the host narrates a real story from its House's subject; at key beats a few players
// (rotating) are picked to possess the host and answer a guiding question; their answer comes out of the host's mouth,
// then the host snaps back to the facts. The tale ends with a "What really happened" card.
// Made-up tales (tales.js): everyone writes every line, everyone votes, the tale ends with a title.
// Every typed answer goes through the word filter (../party/filter.js). At the end every player, writer or audience, is
// invited to save the tale to their Grimoire Journal; it also goes into the Story book and can be posted to the channel.
// Rules in ../party/story.js; House prompt sets + emcee lines in tales.js. In a Discord call everyone who opens
// Possession shares one table (net.js joinTable; the host's client runs it). The table host can strike any card and skip.
// Alone, you write every line yourself (or ask the spirits for a suggestion).
import * as S from "../party/story.js";
import { WHY, MAX_LEN } from "../party/filter.js";
import * as sfx from "../party/sfx.js";
import * as pz from "./sfx.js";
import { talesFor, taleById, beatsFor, LEVELS, emcee } from "./tales.js";
import { trueTalesFor, trueTaleById, trueBeatsFor, TRUE_LEVELS } from "./true.js";
import { SHOP, SLOTS, SHELF_TALK, shopItem, lookOf, buyOrUse, room } from "./shop.js";
import { bookHtml } from "./scene.js";
import { CSS } from "./style.js";
import { canJoin, joinTable } from "../net.js";
import { api } from "../discord.js";
import { host } from "../hosts/index.js";

export const TALES_KEPT = 12;
const styleOnce = () => { if (document.getElementById("pz-style")) return; const s = document.createElement("style"); s.id = "pz-style"; s.textContent = CSS; document.head.append(s); };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** Keep a finished tale in the Story book (newest first). */
export function keepTale(p, tale) {
  const r = room(p); r.tales.unshift({ ...tale, at: tale.at || Date.now() }); r.tales.length = Math.min(r.tales.length, TALES_KEPT); return r.tales;
}
/** A tale as lines for the channel post (sharePage takes at most 14 lines of 140 characters). */
export function shareLines(t) {
  const credit = `Told by ${t.host || "the Oracle"}${t.authors && t.authors.length ? `, possessed by ${t.authors.join(", ")}` : ""}`;
  const body = t.truths && t.truths.some(Boolean) ? t.lines.flatMap((l, k) => [`👻 ${l}`, t.truths[k] ? `📜 ${t.truths[k]}` : null].filter(Boolean)) : t.lines;
  return [...body.slice(0, 12).map((l) => l.slice(0, 140)), credit.slice(0, 140)];
}
export const plainText = (t) => `${t.title}\n\n${t.lines.map((l, k) => (t.truths && t.truths[k] ? `${l}\n  (Really: ${t.truths[k]})` : l)).join("\n")}${t.real && t.real.length ? `\n\nWhat really happened:\n${t.real.map((r) => "- " + r).join("\n")}` : ""}\n\n${shareLines(t).slice(-1)[0]}`;
/** The Grimoire Journal entry for a finished tale: [title, detail rows] (book.js addLog keeps 14 rows of 600 characters). */
export function journalRows(t, part) {
  const rows = [["Told by", t.host || "the Oracle"], ["Possessed by", (t.authors || []).join(", ") || "the House itself"], ["Your part", part]];
  t.lines.slice(0, 8).forEach((l, k) => rows.push([`Line ${k + 1}`, t.truths && t.truths[k] ? `${l} (Really: ${t.truths[k]})` : l]));
  if (t.real && t.real.length) rows.push(["What really happened", t.real.join(" ")]);
  return [`Possession: ${t.title}`, rows.slice(0, 14)];
}

export const possession = {
  id: "possession", label: "Possession", emoji: "👻",
  blurb: "Hear a true story and take turns possessing the host at key moments, then the facts snap back",
  shop: { kind: "possession", label: "👻 Story book", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table possession";
      tableEl.innerHTML = bookHtml({ look: { ink: "pz-irongall", page: "pz-parchment", [it.slot]: id }, title: "A sample page", lines: ["Long ago, in a land of fog, there lived a goatherd with one sandal.", "One moonless night, our hero stole the Moon's spare key."], fresh: true }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, award, tableEl, greet, chime } = ctx;
    styleOnce(); clearReading?.();
    let T = null, G = null, V_ = null, long = false, level = 2, taleId = null, mode = "true", journaled = false, tick = null, until = 0, rewarded = false, lastPhase = "", gone = false, helped = false;
    const P = () => state.prog;
    const solo = !canJoin(state), me = () => (T ? T.me.id : "me");
    const members = () => (T ? T.members : [{ id: "me", name: state.name }]);
    const nameOf = (id) => (T ? T.nameOf(id) : id === "me" ? state.name : "someone");
    const isHost = () => !T || T.isHost();
    const alone = () => members().length === 1;
    const H = () => host() || { id: "oracle", name: "the Oracle" };
    const stop = () => { clearInterval(tick); tick = null; };
    const unpossess = () => document.body.classList.remove("pz-possessed");
    const leave = () => { gone = true; stop(); unpossess(); if (T) { const t = T; T = null; t.leave(); } greet(); };
    const draw = (o = {}) => { tableEl.className = "table possession"; tableEl.innerHTML = bookHtml({ look: lookOf(P()), esc, ...o }); };

    /* ---------- the host runs the tale ---------- */
    function setClock() { if (!G || alone()) { until = 0; return; } const s = S.seconds(G); until = s ? Date.now() + s * 1000 : 0; }
    function broadcast(ev = "") {
      if (!G) return paint(null, ev);
      const left = until ? Math.max(0, Math.round((until - Date.now()) / 1000)) : 0;
      if (T) { for (const m of T.members) if (m.id !== me()) T.to(m.id, { k: "st", st: S.publicView(G, m.id), left, ev }); T.snap(G); }
      paint(S.publicView(G, me()), ev, left);
    }
    function hostAct(from, a) {
      if (!a) return;
      if (a.a === "start") { if (from !== me()) return;
        const tm = a.mode === "made" ? "made" : "true", tales = tm === "true" ? trueTalesFor(H().id) : talesFor(H().id), byId = tm === "true" ? trueTaleById : taleById;
        const tale = byId(a.tale) && tales.some((t) => t.id === a.tale) ? byId(a.tale) : pick(tales), lv = a.level || level;
        G = S.startTale(tale, tm === "true" ? trueBeatsFor(tale, lv) : beatsFor(tale, lv, H().id), members(), { long, level: lv, house: H().id, mode: tm }); rewarded = false; helped = false; journaled = false;
        setClock(); sfx.curtain(); return broadcast("start"); }
      if (!G) return;
      if (a.a === "line") { const r = S.submit(G, from, a.text); if (!r) return;
        if (from === me()) feedback(r); else if (T) T.to(from, { k: "res", r });
        if (r.r === "bad") return; // keep their typing on screen; only the note changes
        if (r.r === "ok" && alone()) { S.openVote(G); S.reveal(G); setClock(); return broadcast("write>reveal"); }
        if (r.r === "ok" && S.allWritten(G)) return step(); return broadcast(); }
      if (a.a === "vote") { const r = S.vote(G, from, a.key); if (!r) return; if (G.phase === "vote" && S.allVoted(G)) return step(); return broadcast(); }
      if (a.a === "strike" && from === me()) { if (S.strike(G, a.key)) { pz.rip(); if (T) T.to("*", { k: "rip" }); if (S.allVoted(G) && Object.keys(G.votes).length) return step(); return broadcast("strike"); } return; }
      if (a.a === "skip" && from === me()) return step();
    }
    function step() {
      const was = G.phase; let r = S.advance(G, members());
      if (!r) return;
      if (r === "vote" && S.allVoted(G)) { S.reveal(G); r = "reveal"; } // nobody can vote (one answer, or all the same): straight to the reveal
      setClock();
      if (r === "vote") sfx.flip(G.choices.length); else if (r === "write") sfx.curtain();
      broadcast(was + ">" + r);
    }
    function hostTick() { if (!G || !isHost() || G.over || !until) return; const left = Math.round((until - Date.now()) / 1000);
      if (left <= 0) return step(); if (left <= 5 && G.phase !== "reveal") sfx.tick(left <= 2); }
    function startTicking() { stop(); tick = setInterval(() => { if (gone) return stop();
      if (state.inRoom && state.inRoom !== "possession") { gone = true; stop(); unpossess(); if (T) { const t = T; T = null; t.leave(); } return; } if (isHost()) hostTick(); clock(); }, 1000); }
    function act(a) { if (isHost()) hostAct(me(), a); else T.up({ k: "act", act: a }); }

    /* ---------- everyone: what you see ---------- */
    function feedback(r) {
      if (r.r === "ok") { sfx.seal(); return; }
      sfx.buzz(); ctx.emote?.("shake", { quiet: true }); const n = $("pz-note"); if (n) n.textContent = WHY[r.why] || WHY.word;
    }
    function possessed(line) {
      pz.possess(); ctx.emote?.("dizzy", { quiet: true }); document.body.classList.add("pz-possessed");
      setTimeout(() => { if (!gone) { say(`${emcee("trance")} “${line}”`); pz.quill(line.split(" ").length); } }, 600);
      setTimeout(unpossess, 4200);
    }
    let viewLeft = 0, viewAt = 0;
    function clock() { const el = $("pz-clock"); if (!el || !viewAt || !viewLeft) { if (el) el.textContent = ""; return; } const left = Math.max(0, viewLeft - Math.round((Date.now() - viewAt) / 1000));
      el.textContent = `⏱ ${left}s`; el.classList.toggle("low", left <= 5); }
    const scoreChips = (v) => { if (v.seats.length < 2) return ""; const rows = S.standings(v), top = rows[0] ? rows[0].score : 0;
      return `<div class="pz-score">${rows.map((r) => `<span class="${r.score && r.score === top ? "lead" : ""}">${esc(nameOf(r.id))} · ${r.score}</span>`).join("")}</div>`; };
    const bar = (v) => `<div class="cx-top"><b>👻 Possession</b> · ${esc(v.name)} · line ${v.i + 1} of ${v.n}${S.isFinal(v) && v.seats.length > 1 ? " · ✨ the title, double points" : ""}<span class="pz-clock" id="pz-clock"></span></div>`;
    const hostBtns = (v) => (isHost() && !v.over && !(alone() && v.phase === "write") ? `<button class="c small" type="button" id="pz-skip">⏭ ${v.phase === "reveal" ? "Next line" : "Skip ahead"}</button>` : "");
    const leaveBtn = `<button class="c small" type="button" id="pz-leave">↩ Leave Possession</button>`;
    const items = (story) => story.flatMap((s, g) => (s.narr || s.truth ? [s.narr && { t: s.narr, k: "narr", g }, { t: s.line, k: "ghost", g }, s.truth && { t: s.truth, k: "truth", g }].filter(Boolean) : [{ t: s.line, k: "ghost", g }]));
    const bookOf = (v, o = {}) => draw({ title: v.title || "", lines: items(v.story), ...o });
    const names = (ids) => { const n = ids.map((id) => nameOf(id)); return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n.at(-1)}` : n[0] || "someone"; };

    function paint(v, ev = "", left = 0) {
      V_ = v; viewLeft = left; viewAt = Date.now();
      if (!v) return lobby();
      const b = v.beats[v.i], phaseChanged = v.phase + v.i !== lastPhase; lastPhase = v.phase + v.i;
      if (v.phase === "write") {
        const tru = v.mode === "true", writer = v.writers.includes(me());
        bookOf(v, { ask: tru ? `${b.ask} (${names(v.writers)})` : b.ask }); cap(tru ? `👻 Possession · ${writer ? "you possess the host" : "someone possesses the host"}` : "👻 Possession · write the host's next line");
        if (phaseChanged) say(tru ? `${b.narr} ${alone() ? "" : emcee("pick", { names: names(v.writers) }) + " "}${b.ask}` : `${b.title ? emcee("title") + " " : ""}${b.ask}`); // the lobby already said the opening line
        if (phaseChanged && tru && writer && !alone()) { pz.possess(); ctx.emote?.("wow", { quiet: true }); }
        const seated = v.seats.includes(me()) && (writer || !tru), mine = v.mine;
        ui(`${bar(v)}<div class="ft-card"><b>✒️ ${esc(b.ask)}</b><p class="note">${b.title ? "Name the tale." : `${tru ? esc(b.narr) + "<br>" : ""}${esc(H().name)} will say: “${esc(b.frame.replace("{a}", "___"))}”`}</p></div>
          ${tru && !writer && v.seats.includes(me()) ? `<div class="pz-who">👻 <b>${esc(names(v.writers))}</b> ${v.writers.length > 1 ? "are" : "is"} possessing ${esc(H().name)}. Your turn comes round soon.${v.writers.length > 1 ? " You'll vote on their lines." : ""}</div>`
            : !seated ? `<div class="note">You arrived mid-line, so you're in the audience. You get a seat at the next line.</div>`
            : mine ? `<div class="note">🔒 Your line is in: <b>${esc(mine)}</b>. Waiting for the others…</div>`
            : `<div class="pz-in"><input id="pz-line" type="text" autocomplete="off" maxlength="${MAX_LEN}" placeholder="Your answer, a few words" aria-label="Your answer"><button class="c main" type="button" id="pz-go">🔒 Lock in</button></div>
               <div class="note" id="pz-note">${esc(emcee("write"))} Keep it friendly: rude words, links and @mentions are refused.</div>
               <div class="choices"><button class="c small" type="button" id="pz-hint">🎲 Ask the spirits for an idea</button></div>`}
          ${v.writers.length > 1 ? `<div class="note">✍️ ${v.done.length} of ${v.writers.length} lines in${v.writers.length > v.done.length ? ` · waiting for ${v.writers.filter((id) => !v.done.includes(id)).map((id) => esc(nameOf(id))).join(", ")}` : ""}</div>` : ""}
          ${scoreChips(v)}<div class="choices">${hostBtns(v)}${leaveBtn}</div>`);
        const inp = $("pz-line");
        if (inp) { const go = () => { const t = inp.value.trim(); if (t) act({ a: "line", text: t }); };
          $("pz-go").onclick = go; inp.onkeydown = (k) => { if (k.key === "Enter") { k.preventDefault(); go(); } }; if (phaseChanged) setTimeout(() => inp.focus(), 50);
          $("pz-hint").onclick = () => { helped = true; inp.value = pick(b.fall || ["…"]); inp.focus(); pz.quill(3); }; }
      } else if (v.phase === "vote") {
        bookOf(v, { ask: b.ask }); cap("👻 Possession · vote for the line");
        if (phaseChanged) say(emcee("vote"));
        if (ev === "strike") say(emcee("strike"));
        const aud = !v.seats.includes(me()), canStrike = isHost() && v.seats.length > 1;
        ui(`${bar(v)}<div class="ft-card"><b>✒️ ${esc(b.ask)}</b></div>
          <div class="pz-cards">${v.choices.map((c, k) => `<div class="pz-c${c.struck ? " struck" : ""}"><button class="c${v.myVote === c.key ? " main mine" : ""}" type="button" data-v="${c.key}" style="--d:${(k * 0.07).toFixed(2)}s"${c.own || c.struck ? " disabled" : ""}${c.own ? ' title="Your own line"' : ""}>${esc(c.text)}${c.own ? " ✍️" : ""}</button>${canStrike && !c.struck ? `<button class="c small pz-x" type="button" data-x="${c.key}" title="Strike this answer from the story">🚫 Strike</button>` : ""}</div>`).join("")}</div>
          <div class="note">${aud ? "📣 Audience vote: it breaks ties but doesn't score. " : ""}🗳️ ${v.voted.length} of ${v.seats.length} voted${v.myVote ? " · you can change your vote until time runs out" : ""}${canStrike ? " · 🚫 you're the table host: strike anything unkind" : ""}</div>
          <div class="choices">${hostBtns(v)}${leaveBtn}</div>`);
        $("ui").querySelectorAll("[data-v]").forEach((x) => (x.onclick = () => { if (!x.disabled) act({ a: "vote", key: x.dataset.v }); }));
        $("ui").querySelectorAll("[data-x]").forEach((x) => (x.onclick = () => act({ a: "strike", key: x.dataset.x })));
      } else if (v.phase === "reveal" || v.phase === "over") {
        const L = v.last || {};
        bookOf(v, { fresh: phaseChanged && !L.title, done: v.over });
        if (phaseChanged && !v.over) { if (L.title) { say(`${emcee("trance")} “${L.text}”`); pz.possess(); } else possessed(L.line);
          if (L.truth) setTimeout(() => { if (!gone) { say(`${emcee("snap")} ${L.truth}`); sfx.seal(); } }, 4800); if (v.i % 2 === 1) setTimeout(() => { if (!gone) ctx.banter?.("mid"); }, 5200); }
        if (v.over) return finish(v);
        cap("👻 Possession · the host speaks");
        const by = L.by && L.by.length ? `Written by ${L.by.map((id) => esc(nameOf(id))).join(" & ")}` : "The House answered itself";
        ui(`${bar(v)}<div class="pz-win"><b>“${esc(L.title ? L.text : L.line)}”</b><div class="note">${by}${(L.cards || 0) > 1 ? ` · ${L.votes} vote${L.votes === 1 ? "" : "s"}` : ""}</div></div>
          ${L.truth ? `<div class="pz-tale"><b>📜 What actually happened</b><p>${esc(L.truth)}</p></div>` : ""}
          ${scoreChips(v)}<div class="choices">${hostBtns(v)}${leaveBtn}</div>${!isHost() ? `<div class="note">Next line in a moment…</div>` : ""}`);
      }
      wire(); clock();
    }
    function wire() { if ($("pz-skip")) $("pz-skip").onclick = () => act({ a: "skip" }); if ($("pz-leave")) $("pz-leave").onclick = leave; }

    function finish(v) {
      const players = v.seats.length, rw = S.reward(v, me(), players, { helped }), top = S.standings(v)[0];
      const tt = S.taleText(v, nameOf), tru = v.mode === "true", real = tru ? ((trueTaleById(v.tale) || {}).real || []) : [];
      const saved = { title: tt.title, lines: tt.lines, ...(tru ? { truths: tt.truths, real } : {}), authors: players > 1 ? tt.authors : [state.name], host: H().name, house: H().id, level: v.level };
      const part = !v.seats.includes(me()) ? "Watched from the audience" : (v.wrote[me()] || 0) ? `Possessed the host ${v.wrote[me()]} time${v.wrote[me()] === 1 ? "" : "s"}, ${rw.beats} line${rw.beats === 1 ? "" : "s"} spoken` : "Watched and voted";
      if (!rewarded) { rewarded = true; const r = room(P()); r.plays = (r.plays || 0) + 1; r.best[v.level] = Math.max(r.best[v.level] || 0, rw.score); keepTale(P(), saved);
        const aw = award(rw.xp, rw.essence); saveProgress(); showStats(); sfx.fanfare(rw.won); pz.closeBook(); if (rw.won) chime?.(rw.perfect ? 2 : 1);
        ctx.trophy?.("possession", v.level, { won: rw.won, perfect: rw.perfect }); // Trophy Case (trophies.js)
        ctx.banter?.(rw.won ? "win" : "lose");
        setTimeout(() => { if (!gone) say(`${tru ? emcee("real") + " " : ""}${players > 1 && top ? emcee("win", { name: nameOf(top.id) }) : emcee("solo", { name: state.name })}${aw.rankUp ? ` You are now ${aw.rankUp}.` : ""}${Math.random() < 0.35 ? " " + emcee("slip") : ""}`); }, 4600); }
      cap("👻 Possession · the tale is told");
      ui(`<div class="reward"><div><b>${players > 1 ? (rw.place === 1 ? "🏆 You possessed the host best!" : `You came ${["", "1st", "2nd", "3rd"][rw.place] || rw.place + "th"}`) : "📖 Your tale is told"}</b>${players > 1 ? ` · ${rw.score} points · ${rw.beats} line${rw.beats === 1 ? "" : "s"} yours` : ""} · +${rw.xp} ✦${rw.essence ? ` · +${rw.essence} 💎` : ""}</div></div>
        ${scoreChips(v)}${real.length ? `<div class="pz-real"><b>📜 What really happened</b><ul>${real.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>` : ""}
        <div class="pz-tale"><b>${esc(tt.title)}</b>${tt.lines.map((l) => `<p>${esc(l)}</p>`).join("")}<div class="note">Saved in your 📜 Story book.</div></div>
        <div class="pz-who">📓 <b>Journal this tale?</b> Everyone at the table, writers and audience, can keep it in their Grimoire Journal${real.length ? ", with what really happened" : ""}.
          <div class="choices"><button class="c main" type="button" id="pz-journal"${journaled ? " disabled" : ""}>${journaled ? "📓 In your Journal ✓" : "📓 Save to my Journal"}</button></div></div>
        <div class="choices">${shareBtns()}${isHost() ? `<button class="c main" type="button" id="pz-again">👻 Tell another</button>` : `<div class="note">The host can start another tale.</div>`}${leaveBtn}</div><div class="note" id="pz-shared"></div>`);
      wireShare(saved);
      $("pz-journal").onclick = () => { if (journaled) return; const [t, rows] = journalRows(saved, part); ctx.logEvent?.("game", "👻", t, null, rows); journaled = true; pz.quill(5);
        const b = $("pz-journal"); b.disabled = true; b.textContent = "📓 In your Journal ✓"; say("Written into your Grimoire Journal."); };
      if ($("pz-again")) $("pz-again").onclick = () => { G = null; lastPhase = ""; broadcast(); };
      wire();
    }

    /* ---------- the Story book: saved tales, shared to the channel or copied ---------- */
    const canShare = () => !!(state.token && state.channelId);
    const shareBtns = () => `${canShare() ? `<button class="c" type="button" id="pz-share">📣 Post to the channel</button>` : ""}<button class="c" type="button" id="pz-copy">📋 Copy the tale</button>`;
    function wireShare(t) {
      const note = (s) => { const n = $("pz-shared"); if (n) n.textContent = s; };
      if ($("pz-share")) $("pz-share").onclick = async () => {
        $("pz-share").disabled = true;
        try { const r = await fetch(api("/api/share"), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ channelId: state.channelId, title: t.title, lines: shareLines(t), color: (host() || {}).accent || "#B8F0FF" }) });
          const j = await r.json().catch(() => ({})); note(j.ok ? "📣 Posted to the channel." : `Couldn't post: ${j.error || "try again in a minute"}.`); if (j.ok) sfx.seal(); }
        catch { note("Couldn't reach the channel. Try again in a minute."); }
        setTimeout(() => { if ($("pz-share")) $("pz-share").disabled = false; }, 60000);
      };
      if ($("pz-copy")) $("pz-copy").onclick = () => { const txt = plainText(t);
        const fallback = () => { const ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;opacity:0"; document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; } ta.remove(); note(ok ? "📋 Copied." : "Your browser blocked copying. The tale is in your Story book."); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => note("📋 Copied."), fallback); else fallback(); };
    }
    function storyBook() {
      const tales = room(P()).tales, rb = $("reading-body"); if (!rb) return;
      if (rb.querySelector(".pz-shelf")) { rb.innerHTML = ""; return; }
      rb.innerHTML = `<div class="pz-shelf"><div class="group">📜 Story book · ${tales.length} tale${tales.length === 1 ? "" : "s"}</div>${tales.length ? tales.map((t, k) => `<div class="pz-tale"><b>${esc(t.title)}</b><div class="note">${esc(t.host || "")} · ${new Date(t.at).toLocaleDateString()}${t.authors && t.authors.length ? ` · ${esc(t.authors.join(", "))}` : ""}</div>${t.lines.map((l, j) => `<p>${esc(l)}</p>${t.truths && t.truths[j] ? `<p class="note">📜 ${esc(t.truths[j])}</p>` : ""}`).join("")}<button class="c small" type="button" data-t="${k}">📖 Open on the table</button></div>`).join("") : `<p class="note">No tales yet. Tell one!</p>`}</div>`;
      rb.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => { const t = tales[+x.dataset.t]; if (!t) return; draw({ title: t.title, lines: t.lines.flatMap((l, g) => [{ t: l, k: "ghost", g }, ...(t.truths && t.truths[g] ? [{ t: t.truths[g], k: "truth", g }] : [])]), done: true }); pz.quill(4);
        ui(`<div class="cx-top"><b>📜 ${esc(t.title)}</b></div><div class="choices">${shareBtns()}<button class="c" type="button" id="pz-back">↩ Back</button></div><div class="note" id="pz-shared"></div>`); wireShare(t); $("pz-back").onclick = lobby; }));
      rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const closeBook = () => { const rb = $("reading-body"); if (rb && rb.querySelector(".pz-shelf")) rb.innerHTML = ""; };
    function shop() {
      closeBook(); const p = P(), look = lookOf(p);
      say(SHELF_TALK.open[0].replace("{name}", state.name));
      ui(`<div class="cx-top"><b>👻 Story book shop</b> · 💎 ${p.essence || 0}</div>${SLOTS.map(([slot, label]) => `<div class="group">${label}</div><div class="levels">${SHOP.filter((s) => s.slot === slot).map((s) => {
        const own = s.price === 0 || (p.owned || []).includes(s.id), on = look[slot] === s.id;
        return `<button class="c level${on ? " done" : ""}" type="button" data-s="${s.id}"><b>${esc(s.name)}${on ? " ✓" : own ? "" : ` · 💎 ${s.price}`}</b><span>${esc(s.note)}</span></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="pz-back">↩ Back</button></div>`);
      draw({ title: "A sample page", lines: ["Long ago, in a land of fog, there lived a goatherd with one sandal."] });
      $("ui").querySelectorAll("[data-s]").forEach((x) => (x.onclick = () => { const r = buyOrUse(p, x.dataset.s), it = shopItem(x.dataset.s);
        if (r === "poor") { say(`${it.name} costs 💎 ${it.price}. Tell a few more tales first.`); sfx.buzz(); return; }
        saveProgress(); showStats(); pz.quill(3); say(pick(SHELF_TALK[r === "bought" ? "buy" : "tryon"]).replace("{item}", it.name)); shop(); }));
      $("pz-back").onclick = lobby;
    }

    function lobby() {
      unpossess(); draw({ title: "Possession", lines: [] }); cap("👻 Possession");
      const tales = mode === "true" ? trueTalesFor(H().id) : talesFor(H().id), LV = mode === "true" ? TRUE_LEVELS : LEVELS, r = room(P());
      if (!taleId || !tales.some((t) => t.id === taleId)) taleId = tales[0].id;
      const who = members().map((m) => `<span>${esc(m.name || nameOf(m.id))}${T && m.id === T.host ? " 👑" : ""}</span>`).join("");
      say(emcee("open"));
      ui(`<div class="cx-top"><b>👻 Possession</b> · ${solo ? "solo: you write every line" : `${members().length} at the table`}</div>${T ? `<div class="chips">${who}</div>` : ""}
        <div class="note">${mode === "true"
          ? `${esc(H().name)} tells a true story. At key moments ${solo ? "you possess" : "one to three players, taking turns, possess"} ${esc(H().name)} and answer a question; the answer comes out of ${esc(H().name)}'s mouth, then the real facts snap back. ${solo ? "" : `With several writers the others vote: ${S.VOTE_PTS} points a vote, +${S.WIN_PTS} for the line spoken.`}`
          : `${esc(H().name)} asks a question; ${solo ? "you type" : "everyone types"} an answer${solo ? "" : ", everyone votes"}, and the ${solo ? "answer" : "winner"} comes out of ${esc(H().name)}'s mouth as the next line of the tale. ${solo ? "" : `Each vote your line gets: ${S.VOTE_PTS} points; the winning line: +${S.WIN_PTS}. The title counts double.`}`}</div>
        ${solo ? `<div class="note">Open Possession inside a Discord voice call and everyone in the call writes the tale together.</div>` : ""}
        ${isHost() ? `<div class="group">Which kind</div><div class="levels"><button class="c level${mode === "true" ? " done" : ""}" type="button" data-m="true"><b>📜 True tales${mode === "true" ? " ✓" : ""}</b><span>${esc(H().name)} tells a real story. Players take turns possessing the host at key moments, then the facts snap back.</span></button><button class="c level${mode === "made" ? " done" : ""}" type="button" data-m="made"><b>✨ Made-up tales${mode === "made" ? " ✓" : ""}</b><span>Everyone writes every line, everyone votes, the tale gets a title.</span></button></div>
          <div class="group">The tale</div><div class="levels">${tales.map((t) => `<button class="c level${taleId === t.id ? " done" : ""}" type="button" data-tale="${t.id}"><b>${esc(t.name)}${taleId === t.id ? " ✓" : ""}</b><span>${esc(t.kind)}</span></button>`).join("")}</div>
          <div class="group">How long</div><div class="levels">${LV.map((L) => `<button class="c level${level === L.n ? " done" : ""}" type="button" data-l="${L.n}"><b>${"👻".repeat(L.n)} Level ${L.n} · ${esc(L.name)}${level === L.n ? " ✓" : ""}</b><span>${esc(L.what)}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`).join("")}</div>` : ""}
        <div class="choices">${isHost() ? `<button class="c main" type="button" id="pz-start">👻 Begin the tale</button>${solo ? "" : `<button class="c small" type="button" id="pz-long">${long ? "⏱ Long timers: on" : "⏱ Long timers: off"}</button>`}` : `<div class="note">Waiting for ${esc(nameOf(T.host))} to start…</div>`}
          <button class="c" type="button" id="pz-book">📜 Story book (${r.tales.length})</button><button class="c" type="button" id="pz-shop">🖋️ Story book shop</button>${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-m]").forEach((x) => (x.onclick = () => { mode = x.dataset.m; taleId = null; pz.quill(2); lobby(); }));
      $("ui").querySelectorAll("[data-tale]").forEach((x) => (x.onclick = () => { taleId = x.dataset.tale; pz.quill(2); lobby(); }));
      $("ui").querySelectorAll("[data-l]").forEach((x) => (x.onclick = () => { level = +x.dataset.l; pz.quill(2); lobby(); }));
      if ($("pz-start")) $("pz-start").onclick = () => { closeBook(); hostAct(me(), { a: "start", tale: taleId, level, mode }); };
      if ($("pz-long")) $("pz-long").onclick = () => { long = !long; lobby(); };
      $("pz-book").onclick = storyBook; $("pz-shop").onclick = shop;
      wire();
    }

    async function connect() {
      if (solo) { startTicking(); return lobby(); }
      say("Pulling up chairs for everyone in the call…");
      let t; try { t = await joinTable("possession", state); } catch (e) { say(`The table won't open (${e.message}). You can still play solo.`); T = null; startTicking(); return lobby(); }
      if (gone) return t.leave(); T = t;
      t.on("msg", ({ from, m }) => { if (T !== t || gone) return;
        if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); }
        else if (m && m.k === "st") { G = null; paint(m.st, m.ev, m.left); if (m.ev && m.ev.endsWith(">vote")) sfx.flip(m.st.choices.length); else if (m.ev === "start" || (m.ev && m.ev.endsWith(">write"))) sfx.curtain(); }
        else if (m && m.k === "res") feedback(m.r);
        else if (m && m.k === "rip") pz.rip(); });
      t.on("members", () => { if (T !== t || gone) return; if (t.isHost()) { if (G) for (const m of t.members) S.join(G, m.id); broadcast(); } else if (!V_) lobby(); });
      t.on("host", (snap) => { if (T !== t || gone) return; if (snap && snap.beats) { G = snap; setClock(); } say("The host left the table. You run Possession now."); broadcast(); });
      t.on("close", () => { if (T !== t) return; T = null; G = null; say("The table broke up (connection lost)."); lobby(); });
      startTicking(); lobby();
    }
    connect();
    return { leave };
  },
};

export function possessionCodex(p, esc) {
  const r = room(p), n = r.tales.length;
  return `<div class="cx"><div class="cx-h"><span>👻 Possession</span><span class="note">${r.plays || 0} tale${r.plays === 1 ? "" : "s"} told</span></div>
    ${n ? `<div class="chips">${r.tales.slice(0, 6).map((t) => `<span>${esc(t.title)}</span>`).join("")}</div>` : ""}</div>`;
}
