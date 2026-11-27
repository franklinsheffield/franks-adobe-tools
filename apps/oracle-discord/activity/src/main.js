// The Oracle Chamber (Discord Activity): pick a system, give the Oracle your details, and she reveals the reading.
// Readings run here in the browser with the same modules the /oracle bot uses (src/modules), so results match.
import { figureSvg, sigilRingSvg } from "../../src/oracle/figure.js";
import { makeTable, fitSvg, setTableDecor } from "./table.js";
import { unlockVoice, blip, isMuted, setMuted } from "./voice-sfx.js";
import { available, systemByKey, optionsFor } from "../../src/oracle/systems.js";
import { greeting, askLine, speech } from "../../src/oracle/voice.js";
import { fieldsFor } from "../../src/profiles.js";
import { MODULES } from "../../src/registry.js";
import { MODS } from "./modules.gen.js";
import { startDiscord, inDiscord, api } from "./discord.js";
import { CODEX, UNLOCKS, RANKS, rankOf, nextRank, fresh, record, liveStreak, merge, loadLocal, saveLocal } from "./game.js";
import { chime, trance, deepen } from "./voice-sfx.js";
import { answer, quip, deeperPages } from "./answer.js";
import { STORE, KINDS, SHOP_TALK, ensureFree, item, buy, readsLeft, useRead, buyDayPass, DAY_PASS, DAILY, dailyLimit } from "./store.js";
import { setVoiceStyle, sampleVoice, checkout } from "./voice-sfx.js";
import { seance, codexHtml as seanceCodex } from "./seance/room.js";
import { room as decoder, decoderCodex } from "./decoder/room.js";
import { robeFx, AVATAR_LOOK, STAR_PUPIL, CLOTH_DESIGN } from "./looks.js";

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const PREVIEW = window.ORACLE_PREVIEW || null; // set only by the standalone preview page (build-preview.mjs)
const state = { name: "traveller", userId: "guest", token: null, profile: PREVIEW ? PREVIEW.profile : null, last: null, prog: fresh() };

// ---- the Oracle and her sky ----
$("teller").innerHTML = `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${sigilRingSvg({ cx: 200, cy: 200, r: 196, id: "t" })}${figureSvg({ id: "t" })}</svg>`;
const table = makeTable($("table"), { reduced });
// Layers the Essence store draws into: elemental effects behind, on and in front of the Oracle; avatar extras
// behind the hood, on the hood, on the face and in front; and a slot in the iris for a star-shaped pupil.
(() => {
  const svg = $("teller").querySelector("svg"), body = svg.querySelector(".o-body"), NS = "http://www.w3.org/2000/svg";
  const g = (id, attrs = {}) => { const e = document.createElementNS(NS, "g"); e.id = id; for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = `<clipPath id="t-hoodclip"><path d="M200 14 C214 60 252 150 290 236 C316 296 340 348 368 400 L32 400 C60 348 84 296 110 236 C148 150 186 60 200 14Z"/></clipPath>
    <pattern id="t-nemes" width="400" height="22" patternUnits="userSpaceOnUse"><rect width="400" height="11" fill="#E2B04A"/><rect y="11" width="400" height="11" fill="#1d3a8e"/></pattern>
    <linearGradient id="fx-firegrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ff3b1a" stop-opacity="0"/></linearGradient>
    <linearGradient id="fx-flamegrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a1a"/><stop offset=".55" stop-color="#ffa63d"/><stop offset="1" stop-color="#fff3b0" stop-opacity=".9"/></linearGradient>`;
  svg.prepend(defs);
  body.before(g("fx-back"));
  body.prepend(g("av-back")); body.children[2].after(g("av-hood")); $("av-hood").after(g("fx-robe", { "clip-path": "url(#t-hoodclip)" }));
  svg.querySelector('[clip-path="url(#t-faceclip)"]').append(g("av-face")); body.append(g("av-front"));
  svg.querySelector(".o-iris").append(g("av-pupil"));
  svg.append(g("fx-front"));
  // Remember which parts of the hands are skin, edge and nail, so avatars can recolour them.
  svg.querySelectorAll('.o-hands [fill="#3a2a5c"]').forEach((e) => (e.dataset.skin = "fill"));
  svg.querySelectorAll('.o-hands [stroke="#3a2a5c"]').forEach((e) => (e.dataset.skin = "stroke"));
  svg.querySelectorAll('.o-hands [stroke="#E2B04A"]').forEach((e) => (e.dataset.edge = "1"));
  svg.querySelectorAll(".o-hands .o-nail").forEach((e) => (e.dataset.r = e.getAttribute("r")));
})();
const CAST = {
  tarot: "I shuffle the deck… cut… and deal…",
  iching: "Six coins leave my hand… spinning… falling…", runes: "I loosen the pouch. Let the stones choose themselves…",
  oraclebones: "The bronze rod is hot. Listen… the shell answers with a crack…", ifa: "The chain falls. Eight seeds, open or closed…",
  astrology: "I turn the heavens back to the hour you arrived…", humandesign: "Your centres are lighting, one by one…",
  numerology: "Your numbers gather, and reduce, and reveal…", chinesezodiac: "The great wheel of twelve is turning…",
  mayan: "Thirteen and twenty, the sacred gears, interlock…", egyptian: "Ra rises over the pyramids for you…", celtic: "Your tree is growing out of the old calendar…",
};
let starColors = ["#FADE8C", "#66E0C8"];
const cv = $("stars"), cx = cv.getContext("2d"); let stars = [];
function sizeSky() { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
  stars = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 })); }
