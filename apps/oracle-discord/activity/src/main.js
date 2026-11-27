// The Oracle Chamber (Discord Activity): pick a system, give the Oracle your details, and she reveals the reading.
// Readings run here in the browser with the same modules the /oracle bot uses (src/modules), so results match.
import { recordShop, checkUnlocks, trackOf, musicOf, togglePlaylist, BATTLE_ROOMS, TRACKS, hasTrack } from "./music.js";
import { createPlayer, recordPlayerHtml, musicSwitchHtml, wireMusic, vinylSvg } from "./player.js";
import { homeItems, homeHtml, wireHome, savedTab, gateHtml } from "./home.js";
import { ghostBody } from "./seance/ghostlooks.js";
import { figureSvg, sigilRingSvg } from "../../src/oracle/figure.js";
import { makeTable, fitSvg, setTableDecor } from "./table.js";
import { unlockVoice, blip, isMuted, setMuted } from "./voice-sfx.js";
import { available, systemByKey, optionsFor } from "../../src/oracle/systems.js";
import { greeting, askLine, speech } from "../../src/oracle/voice.js";
import { fieldsFor } from "../../src/profiles.js";
import { MODULES } from "../../src/registry.js";
import { MODS } from "./modules.gen.js";
import { startDiscord, inDiscord, api } from "./discord.js";
import { CODEX, UNLOCKS, RANKS, rankOf, nextRank, fresh, record, codexNotes, liveStreak, merge, loadLocal, saveLocal } from "./game.js";
import { chime, trance, deepen } from "./voice-sfx.js";
import { answer, quip, deeperPages } from "./answer.js";
import { CARD_BACK, cardBackSvg } from "./cardbacks.js";
import { STORE, KINDS, SHOP_TALK, registerShelf, shelf, departments, deptOf, kindLabel, goodsOf, ensureFree, item, buy, readsLeft, useRead, buyDayPass, DAY_PASS, DAILY, dailyLimit } from "./store.js";
import { setVoiceStyle, sampleVoice, checkout, rimshot, cardDeal } from "./voice-sfx.js";
import { seance, codexHtml as seanceCodex } from "./seance/room.js";
import { room as decoder, decoderCodex } from "./decoder/room.js";
import { room as memory, memoryCodex } from "./memory/room.js";
import { alchemy, alchemyCodex } from "./alchemy/room.js";
import { timeline, codexHtml as timelineCodex } from "./timeline/room.js";
import { room as calendar, codexHtml as calendarCodex } from "./calendar/room.js";
import { room as grimoire, grimoireCodex } from "./grimoire/room.js";
import { stars as starLore, starsCodex } from "./stars/room.js";
import { room as duel, duelCodex } from "./duel/room.js";
import { rummy, rummyCodex } from "./rummy/room.js";
import { robeFx, AVATAR_LOOK, STAR_PUPIL, CLOTH_DESIGN } from "./looks.js";
import { vibeFx, CLOTH_FX, clothTrim, orbFx } from "./fx.js";
import { persona, line, personaQuip, deliver } from "./personas.js";
import { IDLE_AFTER, idleLine } from "./idle.js";
import { headline } from "../../src/oracle/voice.js";
import { TROPHIES, TIERS, SETS, LINES, CASE_LEVELS, recordWin, recordReading, tierOf, points, caseLevel, earned, togglePin, trophyArt } from "./trophies.js";
import { trophyWin } from "./voice-sfx.js";
import { prosody, whoosh, puff, ignite, emoteSfx } from "./voice-sfx.js";
import { banter } from "./banter.js";
import { BOOST_THANKS, BOOSTER_HELLO } from "./boost.js";
import { CREDITS_SONG, creditSections, SPECIAL_THANKS, END_LINE, checkMastery, hasCrown, masteryCount, GAMES } from "./credits.js";
import { initMood, moodForOutcome, moodForTone, flickFor, MOOD_EMOJI } from "./mood.js";
import { STUDY, studyFor, studyHtml, STUDY_CSS } from "./study.js";

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
  // Crystal ball: tint only the glass (not the stand), add an effects layer inside and a glass rim on top.
  const ball = svg.querySelector(".o-ball"), clip = ball.querySelector('[clip-path="url(#t-orbclip)"]');
  const bodyC = ball.querySelector('circle[fill="url(#t-orb)"]'); bodyC.classList.add("o-glass", "o-glassbody"); clip.classList.add("o-glass");
  clip.after(g("orb-fx", { "clip-path": "url(#t-orbclip)" }));
  defs.innerHTML += `<radialGradient id="t-fresnel" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></radialGradient>
    <radialGradient id="t-caustic" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
  const rim = g("orb-rim"); rim.innerHTML = `<circle cx="200" cy="304" r="47" fill="url(#t-fresnel)"/><path d="M166 320 A36 36 0 0 0 214 340" fill="none" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><ellipse class="o-caustic" cx="200" cy="351" rx="16" ry="3" fill="url(#t-caustic)"/>`;
  $("orb-fx").after(rim);
  // Remember which parts of the hands are skin, edge and nail, so avatars can recolour them.
  svg.querySelectorAll('.o-hands [fill="#3a2a5c"]').forEach((e) => (e.dataset.skin = "fill"));
  svg.querySelectorAll('.o-hands [stroke="#3a2a5c"]').forEach((e) => (e.dataset.skin = "stroke"));
  svg.querySelectorAll('.o-hands [stroke="#E2B04A"]').forEach((e) => (e.dataset.edge = "1"));
  svg.querySelectorAll(".o-hands .o-nail").forEach((e) => (e.dataset.r = e.getAttribute("r")));
})();
const CAST = {
  tarot: "I shuffle the deck… cut… and deal…", lenormand: "Thirty-six small pictures… shuffled… laid out in a row…",
  magicdeck: "Atoms, moons, potions, stars… shuffled… dealt like an experiment…",
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
const bused = []; // banter lines already said this visit (banter.js)
const mood = initMood($("teller"), { reduced, name: () => state.name, onChange: (m) => { refreshEnergy(); const sp = document.querySelector(".speaker"); if (sp) sp.dataset.emo = MOOD_EMOJI[m] || ""; },
  onPoke: (zone, count) => (count < 5 && Math.random() < 0.5 ? banter("", state.prog.persona || "mystic", "poke", state.name, bused) : null) });
// Commentary while a game is being played: every few moves, in the chosen personality's voice, about that game.
const chat = { n: 0, next: 3, at: 0 };
function roomBanter(event = "mid") {
  const l = state.inRoom && banter(state.inRoom, state.prog.persona || "mystic", event, state.name, bused); if (!l) return;
  chat.n = 0; chat.next = 5 + Math.floor(Math.random() * 4); chat.at = Date.now();
  mood.emote(["wink", "curious", "think", "smug"][Math.floor(Math.random() * 4)], { quiet: true, say: l });
  if (state.prog.persona === "standup") setTimeout(rimshot, 900);
}
$("ui").addEventListener("click", (e) => { if (!state.inRoom || !e.target.closest("button") || mood.mood()) return;
  if (++chat.n >= chat.next && Date.now() - chat.at > 22000 && !document.body.classList.contains("talking")) roomBanter("mid"); });
// Everything the store sells reacts to her: robe effects, the crystal ball, avatar extras and the vibe speed up when
// she is excited or talking and slow when she is low (candles and colours follow in chamber.css via body[data-mood]).
const ENERGY = { joy: 2, cheer: 3, love: 1.7, laugh: 2.3, wow: 3, curious: 1.4, angry: 3.6, think: 0.8, sad: 0.45, sulk: 0.5, sleepy: 0.3 };
const FX_LAYERS = ["fx-back", "fx-robe", "fx-front", "orb-fx", "av-back", "av-front", "vfx-o", "vfx-t"];
function refreshEnergy() {
  const b = document.body.classList, rate = b.contains("trance") ? 2.6 : ENERGY[mood.mood()] || (b.contains("talking") ? 1.35 : 1);
  for (const id of FX_LAYERS) { const g = $(id); try { g && g.getAnimations && g.getAnimations({ subtree: true }).forEach((a) => { a.playbackRate = rate; }); } catch {} }
  $("teller").classList.toggle("fx-hot", rate >= 1.7); $("teller").classList.toggle("fx-cold", rate < 0.7);
}
/** A flourish when a look is put on or tried: the robe swirls, the ball flares, candles relight, the cloth ripples. */
function flourish(kind) {
  if (reduced) return;
  const cls = { outfit: "fl-robe", avatar: "fl-avatar", orb: "orb-flare", flame: "fl-flame", cloth: "fl-cloth", vibe: "fl-vibe", persona: "fl-avatar" }[kind]; if (!cls) return;
  const el = kind === "flame" || kind === "cloth" ? $("table-pane") : kind === "vibe" ? document.body : $("teller");
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1100);
  if (kind === "outfit") setTimeout(() => mood.emote("dizzy", { quiet: true }), 500); // the twirl leaves her seeing stars
  if (kind === "outfit" || kind === "cloth" || kind === "vibe") whoosh(); else if (kind === "flame") ignite(); else if (kind === "orb") emoteSfx("orb");
}
// Blow out a candle on the table: it smokes, she notices, and it relights itself.
$("table").addEventListener("click", (e) => {
  const c = e.target.closest?.(".t-candle"); if (!c || c.classList.contains("out")) return;
  c.classList.add("out"); puff(); mood.emote("wow", { quiet: true, say: pickLine(["Hey! I need those to see.", "Who blew that out? …It was you.", "Ooo, spooky. Relight it.", "A draught from the beyond. Or from {name}."], {}) });
  setTimeout(() => { if (c.isConnected) { c.classList.remove("out"); c.classList.add("relit"); ignite(); setTimeout(() => c.classList.remove("relit"), 700); } }, 3200);
});
const PAUSE = { ",": 160, ";": 200, ":": 200, ".": 320, "…": 380, "?": 340, "!": 320, "—": 220 };
function say(text, done) {
  clearTimeout(typing); const el = $("say"), box = $("box"), teller = $("teller");
  const plain = text.replace(/\*\*/g, ""); $("sr").textContent = plain;
  if (mood.mood() === "sleepy") mood.clear();
  const stop = () => { box.classList.remove("typing"); document.body.classList.remove("talking", "syl"); teller.classList.remove("syl"); refreshEnergy(); };
  const pros = prosody(plain);
  say.finish = null;
  if (reduced) { el.textContent = plain; stop(); done && done(); return; }
  /** Skip: show the whole line now (no more typing or blips), then carry on as if it finished. */
  say.finish = () => { say.finish = null; clearTimeout(typing); el.textContent = plain; stop(); done && done(); };
  let i = 0, n = 0; el.textContent = ""; box.classList.add("typing"); document.body.classList.add("talking"); refreshEnergy();
  const step = () => {
    const ch = plain[i++]; el.textContent = plain.slice(0, i);
    mood.flick(flickFor(ch));
    if (/[\p{L}\p{N}]/u.test(ch)) { if (n++ % 2 === 0) { blip(ch, { ...pros[i - 1], wordEnd: !/[\p{L}\p{N}]/u.test(plain[i + 1] || " ") }); teller.classList.toggle("syl"); document.body.classList.toggle("syl"); } }
    if (i >= plain.length) { say.finish = null; blip("o", { final: true }); stop(); done && done(); return; }
    typing = setTimeout(step, PAUSE[ch] || (ch === " " ? 34 : 26));
  };
  step();
}
const P = () => persona(state.prog.persona), pid = () => state.prog.persona || "mystic";
const joke = (key) => personaQuip(pid(), state.name, heard()) || quip(key, state.name, heard());
const heard = () => (state.prog.heard ||= []);
const ui = (html) => { $("ui").innerHTML = html; };
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
function poof() { const p = $("poof"); p.innerHTML = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.28; return `<i style="--x:${Math.cos(a) * 110}px;--y:${Math.sin(a) * 70}px"></i>`; }).join("");
  p.classList.remove("go"); void p.offsetWidth; p.classList.add("go"); }

// ---- the conversation ----
const cap = (t) => { $("table-cap").textContent = t || ""; };
const clearReading = () => { $("reading-body").innerHTML = ""; $("box").scrollTop = 0; };
/** Discord's Activity iframe blocks <form> submission, so forms are plain divs: the #go button and Enter in a field run the div's onsubmit. */
function bindGo(id) {
  const box = $(id), run = () => { const bad = [...box.querySelectorAll("input[required]")].find((i) => !i.value.trim());
    if (bad) { bad.focus(); bad.reportValidity?.(); return; } box.onsubmit?.({ preventDefault() {} }); };
  $("go").onclick = run;
  box.querySelectorAll("input").forEach((i) => (i.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); run(); } }));
}
// ---- idle chatter: after 30 s with no click or key, the chosen personality pipes up (first 3 lines chained, then shuffled) ----
const idle = { t: null, step: 0, used: [], on: false };
function idleReset() { clearTimeout(idle.t); idle.step = 0; mood.wake(); if (idle.on) idle.t = setTimeout(idleTick, IDLE_AFTER); }
function idleTick() {
  const b = document.body.classList, busy = state.inRoom || b.contains("talking") || b.contains("trance") || $("more") || document.hidden;
  if (!busy && idle.step >= 4) return mood.sleep(); // after four unanswered remarks she dozes off until you come back
  if (!busy) say(idleLine(pid(), idle.step++, idle.used, state.name));
  idle.t = setTimeout(idleTick, IDLE_AFTER);
}
["pointerdown", "keydown", "wheel", "input"].forEach((ev) => addEventListener(ev, idleReset, { capture: true, passive: true }));

function greet() {
  state.inRoom = null; player.room(null); idle.on = true; idleReset();
  clearReading(); table.idle(); cap("");
  const roomBtn = (r) => `<button class="c room" type="button" data-room="${r.id}" title="${esc(r.blurb || "")}">${r.emoji} ${esc(r.label)}</button>`; // a room with row: "cards" sits in the By the cards row
  const sys = available(MODULES), btn = (s) => `<button class="c" type="button" data-k="${s.key}">${s.emoji} ${esc(s.label)}</button>`;
  const st = liveStreak(state.prog), rk = rankOf(state.prog.xp).name;
  say((line(P(), "greet", { name: state.name }) || greeting(state.name)) + (state.prog.readings ? ` Welcome back, ${rk}.` + (st > 1 ? ` ${st} days in a row now… the stars notice.` : "") : ""));
  showStats();
  const items = homeItems(sys, ROOMS, STUDY);
  ui(homeHtml(items, savedTab(), esc)); wireHome($("ui"), { reduced });
  $("hm-daily").onclick = () => choose(systemByKey("tarot"));
  $("hm-surprise").onclick = () => { const all = [...items.question, ...items.cards, ...items.birth, ...items.play], it = all[Math.floor(Math.random() * all.length)];
    mood.emote("wink", { quiet: true }); it.kind === "sys" ? choose(systemByKey(it.id)) : openRoom(it.id); };
  $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => choose(systemByKey(b.dataset.k))));
  $("ui").querySelectorAll("[data-room]").forEach((b) => (b.onclick = () => openRoom(b.dataset.room)));
  $("ui").querySelectorAll("[data-study]").forEach((b) => (b.onclick = () => openStudy(b.dataset.study)));
}

// ---- Study: every game's study guides, one tap from the main menu (study.js). Rooms can send players here with ctx.study(id). ----
function openStudy(roomId, back) {
  const x = studyFor(roomId); if (!x) return greet();
  if (!document.getElementById("study-style")) { const st = document.createElement("style"); st.id = "study-style"; st.textContent = STUDY_CSS; document.head.appendChild(st); }
  state.inRoom = null; clearReading(); table.idle(); cap(`📖 Study: ${x.name}`);
  const show = (g) => { const rb = $("reading-body"); rb.innerHTML = studyHtml(g); rb.querySelector(".sh-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
    $("ui").querySelectorAll("[data-guide]").forEach((b) => b.classList.toggle("main", b.dataset.guide === g.id)); };
  say(x.guides.length > 1 ? `The ${x.name} library. ${x.guides.length} guides: pick one and read at your own pace.` : `Everything ${x.name} asks is in here. Read at your own pace.`);
  ui(`<div class="choices">${x.guides.map((g) => `<button class="c small" type="button" data-guide="${g.id}">${g.emoji} ${esc(g.title.replace(/ study guide$/i, ""))}</button>`).join("")}</div>
    <div class="choices"><button class="c main" type="button" id="study-play">▶ Play ${esc(x.name)}</button><button class="c" type="button" id="study-back">${back ? "↩ Back" : "✦ Back to the Oracle"}</button></div>`);
  $("ui").querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => show(x.guides.find((g) => g.id === b.dataset.guide))));
  $("study-play").onclick = () => openRoom(roomId);
  $("study-back").onclick = () => (back ? back() : greet());
  show(x.guides[0]);
}

// ---- rooms: games inside the Chamber (src/<room>/). Each exports { id, label, emoji, blurb, open(ctx), codexHtml? }
// and keeps its progress in state.prog.rooms[id] (with a plays counter, so merge() counts it). ----
const ROOMS = [{ ...seance, codexHtml: seanceCodex }, { ...decoder, codexHtml: decoderCodex }, { ...timeline, codexHtml: timelineCodex }, { ...alchemy, codexHtml: alchemyCodex }, { ...calendar, codexHtml: calendarCodex }, { ...grimoire, codexHtml: grimoireCodex }, { ...starLore, codexHtml: starsCodex }, { ...duel, codexHtml: duelCodex }, { ...memory, codexHtml: memoryCodex }, { ...rummy, codexHtml: rummyCodex }];
for (const r of ROOMS) [r.shop, ...(r.shops || [])].forEach(registerShelf);
registerShelf(recordShop); // the 🎵 Records shelf (music.js) // each room may export shop = { kind, label, items, talk, preview } (see store.js)
/** Add ✦ and 💎 from a room, keeping ranks in step. Returns { rankUp } (the new rank's name or null). */
function award(xp = 0, essence = 0) {
  const p = state.prog, before = rankOf(p.xp).name;
  p.xp += xp; p.essence = (p.essence || 0) + essence;
  const after = rankOf(p.xp).name, rankUp = after !== before ? after : null;
  if (rankUp) p.essence += 25;
  return { rankUp };
}
function openRoom(id, arg = null) {
  const r = ROOMS.find((x) => x.id === id); if (!r) return greet();
  state.inRoom = id; chat.n = 0; chat.next = 3; chat.at = Date.now() - 12000; player.room(id);
  const roomAward = (xp, es) => { const r = award(xp, es); if (!mood.mood() && (xp || es)) mood.emote(r.rankUp ? "cheer" : "joy", { quiet: true }); return r; };
  r.open({ $, esc, say, ui, talkThrough, cap, clearReading, table, tableEl: $("table"), state, saveProgress, showStats, chime, applyLook, greet, wait, reduced, award: roomAward, trophy, emote: mood.emote, bubble: mood.bubble, banter: roomBanter, study: (rid = id, back) => openStudy(rid, back),
    arg, go: (rid, a) => openRoom(rid, a), reading: (k) => { const sys = systemByKey(k); if (sys) choose(sys); } }); // reading: open one of the Oracle's readings (e.g. "astrology") // arg: optional entry hint from another room (e.g. { ghost } or { script }); go: jump to another room
}

function choose(sys) {
  if (readsLeft(state.prog, rankOf(state.prog.xp).name) <= 0) return outOfReadings(sys);
  clearReading(); table.rest(sys.key); cap(sys.emoji + " " + sys.label);
  say(line(P(), "ask", { name: state.name, system: sys.label }) || askLine(sys, state.name));
  if (sys.kind === "cast") {
    const spreadSel = sys.spreads ? `<label for="sp">Spread<select id="sp">${sys.spreads.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></label>` : "";
    ui(`<div class="form one" id="f"><label for="q">Your question (optional)<input id="q" maxlength="200" autocomplete="off" placeholder="What do I need to know about…"></label>${spreadSel}</div>
      <div class="choices"><button class="c main" type="button" id="go">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>`);
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
    ui(`<div class="form" id="f">${rows.join("")}</div>
      <div class="choices"><button class="c main" type="button" id="go">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>
      <div class="note">${PREVIEW ? PREVIEW.note + " " : state.profile ? "Filled in from your saved /profile. " : ""}Your details stay in this reading; nothing is posted to the channel.</div>`);
    $("f").onsubmit = (e) => { e.preventDefault();
      const o = optionsFor(sys), v = (id) => ($(id) ? $(id).value.trim() : "");
      o[f.date] = v("d");
      if (need.includes("place")) o[f.place] = v("p");
      if (need.includes("name")) o[f.name] = v("n");
      if (need.includes("time")) { if (v("t")) o[f.time] = v("t"); else o.time_unknown = true; }
      reveal(sys, o, v("bq")); };
  }
  bindGo("f");
  $("back").onclick = greet;
}

async function reveal(sys, options, question = "") {
  if (readsLeft(state.prog, rankOf(state.prog.xp).name) <= 0) return outOfReadings(sys);
  ui(""); clearReading(); state.q = question;
  // The trance: the Oracle closes her eye and raises her hands for 3 seconds, humming, while the table casts.
  document.body.classList.add("trance"); mood.clear(); refreshEnergy(); cap(sys.emoji + " " + (line(P(), "cast", { system: sys.label }) || CAST[sys.key] || "The mist is moving…"));
  clearTimeout(typing); $("say").textContent = "…"; $("sr").textContent = "The Oracle closes her eye and raises her hands.";
  trance(3);
  let r, err;
  try {
    const mod = MODS[sys.command];
    if (sys.row === "cards") { const n = (sys.spreads ? ({ one: 1, pair: 2, three: 3, line: 3, five: 5, square: 9, celtic: 10 }[options.spread] || 3) : 3); cardDeal(n, n > 5 ? 0.13 : 0.2); }
    [r] = await Promise.all([mod.run(options, { user: state.name }), table.cast(sys.key, options), wait((sys.key === "tarot" && options.spread === "celtic") || (sys.key === "lenormand" && options.spread === "square") ? 3600 : 3000)]);
  } catch (e) { err = e; }
  document.body.classList.remove("trance"); refreshEnergy(); cap(sys.emoji + " " + sys.label);
  if (err) {
    table.rest(sys.key);
    mood.emote("nervous");
    say("The glass clouds over. " + (err.message || "Something went wrong."));
    ui(`<div class="choices"><button class="c main" type="button" id="again">Try again</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("again").onclick = () => choose(sys); $("back").onclick = greet; return;
  }
  $("table").classList.add("fade"); mood.gesture("snap"); await wait(450);
  poof(); await wait(250);
  const files = (r.files || []).map(svgOf).filter(Boolean);
  layArt(files);
  const words = line(P(), "reveal", { name: state.name, system: sys.label, result: headline(r.embeds[0], r.headline) }) || speech(sys.command, state.name, r.embeds[0], Math.random, r.headline);
  const text = r.embeds.map((e) => [e.description, ...(e.fields || []).map((f) => f.name + ": " + f.value)].join(" ")).join(" ");
  const lore = codexNotes(state.prog, sys.key, r);
  state.last = { sys, r, words, files, text, deeper: deeperPages(r, question, lore), di: 0, quips: 0 };
  useRead(state.prog); const gain = record(state.prog, sys.key, r); musicNews(); saveProgress(); showStats(); trophyNews(recordReading(state.prog, available(MODULES).length));
  const a = answer(question, text, state.name, r.analysis);
  const pages = [{ text: words, mood: "wow" }, { text: deliver(pid(), a.line, { name: state.name }), mood: question ? moodForTone(a.tone) : "think" },
    ...(lore.length > 1 ? [{ text: `Your Codex adds this, ${state.name}. ${lore.slice(1, 3).join(" ")}`, mood: "think" }] : []), { text: joke(sys.key), after: "laugh" }];
  if (pid() === "standup") setTimeout(rimshot, 400);
  talkThrough(pages, () => { afterReading(); reward(gain, sys); });
}

