// House tokens: every House has its own luxury token, spent only on that House's relics. The Oracle's is the 🌙 moon
// token (moonrelics.js, p.tokens / p.moonSpent); other Houses keep theirs in p.houses[<id>] = { got, spent, lv[], day, relics[] }.
// The gimmick: now and then a token from ANOTHER House turns up (falls out of the flask, rolls out of the crystal ball).
// The host says whose it is and sends it home: it's added to that House's purse, ready when you visit.
import { moonLeft } from "../moonrelics.js";

/** First win at each game level pays tokens (same table as moon tokens), plus a bonus for finishing a game's three levels. */
export const LEVEL_PAY = [0, 2, 4, 6], SERIES_PAY = 3;
/** Chance that a room award turns up a stray token from another House (one stray a day at most). */
export const STRAY_CHANCE = 0.12;

const purse = (p, id) => { p.houses = p.houses && typeof p.houses === "object" ? p.houses : {}; const h = (p.houses[id] ||= {}); h.got ||= 0; h.spent ||= 0; h.lv ||= []; h.relics ||= []; return h; };

/** Tokens of this House left to spend. */
export function tokensLeft(p, host) { return host.token.id === "moon" ? moonLeft(p) : Math.max(0, purse(p, host.id).got - purse(p, host.id).spent); }
/** Add n tokens to this House's purse. */
export function addTokens(p, host, n) { if (host.token.id === "moon") p.tokens = (p.tokens || 0) + n; else purse(p, host.id).got += n; return n; }

/** First win at this level of a game, in a House that isn't the Oracle's (hers still use levelTokens). Returns { n, series }. */
export function houseLevelTokens(p, host, gameId, level, won) {
  if (!won || !LEVEL_PAY[level]) return { n: 0, series: false };
  const h = purse(p, host.id), k = `${gameId}-${level}`; if (h.lv.includes(k)) return { n: 0, series: false }; h.lv.push(k);
  const series = [1, 2, 3].every((l) => h.lv.includes(`${gameId}-${l}`)), n = LEVEL_PAY[level] + (series ? SERIES_PAY : 0);
  h.got += n; return { n, series };
}
/** First visit of the day to a House (not the Oracle's: her first reading of the day already pays a moon). Returns 1 or 0. */
export function dailyVisit(p, host, day) {
  if (host.token.id === "moon") return 0; const h = purse(p, host.id); if (h.day === day) return 0; h.day = day; h.got += 1; return 1;
}
/** Maybe find a stray token from another House. Returns that House (the token is already sent home) or null. */
export function strayFind(p, host, hosts, day, rand = Math.random) {
  const others = hosts.filter((h) => h.id !== host.id && h.token); if (!others.length || p.strayDay === day || rand() >= STRAY_CHANCE) return null;
  const home = others[Math.floor(rand() * others.length)]; p.strayDay = day; addTokens(p, home, 1); p.strays = (p.strays || 0) + 1; return home;
}

export const ownsHouseRelic = (p, host, id) => purse(p, host.id).relics.includes(id);
/** Buy a House relic with that House's tokens. Returns the relic, or null if owned, unknown or too dear. */
export function buyHouseRelic(p, host, id) {
  const r = (host.relics || []).find((x) => x.id === id); if (!r || ownsHouseRelic(p, host, id) || tokensLeft(p, host) < r.price) return null;
  const h = purse(p, host.id); h.spent += r.price; h.relics.push(id); return r;
}
/** The token as HTML: its drawn icon when it has one (the stone is a rock), else its emoji. */
export const tokenIcon = (t) => (t && t.icon) || (t && t.emoji) || "";
/** Every owned relic of this House, drawn into the host's pane. */
export const houseRelicsHtml = (p, host) => (host.relics || []).filter((r) => ownsHouseRelic(p, host, r.id))
  .map((r) => `<svg class="mr hr-${r.id}" style="left:${r.x}%;top:${r.y}%;width:${r.w}%" viewBox="${r.vb}" aria-hidden="true">${r.art()}</svg>`).join("");

/** What the host says when a stray turns up. */
export function strayLine(host, home) {
  const t = home.token; return `${t.emoji} ${host.strayIntro || "Oh! Look what turned up:"} a ${t.name} from ${home.house}. It isn't mine, so I've sent it home. It's waiting in your ${t.purse} there.`;
}

/** The House relic shop panel (opened from the House's home menu). */
export function relicPanelHtml(p, host, esc) {
  const left = tokensLeft(p, host), t = host.token;
  return `<div class="note box-note">${tokenIcon(t)} ${left} ${esc(t.plural)} to spend. ${esc(host.relicBlurb || "")}</div>
  <div class="hr-grid">${host.relics.map((r) => { const own = ownsHouseRelic(p, host, r.id);
    return `<div class="hr-card${own ? " own" : ""}"><svg class="hr-thumb" viewBox="${r.vb}" aria-hidden="true">${r.art()}</svg><b>${r.e} ${esc(r.name)}</b><small>${esc(r.note)}</small>
      ${own ? `<span class="note">✓ In the House</span>` : `<button class="c small main" type="button" data-hrelic="${r.id}" ${left >= r.price ? "" : "disabled"}>Place it · ${tokenIcon(t)} ${r.price}</button>`}</div>`; }).join("")}</div>
  <div class="choices"><button class="c" type="button" id="hr-back">✦ Back</button></div>`;
}
export const TOKEN_CSS = `.hr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin:8px 0}
.hr-card{display:flex;flex-direction:column;gap:4px;padding:10px;border:1px solid rgba(232,154,85,.45);border-radius:12px;background:rgba(40,20,10,.35)}
.hr-card.own{border-color:#66E0C8}.hr-card small{opacity:.8;font-size:.78em;line-height:1.3}
.hr-thumb{width:100%;height:70px}
#house-relics{position:absolute;inset:0;pointer-events:none;z-index:0}#house-relics .mr{position:absolute}`;
