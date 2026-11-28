// Magister Vell's toys in the Alchemist's House: no scores, just experiments for fun.
//   🧪 Your element: your birthday counted along the periodic table, with a glowing tile and its real light.
//   ⚗️ Potion mixer: drag real salts into a flask, stir, then flame-test the mix (with cobalt glass for the sodium trap).
//   🧱 Wall of curiosities: all 118 elements; tap one for one weird, true fact and its note.
// On the House's "Just for fun" tab (row "toy", house "alchemist"); progress in prog.rooms[id].
import { ELEMENTS, CATS, bySym, lightOf, birthElement, parseDM } from "./elements.js";
import { SAMPLES } from "../flametest/data.js";
import { TOY_CSS } from "./style.js";
import { shareToy } from "./share.js";
import * as sfx from "./sfx.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("toy-style")) return; const s = document.createElement("style"); s.id = "toy-style"; s.textContent = TOY_CSS; document.head.append(s); };
const toyOf = (p, id) => ((p.rooms ||= {})[id] ||= { plays: 0 });
// Vell and the Oracle are the same person, which Vell hides badly.
const SLIPS = ["I'd ask the stars about your element, but I'm a scientist. The Oracle does stars. I've heard. From her.", "These goggles have one lens a bit fogged. Old injury. To the goggles.",
  "Funny, the Oracle's orb is the same colour as copper's flame. Coincidence. Pure coincidence."];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ---- drawing ----
/** One big glowing tile. */
export function tileSvg(e, cls = "") {
  const c = CATS[e.cat].col;
  return `<svg viewBox="0 0 120 140" class="ty-tile ${cls}" role="img" aria-label="${e.name}, element ${e.z}" style="--c:${c}"><defs><radialGradient id="ty-tg${e.z}" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="#120c1c"/></radialGradient></defs>
  <rect x="6" y="6" width="108" height="128" rx="10" fill="url(#ty-tg${e.z})" stroke="${c}" stroke-width="2.5"/><text x="16" y="28" font-size="15" fill="#fff" font-family="'Cinzel', serif">${e.z}</text>
  <text x="60" y="86" text-anchor="middle" font-size="${e.s.length > 1 ? 44 : 52}" font-weight="700" fill="#fff" font-family="Georgia, 'Cormorant Garamond', serif">${e.s}</text>
  <text x="60" y="110" text-anchor="middle" font-size="${e.name.length > 10 ? 10 : 12}" fill="#f2ecff">${e.name}</text><text x="60" y="124" text-anchor="middle" font-size="7.5" fill="${c}">${CATS[e.cat].name.replace(/ \(.*/, "")}</text></svg>`;
}
/** Its light: a flame on a burner, a glowing discharge tube, or a sealed lab vial. */
export function lightSvg(e, cls = "") {
  const L = lightOf(e), c = L.hex;
  if (L.kind === "glow") return `<svg viewBox="0 0 80 140" class="ty-light ty-tube ${cls}" style="--c:${c}" aria-hidden="true"><rect x="30" y="10" width="20" height="112" rx="10" fill="#1a1726" stroke="#8c86a6"/>
    <rect class="ty-gas" x="33" y="16" width="14" height="100" rx="7" fill="${c}"/><rect x="26" y="4" width="28" height="10" rx="3" fill="#6b6580"/><rect x="26" y="118" width="28" height="10" rx="3" fill="#6b6580"/></svg>`;
  if (L.kind === "lab") return `<svg viewBox="0 0 80 140" class="ty-light ${cls}" aria-hidden="true"><path d="M28 30H52V108A12 12 0 0 1 28 108Z" fill="#221d30" stroke="#8c86a6"/><rect x="24" y="22" width="32" height="10" rx="2" fill="#6b6580"/>
    <circle class="ty-atom" cx="40" cy="86" r="3" fill="#e6e0ff"/><text x="40" y="132" text-anchor="middle" font-size="9" fill="#a79fc4">lab only</text></svg>`;
  return `<svg viewBox="0 0 80 140" class="ty-light ty-burner ${cls}" style="--c:${c}" aria-hidden="true"><g class="ty-fls"><path class="ty-fo" d="M40 18C52 40 56 62 50 82C46 92 34 92 30 82C24 62 28 40 40 18Z" fill="${c}"/>
    <path class="ty-fi" d="M40 46C46 60 47 72 44 82C42 87 38 87 36 82C33 72 34 60 40 46Z" fill="${L.kind === "flame" ? "#fff" : "#bfe0ff"}" opacity=".75"/></g>
    <rect x="34" y="88" width="12" height="34" fill="#9aa0ad"/><rect x="22" y="120" width="36" height="8" rx="3" fill="#6b707c"/></svg>`;
}

