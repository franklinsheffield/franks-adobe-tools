// Expressive text: now and then a few words of a spoken line move with the speaker's feeling (every host speaks
// through say(), so the Oracle and every House host get it). Pure rules here; main.js applies them, chamber.css moves them.
// fx: shake (angry, shouting), wave (dreamy, trailing off… also typed a little slower), bounce (laughing), pop (wonder,
// exclamations, and any **bold** words, which always pop).
export const FX = ["shake", "wave", "bounce", "pop"];
export const FX_CHANCE = 0.45;
/** Capitals that are not shouting: Roman numerals and common abbreviations. */
const NOT_SHOUT = /^(?:[IVXLCDM]+|DNA|RNA|UV|BCE|AD|NASA|ESA|USA|UK|OK|HD|PH)$/;
const shouted = (t) => [...t.matchAll(/\b[A-Z]{3,}\b/g)].some((m) => !NOT_SHOUT.test(m[0]));
/** Plan the effect for one line: { fx, ranges: [[start, end]] in the plain text, slow } or null. */
export function textFxPlan(raw, mood = "", rand = Math.random) {
  raw = String(raw || ""); const plain = raw.replace(/\*\*/g, ""); if (!plain.trim()) return null;
  const em = []; let off = 0; for (const x of raw.matchAll(/\*\*(.+?)\*\*/g)) { const s = x.index - off; em.push([s, s + x[1].length]); off += 4; }
  let fx = null;
  if (/angry|sulk/.test(mood) || /!{2,}/.test(plain) || shouted(plain)) fx = "shake";
  else if (/dreamy|sleepy|love|sad/.test(mood) || /…|\.\.\./.test(plain)) fx = "wave";
  else if (/laugh|joy|cheer|smug/.test(mood) || /\b(?:ha){2,}\b|\bhee\b|\bheh\b/i.test(plain)) fx = "bounce";
  else if (/wow|curious/.test(mood) || /!\s*$/.test(plain)) fx = "pop";
  if (em.length) return { fx: fx === "shake" || fx === "wave" ? fx : "pop", ranges: em, slow: fx === "wave" };
  if (!fx || rand() > FX_CHANCE) return null;
  return { fx, ranges: [tailRange(plain, fx)], slow: fx === "wave" };
}
/** The words that move: a shouted CAPS word for a shake, otherwise the last one to three words of the line. */
export function tailRange(plain, fx) {
  if (fx === "shake") { const c = [...plain.matchAll(/\b[A-Z]{3,}\b/g)].find((m) => !NOT_SHOUT.test(m[0])); if (c) return [c.index, c.index + c[0].length]; }
  const end = plain.replace(/[\s.!?…"”')\]]+$/u, "").length, words = plain.slice(0, end).split(/\s+/), take = [];
  for (let k = words.length - 1; k >= 0 && take.length < 3; k--) { take.unshift(words[k]); if (take.join(" ").length > 22) { if (take.length > 1) take.shift(); break; } }
  const t = take.join(" "); return [end - t.length, end];
}
/** The line as HTML with each moving letter in its own span (spaces stay plain so words still wrap). */
export function textFxHtml(plain, plan, esc) {
  if (!plan) return esc(plain);
  let out = "", at = 0, k = 0;
  for (const [s, e] of [...plan.ranges].sort((a, b) => a[0] - b[0])) {
    if (s < at || e > plain.length || e <= s) continue;
    out += esc(plain.slice(at, s));
    out += `<span class="txw tx-${plan.fx}">` + [...plain.slice(s, e)].map((c) => (/\s/.test(c) ? " " : `<span class="tx" style="--i:${k++}">${esc(c)}</span>`)).join("") + "</span>";
    at = e;
  }
  return out + esc(plain.slice(at));
}
export const TEXTFX_CSS = `
.say .txw{white-space:nowrap}.say .tx{display:inline-block;will-change:transform}
.say .tx-shake .tx{animation:tx-shake .09s linear calc(var(--i) * -.03s) 8,tx-red .9s ease-out both;color:#ff8a8a}
.say .tx-wave .tx{animation:tx-wave 1.6s ease-in-out calc(var(--i) * .09s) 3}
.say .tx-bounce .tx{animation:tx-bounce .5s cubic-bezier(.3,1.6,.5,1) calc(var(--i) * .05s) 2}
.say .tx-pop .tx{animation:tx-pop .7s cubic-bezier(.3,1.5,.5,1) calc(var(--i) * .035s) both;color:#ffd76a;text-shadow:0 0 8px rgba(255,215,106,.6),0 1px 3px #000}
@keyframes tx-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-1.5px,1px) rotate(-2deg)}75%{transform:translate(1.5px,-1px) rotate(2deg)}}
@keyframes tx-red{from{color:#ff4f4f}}
@keyframes tx-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes tx-bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-7px) scale(1.1)}}
@keyframes tx-pop{0%{transform:scale(1)}45%{transform:scale(1.35) rotate(-3deg)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.say .tx{animation:none!important}}`;