/** Out of Chamber readings for today: say so with style, and offer a day pass, the store, or the chat commands. */
function outOfReadings(sys) {
  const p = state.prog, rk = rankOf(p.xp).name, nx = nextRank(p.xp), lim = dailyLimit(rk);
  table.rest(sys.key);
  mood.emote("sad");
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
  else pages.push(joke(L.sys.key));
  talkThrough(pages, afterReading);
}

/** Ask another question: cast systems cast again; birth systems answer from the same chart. */
function askAgain() {
  const L = state.last;
  ui(`<div class="form one" id="qf"><label for="q2">What else would you like to know?<input id="q2" maxlength="200" autocomplete="off" placeholder="Should I…, When will…, What do I need to…"></label></div>
    <div class="choices"><button class="c main" type="button" id="go">✦ Ask</button><button class="c" type="button" id="cancel">Never mind</button></div>`);
  setTimeout(() => $("q2").focus(), 50);
  $("cancel").onclick = afterReading;
  $("qf").onsubmit = (e) => { e.preventDefault(); const q = $("q2").value.trim(); if (!q) return;
    if (L.sys.kind === "cast") { reveal(L.sys, optionsFor(L.sys, { [L.sys.ask || "question"]: q }), q); return; }
    clearTimeout(typing); state.q = q; document.body.classList.add("trance"); trance(2); $("say").textContent = "…"; ui("");
    setTimeout(() => { document.body.classList.remove("trance");
      talkThrough([deliver(pid(), answer(q, L.text, state.name, L.r.analysis).line, { name: state.name }), joke(L.sys.key)], afterReading); }, reduced ? 0 : 2000);
  };
  bindGo("qf");
}