/** The colour a mix of salts paints a flame, and what cobalt glass lets through. Sodium swamps everything. */
export function mixFlame(ids) {
  const S = ids.map((id) => SAMPLES.find((s) => s.id === id)).filter(Boolean); if (!S.length) return null;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), out = (a) => "#" + a.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const avg = (cols, w) => { const t = w.reduce((a, b) => a + b, 0); return out([0, 1, 2].map((k) => cols.reduce((a, c, i) => a + hex(c)[k] * w[i], 0) / t)); };
  const na = S.some((s) => s.id === "na");
  const flame = avg(S.map((s) => s.flame[1]), S.map((s) => (s.id === "na" ? (S.length > 1 ? 6 : 1) : 1)));
  const through = S.filter((s) => s.cobaltHex);
  const cobalt = through.length ? avg(through.map((s) => s.cobaltHex), through.map(() => 1)) : null;
  return { S, flame, na, cobalt, words: S.map((s) => s.colour) };
}

// ---- the rooms ----
const toyBase = (id, label, emoji, blurb) => ({ id, label, emoji, blurb, row: "toy", house: "alchemist" });

export const myelement = {
  ...toyBase("myelement", "Your element", "🧪", "Your birthday, counted along the periodic table, glowing in its real colour"),
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, greet, tableEl, emote } = ctx; styleOnce();
    const R = toyOf(state.prog, "myelement");
    const prof = (state.profile || {}).date || "", iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(prof);
    let date = R.date || (iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : "");
    const draw = (e) => { tableEl.className = "table toy-table"; tableEl.innerHTML = e ? `<div class="ty-pair on">${tileSvg(e, "glow")}${lightSvg(e, "lit")}</div>` : `<div class="ty-pair">${tileSvg(bySym("H"))}</div>`; };
    function ask(msg) {
      clearReading(); cap("🧪 Your element"); draw(R.z ? ELEMENTS[R.z - 1] : null);
      say(msg || (R.z ? pick(["Another birthday? I've got 118 elements and all day.", "Whose element shall we light?", Math.random() < 0.3 ? pick(SLIPS) : "Burner's on."])
        : `Here's a game of counting, ${state.name}, not fortune: 1 January is hydrogen, 2 January helium, and on along the table. After oganesson, number 118, we start again at hydrogen. Give me a birthday.`));
      ui(`<form class="form one" id="ty-f"><label for="ty-d">Birthday (DD/MM/YYYY, the year is optional)<input id="ty-d" required autocomplete="off" placeholder="09/04/1990" value="${esc(date)}"></label></form>
        <div class="choices"><button class="c main" type="button" id="ty-go">🔥 Find my element</button><button class="c" type="button" id="back">✦ Back</button></div><p class="note" id="ty-msg" role="alert"></p>`);
      $("ty-f").onsubmit = (e) => { e.preventDefault(); $("ty-go").click(); };
      $("ty-go").onclick = () => { const v = $("ty-d").value.trim(), dm = parseDM(v); if (!dm) { $("ty-msg").textContent = "Please use DD/MM/YYYY, like 09/04/1990."; return; } date = v; show(dm); };
      $("back").onclick = greet;
    }
    function show(dm) {
      const b = birthElement(dm.d, dm.m), e = b.el, L = lightOf(e); R.date = date; R.z = e.z; R.plays++; saveProgress();
      clearReading(); cap(`🧪 ${e.name}`); draw(e); sfx.reveal(); setTimeout(() => (L.kind === "glow" ? sfx.buzz() : L.kind === "lab" ? sfx.glass() : sfx.flame()), 500);
      emote && emote("joy", { quiet: true });
      say(`${dm.d} ${MONTHS[dm.m - 1]} is day ${b.day} of the year${b.lap > 1 ? `, lap ${b.lap} round the table` : ""}: element ${e.z}, ${e.name}! ${e.fact}`);
      ui(`<div class="ty-card"><p><b>${e.z} · ${e.s} · ${esc(e.name)}</b> · ${esc(CATS[e.cat].name)}</p><p>${esc(e.fact)}</p><p>${esc(L.line)}</p>
        <p class="note">How it's counted: day ${b.day} of a 366-day year${b.lap > 1 ? `, minus ${(b.lap - 1) * 118} for each full lap of the table` : ""}. A bit of fun with numbers; elements don't know your birthday.</p></div>
        <div class="choices"><button class="c main" type="button" id="ty-fire">${L.kind === "glow" ? "⚡ Switch the tube on" : L.kind === "lab" ? "🔍 Look at the vial" : "🔥 Flame test it"}</button><button class="c" type="button" id="ty-post">📤 Post to the channel</button></div>
        <div class="choices"><button class="c" type="button" id="ty-again">📅 Another birthday</button><button class="c" type="button" id="back">✦ Back</button></div><p class="note" id="ty-msg" aria-live="polite"></p>`);
      $("ty-fire").onclick = () => { draw(e); L.kind === "glow" ? sfx.buzz() : L.kind === "lab" ? sfx.glass() : sfx.flame(); };
      $("ty-post").onclick = () => shareToy(state, { title: `${state.name}'s element: ${e.name}`, color: CATS[e.cat].col,
        lines: [`🧪 ${e.z} · ${e.s} · ${e.name} (${CATS[e.cat].name})`, e.fact, L.line, `Birthday ${String(dm.d).padStart(2, "0")}/${String(dm.m).padStart(2, "0")} = day ${b.day} of the year, counted along the periodic table.`, "Lit by Magister Vell, the Alchemist's House."] }, (t) => { $("ty-msg").textContent = t; });
      $("ty-again").onclick = () => ask("Next birthday, please.");
      $("back").onclick = greet;
    }
    ask();
  },
};

