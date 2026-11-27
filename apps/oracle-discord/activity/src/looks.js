// Everything the Essence store can change, beyond colour: elemental robe effects, avatar eyes and hands,
// occult table-cloth designs, candles, and vibes (colour theme + fonts + background as a set).
// SVG here is drawn in the Oracle's 400 x 400 box (teller) or the table's 400 x 300 box; chamber.css animates fx-*.

const r = (n) => Number(n.toFixed(1));
const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------------------------------------------------------------- robes: elemental effects
// back = behind the Oracle, robe = on the robe (clipped to the hood), front = in front of everything.
export function robeFx(element) {
  const R = rand(7), out = { back: "", robe: "", front: "" };
  if (element === "fire") {
    out.back = `<ellipse class="fx-pulse" cx="200" cy="320" rx="175" ry="90" fill="#ff5a14" opacity=".28" filter="url(#t-soft)"/>`;
    out.robe = `<rect x="0" y="300" width="400" height="100" fill="url(#fx-firegrad)" opacity=".55"/>`;
    out.front = Array.from({ length: 14 }, (_, i) => { const x = 40 + i * 23 + R() * 8, h = 26 + R() * 30;
      return `<path class="fx-flame" style="--d:${r(-R())}s" d="M${r(x - 11)} 400 C${r(x - 12)} ${r(400 - h * .5)} ${r(x - 3)} ${r(400 - h * .7)} ${r(x)} ${r(400 - h)} C${r(x + 3)} ${r(400 - h * .7)} ${r(x + 12)} ${r(400 - h * .5)} ${r(x + 11)} 400Z" fill="url(#fx-flamegrad)"/>`; }).join("") +
      Array.from({ length: 16 }, () => `<circle class="fx-rise" style="--d:${r(-R() * 3)}s;--x:${r(R() * 60 - 30)}px;--h:-${r(160 + R() * 120)}px;--t:${r(2 + R() * 1.5)}s" cx="${r(60 + R() * 280)}" cy="${r(370 + R() * 20)}" r="${r(1.2 + R() * 1.8)}" fill="${R() > .5 ? "#ffd27a" : "#ff7a2a"}"/>`).join("");
  } else if (element === "water") {
    out.back = `<ellipse class="fx-pulse" cx="200" cy="330" rx="180" ry="80" fill="#2aa7c9" opacity=".22" filter="url(#t-soft)"/>`;
    out.robe = [300, 330, 360, 390].map((y, i) => `<path class="fx-wave" style="--d:${-i * .7}s" d="M-100 ${y} ${Array.from({ length: 7 }, () => "q25 -9 50 0 t50 0").join(" ")}" fill="none" stroke="#7fe6ff" stroke-width="${2.4 - i * .3}" opacity="${.55 - i * .08}"/>`).join("") +
      Array.from({ length: 12 }, () => `<circle class="fx-rise" style="--d:${r(-R() * 4)}s;--x:${r(R() * 16 - 8)}px;--h:-${r(120 + R() * 100)}px;--t:${r(3 + R() * 2)}s" cx="${r(90 + R() * 220)}" cy="${r(380 + R() * 15)}" r="${r(2 + R() * 3)}" fill="none" stroke="#bff4ff" stroke-width="1.2"/>`).join("");
    out.front = [[108, 352], [292, 352], [160, 372], [240, 372]].map(([x, y], i) => `<path class="fx-drip" style="--d:${-i * .6}s" d="M${x} ${y} c-3 6 -3 9 0 10 c3 -1 3 -4 0 -10Z" fill="#9ff0ff"/>`).join("");
  } else if (element === "earth") {
    out.back = `<ellipse cx="200" cy="392" rx="190" ry="20" fill="#2d6b2a" opacity=".5" filter="url(#t-soft)"/>`;
    const vine = (d, i) => `<path class="fx-vine" style="--d:${-i * 2}s" d="${d}" fill="none" stroke="#5fbf4a" stroke-width="3" stroke-linecap="round"/>`;
    out.robe = vine("M70 400 C90 360 70 330 104 300 C130 276 112 250 140 220 C158 200 150 170 172 140", 0) + vine("M330 400 C310 360 330 330 296 300 C270 276 288 250 260 220 C242 200 250 170 228 140", 1) +
      [[96, 330], [124, 262], [152, 196], [304, 330], [276, 262], [248, 196], [84, 372], [316, 372]].map(([x, y], i) => `<ellipse class="fx-leaf" style="--d:${-i * .4}s" cx="${x}" cy="${y}" rx="9" ry="4.5" transform="rotate(${i % 2 ? 35 : -35} ${x} ${y})" fill="#7ad65a" stroke="#2d6b2a" stroke-width="1"/>`).join("");
    out.front = `<g class="fx-orbit">${[0, 120, 240].map((a) => { const x = 200 + 165 * Math.cos(a * Math.PI / 180), y = 260 + 40 * Math.sin(a * Math.PI / 180); return `<path d="M${r(x - 8)} ${r(y)} l5 -7 l9 1 l3 8 l-7 6 l-8 -2Z" fill="#8b7355" stroke="#4a3a28" stroke-width="1.2"/>`; }).join("")}</g>` +
      Array.from({ length: 6 }, (_, i) => `<ellipse class="fx-fall" style="--d:${r(-R() * 6)}s;--x:${r(R() * 80 - 40)}px" cx="${r(60 + R() * 280)}" cy="40" rx="6" ry="3" fill="#9be07a"/>`).join("");
  } else if (element === "air") {
    out.back = `<g class="fx-swirl">${[150, 175, 196].map((rad, i) => `<path d="M${200 - rad} 220 A${rad} ${rad * .55} 0 0 1 ${200 + rad * .7} ${r(220 - rad * .4)}" fill="none" stroke="#e8f4ff" stroke-width="${2.5 - i * .5}" stroke-linecap="round" opacity="${.55 - i * .12}"/>`).join("")}</g>`;
    out.front = `<g class="fx-swirl fx-rev">${[130, 160].map((rad) => `<path d="M${200 + rad} 280 A${rad} ${rad * .4} 0 0 1 ${200 - rad * .6} ${r(280 + rad * .3)}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".45"/>`).join("")}</g>` +
      Array.from({ length: 5 }, (_, i) => `<g class="fx-drift" style="--d:${-i * 1.6}s"><path transform="translate(${r(40 + R() * 40)} ${r(80 + i * 60)}) rotate(${r(R() * 60 - 30)})" d="M0 0 C6 -4 18 -4 24 0 C18 4 6 4 0 0Z M0 0 L28 0" fill="#f4f8ff" stroke="#c9d6ea" stroke-width=".8"/></g>`).join("");
  } else if (element === "lightning") {
    out.back = `<ellipse class="fx-pulse" cx="200" cy="260" rx="170" ry="130" fill="#66E0C8" opacity=".18" filter="url(#t-soft)"/>`;
    const bolt = (pts, i) => `<polyline class="fx-zap" style="--d:${r(i * .37)}s" points="${pts}" fill="none" stroke="#c8fff5" stroke-width="2.2" stroke-linejoin="round"/>`;
    out.front = [
      "108,240 96,262 112,268 92,296 106,300 88,330", "292,240 304,262 288,268 308,296 294,300 312,330",
      "150,300 140,288 152,282 138,270", "250,300 260,288 248,282 262,270", "200,252 192,240 206,232 196,218",
    ].map(bolt).join("") + Array.from({ length: 10 }, () => `<circle class="fx-spark" style="--d:${r(-R())}s" cx="${r(120 + R() * 160)}" cy="${r(240 + R() * 120)}" r="1.8" fill="#eafffb"/>`).join("");
  } else if (element === "cosmos") {
    out.robe = Array.from({ length: 46 }, () => `<circle class="fx-twinkle" style="--d:${r(-R() * 3)}s" cx="${r(40 + R() * 320)}" cy="${r(120 + R() * 280)}" r="${r(.6 + R() * 1.6)}" fill="#fff"/>`).join("") +
      `<path d="M120 330 L150 300 L190 316 L230 290 M250 360 L280 330 L300 350" stroke="#c9d4ff" stroke-width=".8" opacity=".6" fill="none"/>`;
    out.front = `<g class="fx-orbit fx-slow"><circle cx="370" cy="260" r="4" fill="#fff"/><path d="M370 260 L340 250" stroke="#c9d4ff" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>`;
  } else if (element === "sun") {
    out.back = `<g class="fx-rays">${Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<path d="M200 200 L${r(200 + 230 * Math.cos(a - .05))} ${r(200 + 230 * Math.sin(a - .05))} L${r(200 + 230 * Math.cos(a + .05))} ${r(200 + 230 * Math.sin(a + .05))}Z" fill="#FADE8C" opacity="${i % 2 ? .1 : .18}"/>`; }).join("")}</g>`;
    out.front = Array.from({ length: 14 }, () => `<circle class="fx-rise" style="--d:${r(-R() * 4)}s;--x:${r(R() * 30 - 15)}px;--h:-${r(80 + R() * 80)}px;--t:${r(3 + R() * 2)}s" cx="${r(60 + R() * 280)}" cy="${r(250 + R() * 120)}" r="${r(1 + R() * 2)}" fill="#FFF3C4"/>`).join("");
  } else if (element === "shadow") {
    out.back = Array.from({ length: 6 }, (_, i) => `<ellipse class="fx-rise fx-smoke" style="--d:${-i * 1.1}s;--x:${i % 2 ? 20 : -20}px;--h:-180px;--t:6.5s" cx="${i < 3 ? 70 + i * 20 : 270 + (i - 3) * 20}" cy="370" rx="26" ry="16" fill="#3d1f66" filter="url(#t-soft)"/>`).join("");
  }
  return out;
}

// ---------------------------------------------------------------- avatars: face, eye and hands
// eye: white, iris [3 stops], pupil {rx, ry} (or star), extra markings; hands: skin, edge, nail colours, nail size.
export const AVATAR_LOOK = {
  classic: { face: ["#FFE7A0", "#E9B947", "#8C5E17"], white: "#FFF6EA", iris: ["#FFB3E2", "#FF4FB3", "#B8157A"], pupil: [2.6, 10], hands: { skin: "#3a2a5c", edge: "#E2B04A", nail: "#FF4FB3", nailR: 1 } },
  cat: { face: ["#FFE7A0", "#E9B947", "#8C5E17"], white: "#FFF0A8", iris: ["#e8ffb0", "#8fd14f", "#2f6e12"], pupil: [1.4, 12.5], hands: { skin: "#1d1426", edge: "#FF8FC8", nail: "#ffffff", nailR: 1.7 },
    eye: `<path d="M150 170 L120 166 M150 176 L118 178 M250 170 L280 166 M250 176 L282 178" stroke="#1a0b06" stroke-width="2" stroke-linecap="round"/>`, handFx: "claws" },
  horned: { face: ["#ffb08a", "#c84a1c", "#5a1208"], white: "#FFE0C0", iris: ["#ffe08a", "#ff6a1a", "#8a1a08"], pupil: [11, 2.4], hands: { skin: "#5a1020", edge: "#ff8a3d", nail: "#1a0505", nailR: 1.8 },
    eye: `<path d="M152 140 Q176 124 196 134 M248 140 Q224 124 204 134" stroke="#5a1208" stroke-width="5" stroke-linecap="round" fill="none"/>`, handFx: "embers" },
  moon: { face: ["#F4F6FF", "#B9C2D9", "#5d6580"], white: "#F7FAFF", iris: ["#c8fff3", "#66E0C8", "#1f7f6e"], pupil: [5, 5], hands: { skin: "#9aa3bd", edge: "#ffffff", nail: "#66E0C8", nailR: 1 },
    eye: `<circle cx="200" cy="152" r="34" fill="none" stroke="#e9f0ff" stroke-width="1" stroke-dasharray="2 5" opacity=".8"/>`, handFx: "glow" },
  sphinx: { face: ["#FFE7A0", "#E9B947", "#8C5E17"], white: "#FFF6EA", iris: ["#9fb8ff", "#1d3a8e", "#0b1640"], pupil: [4, 4], hands: { skin: "#c8932e", edge: "#1d3a8e", nail: "#1d3a8e", nailR: 1.1 },
    eye: `<path d="M156 152 Q200 118 248 150 L262 146" stroke="#0b0b2a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M196 172 L192 192 Q190 200 198 202" stroke="#0b0b2a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M212 168 Q232 186 222 198 Q214 204 208 196" stroke="#0b0b2a" stroke-width="3" fill="none"/>`, handFx: "bands" },
  cosmic: { face: ["#9aa8ff", "#2a2f8a", "#0a0b30"], white: "#e6ecff", iris: ["#fff6c8", "#FADE8C", "#b8862a"], pupil: [0, 0], star: true, hands: { skin: "#232a7a", edge: "#c9d4ff", nail: "#ffffff", nailR: 1.2 },
    eye: "", handFx: "stars" },
};
export const STAR_PUPIL = `<path d="M200 141 L203 149 L211 152 L203 155 L200 163 L197 155 L189 152 L197 149Z" fill="#2a0420"/>`;

// ---------------------------------------------------------------- table cloths: occult designs
// Drawn flat around (200, 200), then squashed into the table's perspective by the caller.
const ZOD = "♈♉♊♋♌♍♎♏♐♑♒♓", PLAN = "☉☽☿♀♂♃♄";
const ring = (n, rad, f) => Array.from({ length: n }, (_, i) => f(200 + rad * Math.cos((i / n) * Math.PI * 2 - Math.PI / 2), 200 + rad * Math.sin((i / n) * Math.PI * 2 - Math.PI / 2), i)).join("");
const txt = (x, y, t, s = 14, extra = "") => `<text x="${r(x)}" y="${r(y + s * .35)}" font-size="${s}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" ${extra}>${t}</text>`;
export const CLOTH_DESIGN = {
  sigil: "", // the default lines already on the table
  pentacle: (c) => { const p = [0, 2, 4, 1, 3].map((k) => [200 + 122 * Math.cos(k * 1.2566 - Math.PI / 2), 200 + 122 * Math.sin(k * 1.2566 - Math.PI / 2)]);
    return `<circle cx="200" cy="200" r="140" stroke-width="3"/><circle cx="200" cy="200" r="122"/><path d="M${p.map(([x, y]) => r(x) + " " + r(y)).join(" L")}Z" stroke-width="2.5"/>` +
      ring(5, 131, (x, y, i) => `<circle cx="${r(x)}" cy="${r(y)}" r="10" fill="#170a2e"/>${txt(x, y, ["✶", "△", "▽", "◬", "⛛"][i], 12, `fill="${c}" stroke="none"`)}`); },
  spirit: (c) => `<rect x="44" y="70" width="312" height="260" rx="26" stroke-width="3"/>${"ABCDEFGHIJKLM".split("").map((l, i) => txt(78 + i * 20.5, 150 - Math.sin((i / 12) * Math.PI) * 26, l, 17, `fill="${c}" stroke="none" font-family="serif"`)).join("")}${"NOPQRSTUVWXYZ".split("").map((l, i) => txt(78 + i * 20.5, 196 - Math.sin((i / 12) * Math.PI) * 22, l, 17, `fill="${c}" stroke="none" font-family="serif"`)).join("")}${"1234567890".split("").map((l, i) => txt(110 + i * 20, 238, l, 15, `fill="${c}" stroke="none"`)).join("")}${txt(86, 92, "YES", 18, `fill="${c}" stroke="none" font-family="serif"`)}${txt(314, 92, "NO", 18, `fill="${c}" stroke="none" font-family="serif"`)}${txt(200, 290, "GOOD BYE", 18, `fill="${c}" stroke="none" font-family="serif"`)}${txt(64, 300, "☉", 22, `fill="${c}" stroke="none"`)}${txt(336, 300, "☽", 22, `fill="${c}" stroke="none"`)}`,
  alchemy: (c) => `<circle cx="200" cy="200" r="140" stroke-width="2.5"/><rect x="101" y="101" width="198" height="198" stroke-width="2"/><path d="M200 101 L299 270 L101 270Z" stroke-width="2"/><circle cx="200" cy="213" r="57" stroke-width="2"/>${ring(7, 156, (x, y, i) => txt(x, y, PLAN[i], 16, `fill="${c}" stroke="none"`))}${[["△", 200, 52], ["▽", 200, 348], ["◬", 52, 200], ["⛛", 348, 200]].map(([t, x, y]) => txt(x, y, t, 16, `fill="${c}" stroke="none"`)).join("")}`,
  metatron: () => { const pts = [[200, 200], ...[0, 1, 2, 3, 4, 5].map((k) => [200 + 50 * Math.cos(k * 1.0472), 200 + 50 * Math.sin(k * 1.0472)]), ...[0, 1, 2, 3, 4, 5].map((k) => [200 + 100 * Math.cos(k * 1.0472), 200 + 100 * Math.sin(k * 1.0472)])];
    return pts.map(([x, y]) => `<circle cx="${r(x)}" cy="${r(y)}" r="25"/>`).join("") + pts.flatMap((a, i) => pts.slice(i + 1).map((b) => `<path d="M${r(a[0])} ${r(a[1])} L${r(b[0])} ${r(b[1])}" stroke-width=".6" opacity=".7"/>`)).join("") + `<circle cx="200" cy="200" r="140" stroke-width="2.5"/>`; },
  tarot: (c) => { const card = (x, y, n, rot = 0) => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 20}" y="${y - 26}" width="40" height="52" rx="4" stroke-width="2"/>${rot ? "" : txt(x, y, n, 12, `fill="${c}" stroke="none" font-family="serif"`)}</g>`;
    return card(160, 200, "I") + card(160, 200, "II", 90) + card(160, 268, "III") + card(92, 200, "IV") + card(160, 132, "V") + card(228, 200, "VI") +
      ["VII", "VIII", "IX", "X"].map((n, i) => card(310, 284 - i * 56, n)).join("") + `<circle cx="200" cy="200" r="150" stroke-width="1" stroke-dasharray="4 6"/>`; },
  zodiac: (c) => `<circle cx="200" cy="200" r="146" stroke-width="3"/><circle cx="200" cy="200" r="112" stroke-width="1.5"/><circle cx="200" cy="200" r="46"/>${ring(12, 129, (x, y, i) => txt(x, y, ZOD[i], 18, `fill="${c}" stroke="none"`))}${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2 + Math.PI / 12; return `<path d="M${r(200 + 46 * Math.cos(a))} ${r(200 + 46 * Math.sin(a))} L${r(200 + 146 * Math.cos(a))} ${r(200 + 146 * Math.sin(a))}"/>`; }).join("")}${txt(200, 200, "☉", 26, `fill="${c}" stroke="none"`)}`,
  solomon: (c) => `<circle cx="200" cy="200" r="146" stroke-width="3"/><circle cx="200" cy="200" r="126"/>${[0, Math.PI].map((o) => { const p = [0, 1, 2].map((k) => [200 + 112 * Math.cos(o + k * 2.0944 - Math.PI / 2), 200 + 112 * Math.sin(o + k * 2.0944 - Math.PI / 2)]); return `<path d="M${p.map(([x, y]) => r(x) + " " + r(y)).join(" L")}Z" stroke-width="2.5"/>`; }).join("")}${ring(24, 136, (x, y, i) => i % 2 ? txt(x, y, "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ"[(i - 1) / 2], 12, `fill="${c}" stroke="none" font-family="Noto Sans Runic"`) : `<circle cx="${r(x)}" cy="${r(y)}" r="2" fill="${c}"/>`)}<circle cx="200" cy="200" r="30"/>`,
  constellations: (c) => { const R = rand(3), stars = Array.from({ length: 34 }, () => [50 + R() * 300, 70 + R() * 260]);
    return stars.map(([x, y]) => `<circle cx="${r(x)}" cy="${r(y)}" r="${r(1.5 + R() * 2.2)}" fill="${c}" stroke="none"/>`).join("") + [[0, 3, 7, 12], [5, 9, 14], [18, 21, 25, 29], [10, 16, 22]].map((g) => `<path d="M${g.map((k) => r(stars[k][0]) + " " + r(stars[k][1])).join(" L")}" stroke-width="1"/>`).join(""); },
  filigree: () => `<circle cx="200" cy="200" r="140" stroke-width="2"/>${ring(16, 116, (x, y, i) => `<path d="M200 200 Q${r((x + 200) / 2 + (i % 2 ? 22 : -22))} ${r((y + 200) / 2)} ${r(x)} ${r(y)}" stroke-width="1.6"/><circle cx="${r(x)}" cy="${r(y)}" r="7" stroke-width="1.5"/>`)}<circle cx="200" cy="200" r="22" stroke-width="2"/>`,
  moonphases: (c) => `<circle cx="200" cy="200" r="140" stroke-width="2"/>${ring(8, 112, (x, y, i) => `<circle cx="${r(x)}" cy="${r(y)}" r="15" stroke-width="1.5"/><path d="M${r(x)} ${r(y - 15)} A15 15 0 0 ${i < 4 ? 1 : 0} ${r(x)} ${r(y + 15)} A${r(Math.abs(15 * Math.cos((i / 8) * Math.PI * 2)))} 15 0 0 ${i % 4 < 2 ? 0 : 1} ${r(x)} ${r(y - 15)}Z" fill="${c}" stroke="none"/>`)}${txt(200, 200, "☽", 34, `fill="${c}" stroke="none"`)}`,
  obsidian: (c) => `<circle cx="200" cy="200" r="140" stroke-width="3"/>${ring(16, 122, (x, y, i) => txt(x, y, "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ"[i], 16, `fill="${c}" stroke="none" font-family="Noto Sans Runic"`))}<path d="M200 90 L214 170 L280 150 L226 206 L300 260 L210 236 L200 310 L188 236 L104 262 L172 204 L118 148 L186 170Z" stroke-width="1.6"/>`,
};

// ---------------------------------------------------------------- vibes: theme + fonts + background
export const VIBE_FONTS = {
  "UnifrakturMaguntia": "unifrakturmaguntia", "IM Fell English": "im-fell-english", "Uncial Antiqua": "uncial-antiqua", "Metamorphous": "metamorphous",
  "VT323": "vt323", "Orbitron": "orbitron", "Cormorant Garamond": "cormorant-garamond", "Creepster": "creepster",
};
