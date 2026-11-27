// The Oracle Chamber (Discord Activity): pick a system, give the Oracle your details, and she reveals the reading.
// Readings run here in the browser with the same modules the /oracle bot uses (src/modules), so results match.
import { figureSvg } from "../../src/oracle/figure.js";
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
$("teller").innerHTML = `<svg viewBox="0 0 400 300" aria-hidden="true">${figureSvg({ id: "t" })}</svg>`;
const cv = $("stars"), cx = cv.getContext("2d"); let stars = [];
function sizeSky() { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
  stars = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 })); }
function drawSky(t) { cx.clearRect(0, 0, cv.width, cv.height);
  for (const s of stars) { cx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + s.p); cx.fillStyle = s.p > 5 ? "#66E0C8" : "#FADE8C"; cx.beginPath(); cx.arc(s.x * cv.width, s.y * cv.height, s.r * devicePixelRatio, 0, 7); cx.fill(); }
  if (!reduced) requestAnimationFrame(drawSky); }
sizeSky(); addEventListener("resize", sizeSky); requestAnimationFrame(drawSky);

let typing = null;
function say(text, done) {
  clearInterval(typing); const el = $("say");
  const plain = text.replace(/\*\*/g, "");
  if (reduced) { el.textContent = plain; done && done(); return; }
  let i = 0; el.textContent = "";
  typing = setInterval(() => { el.textContent = plain.slice(0, ++i); if (i >= plain.length) { clearInterval(typing); done && done(); } }, 20);
}
const ui = (html) => { $("ui").innerHTML = html; };
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
function poof() { const p = $("poof"); p.innerHTML = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.28; return `<i style="--x:${Math.cos(a) * 110}px;--y:${Math.sin(a) * 70}px"></i>`; }).join("");
  p.classList.remove("go"); void p.offsetWidth; p.classList.add("go"); }

// ---- the conversation ----
function greet() {
  $("reading").hidden = true;
  const sys = available(MODULES), btn = (s) => `<button class="c" type="button" data-k="${s.key}">${s.emoji} ${esc(s.label)}</button>`;
  say(greeting(state.name));
  ui(`<div class="choices"><div class="group">By question</div>${sys.filter((s) => s.kind === "cast").map(btn).join("")}
    <div class="group">By birth</div>${sys.filter((s) => s.kind === "birth").map(btn).join("")}</div>`);
  $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => choose(systemByKey(b.dataset.k))));
}

