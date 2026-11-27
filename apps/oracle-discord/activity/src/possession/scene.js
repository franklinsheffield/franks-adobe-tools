// Possession on the table: the Story book. Each winning line is written in with an ink stroke while a planchette glides
// under it; spirit wisps drift over the page. Colours come from the shelf (shop.js): ink + page.
import { colours } from "./shop.js";

const planchette = `<svg class="pz-pl" viewBox="0 0 60 70" aria-hidden="true"><path d="M30 4 C50 4 58 22 54 40 C50 56 38 66 30 66 C22 66 10 56 6 40 C2 22 10 4 30 4Z" fill="#f6e7c8" stroke="#6b4a2a" stroke-width="3"/><circle cx="30" cy="30" r="9" fill="rgba(184,240,255,.35)" stroke="#6b4a2a" stroke-width="2.5"/><circle cx="18" cy="56" r="3" fill="#6b4a2a"/><circle cx="42" cy="56" r="3" fill="#6b4a2a"/></svg>`;

/** The page: title, lines so far (the newest one is written in), and the question being asked. */
export function bookHtml({ look, title = "", lines = [], ask = "", fresh = false, done = false, esc = (s) => s } = {}) {
  const c = colours(look), n = lines.length;
  return `<div class="pz-book${done ? " done" : ""}" style="--ink:${c.ink};--p1:${c.paper[0]};--p2:${c.paper[1]}">
    <i class="pz-wisp w1"></i><i class="pz-wisp w2"></i><i class="pz-wisp w3"></i>
    <div class="pz-title">${title ? esc(title) : "~ a tale ~"}</div>
    <div class="pz-lines">${lines.map((l, k) => `<p class="pz-l${fresh && k === n - 1 ? " new" : ""}">${esc(l)}</p>`).join("") || `<p class="pz-l pz-empty">The page waits for its first words…</p>`}</div>
    ${ask ? `<div class="pz-ask">✒️ ${esc(ask)}</div>` : ""}
    ${fresh ? planchette : ""}
  </div>`;
}
