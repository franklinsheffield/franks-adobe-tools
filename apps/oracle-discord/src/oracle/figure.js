// The Oracle: hooded fortune teller with the Science is Magic atom sigil, behind a crystal ball.
// One SVG drawing shared by the chat portrait (PNG via scripts/make-portrait.js) and the Oracle Chamber Activity.
export const PAL = { night: "#07050f", navy: "#161030", purple: "#2E1E68", robe: "#3b2785", gold: "#E2B04A", light: "#FADE8C", teal: "#66E0C8" };

/** The figure alone, drawn in a 400 x 300 box (hood top at y 18, ball centre 200,232). */
export function figureSvg({ id = "o", eyes = PAL.teal } = {}) {
  return `<defs>
  <radialGradient id="${id}-ball" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="${PAL.light}" stop-opacity=".9"/><stop offset=".35" stop-color="${PAL.teal}" stop-opacity=".55"/><stop offset="1" stop-color="${PAL.purple}" stop-opacity=".9"/></radialGradient>
  <linearGradient id="${id}-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.robe}"/><stop offset="1" stop-color="#140d33"/></linearGradient>
</defs>
<path d="M200 18 C140 20 112 80 108 140 C100 200 70 230 40 300 L360 300 C330 230 300 200 292 140 C288 80 260 20 200 18Z" fill="url(#${id}-robe)" stroke="${PAL.gold}" stroke-width="1.5"/>
<path d="M200 40 C160 42 142 90 146 130 C150 165 172 182 200 182 C228 182 250 165 254 130 C258 90 240 42 200 40Z" fill="#06040c"/>
<g class="eyes" fill="${eyes}"><ellipse class="eye" cx="180" cy="122" rx="7" ry="4"/><ellipse class="eye" cx="220" cy="122" rx="7" ry="4"/></g>
<g stroke="${PAL.gold}" stroke-width="1.2" fill="none" opacity=".9"><circle cx="200" cy="66" r="9"/><ellipse cx="200" cy="66" rx="16" ry="5"/><ellipse cx="200" cy="66" rx="16" ry="5" transform="rotate(60 200 66)"/><ellipse cx="200" cy="66" rx="16" ry="5" transform="rotate(-60 200 66)"/></g>
<path d="M130 250 C150 225 170 222 182 232 M270 250 C250 225 230 222 218 232" stroke="${PAL.light}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".75"/>
<circle class="orb" cx="200" cy="232" r="44" fill="url(#${id}-ball)" stroke="${PAL.light}" stroke-width="1.5"/>
<ellipse cx="185" cy="214" rx="12" ry="7" fill="#fff" opacity=".35"/>
<rect x="160" y="272" width="80" height="14" rx="4" fill="${PAL.gold}"/>`;
}

/** Square portrait for Discord embeds: the figure in a gold ring on a starry night. */
export function portraitSvg(size = 512) {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const stars = Array.from({ length: 46 }, () => `<circle cx="${(rnd() * 512).toFixed(1)}" cy="${(rnd() * 300).toFixed(1)}" r="${(rnd() * 1.6 + 0.4).toFixed(2)}" fill="${rnd() > 0.85 ? PAL.teal : PAL.light}" opacity="${(rnd() * 0.5 + 0.3).toFixed(2)}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
<defs><radialGradient id="sky" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="#2a1b5e"/><stop offset=".6" stop-color="#120c2a"/><stop offset="1" stop-color="${PAL.night}"/></radialGradient>
<clipPath id="disc"><circle cx="256" cy="256" r="246"/></clipPath></defs>
<g clip-path="url(#disc)"><rect width="512" height="512" fill="url(#sky)"/>${stars}
<g transform="translate(16 92) scale(1.2)">${figureSvg({ id: "p" })}</g></g>
<circle cx="256" cy="256" r="246" fill="none" stroke="${PAL.gold}" stroke-width="8"/>
<circle cx="256" cy="256" r="236" fill="none" stroke="${PAL.light}" stroke-width="1.5" opacity=".6"/>
</svg>`;
}
