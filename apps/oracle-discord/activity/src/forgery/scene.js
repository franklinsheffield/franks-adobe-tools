// Forgery Desk drawing: the examiner's desk with the document under test, a UV lamp, a loupe and a dictionary.
// The tool in use lights up. HTML/SVG only, no rules. Look from shop.js: lamp, lens, case.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LAMP = { "fo-woods": "#7a4bd8", "fo-quartz": "#5b6cff", "fo-ir": "#d84b4b" };
const CASE = { "fo-donation": ["Donation", "#7a2a1e"], "fo-hitler": ["Diaries", "#2a2a2a"], "fo-vinland": ["Vinland", "#2a4a6a"] };

/** The desk. year: the claimed date on the document. tool: "" | uv | lens | dict. state: "" | forged | genuine | wrong. */
export function deskHtml({ look, year = "", tool = "", state = "", label = "" }) {
  const glow = LAMP[look.lamp] || LAMP["fo-woods"], [cname, ccol] = CASE[look.case] || CASE["fo-donation"];
  const lines = Array.from({ length: 9 }, (_, i) => `<path d="M138 ${62 + i * 12} q20 -3 40 0 t40 0 t30 ${i % 2 ? 1 : -1}" stroke="#4a3520" stroke-width="1.6" fill="none" opacity=".75"/>`).join("");
  return `<div class="fo-desk t-${tool || "none"}${state ? " " + state : ""}" style="--uv:${glow}">
    <svg class="fo-scene" viewBox="0 0 400 220" aria-hidden="true">
      <rect x="0" y="0" width="400" height="220" fill="#24170e"/><rect x="0" y="0" width="400" height="220" fill="url(#fo-grain)" opacity=".4"/>
      <defs><pattern id="fo-grain" width="40" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 q10 -2 20 0 t20 0" stroke="#3a2616" fill="none"/></pattern>
        <radialGradient id="fo-uvg"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>
      <g class="fo-doc"><rect x="124" y="34" width="150" height="160" rx="2" fill="#ead9b4" stroke="#b49a68"/><path d="M124 34 l12 0 l-12 12z" fill="#d4bf90"/>${lines}
        <text x="262" y="52" text-anchor="end" font-family="Georgia,serif" font-style="italic" font-size="13" fill="#3a2616">${esc(year)}</text>
        <path class="fo-x" d="M150 70 L250 170 M250 70 L150 170" stroke="#c0392b" stroke-width="8" stroke-linecap="round"/>
        <circle class="fo-ok" cx="200" cy="120" r="34" fill="none" stroke="#2f8f4a" stroke-width="7"/></g>
      <ellipse class="fo-uvlight" cx="200" cy="110" rx="120" ry="90" fill="url(#fo-uvg)"/>
      <g class="fo-lamp"><rect x="20" y="40" width="70" height="26" rx="6" fill="#3a3a44"/><rect x="26" y="62" width="58" height="8" fill="${glow}" class="fo-bulb"/><rect x="50" y="66" width="10" height="90" fill="#555"/><rect x="34" y="156" width="42" height="10" rx="3" fill="#444"/></g>
      <g class="fo-lens"><circle cx="330" cy="70" r="26" fill="rgba(200,230,255,.25)" stroke="#c9a24a" stroke-width="6"/><rect x="346" y="88" width="10" height="40" rx="4" fill="#5a3d22" transform="rotate(-35 351 108)"/></g>
      <g class="fo-dict"><rect x="300" y="150" width="76" height="46" rx="3" fill="#6a2a2a"/><rect x="304" y="146" width="70" height="8" fill="#efe2c2"/><text x="338" y="180" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#e9c46a">DICTIONARY</text></g>
      <g class="fo-case"><rect x="20" y="176" width="88" height="30" rx="2" fill="${ccol}"/><text x="64" y="196" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#f3e6c8">CASE: ${esc(cname)}</text></g>
    </svg>${label ? `<div class="fo-label">${esc(label)}</div>` : ""}</div>`;
}

export const CSS = () => `
.table.forgery{padding:0;overflow:hidden}
.fo-desk{position:relative;width:100%;height:100%;min-height:240px;background:#24170e;overflow:hidden}
.fo-scene{position:absolute;inset:0;width:100%;height:100%}
.fo-uvlight{opacity:0;transition:opacity .4s}
.fo-desk.t-uv .fo-uvlight{opacity:1;animation:fo-hum 1.6s ease-in-out infinite}
.fo-desk.t-uv .fo-doc{filter:hue-rotate(200deg) brightness(.75)}
.fo-bulb{opacity:.35}.fo-desk.t-uv .fo-bulb{opacity:1}
.fo-lens{transform-box:fill-box;transform-origin:center;transition:transform .5s}
.fo-desk.t-lens .fo-lens{transform:translate(-120px,30px) scale(1.4)}
.fo-desk.t-dict .fo-dict{animation:fo-flip .5s ease-in-out 2}
.fo-x,.fo-ok{opacity:0}
.fo-desk.forged .fo-x{opacity:1;stroke-dasharray:300;stroke-dashoffset:300;animation:fo-draw .6s ease-out forwards}
.fo-desk.genuine .fo-ok{opacity:1;stroke-dasharray:220;stroke-dashoffset:220;animation:fo-draw .6s ease-out forwards}
.fo-desk.wrong .fo-doc{animation:fo-shake .4s}
.fo-label{position:absolute;left:4%;top:5%;max-width:30%;font:600 12px Georgia,serif;color:#f3e6c8;letter-spacing:.1em;text-transform:uppercase}
.fo-feats .c small{display:block;opacity:.85;margin-top:2px}
.fo-feats .c.old{border-color:#2f8f4a}.fo-feats .c.new{border-color:#e8483b}
@keyframes fo-hum{50%{opacity:.7}}
@keyframes fo-flip{50%{transform:translateY(-6px)}}
@keyframes fo-draw{to{stroke-dashoffset:0}}
@keyframes fo-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce){.fo-desk *{animation:none!important;transition:none!important;stroke-dashoffset:0!important}}
`;
