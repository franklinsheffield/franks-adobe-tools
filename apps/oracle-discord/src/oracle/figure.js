// The Oracle: the creature from the Science is Magic server logo. A tall black pointed hood, a face of golden
// pyramid bricks with one pink eye, hands cupped around a crystal ball, and purple mist at its feet.
// One SVG drawing shared by the chat portrait (PNG via scripts/make-portrait.js) and the Oracle Chamber Activity.
// Class names (o-*) are animation hooks used by the Chamber's CSS; static renderers simply ignore them.
export const PAL = { night: "#07050f", navy: "#161030", purple: "#2E1E68", deep: "#1b0f3a", robe: "#0d0718", gold: "#E2B04A", light: "#FADE8C", teal: "#66E0C8", pink: "#FF4FB3", pinkDeep: "#B8157A", parch: "#F3E3C3" };

/** The zodiac ring and flower-of-life lattice behind the Oracle, drawn around (cx, cy). */
export function sigilRingSvg({ cx = 200, cy = 200, r = 190, id = "o" } = {}) {
  const signs = "♈♉♊♋♌♍♎♏♐♑♒♓";
  let s = `<g class="o-ring" fill="none" stroke="${PAL.gold}">`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="2" opacity=".55"/><circle cx="${cx}" cy="${cy}" r="${r - 34}" stroke-width="1" opacity=".35"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2, a2 = a + Math.PI / 12;
    s += `<line x1="${(cx + (r - 34) * Math.cos(a2)).toFixed(1)}" y1="${(cy + (r - 34) * Math.sin(a2)).toFixed(1)}" x2="${(cx + r * Math.cos(a2)).toFixed(1)}" y2="${(cy + r * Math.sin(a2)).toFixed(1)}" stroke-width="1" opacity=".35"/>`;
    s += `<text x="${(cx + (r - 17) * Math.cos(a)).toFixed(1)}" y="${(cy + (r - 17) * Math.sin(a) + 6).toFixed(1)}" font-family="DejaVu Sans, sans-serif" font-size="17" text-anchor="middle" fill="${PAL.gold}" stroke="none" opacity=".8">${signs[i]}</text>`;
  }
  const fr = (r - 34) / 3;
  s += `<g opacity=".22" stroke-width="1"><circle cx="${cx}" cy="${cy}" r="${fr}"/>`;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s += `<circle cx="${(cx + fr * Math.cos(a)).toFixed(1)}" cy="${(cy + fr * Math.sin(a)).toFixed(1)}" r="${fr}"/>`; }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; s += `<circle cx="${(cx + fr * 1.732 * Math.cos(a)).toFixed(1)}" cy="${(cy + fr * 1.732 * Math.sin(a)).toFixed(1)}" r="${fr}"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${fr * 2}"/></g>`;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<line x1="${cx}" y1="${cy}" x2="${(cx + (r - 34) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r - 34) * Math.sin(a)).toFixed(1)}" stroke-width=".8" opacity=".12"/>`; }
  return s + `</g>`;
}

// One hand cupping the left side of the crystal ball (the right hand is this one mirrored). Each finger is its own
// group pivoting on its knuckle (o-f1..o-f4, o-thumb) so the Chamber can make the fingers move one by one.
// Fingers: [knuckle, bend control, tip], tips resting just off the ball's rim (ball centre 200,304, r 48).
const FINGERS = [
  [[151, 303], [157, 285], [161, 268], 7.2],
  [[144, 301], [147, 279], [151, 259], 7.6],
  [[137, 302], [137, 281], [140, 264], 7.2],
  [[130, 306], [127, 292], [128, 278], 6.2],
]
function hand(id, side) {
  const skin = "#3a2a5c", edge = PAL.gold, nail = PAL.pink;
  const finger = ([k, c, t, w], i) => {
    const d = `M${k[0]} ${k[1]} Q${c[0]} ${c[1]} ${t[0]} ${t[1]}`;
    return `<g class="o-f o-f${i + 1}" style="transform-origin:${k[0]}px ${k[1]}px">
    <path d="${d}" fill="none" stroke="${edge}" stroke-width="${w + 2.6}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${skin}" stroke-width="${w}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#6d58a0" stroke-width="1.4" stroke-linecap="round" opacity=".55" transform="translate(-1 -1.5)"/>
    <circle class="o-nail" cx="${t[0]}" cy="${t[1]}" r="${(w / 3.4).toFixed(1)}" fill="${nail}"/></g>`;
  };
  return `<g class="o-hand o-hand${side}">
  <path d="M124 350 C119 332 121 314 127 302 C134 296 148 295 155 301 C159 316 159 334 153 350Z" fill="${skin}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>
  <g class="o-peye" style="transform-origin:141px 321px"><path class="o-pe-white" d="M129.5 321 Q141 310.5 152.5 321 Q141 331.5 129.5 321Z" fill="#FFF6EA" stroke="${edge}" stroke-width=".9"/>
    <g class="o-pe-iris"><circle cx="141" cy="321" r="5" fill="url(#${id}-iris)"/><ellipse class="o-ppupil" cx="141" cy="321" rx="1.1" ry="4.2" fill="#2a0420"/><circle cx="139.2" cy="319" r="1.2" fill="#fff" opacity=".9"/></g></g>
  <path class="o-pline" d="M131 318 C137 326 145 326 151 320" stroke="#6d58a0" stroke-width="1.3" fill="none" opacity=".6"/>
  ${FINGERS.map(finger).reverse().join("")}
  <g class="o-f o-thumb" style="transform-origin:152px 330px">
    <path d="M152 330 Q166 326 167 310" fill="none" stroke="${edge}" stroke-width="10.2" stroke-linecap="round"/>
    <path d="M152 330 Q166 326 167 310" fill="none" stroke="${skin}" stroke-width="7.6" stroke-linecap="round"/>
    <circle class="o-nail" cx="167" cy="310" r="2.4" fill="${nail}"/></g>
  <circle cx="141" cy="296" r="2.6" fill="${side === "L" ? PAL.light : PAL.teal}" stroke="#7a4f12" stroke-width=".8"/>
