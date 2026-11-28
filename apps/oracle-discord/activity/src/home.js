// The Chamber's home screen: the door you tap to come in (the tap also lets the Oracle's voice play, since browsers
// only allow sound after a gesture), and the menu as five tabs of cards instead of one long list of buttons.
// Guided by Frank's Front End Lab kit (web-pipeline-kit): the "community" buyer theme ("Are these my people?":
// warm welcome, inclusive "we/you" words, an easy low-risk first step, tilt cards and a magnetic main button).

/** The menu's tabs, in order. `of` picks what goes in each: systems by kind/row, rooms by row, or the study guides. */
export const HOME_TABS = [
  { id: "cards", emoji: "🃏", label: "Cards", blurb: "Decks to read and card games to play" },
  { id: "question", emoji: "❓", label: "Ask a question", blurb: "Cast coins, runes, bones or chains for one question" },
  { id: "birth", emoji: "🌌", label: "Your birth", blurb: "Readings from the day you were born" },
  { id: "play", emoji: "🎲", label: "Play & learn", blurb: "Games about real magic and real science" },
  { id: "study", emoji: "📖", label: "Study", blurb: "Your House handbook and a guide for every game: how to play, tips and the real facts" },
];
const TAB_KEY = "oracle-home-tab";
export function savedTab() { try { const t = localStorage.getItem(TAB_KEY); return HOME_TABS.some((x) => x.id === t) ? t : "cards"; } catch { return "cards"; } }
export function saveTab(t) { try { localStorage.setItem(TAB_KEY, t); } catch {} }

/** Sort systems, rooms and study guides into the tabs. Returns { tabId: [{ kind: "sys"|"room"|"study", id, emoji, label, hint }] }. */
export function homeItems(systems, rooms, study, house = null) {
  const sys = (s) => ({ kind: "sys", id: s.key, emoji: s.emoji, label: s.label, hint: s.hint || "" });
  const room = (r) => ({ kind: "room", id: r.id, emoji: r.emoji, label: r.label, hint: r.blurb || "" });
  return {
    cards: [...systems.filter((s) => s.row === "cards").map(sys), ...rooms.filter((r) => r.row === "cards").map(room)],
    question: systems.filter((s) => s.kind === "cast" && !s.row).map(sys),
    birth: systems.filter((s) => s.kind === "birth").map(sys),
    play: rooms.filter((r) => !r.row).map(room),
    study: [...(house ? [{ kind: "study", id: "house", emoji: "📖", label: house.title, hint: `${house.name}: how this House works` }] : []),
      ...study.filter((x) => rooms.some((r) => r.id === x.room)).map((x) => ({ kind: "study", id: x.room, emoji: x.emoji, label: x.name, hint: "How to play, tips and the real facts" }))],
  };
}

/** The menu's HTML. Every option is in the DOM (inactive tabs are hidden) so click wiring stays simple. */
export function homeHtml(items, tab, esc) {
  const card = (it, i) => {
    const data = it.kind === "sys" ? `data-k="${it.id}"` : it.kind === "room" ? `data-room="${it.id}"` : `data-study="${it.id}"`;
    return `<button class="hm-card${it.kind === "room" ? " game" : ""}" type="button" ${data} style="--i:${i}"><span class="hm-e" aria-hidden="true">${it.emoji}</span><span class="hm-t"><b>${esc(it.label)}</b><small>${esc(it.hint)}</small></span>${it.kind === "room" ? `<i class="hm-tag">Game</i>` : ""}</button>`;
  };
  const tabs = HOME_TABS.filter((t) => items[t.id]?.length);
  const on = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;
  return `<div class="home">
  <div class="hm-quick"><button class="c main hm-magnet" type="button" id="hm-daily">✦ Draw today's card</button><button class="c" type="button" id="hm-surprise">🎲 Surprise me</button></div>
  <div class="hm-tabs" role="tablist" aria-label="What would you like to do?">${tabs.map((t) => `<button class="hm-tab${t.id === on ? " on" : ""}" type="button" role="tab" aria-selected="${t.id === on}" aria-controls="hm-p-${t.id}" data-hm="${t.id}"><i class="hm-knob" aria-hidden="true"></i><span class="hm-de" aria-hidden="true">${t.emoji}</span> ${esc(t.label)}<em>${items[t.id].length}</em></button>`).join("")}</div>
  ${tabs.map((t) => `<div class="hm-panel" id="hm-p-${t.id}" role="tabpanel" data-panel="${t.id}"${t.id === on ? "" : " hidden"}><p class="hm-blurb">${esc(t.blurb)}</p><div class="hm-grid">${items[t.id].map(card).join("")}</div></div>`).join("")}
</div>`;
}

