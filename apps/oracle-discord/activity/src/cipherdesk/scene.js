// Cipher Desk drawing: an HTML/SVG desk (lamp, cipher tool, the document under the lamp) and its CSS. No rules here.
// The look comes from shop.js (lamp, tool, desk). Fonts for inscriptions come from the Inscription Tray's bundle.
import { pigpenSvg } from "../codes.js";
import { fontCss } from "../inscriptions/scene.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const DESKS = { "cd-pine": ["#b98a52", "#8a6334", "#d9c49b"], "cd-vienna": ["#4a2418", "#2c140c", "#7a1f2a"], "cd-room40": ["#5a4128", "#3a2a19", "#2f5a3c"] };
const LAMPS = { "cd-tallow": ["#ffb347", 0.38], "cd-beeswax": ["#ffe08a", 0.55], "cd-banker": ["#c8ffb0", 0.5] };

function lampSvg(id) {
  if (id === "cd-banker") return `<svg class="cd-lamp" viewBox="0 0 80 90" aria-hidden="true"><rect x="36" y="40" width="8" height="40" fill="#c9a24a"/><ellipse cx="40" cy="84" rx="22" ry="5" fill="#c9a24a"/><path d="M8 40 Q40 14 72 40Z" fill="#2f8a4a" stroke="#1d5a30"/><ellipse class="cd-bulb" cx="40" cy="41" rx="24" ry="4" fill="#fff6c8"/></svg>`;
  const wax = id === "cd-beeswax" ? "#e9c46a" : "#efe2c2";
  return `<svg class="cd-lamp" viewBox="0 0 80 90" aria-hidden="true"><rect x="32" y="34" width="16" height="46" rx="2" fill="${wax}"/><path class="cd-flame" d="M40 8 Q50 24 40 34 Q30 24 40 8Z" fill="#ffb347"/><ellipse cx="40" cy="82" rx="20" ry="5" fill="#8a6a3a"/></svg>`;
}
function toolSvg(id) {
  if (id === "cd-alberti") return `<svg class="cd-tool cd-spin" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="#d9c49b" stroke="#5a3d22" stroke-width="2"/><circle cx="40" cy="40" r="24" fill="#efe2c2" stroke="#5a3d22"/>${[..."ABCDEFGHIKLMNOPQRSTVXZ"].map((c, i) => { const a = (i / 22) * 6.283; return `<text x="${40 + 30 * Math.sin(a)}" y="${43 - 30 * Math.cos(a)}" font-size="6" text-anchor="middle" fill="#2a1b10">${c}</text>`; }).join("")}<circle cx="40" cy="40" r="3" fill="#5a3d22"/></svg>`;
  if (id === "cd-wheel") return `<svg class="cd-tool" viewBox="0 0 80 80" aria-hidden="true"><rect x="6" y="36" width="68" height="4" fill="#5a3d22"/>${Array.from({ length: 9 }, (_, i) => `<rect class="cd-disc" style="animation-delay:${i * 0.15}s" x="${10 + i * 7}" y="16" width="6" height="44" rx="2" fill="${i % 2 ? "#b98a52" : "#a77a44"}" stroke="#5a3d22"/>`).join("")}</svg>`;
  return `<svg class="cd-tool" viewBox="0 0 80 80" aria-hidden="true"><rect x="4" y="26" width="72" height="12" fill="#efe2c2" stroke="#8a6334"/><rect class="cd-slide" x="4" y="40" width="72" height="12" fill="#e6d3ab" stroke="#8a6334"/><text x="8" y="35" font-size="8" fill="#2a1b10">A B C D E F</text><text class="cd-slide" x="8" y="49" font-size="8" fill="#a52a1e">D E F G H I</text></svg>`;
}

/** How a cipher text sits on the page: drawn pigpen, mirror-flipped, runic font, or plain characters. */
export function cipherHtml(m, text, plain) {
  if (m === "pigpen") return `<div class="cd-cipher cd-pig">${pigpenSvg(plain)}</div>`;
  const cls = m === "mirror" ? " cd-mirror" : m === "runes" ? " cd-runes" : m === "braille" ? " cd-braille" : ["morse", "tap", "binary", "hex", "polybius", "a1z26"].includes(m) ? " cd-small" : "";
  return `<div class="cd-cipher${cls}">${esc(text)}</div>`;
}
/** An inscription: signs, with their sounds under them once the sign list is applied. */
export function inscriptionHtml(ins, withSounds) {
  const fam = ins.font ? `ins-${ins.font},` : "";
  return `<div class="cd-ins${ins.rtl ? " rtl" : ""}" style='font-family:${fam}"Noto Sans","Segoe UI Historic",serif'>${ins.pairs.map(([g, v]) => `<span class="cd-sg"><b>${esc(g)}</b>${withSounds ? `<i>${esc(v.trim() ? v : "·")}</i>` : ""}</span>`).join("")}</div>`;
}

/** The desk. doc: inner HTML for the paper. state: "" | "solved" | "forged" | "cracked". */
export function deskHtml({ look, doc = "", plain = "", state = "", label = "" }) {
  const [top, edge, cloth] = DESKS[look.desk] || DESKS["cd-pine"], [glow, glowA] = LAMPS[look.lamp] || LAMPS["cd-tallow"];
  const stamp = state === "forged" ? `<div class="cd-stamp">FORGED</div>` : state === "cracked" ? `<div class="cd-seal cracked" aria-hidden="true"></div>` : state === "solved" ? `<div class="cd-seal" aria-hidden="true"></div>` : "";
  return `<div class="cd-desk" style="--top:${top};--edge:${edge};--cloth:${cloth};--glow:${glow};--glowA:${glowA}">
    <div class="cd-light"></div>${lampSvg(look.lamp)}${toolSvg(look.tool)}
    <div class="cd-paper${state ? " " + state : ""}">${doc}${plain ? `<div class="cd-plain">${esc(plain)}</div>` : ""}${stamp}</div>
    ${label ? `<div class="cd-label">${esc(label)}</div>` : ""}</div>`;
}

