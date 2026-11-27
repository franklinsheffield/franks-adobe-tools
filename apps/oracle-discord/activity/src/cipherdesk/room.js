// The Cipher Desk: a room of the Oracle Chamber and the Scriptorium's core loop, step 2 (decipher). Real lines hidden
// in real methods: name the method (wrong names cost ink), set the key where one is needed, and the plain text
// appears. Forgeries are the hazard: read one as genuine and Wren's seal cracks. Inscriptions open once their script
// is filed at the Inscription Tray. Content in data.js, rules in logic.js, drawing in scene.js, shelf in shop.js.
import { METHODS, LEVELS, ROUND, INK, INSCRIPTIONS, FORGERIES, methodOf } from "./data.js";
import { room as cdOf, start, current, cipherText, tryMethod, tryKey, preview, judge, tryClue, letterCount, next, rightCount, perfect, settle, maxScore,
  lineOf, forgeryOf, insOf, unlocked, insRead, meaningsOf, readIns, readCount, dailyOf, TOTAL_DOCS, WIN_AT, INS_PAY, FORGERY_BONUS } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { deskHtml, cipherHtml, inscriptionHtml, CSS } from "./scene.js";
import { script } from "../inscriptions/data.js";
import * as sfx from "./sfx.js";
import { openSplitKey } from "./splitkey-room.js";
import { host } from "../hosts/index.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("cd-style")) return; const s = document.createElement("style"); s.id = "cd-style"; s.textContent = CSS(); document.head.append(s); };
const drops = (n) => "●".repeat(Math.max(0, n)) + "○".repeat(Math.max(0, INK - n));