let talkKey = null;
function talkThrough(pages, done) {
  let i = 0;
  const next = () => {
    if (i >= pages.length) { removeEventListener("keydown", talkKey); talkKey = null; done(); return; }
    const raw = pages[i++], page = raw.text ?? raw, last = i >= pages.length;
    if (raw.mood) mood.emote(raw.mood);
    ui(`<div class="talkbar"><button class="c small" type="button" id="skip">Skip ⏭</button></div>`);
    $("skip").onclick = () => say.finish && say.finish(); // Skip only skips the typing effect: the full text shows at once
    say(page, () => {
      if (raw.after) mood.emote(raw.after);
      ui(`<div class="talkbar"><button class="c main" type="button" id="more">${last ? "✦ Done" : "▸ Continue"}</button><span class="note">or press Space</span></div>`);
      $("more").onclick = next;
    });
  };
  if (talkKey) removeEventListener("keydown", talkKey);
  talkKey = (e) => { if ((e.key === " " || e.key === "Enter") && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) {
    if ($("more")) { e.preventDefault(); $("more").click(); } else if (say.finish) { e.preventDefault(); say.finish(); } } };
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
  if (g.rankUp) mood.emote("cheer", { quiet: true }); else if (g.essence) mood.emote("joy", { quiet: true });
  if (g.rankUp || g.unlocked.length || g.newItems.length) { chime(g.rankUp || g.unlocked.length ? 2 : 1); $("table-pane").classList.remove("sparkle"); void $("table-pane").offsetWidth; $("table-pane").classList.add("sparkle"); }
}

