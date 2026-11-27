// The party stage drawn on the table during Fact or Fib in rooms that don't have their own scene for it: curtains that
// part when a match starts, a spotlit card (face down while players write, face up at the reveal), one lantern per
// card already played (lit = the truth was found by someone), and confetti at the end.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const CSS = `
.ps-svg *{transform-box:fill-box}
.ps-svg.open .ps-curL{transform-origin:left center;animation:ps-part 1s cubic-bezier(.5,0,.3,1) both}
.ps-svg.open .ps-curR{transform-origin:right center;animation:ps-part 1s cubic-bezier(.5,0,.3,1) both}
.ps-card{transform-origin:center;animation:ps-bob 2.8s ease-in-out infinite}
.ps-card.flip{animation:ps-flip .6s cubic-bezier(.3,1.3,.5,1) both}
.ps-beam{animation:ps-sweep 5s ease-in-out infinite alternate;transform-origin:50% 0}
.ps-lamp.lit{animation:ps-glow 1.6s ease-in-out infinite alternate}
.ps-conf{animation:ps-fall 2.6s var(--d) cubic-bezier(.3,.1,.6,1) both}
@keyframes ps-part{to{transform:scaleX(.18)}}
@keyframes ps-bob{50%{transform:translateY(-4px) rotate(1deg)}}
@keyframes ps-flip{from{transform:rotateY(90deg) scale(.8)}}
@keyframes ps-sweep{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
@keyframes ps-glow{to{opacity:.55}}
@keyframes ps-fall{from{transform:translateY(0) rotate(0);opacity:1}to{transform:translateY(330px) rotate(var(--r));opacity:.8}}
@media (prefers-reduced-motion:reduce){.ps-svg *{animation:none!important}}
`;
function styleOnce() { if (typeof document === "undefined" || document.getElementById("ps-style")) return; const s = document.createElement("style"); s.id = "ps-style"; s.textContent = CSS; document.head.append(s); }

/** v = the public view (or null in the lobby). o: { emoji, label, phase, unroll, party, accent, bg: [inner, outer] }. */
export function stageSvg(v, { emoji = "❔", label = "", phase = "lobby", unroll = false, party = false, accent = "#E2B04A", bg = ["#2a1a45", "#07040f"] } = {}) {
  styleOnce();
  const up = phase === "reveal" || phase === "over", n = v ? v.n : 5, done = v ? v.log.length : 0;
  const lamps = Array.from({ length: n }, (_, k) => { const L = v && v.log[done - 1 - k], lit = L && L.found.length, x = 200 - (n - 1) * 18 + k * 36;
    return `<g class="ps-lamp${lit ? " lit" : ""}"><circle cx="${x}" cy="270" r="9" fill="${k < done ? (lit ? accent : "#5a5370") : "none"}" stroke="${accent}" stroke-width="1.5" opacity="${k < done ? 1 : 0.45}"/>${v && k === v.i && !v.over ? `<circle cx="${x}" cy="270" r="13" fill="none" stroke="#66E0C8" stroke-width="1.5"/>` : ""}</g>`; }).join("");
  const card = `<g class="ps-card${up ? " flip" : ""}"><rect x="160" y="88" width="80" height="104" rx="10" fill="${up ? "#f3e3c3" : "#1b1430"}" stroke="${accent}" stroke-width="2.5"/>
    ${up ? `<text x="200" y="150" font-size="40" text-anchor="middle">${esc(emoji)}</text>` : `<text x="200" y="152" font-size="44" font-weight="700" fill="${accent}" text-anchor="middle" font-family="Cinzel, Georgia, serif">?</text>`}</g>`;
  const curtain = (side) => { const x = side === "L" ? 0 : 200, cls = side === "L" ? "ps-curL" : "ps-curR";
    return `<g class="${cls}">${Array.from({ length: 6 }, (_, k) => `<rect x="${x + k * 33.4}" y="0" width="34" height="300" fill="${k % 2 ? "#7a1430" : "#8e1a3a"}"/>`).join("")}</g>`; };
  const conf = party ? Array.from({ length: 36 }, (_, i) => `<rect class="ps-conf" style="--d:${((i * 0.13) % 1.6).toFixed(2)}s;--r:${(i * 47) % 360}deg" x="${(i * 113) % 400}" y="-12" width="5" height="9" rx="1" fill="${[accent, "#66E0C8", "#ff4fb3", "#f3e3c3"][i % 4]}"/>`).join("") : "";
  return `<svg class="ps-svg${unroll ? " open" : ""}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="ps-bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
<linearGradient id="ps-beamg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".35"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="${bg[1]}"/><rect x="-200" width="800" height="300" fill="url(#ps-bg)"/>
<path class="ps-beam" d="M185 0 L215 0 L270 230 L130 230Z" fill="url(#ps-beamg)"/>
<ellipse cx="200" cy="228" rx="90" ry="12" fill="#000" opacity=".35"/>
<text x="20" y="28" font-size="12" font-weight="700" fill="${accent}" font-family="Cinzel, Georgia, serif" letter-spacing="1">FACT OR FIB</text>
<text x="380" y="28" font-size="10" fill="#f3e3c3" opacity=".75" text-anchor="end" font-family="Cinzel, Georgia, serif">${esc(label)}</text>
${card}${lamps}${unroll ? curtain("L") + curtain("R") : ""}
<path d="M0 0 H400 V16 Q300 34 200 22 Q100 34 0 16Z" fill="#6a1028"/>${conf}
</svg>`;
}