function drawSky(t) { cx.clearRect(0, 0, cv.width, cv.height);
  for (const s of stars) { cx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + s.p); cx.fillStyle = s.p > 5 ? starColors[1] : starColors[0]; cx.beginPath(); cx.arc(s.x * cv.width, s.y * cv.height, s.r * devicePixelRatio, 0, 7); cx.fill(); }
  if (!reduced) requestAnimationFrame(drawSky); }
sizeSky(); addEventListener("resize", sizeSky); requestAnimationFrame(drawSky);

// The Oracle talks: letters appear at speaking pace (pausing on punctuation), each few letters a retro blip,
// and the creature's eye and face pulse while it speaks.
let typing = null;
const PAUSE = { ",": 160, ";": 200, ":": 200, ".": 320, "…": 380, "?": 340, "!": 320, "—": 220 };
function say(text, done) {
  clearTimeout(typing); const el = $("say"), box = $("box"), teller = $("teller");
  const plain = text.replace(/\*\*/g, ""); $("sr").textContent = plain;
  const stop = () => { box.classList.remove("typing"); document.body.classList.remove("talking"); teller.classList.remove("syl"); };
  if (reduced) { el.textContent = plain; stop(); done && done(); return; }
  let i = 0, n = 0; el.textContent = ""; box.classList.add("typing"); document.body.classList.add("talking");
  const step = () => {
    const ch = plain[i++]; el.textContent = plain.slice(0, i);
    if (/[\p{L}\p{N}]/u.test(ch)) { if (n++ % 2 === 0) { blip(ch); teller.classList.toggle("syl"); } }
    if (i >= plain.length) { blip("o", { final: true }); stop(); done && done(); return; }
    typing = setTimeout(step, PAUSE[ch] || (ch === " " ? 34 : 26));
  };
  step();
}
const heard = () => (state.prog.heard ||= []);
const ui = (html) => { $("ui").innerHTML = html; };
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
function poof() { const p = $("poof"); p.innerHTML = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.28; return `<i style="--x:${Math.cos(a) * 110}px;--y:${Math.sin(a) * 70}px"></i>`; }).join("");
  p.classList.remove("go"); void p.offsetWidth; p.classList.add("go"); }

// ---- the conversation ----
const cap = (t) => { $("table-cap").textContent = t || ""; };
const clearReading = () => { $("reading-body").innerHTML = ""; $("box").scrollTop = 0; };
function greet() {
  clearReading(); table.idle(); cap("");
  const sys = available(MODULES), btn = (s) => `<button class="c" type="button" data-k="${s.key}">${s.emoji} ${esc(s.label)}</button>`;
  const st = liveStreak(state.prog), rk = rankOf(state.prog.xp).name;
  say(greeting(state.name) + (state.prog.readings ? ` Welcome back, ${rk}.` + (st > 1 ? ` ${st} days in a row now… the stars notice.` : "") : ""));
  showStats();
  ui(`<div class="choices"><div class="group">By question</div>${sys.filter((s) => s.kind === "cast").map(btn).join("")}
    <div class="group">By birth</div>${sys.filter((s) => s.kind === "birth").map(btn).join("")}
    <div class="group">Investigate &amp; learn</div>${ROOMS.map((r) => `<button class="c room" type="button" data-room="${r.id}" title="${esc(r.blurb || "")}">${r.emoji} ${esc(r.label)}</button>`).join("")}</div>`);
  $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => choose(systemByKey(b.dataset.k))));
  $("ui").querySelectorAll("[data-room]").forEach((b) => (b.onclick = () => openRoom(b.dataset.room)));
}

// ---- rooms: games inside the Chamber (src/<room>/). Each exports { id, label, emoji, blurb, open(ctx), codexHtml? }
// and keeps its progress in state.prog.rooms[id] (with a plays counter, so merge() counts it). ----
const ROOMS = [{ ...seance, codexHtml: seanceCodex }, { ...decoder, codexHtml: decoderCodex }];
/** Add ✦ and 💎 from a room, keeping ranks in step. Returns { rankUp } (the new rank's name or null). */
function award(xp = 0, essence = 0) {
  const p = state.prog, before = rankOf(p.xp).name;
  p.xp += xp; p.essence = (p.essence || 0) + essence;
  const after = rankOf(p.xp).name, rankUp = after !== before ? after : null;
  if (rankUp) p.essence += 25;
  return { rankUp };
}
function openRoom(id) {
  const r = ROOMS.find((x) => x.id === id); if (!r) return greet();
  r.open({ $, esc, say, ui, talkThrough, cap, clearReading, table, tableEl: $("table"), state, saveProgress, showStats, chime, applyLook, greet, wait, reduced, award });
}

