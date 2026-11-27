// The interface batch of the overhaul: the living Chamber (a window on the real sky behind the Oracle, shelves, dust),
// cinematic transitions, the card-first reading reveal, the hall of doors (CSS) and notification orbs.
// Words and shapes only; main.js places them. Everything shown is real: the local hour, the Moon's actual phase.
import { moonAge } from "./secrets.js";
import { dailyState } from "./daily.js";
import { weekOf } from "./featured.js";

const SYN = 29.530588853;
/** The part of the day for a local hour (0-23). */
export const partOfDay = (h) => (h >= 5 && h < 8 ? "dawn" : h >= 8 && h < 17 ? "day" : h >= 17 && h < 20 ? "dusk" : "night");
/** How much of the Moon's face is lit (0..1), and whether it is waxing. */
export function moonLight(at = Date.now()) {
  const age = moonAge(at);
  return { age, lit: (1 - Math.cos((2 * Math.PI * age) / SYN)) / 2, waxing: age < SYN / 2 };
}
/** The Moon's phase name. */
export function phaseName(at = Date.now()) {
  const { age } = moonLight(at), e = SYN / 8, i = Math.floor(((age + e / 2) % SYN) / e);
  return ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"][i];
}
const SKIES = { dawn: ["#f6a77c", "#7a4f9a", "#2b1c55"], day: ["#9fd4f2", "#5a8fd0", "#2f4f9a"], dusk: ["#ff9a5a", "#a23f78", "#2a1450"], night: ["#1a1446", "#0d0a2a", "#05030f"] };

/** The Moon as SVG: a lit disk with the dark side drawn over it (a fair sketch of the real phase). */
export function moonSvg(at = Date.now(), r = 11, cx = 0, cy = 0) {
  const { lit, waxing } = moonLight(at), shift = 2 * r * lit * (waxing ? -1 : 1);
  return `<g class="sc-moon"><circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#FADE8C" opacity=".12"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4ecd0"/>
<clipPath id="sc-mclip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle clip-path="url(#sc-mclip)" cx="${(cx + shift).toFixed(2)}" cy="${cy}" r="${r + 0.4}" fill="#0d0a22" opacity=".92"/></g>`;
}

