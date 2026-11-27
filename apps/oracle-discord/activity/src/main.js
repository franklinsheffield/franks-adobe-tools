// The Oracle Chamber (Discord Activity): pick a system, give the Oracle your details, and she reveals the reading.
// Readings run here in the browser with the same modules the /oracle bot uses (src/modules), so results match.
import { figureSvg, sigilRingSvg } from "../../src/oracle/figure.js";
import { makeTable, fitSvg } from "./table.js";
import { unlockVoice, blip, isMuted, setMuted } from "./voice-sfx.js";
import { available, systemByKey, optionsFor } from "../../src/oracle/systems.js";
import { greeting, askLine, speech } from "../../src/oracle/voice.js";
import { fieldsFor } from "../../src/profiles.js";
import { MODULES } from "../../src/registry.js";
import { MODS } from "./modules.gen.js";
import { startDiscord, inDiscord, api } from "./discord.js";

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const state = { name: "traveller", userId: "guest", token: null, profile: null, last: null };

// ---- the Oracle and her sky ----
$("teller").innerHTML = `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${sigilRingSvg({ cx: 200, cy: 200, r: 196, id: "t" })}${figureSvg({ id: "t" })}</svg>`;
const table = makeTable($("table"), { reduced });
const CAST = {
  iching: "Six coins leave my hand… spinning… falling…", runes: "I loosen the pouch. Let the stones choose themselves…",
  oraclebones: "The bronze rod is hot. Listen… the shell answers with a crack…", ifa: "The chain falls. Eight seeds, open or closed…",
  astrology: "I turn the heavens back to the hour you arrived…", humandesign: "Your centres are lighting, one by one…",
  numerology: "Your numbers gather, and reduce, and reveal…", chinesezodiac: "The great wheel of twelve is turning…",
  mayan: "Thirteen and twenty, the sacred gears, interlock…", egyptian: "Ra rises over the pyramids for you…", celtic: "Your tree is growing out of the old calendar…",
};
const cv = $("stars"), cx = cv.getContext("2d"); let stars = [];
function sizeSky() { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
  stars = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 })); }
function drawSky(t) { cx.clearRect(0, 0, cv.width, cv.height);
  for (const s of stars) { cx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + s.p); cx.fillStyle = s.p > 5 ? "#66E0C8" : "#FADE8C"; cx.beginPath(); cx.arc(s.x * cv.width, s.y * cv.height, s.r * devicePixelRatio, 0, 7); cx.fill(); }
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
  say(greeting(state.name));
  ui(`<div class="choices"><div class="group">By question</div>${sys.filter((s) => s.kind === "cast").map(btn).join("")}
    <div class="group">By birth</div>${sys.filter((s) => s.kind === "birth").map(btn).join("")}</div>`);
  $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => choose(systemByKey(b.dataset.k))));
}

function choose(sys) {
  clearReading(); table.rest(sys.key); cap(sys.emoji + " " + sys.label);
  say(askLine(sys, state.name));
  if (sys.kind === "cast") {
    ui(`<form class="form one" id="f"><label for="q">Your question (optional)<input id="q" maxlength="200" autocomplete="off" placeholder="What do I need to know about…"></label></form>
      <div class="choices"><button class="c main" type="submit" form="f">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("f").onsubmit = (e) => { e.preventDefault(); const q = $("q").value.trim(); reveal(sys, optionsFor(sys, q ? { [sys.ask || "question"]: q } : {})); };
    setTimeout(() => $("q").focus(), 50);
  } else {
    const p = state.profile || {}, o0 = optionsFor(sys), f = fieldsFor(sys.command, o0), need = f.need || ["date", "place", "time"];
    const field = (id, label, ph, val, req) => `<label for="${id}">${label}<input id="${id}" ${req ? "required" : ""} placeholder="${ph}" value="${esc(val)}" autocomplete="off"></label>`;
    const rows = [field("d", "Birth date", "1990-04-09", p.date, true)];
    if (need.includes("time")) rows.push(field("t", "Time (blank if unknown)", "14:30", p.time && p.time !== "unknown" ? p.time : "", false));
    if (need.includes("place")) rows.push(field("p", "Town or city, country", "Phoenix, USA", p.place, true));
    if (need.includes("name")) rows.push(field("n", "Full birth name", "Mary Ann Smith", p.name, true));
    ui(`<form class="form${rows.length === 1 ? " one" : ""}" id="f">${rows.join("")}</form>
      <div class="choices"><button class="c main" type="submit" form="f">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>
      <div class="note">${state.profile ? "Filled in from your saved /profile. " : ""}Your details stay in this reading; nothing is posted to the channel.</div>`);
    $("f").onsubmit = (e) => { e.preventDefault();
      const o = optionsFor(sys), v = (id) => ($(id) ? $(id).value.trim() : "");
      o[f.date] = v("d");
      if (need.includes("place")) o[f.place] = v("p");
      if (need.includes("name")) o[f.name] = v("n");
      if (need.includes("time")) { if (v("t")) o[f.time] = v("t"); else o.time_unknown = true; }
      reveal(sys, o); };
  }
  $("back").onclick = greet;
}

async function reveal(sys, options) {
  ui(""); clearReading(); document.body.classList.add("gazing");
  say(CAST[sys.key] || "Mmm… the mist is moving…");
  let r, err;
  try {
    const mod = MODS[sys.command];
    [r] = await Promise.all([mod.run(options, { user: state.name }), table.cast(sys.key)]);
  } catch (e) { err = e; }
  document.body.classList.remove("gazing");
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
  state.last = { sys, r, words, files };
  say(words, () => {
    ui(`<div class="choices"><button class="c main" type="button" id="save">📖 Save to journal</button><button class="c" type="button" id="back">✦ Another reading</button>${files.length ? `<button class="c" type="button" id="big">🔍 Enlarge the art</button>` : ""}</div>`);
    $("save").onclick = (e) => { saveJournal(state.last); e.target.textContent = "✓ Saved"; e.target.disabled = true; };
    $("back").onclick = greet;
    if ($("big")) $("big").onclick = () => zoom(files[0]);
    showReading(state.last);
  });
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
function showReading({ r }) {
  $("reading-body").innerHTML = r.embeds.map((e) => `<article class="emb${e.color === 0x66E0C8 ? " teal" : ""}">${e.title ? `<h2>${md(e.title)}</h2>` : ""}${e.description ? `<p>${md(e.description)}</p>` : ""}
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
  greet();
})();