function choose(sys) {
  if (readsLeft(state.prog, rankOf(state.prog.xp).name) <= 0) return outOfReadings(sys);
  clearReading(); table.rest(sys.key); cap(sys.emoji + " " + sys.label);
  say(askLine(sys, state.name));
  if (sys.kind === "cast") {
    const spreadSel = sys.spreads ? `<label for="sp">Spread<select id="sp">${sys.spreads.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></label>` : "";
    ui(`<form class="form one" id="f"><label for="q">Your question (optional)<input id="q" maxlength="200" autocomplete="off" placeholder="What do I need to know about…"></label>${spreadSel}</form>
      <div class="choices"><button class="c main" type="submit" form="f">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("f").onsubmit = (e) => { e.preventDefault(); const q = $("q").value.trim(), extra = q ? { [sys.ask || "question"]: q } : {};
      if ($("sp")) extra.spread = $("sp").value;
      reveal(sys, optionsFor(sys, extra), q); };
    setTimeout(() => $("q").focus(), 50);
  } else {
    const p = state.profile || {}, o0 = optionsFor(sys), f = fieldsFor(sys.command, o0), need = f.need || ["date", "place", "time"];
    const field = (id, label, ph, val, req) => `<label for="${id}">${label}<input id="${id}" ${req ? "required" : ""} placeholder="${ph}" value="${esc(val)}" autocomplete="off"></label>`;
    const rows = [field("d", "Birth date", "1990-04-09", p.date, true)];
    if (need.includes("time")) rows.push(field("t", "Time (blank if unknown)", "14:30", p.time && p.time !== "unknown" ? p.time : "", false));
    if (need.includes("place")) rows.push(field("p", "Town or city, country", "Phoenix, USA", p.place, true));
    if (need.includes("name")) rows.push(field("n", "Full birth name", "Mary Ann Smith", p.name, true));
    rows.push(field("bq", "Your question (optional)", "What should I focus on this year?", "", false));
    ui(`<form class="form" id="f">${rows.join("")}</form>
      <div class="choices"><button class="c main" type="submit" form="f">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>
      <div class="note">${PREVIEW ? PREVIEW.note + " " : state.profile ? "Filled in from your saved /profile. " : ""}Your details stay in this reading; nothing is posted to the channel.</div>`);
    $("f").onsubmit = (e) => { e.preventDefault();
      const o = optionsFor(sys), v = (id) => ($(id) ? $(id).value.trim() : "");
      o[f.date] = v("d");
      if (need.includes("place")) o[f.place] = v("p");
      if (need.includes("name")) o[f.name] = v("n");
      if (need.includes("time")) { if (v("t")) o[f.time] = v("t"); else o.time_unknown = true; }
      reveal(sys, o, v("bq")); };
  }
  $("back").onclick = greet;
}

async function reveal(sys, options, question = "") {
  if (readsLeft(state.prog, rankOf(state.prog.xp).name) <= 0) return outOfReadings(sys);
  ui(""); clearReading(); state.q = question;
  // The trance: the Oracle closes her eye and raises her hands for 3 seconds, humming, while the table casts.
  document.body.classList.add("trance"); cap(sys.emoji + " " + (CAST[sys.key] || "The mist is moving…"));
  clearTimeout(typing); $("say").textContent = "…"; $("sr").textContent = "The Oracle closes her eye and raises her hands.";
  trance(3);
  let r, err;
  try {
    const mod = MODS[sys.command];
    [r] = await Promise.all([mod.run(options, { user: state.name }), table.cast(sys.key, options), wait(sys.key === "tarot" && options.spread === "celtic" ? 3600 : 3000)]);
  } catch (e) { err = e; }
  document.body.classList.remove("trance"); cap(sys.emoji + " " + sys.label);
  if (err) {
    table.rest(sys.key);
    say("The glass clouds over. " + (err.message || "Something went wrong."));
    ui(`<div class="choices"><button class="c main" type="button" id="again">Try again</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("again").onclick = () => choose(sys); $("back").onclick = greet; return;
  }
  $("table").classList.add("fade"); await wait(450);
  poof(); await wait(250);
  const files = (r.files || []).map(svgOf).filter(Boolean);
  layArt(files);
  const words = speech(sys.command, state.name, r.embeds[0], Math.random, r.headline);
  const text = r.embeds.map((e) => [e.description, ...(e.fields || []).map((f) => f.name + ": " + f.value)].join(" ")).join(" ");
  state.last = { sys, r, words, files, text, deeper: deeperPages(r, question), di: 0, quips: 0 };
  useRead(state.prog); const gain = record(state.prog, sys.key, r); saveProgress(); showStats();
  const a = answer(question, text, state.name);
  const pages = [words, a.line, quip(sys.key, state.name, heard())];
  talkThrough(pages, () => { afterReading(); reward(gain, sys); });
}

/** Out of Chamber readings for today: say so with style, and offer a day pass, the store, or the chat commands. */
function outOfReadings(sys) {
  const p = state.prog, rk = rankOf(p.xp).name, nx = nextRank(p.xp), lim = dailyLimit(rk);
  table.rest(sys.key);
  say(`The glass is resting, ${state.name}. A ${rk} gets ${lim} reading${lim === 1 ? "" : "s"} a day in the Chamber. Union rules for crystal balls. ${nx ? `Reach ${nx.name} for more.` : ""} A day pass buys one more, or ask me with /oracle in chat, where the line never closes.`);
  ui(`<div class="choices"><button class="c main" type="button" id="pass" ${p.essence >= DAY_PASS ? "" : "disabled"}>🎟️ Day pass: +1 reading (💎 ${DAY_PASS}, you have ${p.essence})</button><button class="c" type="button" id="shop">💎 Store</button><button class="c" type="button" id="back">✦ Back</button></div>`);
  $("pass").onclick = () => { if (buyDayPass(p)) { saveProgress(); chime(1); showStats(); choose(sys); } };
  $("shop").onclick = () => showStore(); $("back").onclick = greet;
}

/** The menu once the Oracle has answered: go deeper, ask another question, save, or start again. */
function afterReading() {
  const L = state.last, more = L.di < L.deeper.length;
  ui(`<div class="choices"><button class="c main" type="button" id="deeper" ${more ? "" : "disabled"}>🔮 ${more ? "Go deeper" : "That's the bottom of the well"}</button><button class="c" type="button" id="askq">❓ Ask another question</button><button class="c" type="button" id="save">📖 Save to journal</button><button class="c" type="button" id="back">✦ Another reading</button>${L.files.length ? `<button class="c" type="button" id="big">🔍 Enlarge the art</button>` : ""}</div>
    <details class="written"><summary>📜 The full written reading</summary><div id="written"></div></details>`);
  $("deeper").onclick = goDeeper;
  $("askq").onclick = askAgain;
  $("save").onclick = (e) => { saveJournal(L); e.target.textContent = "✓ Saved"; e.target.disabled = true; };
  $("back").onclick = greet;
  if ($("big")) $("big").onclick = () => zoom(L.files[0]);
  showReading(L, $("written"));
}

/** Go deeper: the Oracle keeps talking about the same reading, two parts at a time, with the odd aside. */
function goDeeper() {
  const L = state.last; deepen();
  const pages = L.deeper.slice(L.di, L.di + 2); L.di += pages.length;
  if (state.q && L.di <= 2) pages.push(`Hold your question close: “${state.q}”. This is the part that touches it.`);
  if (L.di >= L.deeper.length) pages.push(`That's everything the glass will show me, ${state.name}. Any more and I'd be making it up, and I have standards.`);
  else pages.push(quip(L.sys.key, state.name, heard()));
  talkThrough(pages, afterReading);
}

/** Ask another question: cast systems cast again; birth systems answer from the same chart. */
function askAgain() {
  const L = state.last;
  ui(`<form class="form one" id="qf"><label for="q2">What else would you like to know?<input id="q2" maxlength="200" autocomplete="off" placeholder="Should I…, When will…, What do I need to…"></label></form>
    <div class="choices"><button class="c main" type="submit" form="qf">✦ Ask</button><button class="c" type="button" id="cancel">Never mind</button></div>`);
  setTimeout(() => $("q2").focus(), 50);
  $("cancel").onclick = afterReading;
  $("qf").onsubmit = (e) => { e.preventDefault(); const q = $("q2").value.trim(); if (!q) return;
    if (L.sys.kind === "cast") { reveal(L.sys, optionsFor(L.sys, { [L.sys.ask || "question"]: q }), q); return; }
    clearTimeout(typing); state.q = q; document.body.classList.add("trance"); trance(2); $("say").textContent = "…"; ui("");
    setTimeout(() => { document.body.classList.remove("trance");
      talkThrough([answer(q, L.text, state.name).line, quip(L.sys.key, state.name, heard())], afterReading); }, reduced ? 0 : 2000);
  };
}

let talkKey = null;
function talkThrough(pages, done) {
  let i = 0;
  const next = () => {
    if (i >= pages.length) { removeEventListener("keydown", talkKey); talkKey = null; done(); return; }
    const page = pages[i++], last = i >= pages.length;
    ui(`<div class="talkbar"><button class="c small" type="button" id="skip">Skip ⏭</button></div>`);
    $("skip").onclick = () => { clearTimeout(typing); i = pages.length; next(); };
    say(page, () => {
      ui(`<div class="talkbar"><button class="c main" type="button" id="more">${last ? "✦ Done" : "▸ Continue"}</button><span class="note">or press Space</span><button class="c small" type="button" id="skip">Skip ⏭</button></div>`);
      $("more").onclick = next; $("skip").onclick = () => { i = pages.length; next(); };
    });
  };
  if (talkKey) removeEventListener("keydown", talkKey);
  talkKey = (e) => { if ((e.key === " " || e.key === "Enter") && $("more") && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) { e.preventDefault(); $("more").click(); } };
  addEventListener("keydown", talkKey);
  next();
}

// ---- the game layer: rewards, stats, Codex and wardrobe ----
function reward(g, sys) {
  const bits = [`<b>+${g.xp} ✦ · +${g.essence} 💎</b>`];
  if (g.firstSystem) bits.push(`first ${esc(sys.label)} reading`);
  if (g.newItems.length) bits.push(`new in your Codex: ${g.newItems.map(esc).join(", ")}`);
  if (g.firstToday) bits.push(`🌙 moon token · 🔥 ${g.streak}-day streak`);
  const el = document.createElement("div"); el.className = "reward";
  el.innerHTML = `<div>${bits.join(" · ")}</div>` + (g.rankUp ? `<div class="up">🏅 You are now <b>${esc(g.rankUp)}</b></div>` : "") +
    g.unlocked.map((u) => `<div class="up">✨ Unlocked ${u.kind === "cloth" ? "table cloth" : "crystal ball"}: <b>${esc(u.name)}</b> <button class="c small" type="button" data-wear="${u.id}">Use it</button></div>`).join("");
  $("ui").appendChild(el);
  el.querySelectorAll("[data-wear]").forEach((b) => (b.onclick = () => { wear(b.dataset.wear); b.textContent = "✓ On"; b.disabled = true; }));
  if (g.rankUp || g.unlocked.length || g.newItems.length) { chime(g.rankUp || g.unlocked.length ? 2 : 1); $("table-pane").classList.remove("sparkle"); void $("table-pane").offsetWidth; $("table-pane").classList.add("sparkle"); }
}

function showStats() {
  const p = state.prog, rk = rankOf(p.xp), nx = nextRank(p.xp);
  const pct = nx ? Math.round(((p.xp - rk.at) / (nx.at - rk.at)) * 100) : 100;
  $("stats").innerHTML = `<span class="rank" title="${nx ? `${nx.at - p.xp} ✦ to ${esc(nx.name)}` : "The highest rank"}">🏅 ${esc(rk.name)} <i style="--p:${pct}%"></i></span><span title="Day streak">🔥 ${liveStreak(p)}</span><span title="Moon tokens">🌙 ${p.tokens}</span><span title="Essence">💎 ${p.essence || 0}</span><span title="Chamber readings left today">🔮 ${(() => { const l = readsLeft(p, rk.name); return l === Infinity ? "∞" : l + " left"; })()}</span>`;
}

const EARNED_DESIGN = { velvet: "", starchart: "constellations", goldleaf: "filigree", moonlit: "moonphases", obsidian: "obsidian" };
const EARNED_INK = { starchart: "#c9d4ff", goldleaf: "#FFF3C4", moonlit: "#e9f0ff", obsidian: "#b06cff" };
const owns = (id) => state.prog.unlocked.includes(id) || (state.prog.owned || []).includes(id);
const lookItem = (id) => UNLOCKS.find((x) => x.id === id) || item(id);
function wear(id) {
  const u = lookItem(id); if (!u || !owns(id)) return;
  state.prog[u.kind] = id; saveProgress(); applyLook();
}
function applyLook(over = {}) {
  const p = { ...state.prog, ...over }, svg = $("teller").querySelector("svg"), root = document.documentElement;
  const c = lookItem(p.cloth) || UNLOCKS[0], o = lookItem(p.orb), fl = item(p.flame) || item("goldflame"), out = item(p.outfit) || item("midnight"), av = item(p.avatar) || item("classic");
  const vibe = item(p.vibe) || item("chamber"), A = AVATAR_LOOK[av.id] || AVATAR_LOOK.classic;
  // table: cloth colours and design, candles
  const t = $("table"); c.c.forEach((v, i) => t.style.setProperty(`--cloth${i + 1}`, v));
  const design = c.design || EARNED_DESIGN[c.id] || "", ink = c.ink || EARNED_INK[c.id] || "#E2B04A";
  setTableDecor({ design: design && CLOTH_DESIGN[design] ? CLOTH_DESIGN[design](ink) : "", ink, wax: fl.wax, flame: fl.flame, halo: fl.halo, detail: fl.detail || "" });
  table.refresh();
  root.style.setProperty("--orb-filter", o ? o.f : "none");
  // robe: colours, trim and its element
  const stops = (id, cols) => svg.querySelectorAll(`#${id} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  stops("t-hood", out.hood);
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (e.closest(".o-hands")) return; e.dataset.trim = "1"; e.setAttribute("stroke", out.trim); });
  const fx = robeFx(out.element); $("fx-back").innerHTML = fx.back; $("fx-robe").innerHTML = fx.robe; $("fx-front").innerHTML = fx.front;
  // avatar: face, eye, pupil, hands and extras
  stops("t-face", A.face); stops("t-iris", A.iris);
  const lid = svg.querySelector(".o-lid path"); lid.setAttribute("fill", A.white);
  const pupil = svg.querySelector(".o-iris ellipse"); pupil.setAttribute("rx", A.pupil[0]); pupil.setAttribute("ry", A.pupil[1]);
  $("av-pupil").innerHTML = A.star ? STAR_PUPIL : "";
  svg.querySelectorAll("[data-skin]").forEach((e) => e.setAttribute(e.dataset.skin, A.hands.skin));
  svg.querySelectorAll(".o-hands [data-edge]").forEach((e) => e.setAttribute("stroke", A.hands.edge));
  svg.querySelectorAll(".o-hands .o-nail").forEach((e) => { e.setAttribute("fill", A.hands.nail); e.setAttribute("r", (e.dataset.r * A.hands.nailR).toFixed(1)); });
  $("teller").dataset.hands = A.handFx || ""; $("teller").dataset.element = out.element || "";
  $("av-back").innerHTML = av.back || ""; $("av-hood").innerHTML = av.hood || ""; $("av-face").innerHTML = av.face2 || ""; $("av-front").innerHTML = (av.front || "") + (A.eye || "");
  // vibe: theme, fonts, background, star colours
  root.dataset.vibe = vibe.id; starColors = vibe.stars || starColors;
  const v = item(p.voice); setVoiceStyle(v ? v.v : null);
}

// ---- the Essence store ----
let trying = null; // a store item being tried on: { kind, id }
const pickLine = (pool, vars) => { const opts = pool.filter((l) => l !== pickLine.last); const l = opts[Math.floor(Math.random() * opts.length)] || pool[0]; pickLine.last = l; return l.replace(/\{item\}/g, vars.item || "").replace(/\{name\}/g, state.name); };
function showStore(tab = "outfit", line = null) {
  clearReading(); cap(trying ? "👁 Trying on: " + (lookItem(trying.id)?.name || "") : "💎 The Essence store"); table.idle();
  const p = state.prog;
  say(line || (p.essence ? `Ah, a customer. You have ${p.essence} Essence, ${state.name}. Everything here is cosmetic. Destiny is not for sale. Lip gloss for the crystal ball, however…` : "Essence comes from readings, traveller. Every ✦ you earn is a drop of 💎 Essence. Come back with a full pocket."));
  const tabs = KINDS.map(([k, label]) => `<button class="c small${k === tab ? " on" : ""}" type="button" data-tab="${k}">${label}</button>`).join("");
  const goods = [...(tab === "cloth" || tab === "orb" ? UNLOCKS.filter((u) => u.kind === tab).map((u) => ({ ...u, earned: true })) : []), ...STORE.filter((s) => s.kind === tab)];
  const rows = goods.map((it) => { const own = owns(it.id), on = p[tab] === it.id;
    const act = on ? `<button class="c small" type="button" disabled>✓ ${tab === "voice" || tab === "vibe" ? "Active" : "Wearing"}</button>`
      : own ? `<button class="c small" type="button" data-w="${it.id}">Use</button>`
      : it.earned ? `<span class="note">🔒 ${esc(it.how)}</span>`
      : `<button class="c small main" type="button" data-buy="${it.id}" ${p.essence >= it.price ? "" : "disabled"}>💎 ${it.price}</button>`;
    const tri = trying && trying.id === it.id;
    const tryBtn = tab === "voice" ? `<button class="c small" type="button" data-hear="${it.id}">▶ Hear</button>` : on ? "" : `<button class="c small${tri ? " on" : ""}" type="button" data-try="${it.id}">${tri ? "✓ Trying on" : "👁 Try on"}</button>`;
    return `<div class="shop-row${on ? " on" : ""}"><span>${esc(it.name)}${it.note ? `<span class="note"> · ${esc(it.note)}</span>` : ""}</span>${tryBtn}${act}</div>`; }).join("");
  const left = readsLeft(p, rankOf(p.xp).name);
  ui(`<div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
    <div class="cx-top"><b>💎 ${p.essence} Essence</b> · readings left today: ${left === Infinity ? "unlimited" : left}
      ${left === Infinity ? "" : `<button class="c small" type="button" id="pass" ${p.essence >= DAY_PASS ? "" : "disabled"}>🎟️ Day pass: +1 reading today (💎 ${DAY_PASS})</button>`}</div>
    <div class="note">Daily readings by rank: ${DAILY.filter((d, i) => i < 4).map((d) => `${d.rank} ${d.n === Infinity ? "unlimited" : d.n}`).join(" · ")}. The /oracle commands in chat are always unlimited.</div>
    <div class="choices tabs">${tabs}</div><div class="shop">${rows}</div>`);
  const talk = (kind, act, it) => pickLine(SHOP_TALK[kind][act], { item: it ? it.name : "" });
  $("back").onclick = () => { trying = null; applyLook(); greet(); };
  applyLook(trying ? { [trying.kind]: trying.id } : {});
  $("ui").querySelectorAll("[data-try]").forEach((b) => (b.onclick = () => { const it = lookItem(b.dataset.try);
    const off = trying && trying.id === it.id; trying = off ? null : { kind: it.kind, id: it.id }; showStore(tab, off ? talk(tab, "open") : talk(tab, "tryon", it)); }));
  if ($("pass")) $("pass").onclick = () => { if (buyDayPass(p)) { saveProgress(); checkout(); showStats(); showStore(tab, "One more reading, coming right up. The glass thanks you for your patronage."); } };
  $("ui").querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { trying = null; showStore(b.dataset.tab, talk(b.dataset.tab, "open")); }));
  $("ui").querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { trying = null; wear(b.dataset.w); showStore(tab, talk(tab, "tryon", lookItem(b.dataset.w))); }));
  $("ui").querySelectorAll("[data-hear]").forEach((b) => (b.onclick = () => { const cur = item(p.voice); setVoiceStyle(item(b.dataset.hear).v); say(talk("voice", "tryon", item(b.dataset.hear)), () => setVoiceStyle(cur ? cur.v : null)); }));
  $("ui").querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.buy); if (buy(p, it.id)) { trying = null; checkout(); wear(it.id); saveProgress(); showStats(); burst(); showStore(tab, talk(tab, "buy", it)); } }));
  if (PREVIEW) { const t = document.createElement("div"); t.className = "note"; t.innerHTML = `Preview only: <button class="c small" type="button" id="tester">🧪 +500 💎 and reset today's readings</button>`; $("ui").appendChild(t);
    $("tester").onclick = () => { p.essence += 500; p.day = null; saveProgress(); showStats(); showStore(tab); }; }
}
function burst() { const tp = $("table-pane"); tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); }
$("store-btn").onclick = () => showStore();