export const CSS = () => fontCss() + `
.table.cipherdesk{padding:0;overflow:hidden}
.cd-desk{position:relative;width:100%;height:100%;min-height:260px;background:linear-gradient(180deg,#2a1b10 0 18%,var(--top) 18% 92%,var(--edge) 92%);overflow:hidden}
.cd-desk:before{content:"";position:absolute;left:8%;right:8%;top:24%;bottom:12%;background:var(--cloth);opacity:.35;border-radius:6px}
.cd-light{position:absolute;inset:0;background:radial-gradient(circle at 18% 30%,var(--glow),transparent 55%);opacity:var(--glowA);animation:cd-fl 2.4s ease-in-out infinite;pointer-events:none}
.cd-lamp{position:absolute;left:4%;top:8%;width:15%;max-width:90px}
.cd-flame{transform-origin:40px 34px;animation:cd-flame 1.4s ease-in-out infinite}
.cd-tool{position:absolute;right:4%;bottom:12%;width:14%;max-width:84px}
.cd-spin{animation:cd-spin 18s linear infinite}
.cd-slide{animation:cd-slide 4s ease-in-out infinite alternate}
.cd-disc{animation:cd-disc 3s ease-in-out infinite alternate}
.cd-paper{position:absolute;left:22%;right:22%;top:14%;bottom:14%;background:#efe2c2;color:#2a1b10;border-radius:3px;box-shadow:0 6px 18px rgba(0,0,0,.45);padding:14px 16px;display:flex;flex-direction:column;justify-content:center;gap:10px;animation:cd-in .5s ease-out;overflow:hidden;transform:rotate(-1deg)}
.cd-paper.forgery{background:#e8dcc0}
.cd-cipher{font:600 clamp(15px,2.6vw,26px)/1.35 "Courier New",monospace;letter-spacing:.06em;word-break:break-word;text-align:center}
.cd-cipher.cd-small{font-size:clamp(11px,1.7vw,16px);letter-spacing:.02em}
.cd-cipher.cd-braille{font-size:clamp(22px,3.6vw,36px)}
.cd-cipher.cd-runes{font-family:ins-runic,"Noto Sans Runic","Segoe UI Historic",serif}
.cd-cipher.cd-mirror{transform:scaleX(-1)}
.cd-pig svg{width:100%;max-height:70px;color:#2a1b10}
.cd-plain{font:700 clamp(14px,2.2vw,22px)/1.3 Georgia,serif;color:#a52a1e;text-align:center;animation:cd-ink 1s ease-out both}
.cd-ins{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 6px;font-size:clamp(22px,4vw,38px)}
.cd-ins.rtl{flex-direction:row-reverse}
.cd-sg{display:flex;flex-direction:column;align-items:center;min-width:.8em}
.cd-sg i{font:italic 12px/1.2 Georgia,serif;color:#a52a1e;animation:cd-ink .6s ease-out both}
.cd-claim{font:15px/1.4 Georgia,serif}.cd-claim b{display:block;font-size:17px;margin-bottom:4px}
.cd-stamp{position:absolute;right:8%;top:12%;border:3px solid #a52a1e;color:#a52a1e;font:900 18px/1 Georgia,serif;padding:4px 8px;transform:rotate(-14deg);animation:cd-stamp .35s cubic-bezier(.3,1.6,.6,1) both}
.cd-seal{position:absolute;right:6%;bottom:8%;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#d9463b,#8e1d16);box-shadow:0 2px 4px rgba(0,0,0,.4);animation:cd-stamp .35s cubic-bezier(.3,1.6,.6,1) both}
.cd-seal.cracked{background:radial-gradient(circle at 35% 35%,#8a8a8a,#4a4a4a);clip-path:polygon(0 0,46% 0,58% 40%,44% 60%,56% 100%,0 100%,0 0,100% 0,100% 100%,62% 100%,50% 62%,64% 40%,52% 0)}
.cd-label{position:absolute;left:0;right:0;bottom:3%;text-align:center;font:600 12px Georgia,serif;color:#f3e6c8;letter-spacing:.12em;text-transform:uppercase}
.cd-wheelui{display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0}.cd-wheelui b{min-width:5.5em;text-align:center}
.cd-preview{font:600 15px/1.3 "Courier New",monospace;text-align:center;padding:6px;border:1px dashed rgba(255,255,255,.25);border-radius:8px;word-break:break-word}
.cd-count{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;font:600 13px monospace}
.cd-list .c.locked{opacity:.6}
@keyframes cd-fl{50%{opacity:calc(var(--glowA) * .8)}}
@keyframes cd-flame{50%{transform:scaleY(1.12) skewX(3deg)}}
@keyframes cd-spin{to{transform:rotate(360deg)}}
@keyframes cd-slide{to{transform:translateX(-8px)}}
@keyframes cd-disc{to{transform:translateY(4px)}}
@keyframes cd-in{from{opacity:0;transform:translateY(30px) rotate(4deg)}}
@keyframes cd-ink{from{opacity:0;filter:blur(3px);letter-spacing:.3em}}
@keyframes cd-stamp{from{opacity:0;transform:scale(2.2) rotate(-14deg)}}
@media (prefers-reduced-motion:reduce){.cd-desk *{animation:none!important}}
`;