function showStats() {
  const p = state.prog, rk = rankOf(p.xp), nx = nextRank(p.xp);
  const pct = nx ? Math.round(((p.xp - rk.at) / (nx.at - rk.at)) * 100) : 100;
  $("stats").innerHTML = `<span class="rank" title="${nx ? `${nx.at - p.xp} ✦ to ${esc(nx.name)}` : "The highest rank"}">🏅 ${esc(rk.name)} <i style="--p:${pct}%"></i></span><span title="Day streak">🔥 ${liveStreak(p)}</span><span title="Moon tokens">🌙 ${p.tokens}</span><span title="Essence">💎 ${p.essence || 0}</span><span title="Chamber readings left today">🔮 ${(() => { const l = readsLeft(p, rk.name); return l === Infinity ? "∞" : l + " left"; })()}</span>${state.booster ? `<span class="booster" title="Boosting the Science is Magic server. Thank you!">💜 Booster</span>` : ""}${showcaseHtml(p)}`;
}

const EARNED_DESIGN = { velvet: "", starchart: "constellations", goldleaf: "filigree", moonlit: "moonphases", obsidian: "obsidian" };
const EARNED_INK = { starchart: "#c9d4ff", goldleaf: "#FFF3C4", moonlit: "#e9f0ff", obsidian: "#b06cff" };
const owns = (id) => state.prog.unlocked.includes(id) || (state.prog.owned || []).includes(id);
const lookItem = (id) => UNLOCKS.find((x) => x.id === id) || item(id);
function wear(id) {
  const u = lookItem(id); if (!u || !owns(id)) return;
  if (u.kind === "record") { const t = trackOf(id), L = musicOf(state.prog).list; if (t && !L.includes(t.id)) togglePlaylist(state.prog, t.id); saveProgress(); player.refresh(); player.play(t.id); return; }
  const changed = state.prog[u.kind] !== id; state.prog[u.kind] = id; saveProgress(); applyLook(); if (changed) flourish(u.kind);
}
function applyLook(over = {}) {
  const p = { ...state.prog, ...over }, svg = $("teller").querySelector("svg"), root = document.documentElement;
  const c = lookItem(p.cloth) || UNLOCKS[0], o = lookItem(p.orb), fl = item(p.flame) || item("goldflame"), out = item(p.outfit) || item("midnight"), av = item(p.avatar) || item("classic");
  const vibe = item(p.vibe) || item("chamber"), A = AVATAR_LOOK[av.id] || AVATAR_LOOK.classic;
  // table: cloth colours and design, candles
  const t = $("table"); c.c.forEach((v, i) => t.style.setProperty(`--cloth${i + 1}`, v));
  const design = c.design || EARNED_DESIGN[c.id] || "", ink = c.ink || EARNED_INK[c.id] || "#E2B04A";
  setTableDecor({ cardback: p.cardback && p.cardback !== "cb-deck" ? p.cardback : "", design: design && CLOTH_DESIGN[design] ? CLOTH_DESIGN[design](ink) : "", ink, wax: fl.wax, flame: fl.flame, halo: fl.halo, detail: fl.detail || "",
    fx: (CLOTH_FX[design] || CLOTH_FX[""])(ink), trim: clothTrim(ink) });
  table.refresh();
  root.style.setProperty("--orb-filter", o ? o.f : "none");
  const O = orbFx(o ? o.id : "amethyst");
  svg.querySelector(".o-glassbody").setAttribute("fill-opacity", O.glass);
  svg.querySelector('[clip-path="url(#t-orbclip)"].o-glass').style.display = O.swirl ? "" : "none";
  $("orb-fx").innerHTML = O.fx;
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
  if (applyLook.vibe !== vibe.id) { applyLook.vibe = vibe.id; $("vfx-o").innerHTML = vibeFx(vibe.id, "o"); $("vfx-t").innerHTML = vibeFx(vibe.id, "t"); }
  const v = item(p.voice); setVoiceStyle(v ? v.v : null);
  // every candle in the Chamber (Memory's candle row, the séance wax) burns in the equipped candles
  root.style.setProperty("--cw1", fl.wax[0]); root.style.setProperty("--cw2", fl.wax[1]);
  root.style.setProperty("--cf1", fl.flame[1]); root.style.setProperty("--cf2", fl.flame[2]); root.style.setProperty("--ch", fl.halo);
  applyCrown(svg, p);
  refreshEnergy();
}
/** The Star Crown: the Oracle's permanent reward once a member has finished every game on every level. */
function applyCrown(svg, p) {
  const old = svg.querySelector(".o-crown"); if (!hasCrown(p)) { if (old) old.remove(); return; } if (old) return;
  const st = (x, y, r, d) => `<path class="cr-star" style="--d:${d}s" d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z"/>`;
  const pts = [[132, 40, 7], [154, 26, 9], [178, 18, 10], [200, 12, 14], [222, 18, 10], [246, 26, 9], [268, 40, 7]];
  svg.insertAdjacentHTML("beforeend", `<g class="o-crown" aria-hidden="true"><ellipse class="cr-halo" cx="200" cy="34" rx="78" ry="16" fill="none" stroke="#FADE8C" stroke-width="3" opacity=".75"/>
    <ellipse cx="200" cy="34" rx="78" ry="16" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 9" opacity=".8"/>
    <g fill="#FADE8C" stroke="#fff" stroke-width="1.2">${pts.map(([x, y, r], i) => st(x, y, r, (i * 0.3).toFixed(1))).join("")}</g></g>`);
}

