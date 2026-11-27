// Hidden features per House: each House hides its own set of finds (a Cabinet of Curiosities of its own), tracked in
// prog.houses[<id>].sec = [ids] and shown in that House's own drawer ("Hidden Lab", "Hidden Parlour"...). The engine
// pays, tracks, fires events and draws the drawer; a House pack only declares its finds and when they happen.
//
//   pack.secrets = {
//     label: "🔬 Hidden Lab",                         // the drawer's name (its button on the House's home menu)
//     items: [{ id, e, name, hint, pay: { gem?, token? }, rare? }],   // hint is a riddle, never the answer
//     event?(kind, data, api),                         // the engine calls this on every event below
//   }
//   Events: "home" { at } (the home menu opened), "poke" { zone, count }, "emote" { id }, "result" { room, won,
//   perfect, level }, "tap" { tap, count } (a click on any element with data-tap="<name>" in the scene, the menu
//   background or the host; count = taps on it in a row, reset after 1.5 s of quiet).
//   api: { find(id, line?), found(id), prog, at }. find() pays once and returns false when already found.
//
//   pack.menuBg = { css, html(at, { prog }) }: the House's animated background behind its home menu (aria-hidden,
//   pointer-events none except elements with class "mb-hot", which take data-tap).
import { addTokens } from "./tokens.js";

export const ALL_BONUS = { gem: 200, token: 5 };
const box = (p, hid) => { p.houses = p.houses && typeof p.houses === "object" ? p.houses : {}; const h = (p.houses[hid] ||= {}); h.sec = Array.isArray(h.sec) ? h.sec : []; return h; };
export const secretsOf = (host) => (host && host.secrets && host.secrets.items) || [];
export const secretFound = (p, host, id) => box(p, host.id).sec.includes(id);
export const secretCount = (p, host) => box(p, host.id).sec.filter((id) => secretsOf(host).some((s) => s.id === id)).length;
const pay = (p, host, x) => { p.essence = (p.essence || 0) + (x.gem || 0); if (x.token) addTokens(p, host, x.token); };
export const payLabel = (host, x) => [x.gem ? `💎 ${x.gem}` : "", x.token ? `${host.token.emoji} ${x.token}` : ""].filter(Boolean).join(" + ");

/** Record a find. Returns null if unknown or already found, else { s, pay, all } (all: the whole set, bonus paid). */
export function findSecret(p, host, id) {
  const s = secretsOf(host).find((x) => x.id === id), h = box(p, host.id); if (!s || h.sec.includes(id)) return null;
  h.sec.push(id); pay(p, host, s.pay || {}); const all = secretCount(p, host) === secretsOf(host).length && !h.secAll;
  if (all) { h.secAll = true; pay(p, host, ALL_BONUS); }
  return { s, pay: s.pay || {}, all };
}
/** The House's drawer: found finds with their name, unfound ones with their riddle. */
export function secretsPanelHtml(p, host, esc) {
  const S = secretsOf(host), n = secretCount(p, host);
  return `<div class="note box-note">${esc(host.secrets.label)}: ${n} of ${S.length} found. Each pays once; find them all for ${payLabel(host, ALL_BONUS)}.</div>
  <div class="sec-grid">${S.map((s) => { const got = secretFound(p, host, s.id);
    return `<div class="sec-card${got ? " got" : ""}${s.rare ? " rare" : ""}"><span class="sec-e" aria-hidden="true">${got ? s.e : "❔"}</span><b>${got ? esc(s.name) : "Not found yet"}</b><small>${esc(s.hint)}</small><i>${payLabel(host, s.pay || {})}</i></div>`; }).join("")}</div>
  <div class="choices"><button class="c" type="button" id="sec-back">✦ Back</button></div>`;
}
/** Tap counting for data-tap hotspots: returns the run length for this tap name. */
const runs = {};
export function tapCount(name, now = Date.now()) { const r = runs[name]; runs[name] = r && now - r.at < 1500 ? { n: r.n + 1, at: now } : { n: 1, at: now }; return runs[name].n; }
export const SECRETS_CSS = `.sec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:8px 0}
.sec-card{display:flex;flex-direction:column;gap:3px;padding:9px;border:1px dashed rgba(255,255,255,.25);border-radius:12px;background:rgba(0,0,0,.25)}
.sec-card.got{border-style:solid;border-color:var(--house-accent,#E2B04A)}.sec-card.rare.got{box-shadow:0 0 12px var(--house-accent,#E2B04A)}
.sec-e{font-size:1.5em}.sec-card small{opacity:.75;font-size:.78em;line-height:1.3}.sec-card i{font-style:normal;font-size:.78em;opacity:.85}
#ui.has-mbg{position:relative;isolation:isolate}.menu-bg{position:absolute;inset:-6px;z-index:-1;pointer-events:none;overflow:hidden;border-radius:12px;opacity:.55}
.menu-bg .mb-hot{pointer-events:auto;cursor:pointer}
@media (prefers-reduced-motion: reduce){.menu-bg *{animation:none!important}}`;