export const potion = {
  ...toyBase("potion", "Potion mixer", "⚗️", "Drag real salts into a flask, stir, and flame-test the mix. No score"),
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, greet, tableEl } = ctx; styleOnce();
    const R = toyOf(state.prog, "potion"); R.tried ||= []; let flask = [], cobalt = false, lit = false;
    const liquid = () => (flask.includes("cu") ? "#3fb8a8" : "#cfe8ff");
    const jar = (s) => `<button class="ty-jar" type="button" data-salt="${s.id}" draggable="false" title="${esc(s.salt)}" style="--c:${s.flame[1]}"><i></i><b>${s.sym}</b><small>${esc(s.salt.replace(/ \(.*/, ""))}</small></button>`;
    function draw(anim = "") {
      const m = lit ? mixFlame(flask) : null, fc = m ? (cobalt ? m.cobalt || "#22245a" : m.flame) : null, lvl = 40 + flask.length * 10;
      tableEl.className = "table toy-table";
      tableEl.innerHTML = `<div class="ty-lab ${anim}"><svg viewBox="0 0 200 170" class="ty-flask" aria-label="The flask"><defs><clipPath id="ty-fc"><path d="M84 20V62L48 140A10 10 0 0 0 57 154H143A10 10 0 0 0 152 140L116 62V20Z"/></clipPath></defs>
        <g clip-path="url(#ty-fc)"><rect class="ty-liq" x="40" y="${154 - lvl}" width="120" height="${lvl}" fill="${liquid()}" opacity=".55"/>
        ${flask.length ? Array.from({ length: 8 }, (_, k) => `<circle class="ty-bub" cx="${70 + k * 8}" cy="150" r="${1.5 + (k % 3)}" style="--d:${(k * 0.23).toFixed(2)}s"/>`).join("") : ""}</g>
        <path d="M84 20V62L48 140A10 10 0 0 0 57 154H143A10 10 0 0 0 152 140L116 62V20Z" fill="none" stroke="#dfe8ff" stroke-width="2.5"/><rect x="80" y="14" width="40" height="7" rx="3" fill="#dfe8ff"/>
        ${flask.map((id, k) => `<text x="${100 + (k - (flask.length - 1) / 2) * 22}" y="${150 - lvl / 2}" text-anchor="middle" font-size="11" fill="#0d1b2a" font-weight="700">${SAMPLES.find((s) => s.id === id).sym}</text>`).join("")}</svg>
        ${lit ? `<svg viewBox="0 0 80 140" class="ty-light ty-burner lit" style="--c:${fc}" aria-hidden="true"><g class="ty-fls"><path class="ty-fo" d="M40 18C52 40 56 62 50 82C46 92 34 92 30 82C24 62 28 40 40 18Z" fill="${fc}"/></g><rect x="34" y="88" width="12" height="34" fill="#9aa0ad"/><rect x="22" y="120" width="36" height="8" rx="3" fill="#6b707c"/></svg>${cobalt ? `<div class="ty-cobalt" aria-hidden="true"></div>` : ""}` : ""}</div>`;
    }
    const add = (id) => {
      if (flask.length >= 3) { say("Three salts is plenty. Empty the flask first, or we'll have a muddy flame and a muddier lab book."); return; }
      if (flask.includes(id)) { say("That one's already in. More of it only makes the same colour."); return; }
      flask.push(id); lit = false; sfx.pour(); setTimeout(() => sfx.bubbles(4), 300); draw("plop");
      const s = SAMPLES.find((x) => x.id === id); say(id === "cu" ? `Copper(II) chloride turns the water blue-green: the colour of copper ions in water. ${s.use}` : `${s.salt[0].toUpperCase() + s.salt.slice(1)} dissolves without a colour. Its secret shows in the flame. ${s.use}`);
      view(); };
    function view() {
      cap("⚗️ Potion mixer" + (flask.length ? ` · ${flask.length} / 3 salts` : ""));
      ui(`<div class="ty-shelf" aria-label="Salts: drag one into the flask, or tap it">${SAMPLES.map(jar).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="ty-fire"${flask.length ? "" : " disabled"}>🔥 Flame test</button><button class="c" type="button" id="ty-stir"${flask.length ? "" : " disabled"}>🥄 Stir</button>
          <button class="c" type="button" id="ty-cob"${lit ? "" : " disabled"}>🔵 ${cobalt ? "Lower" : "Hold up"} cobalt glass</button><button class="c" type="button" id="ty-empty"${flask.length ? "" : " disabled"}>🚰 Empty</button></div>
        <div class="choices"><button class="c" type="button" id="back">✦ Back</button></div><p class="note">Drag a jar onto the flask (or tap it). Mixes tried: ${R.tried.length}. Never taste the potions. Barium salts are poisonous.</p>`);
      $("ui").querySelectorAll("[data-salt]").forEach(wireJar);
      if ($("ty-fire")) $("ty-fire").onclick = fire;
      $("ty-stir").onclick = () => { sfx.stir(); setTimeout(() => sfx.bubbles(8), 200); draw("swirl"); say(pick(["Stir, stir. The bubbles are just air from the rod: dissolving salt doesn't fizz.", "Round and round. Stirring helps it dissolve faster, nothing more mystical.", Math.random() < 0.3 ? pick(SLIPS) : "Gently! Glass is glass."])); };
      $("ty-cob").onclick = () => { cobalt = !cobalt; sfx.glass(); draw(); const m = mixFlame(flask);
        say(cobalt ? (m.cobalt ? `Through cobalt-blue glass${m.na ? ", sodium's yellow vanishes," : ""} the flame looks ${m.S.filter((s) => s.cobaltHex).map((s) => `${s.cobalt} (${s.name.toLowerCase()})`).join(", ")}. Chemists use this to see past sodium.` : "Cobalt glass blocks sodium's yellow completely. Nothing else in this mix shows a colour through it.") : "Glass down. Back to the naked flame."); view(); };
      $("ty-empty").onclick = () => { flask = []; lit = false; cobalt = false; sfx.drain(); draw("drain"); say("Down the sink. In a real lab, check what you can pour away first!"); view(); };
      $("back").onclick = greet;
    }
    function fire() {
      lit = true; cobalt = false; sfx.flame(); const m = mixFlame(flask), key = [...flask].sort().join("+");
      if (!R.tried.includes(key)) { R.tried.push(key); R.plays++; saveProgress(); }
      draw("lit");
      const has = (id) => flask.includes(id);
      say(flask.length === 1 ? `${m.S[0].name}: ${m.S[0].colour}. ${m.S[0].fact}`
        : m.na ? "Yellow. Sodium's yellow swamps every other colour, the classic trap. Hold up the cobalt glass to see what it's hiding."
        : has("li") && has("sr") ? "Two crimsons together: lithium and strontium look almost the same by eye. A spectroscope tells them apart: lithium has one red line, strontium several red bands."
        : has("k") && flask.length > 1 ? `Mostly ${m.words.filter((w, i) => m.S[i].id !== "k").join(" and ")}: potassium's pale lilac is easily drowned out. Cobalt glass helps.`
        : `Both colours at once: ${m.words.join(" and ")}. Each metal gives off its own light, and your eye blends them.`);
      view();
    }
    function wireJar(b) {
      let ghost = null, moved = false;
      b.onclick = () => { if (!moved) add(b.dataset.salt); moved = false; };
      b.onpointerdown = (e) => { moved = false; const sx = e.clientX, sy = e.clientY;
        const move = (ev) => { if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { moved = true; ghost = b.cloneNode(true); ghost.classList.add("ty-ghost"); document.body.append(ghost); }
          if (ghost) { ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; const fl = tableEl.querySelector(".ty-flask"); fl && fl.classList.toggle("hot", over(fl, ev)); } };
        const up = (ev) => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); if (!ghost) return; const fl = tableEl.querySelector(".ty-flask"); ghost.remove(); ghost = null; if (fl && over(fl, ev)) add(b.dataset.salt); else fl && fl.classList.remove("hot"); };
        addEventListener("pointermove", move); addEventListener("pointerup", up); };
    }
    const over = (el, ev) => { const r = el.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; };
    clearReading(); draw();
    say(R.plays ? pick(["Clean flask, fresh salts. Mix me something pretty.", "Back for more colours? Excellent. Goggles."]) : `My potion bench, ${state.name}, no score, no wrong answers. These are real salts from my flame bench. Drop up to three into the flask, stir, then flame-test the mix and see what each metal does to the colour.`);
    view();
  },
};