export const cipherdesk = {
  id: "cipherdesk", label: "Cipher Desk", emoji: "🗝️",
  blurb: "Break 100 real ciphers, inscriptions and forgeries",
  shop: { kind: "cipherdesk", label: "🗝️ Cipher Desk", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table cipherdesk";
      tableEl.innerHTML = (it.slot === "banner" ? `<div class="sk-flag" style="--tc:#e05a4f;position:absolute;top:6px;left:8px;padding:4px 10px;border-radius:2px 10px 10px 2px;color:#fff;font-weight:700;background:#e05a4f;z-index:3">🪶 Team Quill ${{ "cd-cabinet": "⚜️", "cd-hut": "🛖" }[id] || ""}</div>` : "") + deskHtml({ look: { ...DEFAULT_LOOK, [it.slot]: id }, doc: cipherHtml("caesar3", "YHQL YLGL YLFL", "VENI VIDI VICI") }); tableEl.style.position = "relative"; cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => cdOf(P());
    const draw = (s = {}) => { tableEl.className = "table cipherdesk"; tableEl.innerHTML = deskHtml({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const wren = () => host().id === "scriptorium"; // each House greets in its own voice (Frank 2026-11-27)

    // ---- lobby ----
    function lobby(first) {
      clearReading(); cap("🗝️ The Cipher Desk"); draw({ doc: `<div class="cd-claim"><b>The Cipher Desk</b>${readCount(P())} of ${TOTAL_DOCS} documents read</div>` }); sfx.unfold();
      say(first && !R().plays
        ? (wren() ? `The Cipher Desk, ${state.name}. Real letters, real codes, and a few real fakes. Name the method, set the key if it has one, and the words come back. Mind the forgeries: they crack my seal.`
          : `Welcome to the Cipher Desk, ${state.name}. ${TOTAL_DOCS} real documents: ciphers, inscriptions and famous forgeries. Name the method and the words come back.`)
        : wren() ? pick([`Post's in, ${state.name}. Some of it is even in plain English.`, "Lamp's lit. Shall we read someone's secrets?", "A new bundle of letters. Half of them pretend to be something they're not."])
        : pick([`Another bundle on the desk, ${state.name}.`, "Coded letters, waiting. Shall we?", "The desk is ready."]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "cipherdesk");
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🗝️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)}${L.forgery ? " · one forgery a round" : ""} · ${r.wins[L.n] || 0} round${(r.wins[L.n] || 0) === 1 ? "" : "s"} won</span></button>`;
      const openIns = INSCRIPTIONS.filter((x) => unlocked(P(), x)).length;
      ui(`<div class="cx-top"><b>🗝️ Cipher Desk</b> · ${readCount(P())} / ${TOTAL_DOCS} documents read</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${ROUND} documents a round, ${INK} ink drops each. A wrong method, key or clue costs a drop. Read ${WIN_AT} to win. The Caesar wheel and the letter count are free.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="cd-daily"><b>📅 Daily Bundle${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same ${ROUND} documents for everyone${ds.streak ? ` · streak ${ds.streak}` : ""}</span></button>
        <div class="choices"><button class="c main" type="button" id="cd-ins">📜 Inscriptions (${openIns} / ${INSCRIPTIONS.length} open)</button><button class="c" type="button" id="cd-split">🔀 Split Key (team race)</button><button class="c" type="button" id="cd-shop">🧰 Desk kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => begin(start(LEVELS[+b.dataset.l - 1]))));
      $("cd-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, { seed: d.seed, daily: d.day })); };
      $("cd-ins").onclick = () => insList();
      $("cd-shop").onclick = shop;
      $("cd-split").onclick = () => openSplitKey(ctx, () => lobby(false));
      $("back").onclick = greet;
    }

    // ---- a round ----
    const begin = (run) => { clearReading(); show(run); };
    const bar = (run) => { const it = current(run);
      return `<div class="cx-top">Level ${run.L.n} · document ${run.i + 1} / ${run.items.length} · ink ${drops(it.drops)} · score ${run.score}${run.daily ? " · 📅 daily" : ""}</div>`; };
    function show(run, line) {
      const it = current(run);
      if (it.kind === "forgery") return forgery(run, line);
      const ln = lineOf(it.id), text = cipherText(it);
      cap(`🗝️ Document ${run.i + 1}`); draw({ doc: cipherHtml(it.m, text, ln.plain) });
      if (!line) sfx.unfold();
      if (it.stage === "key") return keyStage(run, line);
      say(line || pick(["Which method hid this? Look at the shapes first.", "A coded letter. Name the method.", "Dots, numbers or letters? That tells you a lot."]));
      const note = it.kws ? `<div class="note">📌 A note pinned to it: <i>${it.kws.map(esc).join(" · ")}</i></div>` : "";
      ui(`${bar(run)}${note}<div id="cd-kindi"></div>
        <div class="choices col">${it.choices.map((m) => { const M = methodOf(m), bad = it.tried.includes(m);
          return `<button class="c" type="button" data-m="${m}" title="${esc(M.how)}" ${bad ? "disabled" : ""}>${bad ? "✗ " : ""}${M.e} ${esc(M.name)}</button>`; }).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="cd-count">🔢 Count the letters (al-Kindi)</button><button class="c small" type="button" id="cd-leave">Leave the desk</button></div>`);
      $("cd-count").onclick = () => { sfx.scratch(); const c = letterCount(text); $("cd-kindi").innerHTML = c.length
        ? `<div class="cd-count">${c.map(([k, n]) => `<span>${k}×${n}</span>`).join("")}</div><div class="note">In English, E, T and A are the commonest letters. If the counts look English, the letters were only moved or shifted.</div>`
        : `<div class="note">No letters to count: this one is made of ${/[01]{8}/.test(text) ? "bits" : /[•–]/.test(text) ? "signals" : "numbers or shapes"}.</div>`; };
      $("cd-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        const r = tryMethod(run, b.dataset.m);
        if (r === "wrong") { sfx.wrong(); ctx.emote?.("think", { quiet: true }); return show(run, pick(["That doesn't read. Try another.", "No, the shapes don't fit that one.", "Not that method."])); }
        if (r === "out") { sfx.wrong(); return reveal(run); }
        if (r === "key") { sfx.click(); return keyStage(run); }
        if (r === "right") { sfx.decode(); spark(); ctx.banter?.("mid"); reveal(run); }
      }));
    }
    function keyStage(run, line) {
      const it = current(run), ln = lineOf(it.id);
      if (it.m === "caesar") {
        say(line || "Right method. Now turn the wheel until words appear. Looking is free; committing a wrong shift costs ink.");
        const paint = () => { const el = $("cd-prev"); if (el) el.textContent = preview(it, it.shift); const b = $("cd-shift"); if (b) b.textContent = `shift ${it.shift}`; };
        ui(`${bar(run)}<div class="cd-wheelui"><button class="c small" type="button" id="cd-dn">◀</button><b id="cd-shift"></b><button class="c small" type="button" id="cd-up">▶</button></div>
          <div class="cd-preview" id="cd-prev"></div><div class="choices"><button class="c main" type="button" id="cd-read">✒️ That's it: read it</button><button class="c small" type="button" id="cd-leave">Leave the desk</button></div>`);
        paint();
        $("cd-dn").onclick = () => { it.shift = (it.shift + 25) % 26; sfx.click(false); paint(); };
        $("cd-up").onclick = () => { it.shift = (it.shift + 1) % 26; sfx.click(true); paint(); };
        $("cd-leave").onclick = () => lobby(false);
        $("cd-read").onclick = () => { const r = tryKey(run, it.shift); afterKey(run, r); };
        return;
      }
      say(line || "Vigenère, yes. One of the words on the pinned note is the key. Which?");
      ui(`${bar(run)}<div class="note">Each letter of the key sets a shift: A is 0, B is 1… Try one; a wrong key costs a drop.</div>
        <div class="choices col">${it.kws.map((k) => `<button class="c" type="button" data-k="${k}" ${it.tried.includes(k) ? "disabled" : ""}>${it.tried.includes(k) ? "✗ " : "🗝️ "}${esc(k)}</button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="cd-leave">Leave the desk</button></div>`);
      $("cd-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => afterKey(run, tryKey(run, b.dataset.k))));
      void ln;
    }
    function afterKey(run, r) {
      if (r === "right") { sfx.decode(); spark(); ctx.banter?.("mid"); return reveal(run); }
      sfx.wrong(); if (r === "out") return reveal(run);
      show(run, pick(["Gibberish. Not that key.", "Close, but the words don't come.", "No. Try again."]));
    }
    function forgery(run, line) {
      const it = current(run), f = forgeryOf(it.id);
      cap(`🗝️ Document ${run.i + 1}`); draw({ doc: `<div class="cd-claim"><b>${esc(f.name)}</b>${esc(f.claim)}</div>` }); if (!line) sfx.unfold();
      if (it.stage === "judge") {
        say(line || pick(["This one comes with a story. Is the story true?", "Lovely document. Suspiciously lovely.", "Read it, or question it?"]));
        ui(`${bar(run)}<div class="choices col"><button class="c" type="button" id="cd-gen">✒️ Read it as genuine</button><button class="c main" type="button" id="cd-flag">🚩 Flag it as a forgery</button></div>`);
        $("cd-gen").onclick = () => { judge(run, "genuine"); sfx.crack(); ctx.emote?.("shock", { quiet: true }); reveal(run); };
        $("cd-flag").onclick = () => { judge(run, "flagged"); sfx.scratch(); forgery(run, "Good instinct. What gives it away?"); };
        return;
      }
      say(line || "What gives it away?");
      ui(`${bar(run)}<div class="choices col">${it.clues.map((c, i) => `<button class="c" type="button" data-c="${i}" ${it.tried.includes(i) ? "disabled" : ""}>${it.tried.includes(i) ? "✗ " : "🔍 "}${esc(c)}</button>`).join("")}</div>`);
      $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
        const r = tryClue(run, +b.dataset.c);
        if (r === "right") { sfx.seal(); spark(); ctx.banter?.("mid"); return reveal(run); }
        sfx.wrong(); if (r === "out") return reveal(run);
        forgery(run, pick(["True, but that's no proof of anything.", "Genuine documents have that too.", "No, look for what couldn't be true."]));
      }));
    }
    function reveal(run) {
      const it = current(run), last = run.i >= run.items.length - 1, nextBtn = `<div class="choices"><button class="c main" type="button" id="cd-next">${last ? "🏁 Finish the round" : "🗝️ Next document"}</button></div>`;
      if (it.kind === "forgery") {
        const f = forgeryOf(it.id), cracked = !it.right && it.stage === "judge";
        draw({ doc: `<div class="cd-claim"><b>${esc(f.name)}</b>${esc(f.claim)}</div>`, state: it.right ? "forged" : cracked ? "cracked" : "" });
        if (it.right) setTimeout(() => sfx.seal(), 200);
        cap(`${f.name} · forgery`);
        say(it.right ? `Caught it. A forgery, and you named the tell. +${FORGERY_BONUS} bonus.` : cracked ? "My seal! That one was a forgery. We've all been fooled by a nice story." : "A forgery. The tell was hiding in plain sight.");
        ui(`${bar(run)}<div class="in-card"><b>🚩 ${esc(f.name)}${it.right ? " ✓" : ""}</b><p><b>The tell:</b> ${esc(f.clue)}</p><p>${esc(f.fact)}</p></div>${nextBtn}`);
      } else {
        const ln = lineOf(it.id), M = methodOf(it.m);
        draw({ doc: cipherHtml(it.m, cipherText(it), ln.plain), plain: ln.plain, state: it.right ? "solved" : "" });
        if (it.right) setTimeout(() => sfx.seal(), 300);
        cap(`${M.name}${it.key ? ` · key ${it.key}` : ""}`);
        say(it.right ? pick(["There it is.", "Words again. My favourite trick.", "Read and sealed."]) : `It was ${M.name}. The ink ran out first.`);
        ui(`${bar(run)}<div class="in-card"><b>${M.e} ${esc(M.name)}${it.right ? " ✓" : ""}${it.key ? ` · key ${esc(it.key)}` : ""}</b><p class="cd-plaintext">“${esc(ln.plain)}”</p><p>${esc(ln.fact)}</p><p class="note">${esc(M.how)}</p></div>${nextBtn}`);
      }
      $("cd-next").onclick = () => { if (next(run)) show(run); else finish(run); };
    }
    function finish(run) {
      const L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("cipherdesk", L.n, { won: r.won, perfect: r.won && perfect(run) }); // Trophy Case (trophies.js)
      sfx.finale(r.won); if (r.won) { spark(); chime(perfect(run) ? 3 : 1); }
      const n = rightCount(run), bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, `${n} / ${run.items.length} read`, `score ${run.score} / ${maxScore(L)}${r.best ? " · new best" : ""}`];
      if (perfect(run)) bits.push("✨ perfect round");
      let board = "";
      if (run.daily) { const res = { score: run.score, won: r.won, detail: `Level ${L.n} · ${n}/${run.items.length}` }, fd = finishDaily(P(), "cipherdesk", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("cd-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: run.score } }); };
        (fd.first ? postDaily(state, "cipherdesk", res) : boardOf(state, "cipherdesk")).then(fill);
        if (fd.first) bits.push(`📅 daily streak ${fd.streak}`);
        board = `<div class="group">📅 Today's board</div><div id="cd-board" class="note">Loading the board…</div>`; }
      draw({ doc: `<div class="cd-claim"><b>${r.won ? "Bundle read" : "Bundle set aside"}</b>${readCount(P())} of ${TOTAL_DOCS} documents read</div>`, state: r.won ? "solved" : "" });
      say(r.won ? pick(["Every secret back in plain words. A good afternoon's work.", "Read, sealed and filed. The Black Chamber would hire you.", "Al-Kindi would be proud. He'd also count your letters."]) : `${n} read. The rest keep their secrets, for now.`);
      const fresh = r.newRead.length ? `<div class="up">📜 New on your shelf: ${r.newRead.length} document${r.newRead.length === 1 ? "" : "s"}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${fresh}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}
        <div class="choices"><button class="c main" type="button" id="cd-again">🗝️ Another Level ${L.n} bundle</button><button class="c" type="button" id="cd-lobby">🗂 Choose a level</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("cd-again").onclick = () => begin(start(L)); $("cd-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    // ---- inscriptions, opened by the Inscription Tray ----
    function insList(line) {
      clearReading(); cap("📜 Inscriptions"); draw({ doc: `<div class="cd-claim"><b>Sign lists</b>Every script you file at the Inscription Tray opens a real inscription here.</div>` });
      say(line || "Real inscriptions. Each opens once you've filed its script at the Tray. Then the sign list gives you the sounds, and you give me the meaning.");
      ui(`<div class="cx-top">📜 ${INSCRIPTIONS.filter((x) => insRead(P(), x.id)).length} / ${INSCRIPTIONS.length} read</div><div class="choices col cd-list">${INSCRIPTIONS.map((x) => { const open = unlocked(P(), x), done = insRead(P(), x.id);
        return `<button class="c${open ? "" : " locked"}" type="button" data-i="${x.id}" ${open ? "" : "disabled"}>${done ? "✓ " : open ? "📜 " : "🔒 "}${esc(x.name)} <span class="note">${open ? esc(x.where) : `file ${esc(script(x.need).name)} at the Inscription Tray`}</span></button>`; }).join("")}</div>
        <div class="choices"><button class="c" type="button" id="cd-lobby">🗝️ Back to the desk</button></div>`);
      $("ui").querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => inscription(b.dataset.i)));
      $("cd-lobby").onclick = () => lobby(false);
    }
    function inscription(id, sounds = false, line) {
      const x = insOf(id); cap(`📜 ${x.name}`); draw({ doc: inscriptionHtml(x, sounds), label: x.where }); if (!line && !sounds) sfx.unfold();
      say(line || (sounds ? "There are the sounds. What does it say?" : `${x.name}. Apply the sign list, or try reading it straight off.`));
      ui(`<div class="choices">${sounds ? "" : `<button class="c main" type="button" id="cd-sl">📖 Apply the ${esc(script(x.need).name)} sign list</button>`}</div>
        <div class="choices col">${meaningsOf(x).map((m) => `<button class="c" type="button" data-x="${esc(m)}">${esc(m)}</button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="cd-il">📜 All inscriptions</button></div>`);
      if ($("cd-sl")) $("cd-sl").onclick = () => { sfx.scratch(); inscription(id, true); };
      $("cd-il").onclick = () => insList();
      $("ui").querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => {
        const r = readIns(P(), id, b.dataset.x);
        if (!r.ok) { sfx.wrong(); b.disabled = true; return say("Not quite. Look at the sounds again."); }
        sfx.decode(4); spark(); setTimeout(() => sfx.seal(), 250);
        if (r.pay) { award(r.pay.xp, r.pay.essence); saveProgress(); showStats(); }
        draw({ doc: inscriptionHtml(x, true), plain: x.meaning, label: x.where, state: "solved" });
        say(`“${x.meaning}.” ${r.pay ? `+${r.pay.essence} 💎 for a new inscription.` : "Read before, and still lovely."}`);
        ui(`<div class="in-card"><b>📜 ${esc(x.name)} ✓</b><p>${esc(x.fact)}</p></div><div class="choices"><button class="c main" type="button" id="cd-il">📜 All inscriptions</button><button class="c" type="button" id="cd-lobby">🗝️ Back to the desk</button></div>`);
        $("cd-il").onclick = () => insList(); $("cd-lobby").onclick = () => lobby(false);
      }));
    }

    // ---- the desk kit shelf ----
    function shop(msg) {
      clearReading(); cap("🧰 Desk kit"); const look = lookOf(P()); draw({ doc: cipherHtml("caesar3", "YHQL YLGL YLFL", "VENI VIDI VICI") });
      say(typeof msg === "string" ? msg : `Lamps, cipher tools and desks, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><br><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="cd-lobby">🗝️ Back to the desk</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A few bundles will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.click(); shop(r === "bought" ? "Good kit. It's on your desk." : "Swapped in."); } }));
      $("cd-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** Codex page: documents read, by kind. */
export function cipherdeskCodex(p, esc) {
  const r = cdOf(p), lines = r.read.filter((k) => !k.startsWith("f:")).length, forg = r.read.filter((k) => k.startsWith("f:")).map((k) => k.slice(2));
  return `<div class="note">🗝️ Cipher Desk: ${readCount(p)} / ${TOTAL_DOCS} documents read · ${lines} ciphers · ${forg.length} / ${FORGERIES.length} forgeries caught · ${r.ins.length} / ${INSCRIPTIONS.length} inscriptions</div>
    ${forg.length ? `<div class="chips">${forg.map((id) => `<span>🚩 ${esc(forgeryOf(id).name)}</span>`).join("")}</div>` : ""}
    ${r.ins.length ? `<div class="chips">${r.ins.map((id) => `<span>📜 ${esc(insOf(id).name)}</span>`).join("")}</div>` : ""}
    <div class="note">Methods: ${METHODS.map((m) => m.e + " " + esc(m.name)).join(" · ")}</div>`;
}