/** The scene behind the Oracle: an arched window on the sky now, a shelf of jars and books, hanging herbs, dust motes. */
export function sceneHtml(at = Date.now(), { motes = 14, rnd = Math.random } = {}) {
  const d = new Date(at), part = partOfDay(d.getHours()), [a, b, c] = SKIES[part], dark = part === "night" || part === "dusk";
  const stars = dark ? Array.from({ length: 14 }, (_, i) => `<circle class="sc-star" style="--d:${(i % 5) * 0.6}s" cx="${(-22 + rnd() * 44).toFixed(1)}" cy="${(-30 + rnd() * 34).toFixed(1)}" r="${(0.4 + rnd() * 0.7).toFixed(2)}" fill="#fff"/>`).join("") : "";
  const rays = Array.from({ length: 8 }, (_, i) => `<path d="M0 -9.5 L.8 -13.5 L-.8 -13.5Z" transform="rotate(${i * 45})" fill="#fff3b0" opacity=".45"/>`).join("");
  const sky = part === "day" ? `<g transform="translate(10 -18)"><g class="sc-rays">${rays}</g><circle r="12" fill="#fff3b0" opacity=".25" class="sc-halo"/><circle r="7" fill="#fff3b0"/></g>` : `<g class="sc-moonbob">${moonSvg(at, 7, 9, -18)}</g>`;
  // moving weather: clouds drift across, birds cross by day, a shooting star at night, fireflies over the hills after dark
  const cloud = (y, s, d, t, o) => `<g class="sc-cloud" style="--d:${d}s;--t:${t}s" opacity="${o}"><g transform="translate(0 ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="9" ry="3.6" fill="#fff"/><ellipse cx="-5" cy="-1.6" rx="5" ry="3.2" fill="#fff"/><ellipse cx="4" cy="-2.4" rx="5.5" ry="3.8" fill="#fff"/></g></g>`;
  const clouds = part === "night" ? cloud(-8, 0.9, -11, 46, 0.12) + cloud(4, 0.7, -30, 58, 0.09) : cloud(-26, 1, -6, 34, part === "day" ? 0.85 : 0.5) + cloud(-6, 0.8, -21, 42, part === "day" ? 0.7 : 0.4) + cloud(8, 0.6, -2, 50, part === "day" ? 0.6 : 0.35);
  const birds = part === "day" || part === "dawn" ? `<g class="sc-birds" fill="none" stroke="#1d2a44" stroke-width=".9" stroke-linecap="round"><path class="sc-bird" d="M-3 0 Q-1.5 -1.6 0 0 Q1.5 -1.6 3 0"/><path class="sc-bird" style="--d:.2s" d="M2 4 Q3.2 2.8 4.4 4 Q5.6 2.8 6.8 4"/><path class="sc-bird" style="--d:.4s" d="M-6 5 Q-4.8 3.8 -3.6 5 Q-2.4 3.8 -1.2 5"/></g>` : "";
  const shoot = dark ? `<g class="sc-shoot"><path d="M0 0 L-14 6" stroke="url(#sc-trail)" stroke-width="1.1" stroke-linecap="round"/><circle r=".9" fill="#fff"/></g>` : "";
  const flies = part === "night" ? Array.from({ length: 6 }, (_, i) => `<circle class="sc-fly" style="--d:${(i * 0.9).toFixed(1)}s;--x:${(rnd() * 6 - 3).toFixed(1)}px" cx="${(-20 + rnd() * 40).toFixed(1)}" cy="${(24 + rnd() * 10).toFixed(1)}" r=".8" fill="#e6ff9a"/>`).join("") : "";
  const win = `<svg class="sc-window" viewBox="-30 -42 60 84" aria-hidden="true"><defs><linearGradient id="sc-sky" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
<linearGradient id="sc-trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="sc-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="sc-arch"><path d="M-24 40V-14a24 24 0 0 1 48 0V40z"/></clipPath></defs>
<g clip-path="url(#sc-arch)"><rect x="-30" y="-42" width="60" height="84" fill="url(#sc-sky)"/><g class="sc-skyshift">${stars}</g>${sky}${clouds}${birds}${shoot}<path class="sc-hills" d="M-30 40 L-30 22 Q-14 12 0 20 T30 16 L30 40z" fill="#0a0718" opacity=".85"/>${flies}<rect class="sc-glint" x="-60" y="-42" width="22" height="84" fill="url(#sc-glint)" transform="skewX(-18)"/></g>
<path d="M-24 40V-14a24 24 0 0 1 48 0V40z" fill="none" stroke="var(--gold)" stroke-width="2"/><path d="M0 -38V40M-24 6H24" stroke="var(--gold)" stroke-width="1.2" opacity=".7"/>
<rect x="-28" y="38" width="56" height="4" rx="1" fill="var(--gold)" opacity=".8"/></svg>`;
  const jar = (x, h, col) => `<rect x="${x}" y="${-h}" width="8" height="${h}" rx="2" fill="${col}" opacity=".55"/><rect x="${x + 1.5}" y="${-h - 2}" width="5" height="2.5" fill="#6b4a2a"/>`;
  const book = (x, h, col) => `<rect x="${x}" y="${-h}" width="4" height="${h}" fill="${col}" opacity=".7"/>`;
  const shelf = `<svg class="sc-shelf" viewBox="0 -24 80 28" aria-hidden="true">${jar(2, 14, "#66E0C8")}${jar(12, 10, "#FF4FB3")}${book(24, 18, "#7a3a2a")}${book(28.5, 16, "#2e4a7a")}${book(33, 19, "#5a2e6a")}${book(37.5, 15, "#7a6a2a")}<circle cx="50" cy="-7" r="7" fill="#e8e0c8" opacity=".35"/><circle cx="48" cy="-8" r="1.4" fill="#000" opacity=".5"/><circle cx="52.5" cy="-8" r="1.4" fill="#000" opacity=".5"/>${jar(62, 12, "#E2B04A")}<rect x="0" y="0" width="80" height="3" fill="#4a3020"/></svg>`;
  const herbs = `<svg class="sc-herbs" viewBox="0 0 40 40" aria-hidden="true"><path d="M2 2H38" stroke="#4a3020" stroke-width="1.5"/>${[6, 16, 27, 35].map((x, i) => `<g class="sc-herb" style="--d:${i * 0.7}s"><path d="M${x} 2v${10 + (i % 2) * 6}" stroke="#5c7a3a"/><ellipse cx="${x}" cy="${14 + (i % 2) * 6}" rx="3" ry="6" fill="#6f9448" opacity=".7"/></g>`).join("")}</svg>`;
  const dust = Array.from({ length: motes }, (_, i) => `<i style="--x:${(rnd() * 100).toFixed(0)}%;--y:${(30 + rnd() * 60).toFixed(0)}%;--d:${(rnd() * 9).toFixed(1)}s;--t:${(9 + rnd() * 9).toFixed(1)}s"></i>`).join("");
  return `<div class="sc sc-${part}" data-part="${part}" title="${part === "day" ? "Daylight outside" : `Tonight's moon: ${phaseName(at)}, ${Math.round(moonLight(at).lit * 100)}% lit`}">${win}${shelf}${herbs}<div class="sc-dust">${dust}</div><div class="sc-light"></div></div>`;
}