export const curiowall = {
  ...toyBase("curiowall", "Wall of curiosities", "🧱", "All 118 elements. Tap one for a weird, true fact"),
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, greet, tableEl } = ctx; styleOnce();
    const R = toyOf(state.prog, "curiowall"); R.seen ||= [];
    const draw = (e) => { tableEl.className = "table toy-table"; tableEl.innerHTML = `<div class="ty-pair on">${tileSvg(e, "glow")}${lightSvg(e, "lit")}</div>`; };
    const cell = (e) => `<button type="button" class="ty-cell${R.seen.includes(e.z) ? " seen" : ""}" data-z="${e.z}" style="grid-row:${e.place[0] + (e.place[0] > 7 ? 1 : 0)};grid-column:${e.place[1]};--c:${CATS[e.cat].col}" aria-label="${e.z} ${esc(e.name)}"><small>${e.z}</small>${e.s}</button>`;
    function tap(z) {
      const e = ELEMENTS[z - 1]; if (!R.seen.includes(z)) { R.seen.push(z); R.plays++; saveProgress(); }
      sfx.tile(e.z, e.cat); draw(e); cap(`🧱 Wall of curiosities · ${R.seen.length} / 118 tapped`);
      say(`${e.name}, number ${e.z}. ${e.fact}${R.seen.length === 118 ? " And that's every element on the wall! You've read the whole universe's ingredient list." : ""}`);
      const b = $("ui").querySelector(`[data-z="${z}"]`); if (b) { b.classList.add("seen", "ping"); setTimeout(() => b.classList.remove("ping"), 700); }
    }
    clearReading(); draw(bySym(R.last || "Au"));
    cap(`🧱 Wall of curiosities · ${R.seen.length} / 118 tapped`);
    say(R.seen.length ? pick(["Back at the wall! Tap anything. Even the radioactive ones are safe at this distance.", Math.random() < 0.3 ? pick(SLIPS) : "Every tile is a real element with a real oddity."]) : `This is my wall of curiosities, ${state.name}: every element there is, 118 of them, each with one strange and true fact. Tap away. The colours are the families.`);
    ui(`<div class="ty-wall" role="group" aria-label="The periodic table">${ELEMENTS.map(cell).join("")}</div>
      <div class="ty-legend">${Object.entries(CATS).map(([, c]) => `<span><i style="background:${c.col}"></i>${esc(c.name.replace(/ \(.*/, ""))}</span>`).join("")}</div>
      <div class="choices"><button class="c main" type="button" id="ty-rand">🎲 Surprise me</button><button class="c" type="button" id="back">✦ Back</button></div>`);
    $("ui").querySelectorAll("[data-z]").forEach((b) => (b.onclick = () => { R.last = ELEMENTS[+b.dataset.z - 1].s; tap(+b.dataset.z); }));
    $("ty-rand").onclick = () => { const left = ELEMENTS.filter((e) => !R.seen.includes(e.z)), e = pick(left.length ? left : ELEMENTS); R.last = e.s; tap(e.z); $("ui").querySelector(`[data-z="${e.z}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); };
    $("back").onclick = greet;
  },
};

export const ALCHEMIST_TOYS = [myelement, potion, curiowall];