</g>`;
}

/** The creature alone, drawn in a 400 x 400 box: hood apex at (200,16), eye at (200,150), crystal ball at (200,304) r 48. */
export function figureSvg({ id = "o" } = {}) {
  const P = PAL;
  return `<defs>
  <linearGradient id="${id}-hood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1748"/><stop offset=".45" stop-color="${P.robe}"/><stop offset="1" stop-color="#030107"/></linearGradient>
  <linearGradient id="${id}-hoodL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2263" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="${id}-face" cx="50%" cy="48%" r="62%"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".45" stop-color="#E9B947"/><stop offset="1" stop-color="#8C5E17"/></radialGradient>
  <pattern id="${id}-brick" width="28" height="14" patternUnits="userSpaceOnUse"><path d="M0 .5H28M0 7.5H28M7 0V7M21 7V14" stroke="#7a4f12" stroke-width="1.3" fill="none" opacity=".75"/></pattern>
  <radialGradient id="${id}-shade" cx="50%" cy="40%" r="60%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></radialGradient>
  <radialGradient id="${id}-iris" cx="42%" cy="40%" r="60%"><stop offset="0" stop-color="#FFB3E2"/><stop offset=".45" stop-color="${P.pink}"/><stop offset="1" stop-color="${P.pinkDeep}"/></radialGradient>
  <linearGradient id="${id}-rod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6a1c"/><stop offset=".45" stop-color="${P.light}"/><stop offset="1" stop-color="#8a5c16"/></linearGradient>
  <radialGradient id="${id}-mist" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9b3fd0" stop-opacity=".75"/><stop offset="1" stop-color="#4a1a7a" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}-orb" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFE4F4" stop-opacity=".95"/><stop offset=".35" stop-color="#c46ad8" stop-opacity=".75"/><stop offset=".75" stop-color="#4a1f8a" stop-opacity=".92"/><stop offset="1" stop-color="#1c0b3c"/></radialGradient>
  <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3570"/><stop offset="1" stop-color="#1d1233"/></linearGradient>
  <clipPath id="${id}-orbclip"><circle cx="200" cy="304" r="47"/></clipPath>
  <filter id="${id}-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
  <clipPath id="${id}-faceclip"><path d="M200 66 L282 238 Q200 206 118 238 Z"/></clipPath>
</defs>
<g class="o-body">
  <path d="M200 14 C214 60 252 150 290 236 C316 296 340 348 368 400 L32 400 C60 348 84 296 110 236 C148 150 186 60 200 14Z" fill="url(#${id}-hood)" stroke="${P.gold}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M200 14 C186 60 148 150 110 236 C84 296 60 348 32 400 L120 400 C130 330 150 250 200 14Z" fill="url(#${id}-hoodL)"/>
  <path d="M200 44 C210 80 244 160 276 236" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>
  <path d="M130 248 C108 300 92 352 80 400 M270 248 C292 300 308 352 320 400" fill="none" stroke="${P.gold}" stroke-width="2.2" opacity=".85"/>
  <path d="M118 238 C150 272 250 272 282 238" fill="none" stroke="${P.gold}" stroke-width="2.2" opacity=".85"/>
  <path d="M200 66 L282 238 Q200 206 118 238 Z" fill="#050208"/>
  <g clip-path="url(#${id}-faceclip)">
    <g class="o-face">
      <rect x="110" y="60" width="180" height="190" fill="url(#${id}-face)"/>
      <rect x="110" y="60" width="180" height="190" fill="url(#${id}-brick)"/>
      <path d="M150 60 L200 220 L120 230Z" fill="#fff" opacity=".07"/>
    </g>
    <rect x="110" y="60" width="180" height="190" fill="url(#${id}-shade)"/>
    <path d="M118 238 Q200 196 282 238 L282 250 L118 250Z" fill="#050208"/>
    <ellipse cx="200" cy="222" rx="70" ry="16" fill="#050208" opacity=".7" filter="url(#${id}-glow)"/>
  </g>
  <path d="M200 66 L282 238 Q200 206 118 238 Z" fill="none" stroke="#000" stroke-width="7" opacity=".55"/>
  <g class="o-eye">
    <path class="o-eyeglow" d="M156 152 Q200 118 244 152 Q200 182 156 152Z" fill="${P.light}" opacity=".55" filter="url(#${id}-glow)"/>
    <g class="o-lid">
      <path d="M160 152 Q200 124 240 152 Q200 177 160 152Z" fill="#FFF6EA" stroke="${P.light}" stroke-width="3.2"/>
      <g class="o-iris"><circle cx="200" cy="152" r="14" fill="url(#${id}-iris)"/><ellipse cx="200" cy="152" rx="2.6" ry="10" fill="#2a0420"/><circle cx="195" cy="146" r="3.2" fill="#fff" opacity=".9"/></g>
    </g>
    <path d="M154 146 Q200 112 246 146" fill="none" stroke="#1a0b06" stroke-width="5" stroke-linecap="round"/>
  </g>