// ---- the Essence store ----
let trying = null; // a store item being tried on: { kind, id }
const pickLine = (pool, vars) => { const opts = pool.filter((l) => l !== pickLine.last); const l = opts[Math.floor(Math.random() * opts.length)] || pool[0]; pickLine.last = l; return l.replace(/\{item\}/g, vars.item || "").replace(/\{name\}/g, state.name); };
const emojiOf = (kind) => kindLabel(kind).split(" ")[0];
/** A small picture of a store item for its card: the real card back, or swatches made from the item's own colours. */
function thumb(it) {
  const k = it.kind;
  if (k === "cardback") return it.id === "cb-deck" ? `<span class="th">🂠</span>` : `<span class="th th-card">${cardBackSvg(it.id)}</span>`;
  if (k === "outfit" && it.hood) return `<span class="th th-robe" style="--a:${it.hood[0]};--b:${it.hood[1]};--t:${it.trim}"></span>`;
  if (k === "cloth" && it.c) return `<span class="th th-cloth" style="--a:${it.c[0]};--b:${it.c[2]};--t:${it.ink || EARNED_INK[it.id] || "#E2B04A"}"></span>`;
  if (k === "record") return `<span class="th th-rec">${vinylSvg(trackOf(it.id), 46)}</span>`;
  if (k === "ghost") return `<span class="th th-ghost"><svg viewBox="110 0 180 210" aria-hidden="true"><defs><linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs><g class="sc-gb sg-${it.id}">${ghostBody(it.id)}</g></svg></span>`;
  if (k === "orb") return `<span class="th th-orb" style="filter:${it.f || "none"}"></span>`;
  if (k === "flame" && it.wax) return `<span class="th th-flame" style="--w:${it.wax[0]};--f:${it.flame[1]};--h:${it.halo}"></span>`;
  if (k === "vibe" && it.stars) return `<span class="th th-vibe" style="--a:${it.stars[0]};--b:${it.stars[1]}"></span>`;
  return `<span class="th">${emojiOf(k)}</span>`;
}
const ACTIVE_KINDS = ["voice", "vibe", "persona"]; // "Active" reads better than "Wearing" for these
/** The store: five departments, each with its shelves; `tab` is the open shelf (a kind, or "haunted"). */
function showStore(tab = "outfit", opener = null) {
  clearReading(); cap(trying ? "👁 Trying on: " + (lookItem(trying.id)?.name || "") : "💎 The Essence store"); table.idle();
  const p = state.prog, depts = departments(), dept = deptOf(tab);
  say(opener || (p.essence ? `Ah, a customer. You have ${p.essence} Essence, ${state.name}. Everything here is cosmetic. Destiny is not for sale. Lip gloss for the crystal ball, however…` : "Essence comes from readings, traveller. Every ✦ you earn is a drop of 💎 Essence. Come back with a full pocket."));
  const earnedOf = (k) => (k === "cloth" || k === "orb" ? UNLOCKS.filter((u) => u.kind === k).map((u) => ({ ...u, earned: true })) : []);
  const goodsFor = (k) => [...earnedOf(k), ...goodsOf(k)];
  const deptBtns = depts.filter((d) => d.kinds.length).map((d) => { const all = d.kinds.filter((k) => k !== "haunted").flatMap(goodsFor), have = all.filter((it) => owns(it.id)).length;
    return `<button class="dept${d.id === dept.id ? " on" : ""}" type="button" data-tab="${d.kinds[0]}" title="${esc(d.blurb)}"><b>${d.label}</b><small>${have} / ${all.length} owned</small></button>`; }).join("");
  const tabs = dept.kinds.length > 1 ? `<div class="choices tabs">${dept.kinds.map((k) => `<button class="c small${k === tab ? " on" : ""}" type="button" data-tab="${k}">${kindLabel(k)}</button>`).join("")}</div>` : "";
  const cards = goodsFor(tab).map((it, i) => { const k = it.kind, own = owns(it.id), on = p[k] === it.id, tri = trying && trying.id === it.id;
    const act = on ? `<button class="c small" type="button" disabled>✓ ${ACTIVE_KINDS.includes(k) ? "Active" : "Wearing"}</button>`
      : own ? `<button class="c small" type="button" data-w="${it.id}">${k === "record" ? "▶ Play" : "Use"}</button>`
      : it.earned ? `<span class="note">🔒 ${esc(it.how)}</span>`
      : `<button class="c small main" type="button" data-buy="${it.id}" ${p.essence >= it.price ? "" : "disabled"}>💎 ${it.price}</button>`;
    const tryBtn = k === "record" ? `<button class="c small" type="button" data-listen="${it.id}">▶ Listen</button>` : k === "voice" ? `<button class="c small" type="button" data-hear="${it.id}">▶ Hear</button>` : k === "persona" ? `<button class="c small" type="button" data-hearp="${it.id}">▶ Hear</button>` : on ? "" : `<button class="c small${tri ? " on" : ""}" type="button" data-try="${it.id}">${tri ? "✓ Trying on" : "👁 Try on"}</button>`;
    return `<div class="shop-card${on ? " on" : ""}${tri ? " try" : ""}" style="--i:${i}">${thumb(it)}<div class="sc-body"><b>${esc(it.name)}</b>${tab === "haunted" ? `<span class="sc-tag">${kindLabel(k)}</span>` : ""}${it.note ? `<span class="note">${esc(it.note)}</span>` : ""}<div class="sc-acts">${tryBtn}${act}</div></div></div>`; }).join("");
  const left = readsLeft(p, rankOf(p.xp).name);
  ui(`<div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
    <div class="cx-top"><b>💎 ${p.essence} Essence</b> · readings left today: ${left === Infinity ? "unlimited" : left}
      ${left === Infinity ? "" : `<button class="c small" type="button" id="pass" ${p.essence >= DAY_PASS ? "" : "disabled"}>🎟️ Day pass: +1 reading today (💎 ${DAY_PASS})</button>`}</div>
    <div class="note">Daily readings by rank: ${DAILY.filter((d, i) => i < 4).map((d) => `${d.rank} ${d.n === Infinity ? "unlimited" : d.n}`).join(" · ")}. The /oracle commands in chat are always unlimited.</div>
    <div class="depts">${deptBtns}</div><div class="dept-blurb">${dept.label}: ${esc(dept.blurb)}.${tab === "cardback" ? " The back you pick is dealt in tarot, Lenormand, the Science is Magic deck, Grimoire Memory, Constellation Rummy and Element Duel." : ""}</div>
    ${tabs}<div class="shop grid">${cards}</div>`);
  const talk = (kind, act, it) => pickLine(((SHOP_TALK[kind] || SHOP_TALK.outfit)[act]) || SHOP_TALK.outfit[act], { item: it ? it.name : "" });
  $("back").onclick = () => { trying = null; applyLook(); greet(); };
  applyLook(trying ? { [trying.kind]: trying.id } : {});
  if (tab === "cardback") { const bid = trying && trying.kind === "cardback" ? trying.id : p.cardback;
    if (CARD_BACK[bid]) { const t = $("table"); t.className = "table cb-show"; t.innerHTML = `<div class="cb-fan">${[-2, -1, 0, 1, 2].map((r, i) => `<i style="--r:${r * 13}deg;--i:${i}">${cardBackSvg(bid)}</i>`).join("")}</div>`; } // the back, fanned out
    else { showStore.deck = showStore.deck || ["tarot", "lenormand", "magicdeck"][Math.floor(Math.random() * 3)]; table.rest(showStore.deck); } }
  const sh = trying ? shelf(trying.kind) : null; if (sh && sh.preview) sh.preview(trying.id, { table, tableEl: $("table"), cap, esc, prog: state.prog });
  $("ui").querySelectorAll("[data-try]").forEach((b) => (b.onclick = () => { const it = lookItem(b.dataset.try);
    const off = trying && trying.id === it.id; trying = off ? null : { kind: it.kind, id: it.id }; if (!off) mood.emote("curious"); showStore(tab, off ? talk(tab, "open") : talk(it.kind, "tryon", it)); if (!off) flourish(it.kind); }));
  if ($("pass")) $("pass").onclick = () => { if (buyDayPass(p)) { saveProgress(); checkout(); showStats(); showStore(tab, "One more reading, coming right up. The glass thanks you for your patronage."); } };
  $("ui").querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { trying = null; showStore.deck = null; showStore(b.dataset.tab, talk(b.dataset.tab, "open")); }));
  $("ui").querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { trying = null; wear(b.dataset.w); const it = lookItem(b.dataset.w); showStore(tab, talk(it.kind, "tryon", it)); }));
  $("ui").querySelectorAll("[data-listen]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.listen); player.preview(b.dataset.listen); say(talk("record", "tryon", it)); }));
  $("ui").querySelectorAll("[data-hearp]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.hearp), Q = persona(it.id);
    say(`${talk("persona", "tryon", it)} ${line(Q, "greet", { name: state.name }) || greeting(state.name)} ${personaQuip(it.id, state.name, []) || quip("iching", state.name, [])}`); }));
  $("ui").querySelectorAll("[data-hear]").forEach((b) => (b.onclick = () => { const cur = item(p.voice); setVoiceStyle(item(b.dataset.hear).v); say(talk("voice", "tryon", item(b.dataset.hear)), () => setVoiceStyle(cur ? cur.v : null)); }));
  $("ui").querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.buy); if (buy(p, it.id)) { trying = null; checkout(); wear(it.id); saveProgress(); showStats(); burst(); mood.emote("love", { quiet: true }); showStore(tab, talk(it.kind, "buy", it)); } }));
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
      if (d.user) { state.name = d.user.global_name || d.user.username; state.userId = d.user.id; state.token = d.token; state.guildId = d.guildId; }
      state.instance = d.sdk && d.sdk.instanceId; // the call: multiplayer tables (net.js) are per call
      if (d.token) {
        const p = await fetch(api("/api/profile"), { headers: { authorization: "Bearer " + d.token } }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        if (p && p.profile) state.profile = p.profile;
      }
    } catch (e) { console.warn("Discord SDK failed to start", e); }
  }
  await loadProgress();
  await checkBoost();
  // the door: its tap is the gesture browsers need before sound, so the Oracle's first line is spoken aloud
  const gate = $("gate"), p = state.prog;
  gate.innerHTML = gateHtml({ name: state.name === "traveller" ? "" : state.name, rank: rankOf(p.xp).name, streak: liveStreak(p), back: !!p.readings, esc, art: `<svg viewBox="0 0 400 400">${figureSvg({ id: "g" })}</svg>` });
  gate.hidden = false; say("");
  const enter = () => { unlockVoice(); musicNews(true); player.start(); gate.classList.add("open"); setTimeout(() => { gate.hidden = true; }, reduced ? 0 : 650); greet(); boostThanks(); };
  $("enter").onclick = enter; $("enter").focus();
})();