function showCodex() {
  clearReading(); cap("📜 Codex"); table.idle();
  const p = state.prog, rk = rankOf(p.xp), nx = nextRank(p.xp);
  say(p.readings ? `Your Codex, ${state.name}. Everything the Chamber has shown you, kept.` : "Your Codex is empty. Every reading writes into it.");
  const sys = available(MODULES);
  const rows = sys.map((s) => { const d = CODEX[s.key], have = (p.codex[s.key] || []), n = have.length, t = d ? d.total : 0;
    return `<div class="cx"><div class="cx-h"><span>${s.emoji} ${esc(s.label)}</span><span class="note">${n} / ${t} ${d ? esc(d.label) : ""}</span></div>
      <div class="bar"><i style="width:${t ? Math.min(100, (n / t) * 100) : 0}%"></i></div>${n ? `<div class="chips">${have.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
  const look = (kind) => UNLOCKS.filter((u) => u.kind === kind).map((u) => { const own = p.unlocked.includes(u.id), on = p[kind] === u.id;
    return `<button class="c wear${on ? " on" : ""}" type="button" data-w="${u.id}" ${own ? "" : "disabled"} title="${esc(u.how)}">${own ? (on ? "✓ " : "") : "🔒 "}${esc(u.name)}<span class="note"> · ${esc(u.how)}</span></button>`; }).join("");
  ui(`<div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
    <div class="cx-top"><b>🏅 ${esc(rk.name)}</b> · ${p.xp} ✦${nx ? ` · ${nx.at - p.xp} ✦ to ${esc(nx.name)}` : ""} · 🔥 ${liveStreak(p)} days (best ${p.best}) · 🌙 ${p.tokens} · ${p.readings} readings</div>
    <div class="group">Ranks</div><div class="note">${RANKS.map((r) => `${r.name} ${r.at}✦`).join(" → ")}</div>
    <div class="group">Collection</div>${rows}${ROOMS.filter((r) => r.codexHtml).map((r) => r.codexHtml(p, esc)).join("")}
    <div class="group">Table cloth</div><div class="choices">${look("cloth")}</div>
    <div class="group">Crystal ball</div><div class="choices">${look("orb")}</div>`);
  $("back").onclick = greet;
  $("ui").querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { wear(b.dataset.w); showCodex(); }));
}
$("codex-btn").onclick = showCodex;

// Progress: this device always; the member's Discord account too when signed in (newest by reading count wins).
let pushT = null;
function saveProgress() {
  saveLocal(state.userId, state.prog);
  if (!state.token) return;
  clearTimeout(pushT);
  pushT = setTimeout(() => fetch(api("/api/progress"), { method: "PUT", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify(state.prog) }).catch(() => {}), 400);
}
async function loadProgress() {
  let p = loadLocal(state.userId);
  if (state.token) {
    const j = await fetch(api("/api/progress"), { headers: { authorization: "Bearer " + state.token } }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (j && j.progress && j.progress.v === 1) p = merge(p, { ...fresh(), ...j.progress });
  }
  state.prog = p || fresh(); ensureFree(state.prog); applyLook(); showStats();
}

function layArt(files) {
  const card = table.reveal(files.map(fitSvg));
  if (card) card.onclick = () => zoom(files[0]);
}
function zoom(svg) { $("zoom-art").innerHTML = fitSvg(svg); $("zoom").hidden = false; $("zoom-close").focus(); }
$("zoom-close").onclick = () => { $("zoom").hidden = true; $("zoom-art").innerHTML = ""; };
$("zoom").onclick = (e) => { if (e.target === $("zoom")) $("zoom-close").click(); };

// ---- the reading scroll ----
function md(s) {
  return esc(s).split("\n").map((l) => (l.startsWith("&gt; ") ? `<blockquote>${l.slice(5)}</blockquote>` : l)).join("<br>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<u>$1</u>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/<br><blockquote>/g, "<blockquote>").replace(/<\/blockquote><br>/g, "</blockquote>");
}
const svgOf = (f) => { const t = f.svg || (f.data ? new TextDecoder().decode(f.data) : ""); return /^\s*(<\?xml|<svg)/.test(t) ? t.replace(/<script[\s\S]*?<\/script>/gi, "") : null; };
function showReading({ r }, el = $("reading-body")) {
  el.innerHTML = r.embeds.map((e) => `<article class="emb${e.color === 0x66E0C8 ? " teal" : ""}">${e.title ? `<h2>${md(e.title)}</h2>` : ""}${e.description ? `<p>${md(e.description)}</p>` : ""}
      ${(e.fields || []).map((f) => `<h3>${md(f.name)}</h3><p>${md(f.value)}</p>`).join("")}${e.footer ? `<footer>${esc(e.footer.text)}</footer>` : ""}</article>`).join("");
}

// ---- journal (this device, per member) ----
const jKey = () => "oracle-journal:" + state.userId;
const loadJournal = () => { try { return JSON.parse(localStorage.getItem(jKey()) || "[]"); } catch { return []; } };
function saveJournal({ sys, r, words }) {
  const entry = { at: Date.now(), key: sys.key, label: sys.label, emoji: sys.emoji, title: r.embeds[0].title || sys.label, words,
    embeds: r.embeds, files: (r.files || []).map(svgOf).filter(Boolean) };
  try { localStorage.setItem(jKey(), JSON.stringify([entry, ...loadJournal()].slice(0, 20))); } catch {}
}
$("journal-btn").onclick = () => {
  const j = loadJournal(); clearReading(); table.idle(); cap("");
  say(j.length ? `Your journal, ${state.name}. The last ${j.length} reading${j.length > 1 ? "s" : ""} I gave you.` : "Your journal is empty. Ask me something first.");
  ui(`<div class="jl">${j.map((e, i) => `<button class="c" type="button" data-j="${i}">${e.emoji} ${esc(String(e.title).replace(/^\P{L}+/u, ""))} · <span class="note">${new Date(e.at).toLocaleDateString()}</span></button>`).join("")}</div>
    <div class="choices"><button class="c" type="button" id="back">Back</button></div>`);
  $("ui").querySelectorAll("[data-j]").forEach((b) => (b.onclick = () => { const e = j[+b.dataset.j];
    cap(e.emoji + " " + e.label); layArt(e.files || []); say(e.words); ui(`<div class="choices"><button class="c" type="button" id="back">✦ Another reading</button></div>`); $("back").onclick = greet;
    showReading({ r: { embeds: e.embeds } }); }));
  $("back").onclick = greet;
};

// ---- voice: unlock on the first click; mute toggle ----
addEventListener("pointerdown", unlockVoice, { capture: true });
addEventListener("keydown", unlockVoice, { capture: true });
const vb = $("voice-btn");
const showVoice = () => { vb.textContent = isMuted() ? "🔇 Voice off" : "🔊 Voice on"; vb.setAttribute("aria-pressed", String(!isMuted())); };
vb.onclick = () => { setMuted(!isMuted()); showVoice(); };
showVoice();

// ---- start ----
(async () => {
  say("…");
  if (inDiscord()) {
    try {
      const d = await startDiscord();
      if (d.user) { state.name = d.user.global_name || d.user.username; state.userId = d.user.id; state.token = d.token; }
      if (d.token) {
        const p = await fetch(api("/api/profile"), { headers: { authorization: "Bearer " + d.token } }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        if (p && p.profile) state.profile = p.profile;
      }
    } catch (e) { console.warn("Discord SDK failed to start", e); }
  }
  await loadProgress();
  greet();
})();