// ---- cinematic transitions: a short overlay over the stage while the content swaps underneath ----
/** door: curtains part · smoke: mist clears · shimmer: a gold sweep · page: a page turns. */
export const CINE = { room: "door", reading: "smoke", store: "shimmer", home: "smoke", book: "page" };
export const cineHtml = (kind) => kind === "door" ? `<i class="cn-l"></i><i class="cn-r"></i><b class="cn-sigil">✦</b>` : kind === "smoke" ? `<i></i><i></i><i></i>` : kind === "shimmer" ? `<i class="cn-sweep"></i>` : `<i class="cn-page"></i>`;

// ---- card-first readings: the result arrives as a card that flips over, then the words follow ----
const short = (s, n) => { s = String(s || "").replace(/\*\*|__|\*/g, "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
/** The reading card's facts: up to 3 field names with their first short phrase (data only). */
export function cardFacts(r, n = 3) {
  const f = (r.embeds || []).flatMap((e) => e.fields || []);
  return f.slice(0, n).map((x) => ({ k: short(x.name, 28), v: short(String(x.value).split(/[.\n]/)[0], 46) }));
}
export function readingCardHtml(sys, r, hl, esc) {
  const facts = cardFacts(r), title = String((r.embeds && r.embeds[0] && r.embeds[0].title) || sys.label).replace(/^[^\p{L}\p{N}]+/u, "") || sys.label;
  return `<div class="rc-wrap"><button class="rc" type="button" id="rc" aria-label="Your reading card: ${esc(short(hl, 80))}. Tap for the full written reading.">
<span class="rc-back" aria-hidden="true"><b>✦</b></span>
<span class="rc-face"><span class="rc-e" aria-hidden="true">${sys.emoji}</span><span class="rc-sys">${esc(sys.label)}</span><b class="rc-title">${esc(short(title, 60))}</b><span class="rc-hl">${esc(short(hl, 110))}</span>
${facts.length ? `<span class="rc-facts">${facts.map((x) => `<span><em>${esc(x.k)}</em>${esc(x.v)}</span>`).join("")}</span>` : ""}<small>Tap for the full reading</small></span></button></div>`;
}

// ---- notification orbs: small glowing dots where something new is waiting ----
export const DAILY_ROOMS = ["alchemy", "calendar", "decoder", "duel", "flametest", "grimoire", "memory", "rummy", "seance", "stars", "timeline"];
const today = (at) => { const d = new Date(at); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
/** What is waiting: today's card, each game's daily, a new store week. Data from the player's own progress only. */
export function orbsFor(p, rooms = DAILY_ROOMS, at = Date.now()) {
  const games = rooms.filter((id) => !dailyState(p, id, new Date(at).toISOString().slice(0, 10)).played);
  const card = (p.cardDay || "") !== today(at), store = (p.wkSeen ?? -1) !== weekOf(at);
  return { card, games, store, total: (card ? 1 : 0) + games.length + (store ? 1 : 0) };
}
export const markCard = (p, at = Date.now()) => { p.cardDay = today(at); };
export const markStore = (p, at = Date.now()) => { p.wkSeen = weekOf(at); };
export const orbHtml = (n = 0, label = "") => `<i class="orb" aria-hidden="true"${n > 1 ? ` data-n="${n}"` : ""}${label ? ` title="${label}"` : ""}></i>`;