function choose(sys) {
  say(askLine(sys, state.name));
  if (sys.kind === "cast") {
    ui(`<form class="form one" id="f"><label for="q">Your question (optional)<input id="q" maxlength="200" autocomplete="off" placeholder="What do I need to know about…"></label></form>
      <div class="choices"><button class="c main" type="submit" form="f">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("f").onsubmit = (e) => { e.preventDefault(); const q = $("q").value.trim(); reveal(sys, optionsFor(sys, q ? { [sys.ask || "question"]: q } : {})); };
    setTimeout(() => $("q").focus(), 50);
  } else {
    const p = state.profile;
    ui(`<form class="form" id="f">
        <label for="d">Birth date<input id="d" required placeholder="1990-04-09" value="${esc(p?.date)}"></label>
        <label for="t">Time (blank if unknown)<input id="t" placeholder="14:30" value="${esc(p && p.time !== "unknown" ? p.time : "")}"></label>
        <label for="p">Town or city, country<input id="p" required placeholder="Phoenix, USA" value="${esc(p?.place)}"></label></form>
      <div class="choices"><button class="c main" type="submit" form="f">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>
      <div class="note">${p ? "Filled in from your saved /profile. " : ""}Your details stay in this reading; nothing is posted to the channel.</div>`);
    $("f").onsubmit = (e) => { e.preventDefault();
      const o = optionsFor(sys), f = fieldsFor(sys.command, o), t = $("t").value.trim();
      o[f.date] = $("d").value.trim(); o[f.place] = $("p").value.trim();
      if (t) o[f.time] = t; else o.time_unknown = true;
      reveal(sys, o); };
  }
  $("back").onclick = greet;
}

async function reveal(sys, options) {
  ui(""); document.body.classList.add("gazing");
  say("Mmm… the mist is moving…");
  let r, err;
  try {
    const mod = MODS[sys.command];
    [r] = await Promise.all([mod.run(options, { user: state.name }), wait(1800)]);
  } catch (e) { err = e; }
  document.body.classList.remove("gazing");
  if (err) {
    say("The glass clouds over. " + (err.message || "Something went wrong."));
    ui(`<div class="choices"><button class="c main" type="button" id="again">Try again</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("again").onclick = () => choose(sys); $("back").onclick = greet; return;
  }
  poof(); await wait(600);
  const words = speech(sys.command, state.name, r.embeds[0], Math.random, r.headline);
  state.last = { sys, r, words };
  say(words, () => {
    ui(`<div class="choices"><button class="c main" type="button" id="open">📜 Read the full reading</button><button class="c" type="button" id="save">📖 Save to journal</button><button class="c" type="button" id="back">Another reading</button></div>`);
    $("open").onclick = () => showReading(state.last);
    $("save").onclick = (e) => { saveJournal(state.last); e.target.textContent = "✓ Saved"; e.target.disabled = true; };
    $("back").onclick = greet;
  });
}

// ---- the reading scroll ----
function md(s) {
  return esc(s).split("\n").map((l) => (l.startsWith("&gt; ") ? `<blockquote>${l.slice(5)}</blockquote>` : l)).join("<br>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<u>$1</u>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/<br><blockquote>/g, "<blockquote>").replace(/<\/blockquote><br>/g, "</blockquote>");
}
const svgOf = (f) => { const t = new TextDecoder().decode(f.data); return /^\s*(<\?xml|<svg)/.test(t) ? t.replace(/<script[\s\S]*?<\/script>/gi, "") : null; };
function showReading({ r, words, files }) {
  const art = (files || (r.files || []).map(svgOf)).filter(Boolean);
  $("reading-body").innerHTML = `<div class="speech">“${md(words)}”</div>` + art.map((s) => `<div class="art">${s}</div>`).join("") +
    r.embeds.map((e) => `<article class="emb${e.color === 0x66E0C8 ? " teal" : ""}">${e.title ? `<h2>${md(e.title)}</h2>` : ""}${e.description ? `<p>${md(e.description)}</p>` : ""}
      ${(e.fields || []).map((f) => `<h3>${md(f.name)}</h3><p>${md(f.value)}</p>`).join("")}${e.footer ? `<footer>${esc(e.footer.text)}</footer>` : ""}</article>`).join("");
  $("reading").hidden = false; $("reading").scrollTop = 0;
}
$("close-reading").onclick = () => { $("reading").hidden = true; };

// ---- journal (this device, per member) ----
const jKey = () => "oracle-journal:" + state.userId;
const loadJournal = () => { try { return JSON.parse(localStorage.getItem(jKey()) || "[]"); } catch { return []; } };
function saveJournal({ sys, r, words }) {
  const entry = { at: Date.now(), key: sys.key, label: sys.label, emoji: sys.emoji, title: r.embeds[0].title || sys.label, words,
    embeds: r.embeds, files: (r.files || []).map(svgOf).filter(Boolean) };
  try { localStorage.setItem(jKey(), JSON.stringify([entry, ...loadJournal()].slice(0, 20))); } catch {}
}
$("journal-btn").onclick = () => {
  const j = loadJournal();
  say(j.length ? `Your journal, ${state.name}. The last ${j.length} reading${j.length > 1 ? "s" : ""} I gave you.` : "Your journal is empty. Ask me something first.");
  ui(`<div class="jl">${j.map((e, i) => `<button class="c" type="button" data-j="${i}">${e.emoji} ${esc(String(e.title).replace(/^\P{L}+/u, ""))} · <span class="note">${new Date(e.at).toLocaleDateString()}</span></button>`).join("")}</div>
    <div class="choices"><button class="c" type="button" id="back">Back</button></div>`);
  $("ui").querySelectorAll("[data-j]").forEach((b) => (b.onclick = () => { const e = j[+b.dataset.j]; showReading({ r: { embeds: e.embeds }, words: e.words, files: e.files }); }));
  $("back").onclick = greet;
};

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