// ---- server boosts (boost.js): the Worker checks the boost with the bot and pays each one once; the Oracle says thank you ----
async function checkBoost() {
  if (!state.token || !state.guildId) return;
  const b = await fetch(api("/api/boost"), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ guildId: state.guildId }) }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
  if (!b) return; state.booster = !!b.boosting;
  if (b.fresh && b.reward > 0) { award(0, b.reward); state.prog.boosts = (state.prog.boosts || 0) + 1; saveProgress(); state.boostNews = "thanks"; }
  else if (b.boosting) state.boostNews = Math.random() < 0.35 ? "hello" : null;
  showStats();
}
/** After the door opens: thank a new booster (big), or now and then greet a returning one. */
function boostThanks() {
  const kind = state.boostNews; state.boostNews = null; if (!kind) return;
  const line = pickLine(kind === "thanks" ? BOOST_THANKS : BOOSTER_HELLO, {});
  setTimeout(() => { if (kind === "thanks") { chime(3); mood.gesture("snap"); } mood.emote(kind === "thanks" ? "love" : "joy", { say: line }); }, reduced ? 0 : 3200);
}
if (PREVIEW) window.__boostTest = () => { state.booster = true; award(0, 500); state.boostNews = "thanks"; showStats(); boostThanks(); };

// ---- the Trophy Case (trophies.js): full-screen cabinet, the collect moment, showcase pins ----
const tq = []; let tShowing = false;
function tierKey(n) { return TIERS[n].key; }
function showcaseHtml(p) { return (p.showcase || []).length ? `<button type="button" class="tr-pins" id="tr-pins" title="Your showcase: open the Trophy Case">${p.showcase.map((id) => { const t = TROPHIES.find((x) => x.id === id); return t ? `<span class="tr-pin">${trophyArt(t.art, tierKey(tierOf(p, id)), { plinth: false })}</span>` : ""; }).join("")}</button>` : ""; }
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#tr-pins")) openCase(); });
/** A room finished a round: C.trophy(roomId, level 1-3, { won, perfect }). */
function trophy(id, level, o) { const ev = o && o.won ? (o.perfect ? "perfect" : "win") : "lose"; chat.at = Date.now();
  mood.emote(moodForOutcome(id, o || {}), { say: banter(id, pid(), ev, state.name, bused) }); if (pid() === "standup") setTimeout(rimshot, 900);
  try { trophyNews(recordWin(state.prog, id, level, o)); } catch (e) { console.warn("trophy", e); }
  if (!(o && o.won) && BATTLE_ROOMS.includes(id)) musicOf(state.prog).lost = true;
  if (o && o.won && checkMastery(state.prog)) { saveProgress(); creditsDue = true; if (!tShowing && !tq.length) setTimeout(() => rollCredits(true), reduced ? 0 : 2600); }
  setTimeout(musicNews, reduced ? 0 : 2600); }