/** Tabs switch panels; cards tilt toward the pointer; the main button leans toward it (magnet). */
export function wireHome(root, { reduced = false, onTab = null } = {}) {
  root.querySelectorAll("[data-hm]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.hm; saveTab(id); onTab && onTab(id);
    if (!reduced) { b.classList.remove("swing"); void b.offsetWidth; b.classList.add("swing"); } // the hall of doors: the door you pick swings open
    root.querySelectorAll("[data-hm]").forEach((x) => { const on = x.dataset.hm === id; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); });
    root.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== id; });
  }));
  const tabs = [...root.querySelectorAll("[data-hm]")];
  tabs.forEach((b, i) => (b.onkeydown = (e) => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); }));
  if (reduced) return;
  root.querySelectorAll(".hm-card").forEach((c) => {
    c.onpointermove = (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty("--ry", (x * 8).toFixed(1) + "deg"); c.style.setProperty("--rx", (-y * 8).toFixed(1) + "deg"); c.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(0) + "%"); };
    c.onpointerleave = () => { c.style.removeProperty("--ry"); c.style.removeProperty("--rx"); };
  });
  const m = root.querySelector(".hm-magnet");
  if (m) { m.onpointermove = (e) => { const r = m.getBoundingClientRect(); m.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.35).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px)`; };
    m.onpointerleave = () => { m.style.transform = ""; }; }
}

/** The living backdrop behind the door: deep space, drifting nebulae, a turning zodiac wheel and a ring of planets,
 *  constellations that draw themselves, rising glyphs, shooting stars. Pure CSS/SVG; parallax follows the pointer. */
export function gateBgHtml(rnd = Math.random) {
  const stars = (n, cls) => Array.from({ length: n }, () => `<i style="left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * 100).toFixed(2)}%;--d:${(rnd() * 5).toFixed(1)}s;--s:${(0.5 + rnd() * 1.2).toFixed(2)}"></i>`).join("");
  const Z = "♈♉♊♋♌♍♎♏♐♑♒♓", P = "☉☽☿♀♂♃♄";
  const zod = [...Z].map((g, i) => { const a = (i * 30 - 75) * Math.PI / 180; return `<text x="${(Math.cos(a) * 205).toFixed(1)}" y="${(Math.sin(a) * 205 + 9).toFixed(1)}" text-anchor="middle">${g}\uFE0E</text>`; }).join("");
  const ticks = Array.from({ length: 72 }, (_, i) => `<path d="M0 -${i % 6 ? 232 : 226}V-238" transform="rotate(${i * 5})"/>`).join("");
  const plan = [...P].map((g, i) => { const a = (i * (360 / 7)) * Math.PI / 180; return `<text x="${(Math.cos(a) * 140).toFixed(1)}" y="${(Math.sin(a) * 140 + 8).toFixed(1)}" text-anchor="middle">${g}</text>`; }).join("");
  const CONST = [[[12, 18], [17, 14], [22, 17], [26, 12], [31, 15]], [[70, 20], [74, 27], [80, 24], [84, 31], [78, 36]], [[14, 72], [19, 66], [25, 70], [22, 78]], [[72, 74], [77, 69], [83, 72], [88, 66]]];
  const cons = CONST.map((pts, k) => `<g class="gb-con" style="--d:${k * 2.5}s"><polyline points="${pts.map(([x, y]) => `${x},${y}`).join(" ")}" pathLength="1"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".45"/>`).join("")}</g>`).join("");
  const glyphs = Array.from({ length: 14 }, (_, i) => `<b style="left:${(4 + rnd() * 92).toFixed(1)}%;--d:${(rnd() * 18).toFixed(1)}s;--t:${(16 + rnd() * 14).toFixed(1)}s;--x:${Math.round(rnd() * 80 - 40)}px">${"☉☽☿♀♂♃♄△▽⊕∴✶✧⚗"[i % 14]}</b>`).join("");
  const shoot = Array.from({ length: 3 }, (_, i) => `<u style="top:${(8 + rnd() * 40).toFixed(1)}%;left:${(40 + rnd() * 55).toFixed(1)}%;--d:${(2 + i * 4.3 + rnd() * 2).toFixed(1)}s"></u>`).join("");
  return `<div class="gate-bg" aria-hidden="true">
  <div class="gb-neb n1"></div><div class="gb-neb n2"></div><div class="gb-neb n3"></div>
  <div class="gb-stars far">${stars(90, "far")}</div><div class="gb-stars mid">${stars(50, "mid")}</div><div class="gb-stars near">${stars(22, "near")}</div>
  <svg class="gb-cons" viewBox="0 0 100 100" preserveAspectRatio="none">${cons}</svg>
  <div class="gb-wheel"><svg viewBox="-260 -260 520 520"><g class="gb-zod"><circle r="238"/><circle r="226"/><circle r="182"/>${ticks}${zod}</g><g class="gb-plan"><circle r="160" stroke-dasharray="2 8"/>${plan}<circle r="118"/></g><g class="gb-tri"><path d="M0 -118 L102 59 L-102 59Z"/><path d="M0 118 L102 -59 L-102 -59Z"/></g></svg></div>
  <div class="gb-glyphs">${glyphs}</div>${shoot}<div class="gb-vig"></div></div>`;
}

/** The door: shown once at start. Its tap unlocks the Oracle's voice, then she greets you out loud. */
export function gateHtml({ name = "", rank = "", streak = 0, back = false, esc, art = "" }) {
  return `${gateBgHtml()}<div class="gate-in">
  <div class="gate-sigil" aria-hidden="true"><i></i><i></i><i></i>${art}</div>
  <p class="gate-eye">Science is Magic</p>
  <h1 class="gate-title">The Oracle Chamber</h1>
  <p class="gate-sub">${back ? `Welcome back${name ? ", " + esc(name) : ""}. ${esc(rank)}${streak > 1 ? ` · 🔥 ${streak} days in a row` : ""}` : `Readings, card games and real science, with a fortune teller who talks back${name ? `. Come in, ${esc(name)}` : ""}.`}</p>
  <button class="c main gate-go" type="button" id="enter">✦ Enter the Chamber</button>
  <p class="gate-note">🔊 Sound on: your host speaks. You can mute the voice any time.</p>
</div>`;
}