</g>
<g class="o-sleeves" fill="url(#${id}-hood)" stroke="${P.gold}" stroke-width="2" stroke-linejoin="round">
  <path d="M114 232 C92 268 86 318 100 356 C122 358 146 350 162 338 C154 312 146 280 140 254Z"/>
  <path d="M286 232 C308 268 314 318 300 356 C278 358 254 350 238 338 C246 312 254 280 260 254Z"/>
  <path d="M100 356 C122 358 146 350 162 338 M300 356 C278 358 254 350 238 338" fill="none" stroke="${P.light}" stroke-width="3"/>
</g>
<g class="o-ball">
  <ellipse class="o-orbglow" cx="200" cy="304" rx="70" ry="66" fill="${P.pink}" opacity=".28" filter="url(#${id}-soft)"/>
  <path d="M168 352 L232 352 L244 372 L156 372Z" fill="url(#${id}-rod)" stroke="#7a4f12" stroke-width="1"/>
  <rect x="150" y="370" width="100" height="10" rx="3" fill="#b8862a"/>
  <ellipse cx="200" cy="352" rx="34" ry="6" fill="#7a4f12"/>
  <circle cx="200" cy="304" r="48" fill="url(#${id}-orb)"/>
  <g clip-path="url(#${id}-orbclip)">
    <g class="o-swirl"><ellipse cx="186" cy="300" rx="34" ry="12" fill="${P.pink}" opacity=".45" filter="url(#${id}-glow)"/><ellipse cx="214" cy="316" rx="28" ry="9" fill="${P.teal}" opacity=".4" filter="url(#${id}-glow)"/></g>
    <g class="o-swirl2"><ellipse cx="204" cy="290" rx="22" ry="7" fill="${P.light}" opacity=".35" filter="url(#${id}-glow)"/><ellipse cx="192" cy="322" rx="26" ry="8" fill="#b06cff" opacity=".45" filter="url(#${id}-glow)"/></g>
  </g>
  <circle cx="200" cy="304" r="48" fill="none" stroke="${P.light}" stroke-width="1.6" opacity=".8"/>
  <ellipse cx="183" cy="284" rx="14" ry="8" fill="#fff" opacity=".45" transform="rotate(-25 183 284)"/>
  <circle cx="221" cy="324" r="3" fill="#fff" opacity=".5"/>
</g>
<g class="o-hands">${hand(id, "L")}<g transform="translate(400 0) scale(-1 1)">${hand(id, "R")}</g></g>
<g class="o-mist" filter="url(#${id}-soft)">
  <ellipse cx="110" cy="388" rx="120" ry="26" fill="url(#${id}-mist)"/><ellipse cx="290" cy="392" rx="130" ry="24" fill="url(#${id}-mist)"/><ellipse cx="200" cy="378" rx="110" ry="20" fill="url(#${id}-mist)" opacity=".8"/>
</g>
<g class="o-motes" fill="${P.pink}"><circle cx="96" cy="200" r="2.6"/><circle cx="316" cy="250" r="2.2"/><circle cx="292" cy="140" r="1.8"/><circle cx="150" cy="268" r="1.6"/><circle cx="258" cy="372" r="2.4"/><circle cx="84" cy="330" r="1.8"/></g>`;
}

/** Square portrait for Discord embeds: the creature inside the logo's gold ring, zodiac and flower of life. */
export function portraitSvg(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
<defs><radialGradient id="sky" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#3a1f72"/><stop offset=".6" stop-color="${PAL.deep}"/><stop offset="1" stop-color="#0c0620"/></radialGradient>
<clipPath id="disc"><circle cx="256" cy="256" r="238"/></clipPath></defs>
<g clip-path="url(#disc)"><rect width="512" height="512" fill="url(#sky)"/>${sigilRingSvg({ cx: 256, cy: 256, r: 236, id: "p" })}
<g transform="translate(56 66) scale(1.0)">${figureSvg({ id: "p" })}</g></g>
<circle cx="256" cy="256" r="244" fill="none" stroke="${PAL.gold}" stroke-width="10"/>
<circle cx="256" cy="256" r="232" fill="none" stroke="#1b0f3a" stroke-width="4"/>
<circle cx="256" cy="256" r="228" fill="none" stroke="${PAL.gold}" stroke-width="3"/>
</svg>`;
}