function trophyNews(n) {
  if (!n) return;
  if (n.pay) award(0, n.pay); saveProgress(); showStats();
  tq.push(n); if (!tShowing) setTimeout(nextCollect, reduced ? 0 : 1200);
}
function nextCollect() {
  const n = tq.shift(), el = $("tcollect"); if (!n) { tShowing = false; if (creditsDue) setTimeout(() => rollCredits(true), reduced ? 0 : 700); return; }
  tShowing = true; mood.emote("cheer", { quiet: true });
  const t = TROPHIES.find((x) => x.id === n.id), T = TIERS[n.tier], up = n.from > 0;
  const kicker = n.tier === 4 ? "Fully mastered" : up ? "Trophy upgraded" : "New trophy";
  const rays = Array.from({ length: 16 }, (_, i) => `<i style="--a:${i * 22.5}deg"></i>`).join("");
  const motes = Array.from({ length: 14 }, (_, i) => `<b style="--x:${(i * 37) % 100}%;--d:${(i * 0.23).toFixed(2)}s;--s:${0.6 + (i % 4) * 0.25}"></b>`).join("");
  el.className = `tcollect t-${T.key}${up ? " up" : ""}`;
  el.innerHTML = `<div class="tc-rays">${rays}</div><div class="tc-motes">${motes}</div>
    <div class="tc-card" role="dialog" aria-label="${esc(kicker)}: ${esc(t.name)}">
      <div class="tc-kicker">✦ ${esc(kicker)} ✦</div>
      <div class="tc-art">${up ? `<div class="tc-old">${trophyArt(t.art, tierKey(n.from))}</div>` : ""}<div class="tc-new">${trophyArt(t.art, T.key)}</div></div>
      <h2 class="tc-name">${esc(t.name)}</h2>
      <div class="tc-tier">${esc(T.name)} · ${esc(t.game)}</div>
      <p class="tc-line">“${esc(LINES[t.id] || "")}”</p>
      <div class="tc-pay">+💎 <span id="tc-count">0</span> Essence</div>
      ${n.sets.map((s) => `<div class="tc-set">🏆 ${esc(s.name)} complete: Gold on ${s.ids.length} games · bonus 💎 ${s.bonus}</div>`).join("")}
      <div class="choices"><button class="c main" type="button" id="tc-ok">✦ Collect</button><button class="c" type="button" id="tc-case">🏆 Open the case</button></div>
    </div>`;
  el.hidden = false; trophyWin(n.tier, up);
  const cnt = $("tc-count"), t0 = performance.now(), dur = reduced ? 0 : 1200;
  const tick = (now) => { const k = dur ? Math.min(1, (now - t0 - 700) / dur) : 1; cnt.textContent = Math.max(0, Math.round(n.pay * k)); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  $("tc-ok").focus();
  const done = (open) => { checkout(); el.classList.add("out"); setTimeout(() => { el.hidden = true; el.innerHTML = ""; if (open) openCase(); else nextCollect(); }, reduced ? 0 : 350); };
  $("tc-ok").onclick = () => done(false); $("tc-case").onclick = () => { tq.length = 0; done(true); };
}
let caseView = "trophies";
function openCase(focus = null, view = null) {
  if (view) caseView = view; if (caseView === "music") return openRecords();
  const p = state.prog, el = $("tcase"), pts = points(p), lv = caseLevel(p), nextLv = CASE_LEVELS.find((l) => l.at > pts);
  const got = TROPHIES.filter((t) => tierOf(p, t.id) > 0).length;
  const bay = (t) => { const n = tierOf(p, t.id), T = TIERS[n], pinned = (p.showcase || []).includes(t.id);
    const motes = n >= 3 ? Array.from({ length: 5 }, (_, k) => `<span class="mote" style="left:${18 + k * 15}%;animation-delay:${(k * 0.6).toFixed(1)}s"></span>`).join("") : "";
    return `<button type="button" class="bay t-${T.key}${focus === t.id ? " sel" : ""}" data-tr="${t.id}" aria-label="${esc(t.name)}, ${T.name}"><span class="glow">${motes}</span>${pinned ? `<span class="pinmark" title="In your showcase">📌</span>` : ""}${trophyArt(t.art, T.key)}<span class="nm">${esc(t.name)}</span><span class="tr-tier">${T.name}</span><span class="pips">${[1, 2, 3].map((k) => `<i class="${n >= k ? "on" : ""}"></i>`).join("")}${n >= 4 ? `<i class="on pr"></i>` : ""}</span></button>`; };
  const sets = SETS.map((s) => { const have = s.ids.filter((x) => tierOf(p, x) >= 3).length, done = (p.trophySets || []).includes(s.id);
    return `<div class="tset${done ? " done" : ""}"><b>${done ? "🏆" : "◇"} ${esc(s.name)}</b><span>Gold on ${s.ids.map((x) => esc(TROPHIES.find((t) => t.id === x).name)).join(", ")} · ${have} / ${s.ids.length} · bonus 💎 ${s.bonus}</span></div>`; }).join("");
  const sel = focus && TROPHIES.find((t) => t.id === focus);
  const detail = sel ? (() => { const n = tierOf(p, sel.id), pinned = (p.showcase || []).includes(sel.id);
    return `<div class="tdetail"><div class="td-art t-${TIERS[n].key}">${trophyArt(sel.art, TIERS[n].key)}</div><div class="td-txt"><h3>${esc(sel.name)}</h3><div class="td-game">${esc(sel.game)} · ${TIERS[n].name}</div>
      <ol>${sel.how.map((h, i) => `<li class="${n > i ? "ok" : ""}"><b>${TIERS[i + 1].name}</b> ${esc(h)} · 💎 ${TIERS[i + 1].pay}${n > i ? " ✓" : ""}</li>`).join("")}</ol>
      ${n ? `<button class="c small" type="button" id="td-pin">${pinned ? "📌 Unpin from showcase" : "📌 Pin to showcase"}</button>` : `<div class="note">Win it to pin it beside your name.</div>`}</div></div>`; })() : `<div class="tdetail hint">Tap a trophy to see how to upgrade it. Pin up to three to show beside your name.</div>`;
  el.innerHTML = `<div class="tcase-in" role="dialog" aria-label="The Trophy Case">
    <header><div class="tc-brand"><span class="tc-sig">⚛</span><div><h2>The Trophy Case</h2><small>Science is Magic · Oracle Chamber</small></div></div>
      <div class="tc-stats"><span><b>${got}/${TROPHIES.length}</b> trophies</span><span><b>${esc(lv.name)}</b> case level${nextLv ? ` · ${nextLv.at - pts} pts to ${esc(nextLv.name)}` : ""}</span><span><b>💎 ${earned(p)}</b> earned</span></div>
      ${caseTabs()}<button class="c small" type="button" id="tcase-x" aria-label="Close the Trophy Case">✕ Close</button></header>
    ${(() => { const t = player.current, own = TRACKS.filter((x) => hasTrack(p, x)).length;
      return `<button type="button" class="rp-banner" data-cv="music" aria-label="Open the record player">${vinylSvg(t || TRACKS[0], 64, player.playing ? "spin" : "")}<span class="rp-b-txt"><b>🎵 The Record Player</b><small>${player.playing && t ? `Now playing: ${esc(t.title)}` : "Your records, your playlist, music on/off and volume"} · ${own} / ${TRACKS.length} records</small></span><span class="c small main rp-b-go">Open ▸</span></button>`; })()}
    <div class="shelf">${TROPHIES.map(bay).join("")}</div>
    ${detail}
    <div class="tsets">${sets}${(() => { const m = masteryCount(p), c = hasCrown(p);
      return `<div class="tset tmaster${c ? " done" : ""}"><b>${c ? "👑" : "◇"} The Star Crown</b><span>${c ? "Every game finished on every level. The Oracle wears the Star Crown for good." : `Finish all ${GAMES.length} games on every level to roll the credits and crown the Oracle forever · ${m.done} / ${m.of} levels`}</span><button class="c small" type="button" data-credits="1">🎬 Roll the credits</button></div>`; })()}</div>
    <div class="note">Bronze, Silver and Gold come from finishing Levels 1, 2 and 3. Prismatic needs a perfect round on every level. Each tier pays its Essence once.</div></div>`;
  el.hidden = false; el.scrollTop = 0; wireCaseTabs();
  $("tcase-x").onclick = () => { el.hidden = true; el.innerHTML = ""; $("trophy-btn").focus(); };
  el.querySelectorAll("[data-tr]").forEach((b) => (b.onclick = () => { chime(1); openCase(b.dataset.tr); }));
  if ($("td-pin")) $("td-pin").onclick = () => { togglePin(p, focus); saveProgress(); showStats(); openCase(focus); };
}
$("trophy-btn").onclick = () => openCase(null, "trophies");
const caseTabs = () => `<div class="tc-views" role="tablist"><button class="c small${caseView === "trophies" ? " on" : ""}" type="button" role="tab" aria-selected="${caseView === "trophies"}" data-cv="trophies">🏆 Trophies</button><button class="c small${caseView === "music" ? " on" : ""}" type="button" role="tab" aria-selected="${caseView === "music"}" data-cv="music">🎵 Record player</button></div>`;
function wireCaseTabs() { $("tcase").querySelectorAll("[data-cv]").forEach((b) => (b.onclick = () => { chime(1); openCase(null, b.dataset.cv); }));
  $("tcase").querySelectorAll("[data-credits]").forEach((b) => (b.onclick = () => rollCredits(false))); }

// ---- music (music.js data, player.js audio + record player): always-there 🎵 button, the record player in the Trophy Case ----
const player = createPlayer({ getProg: () => state.prog, save: saveProgress, onChange: () => musicUi() });
const musicDeps = () => ({ getProg: () => state.prog, save: saveProgress, onOpenStore: () => { $("tcase").hidden = true; $("tcase").innerHTML = ""; showStore("record"); }, redraw: musicUi });
/** The record player view of the Trophy Case. */
function openRecords() {
  const el = $("tcase"), p = state.prog;
  el.innerHTML = `<div class="tcase-in" role="dialog" aria-label="The record player">
    <header><div class="tc-brand"><span class="tc-sig">♫</span><div><h2>The Record Player</h2><small>Science is Magic · Oracle Chamber</small></div></div>${caseTabs()}
      <button class="c small" type="button" id="tcase-x" aria-label="Close the record player">✕ Close</button></header>${recordPlayerHtml(p, player, esc)}</div>`;
  const wasHidden = el.hidden; el.hidden = false; if (wasHidden) el.scrollTop = 0; wireCaseTabs(); wireMusic(el, player, musicDeps());
  $("tcase-x").onclick = () => { el.hidden = true; el.innerHTML = ""; $("trophy-btn").focus(); };
}
/** Redraw whatever music UI is open, and the header button. */
function musicUi() {
  const s = musicOf(state.prog), mb = $("music-btn");
  mb.textContent = s.on ? (player.playing ? "🎵 Music ♪" : "🎵 Music") : "🔇 Music"; mb.classList.toggle("on", player.playing);
  if (!$("tcase").hidden && caseView === "music" && $("tcase").querySelector(".rp")) { const y = $("tcase").scrollTop; openRecords(); $("tcase").scrollTop = y; }
  if (!$("music-pop").hidden) drawMusicPop();
}
function drawMusicPop() {
  const pop = $("music-pop"), s = musicOf(state.prog), t = player.current;
  pop.innerHTML = `<div class="mp-now">${vinylSvg(t, 44, player.playing ? "spin" : "")}<div><small>${player.inBattle ? "⚔ Battle music" : s.on ? (player.playing ? "Now playing" : "Paused") : "Music is off"}</small><b>${t ? esc(t.title) : "No record on"}</b></div></div>
    <div class="rp-btns"><button class="c small" type="button" data-mu="prev" aria-label="Previous record">⏮</button><button class="c small main" type="button" data-mu="toggle" aria-label="${player.playing ? "Pause" : "Play"}">${player.playing ? "⏸" : "▶"}</button><button class="c small" type="button" data-mu="next" aria-label="Next record">⏭</button></div>
    ${musicSwitchHtml(s)}<button class="c small" type="button" id="mp-open">🎛️ Open the record player</button>`;
  wireMusic(pop, player, musicDeps());
  $("mp-open").onclick = () => { pop.hidden = true; $("music-btn").setAttribute("aria-expanded", "false"); openCase(null, "music"); };
}
$("music-btn").onclick = (e) => { e.stopPropagation(); const pop = $("music-pop"), open = pop.hidden; pop.hidden = !open; $("music-btn").setAttribute("aria-expanded", String(open));
  if (open) { const r = $("music-btn").getBoundingClientRect(); pop.style.top = Math.min(innerHeight - 250, r.bottom + 6) + "px"; pop.style.right = Math.max(8, innerWidth - r.right) + "px"; drawMusicPop(); } };
document.addEventListener("click", (e) => { const pop = $("music-pop"); if (!pop.hidden && !pop.contains(e.target) && e.target !== $("music-btn")) { pop.hidden = true; $("music-btn").setAttribute("aria-expanded", "false"); } });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("music-pop").hidden) { $("music-pop").hidden = true; $("music-btn").focus(); } });
setInterval(() => { const tm = document.querySelector(".rp-time"); if (tm && player.current) { const { t, d } = player.position, f = (x) => (isFinite(x) && x > 0 ? `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}` : "0:00"); tm.textContent = `${f(t)} / ${f(d)}`; } }, 1000);
/** Check the record tasks; announce any record unlocked just now. */
function musicNews(silent = false) {
  const fresh = checkUnlocks(state.prog); if (!fresh.length) return; saveProgress(); player.refresh(); if (silent) return;
  chime(2); const t = fresh[0]; mood.bubble(`New record: ${t.title}! ${fresh.length > 1 ? `And ${fresh.length - 1} more. ` : ""}Find it in the record player.`, 4200, "🎵");
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("tcase").hidden && $("tcollect").hidden) $("tcase-x").click(); });
if (PREVIEW) window.__trophyTest = (id = "seance", level = 1, perfect = false) => trophy(id, level, { won: true, perfect });
if (PREVIEW) window.__masterAll = () => { const p = state.prog; p.trophies = p.trophies || {}; for (const t of GAMES) { const r = (p.trophies[t.id] ||= { tier: 0, wins: {}, perfect: {} }); r.wins = { 1: t.need, 2: t.need, 3: t.need }; r.tier = Math.max(r.tier, 2); } const last = GAMES[GAMES.length - 1]; p.trophies[last.id].wins[3] = last.need - 1; trophy(last.id, 3, { won: true }); };

// ---- the end credits (credits.js): a starfield scroll timed to the credits song ----
let creditsDue = false;
function rollCredits(auto) {
  creditsDue = false; if (document.getElementById("credits")) return;
  const tc = $("tcase"); tc.hidden = true; tc.innerHTML = ""; $("music-pop").hidden = true;
  const p = state.prog, c = (p.credits ||= { rolls: 0 }); c.rolls = (c.rolls || 0) + 1; saveProgress();
  const rows = creditSections().map((s) => `<section class="cr-sec"><h3>${esc(s.h)}</h3>${s.rows.map(([r, n]) => `<div class="cr-row${r ? "" : " solo"}">${r ? `<span>${esc(r)}</span>` : ""}<b>${esc(n)}</b></div>`).join("")}</section>`).join("");
  const stars = Array.from({ length: 70 }, (_, i) => `<i style="left:${(i * 53) % 100}%;top:${(i * 37) % 100}%;--d:${((i % 9) * 0.4).toFixed(1)}s;--s:${1 + (i % 3)}px"></i>`).join("");
  const el = document.createElement("div"); el.id = "credits"; el.className = "credits"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "End credits");
  el.innerHTML = `<div class="cr-stars" aria-hidden="true">${stars}</div><button class="c small cr-x" type="button" id="cr-x" aria-label="Close the credits">✕ Close</button>
    <div class="cr-roll" id="cr-roll">
      <div class="cr-title"><small>${auto ? "Every game. Every level. You did it." : "Science is Magic presents"}</small><h2>The Oracle Chamber</h2><div class="cr-song">♫ Don't Judge a Space Kid</div></div>
      ${rows}
      <section class="cr-sec cr-thanks"><h3>Special thanks</h3><div class="cr-big">${esc(SPECIAL_THANKS.name)}</div><p>${esc(SPECIAL_THANKS.line)}</p></section>
      <section class="cr-end"><div class="cr-sig">⚛</div><h2>The End</h2><p>${esc(END_LINE)}</p>
        ${hasCrown(p) ? `<div class="cr-crown">👑 <b>The Star Crown</b><span>${auto ? "Is the Oracle's now, forever. And your new record, Don't Judge a Space Kid, is in the record player." : "The Oracle wears it, for good."}</span></div>` : ""}
        <button class="c main" type="button" id="cr-done">✦ Back to the Chamber</button></section>
    </div>`;
  document.body.append(el);
  const roll = $("cr-roll"), song = new Audio(`music/${CREDITS_SONG}.mp3`), m = musicOf(p), t0 = performance.now();
  el.song = song; song.volume = Math.max(0.2, m.vol || 0.45); player.hold(true); song.play().catch(() => {});
  let raf = 0, over = false;
  const frame = () => { const d = isFinite(song.duration) && song.duration > 0 ? song.duration : 151.6, t = song.currentTime > 0 ? song.currentTime : (performance.now() - t0) / 1000;
    const k = Math.min(1, t / (d - 4)), vh = el.clientHeight, H = roll.scrollHeight, y = vh * 0.72 - k * (vh * 0.72 + H - vh * 0.92);
    roll.style.transform = `translateY(${y.toFixed(1)}px)`; if (k >= 1 && !over) { over = true; el.classList.add("over"); } raf = requestAnimationFrame(frame); };
  if (reduced) { roll.style.position = "relative"; el.classList.add("still"); } else raf = requestAnimationFrame(frame);
  const close = () => { cancelAnimationFrame(raf); song.pause(); el.classList.add("out"); setTimeout(() => el.remove(), reduced ? 0 : 400); player.hold(false); document.removeEventListener("keydown", esc_);
    if (auto) setTimeout(() => { mood.gesture("snap"); mood.emote("cheer", { say: `${state.name}, you finished every game on every level. The whole Chamber! Look: a crown of stars, and it's mine forever. Thank you.` }); }, reduced ? 0 : 500); };
  const esc_ = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc_); $("cr-x").onclick = close; $("cr-done").onclick = close; $("cr-x").focus();
  song.addEventListener("ended", () => { el.classList.add("over"); });
  if (auto) { applyLook(); musicNews(true); }
}
