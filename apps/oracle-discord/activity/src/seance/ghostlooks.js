// The Séance ghost's looks: the avatar of the spirit that rises over the séance table. Sold on the Essence store's
// "👻 Ghost avatars" shelf in the Ghosts department (registered through ROOMS -> registerShelf; prog.ghost = the one worn).
// Each look is the ghost's body drawn in the séance scene's 400 x 300 box (centre x 200, from y 46 down to about 182).
// Every look keeps the scene's hooks: .sc-eyes (blink), .sc-mouth (frown when wrong), and adds its own sg-* motion
// (chamber.css) and its own cry (sfx.js ghostCry), heard when it is summoned and when you try it on.

const eyes = (fill = "#160b2c", rx = 7, ry = 10, y = 106, glow = "") => `<g class="sc-eyes">${glow ? `<ellipse cx="184" cy="${y}" rx="${rx + 5}" ry="${ry + 5}" fill="${glow}" opacity=".35"/><ellipse cx="216" cy="${y}" rx="${rx + 5}" ry="${ry + 5}" fill="${glow}" opacity=".35"/>` : ""}<ellipse cx="184" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/><ellipse cx="216" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/><circle cx="181" cy="${y - 4}" r="2.2" fill="#fff" opacity=".85"/><circle cx="213" cy="${y - 4}" r="2.2" fill="#fff" opacity=".85"/></g>`;
const SHEET = "M200 46 C236 46 252 76 252 114 L252 180 L240 170 L228 182 L214 170 L200 182 L186 170 L172 182 L160 170 L148 180 L148 114 C148 76 164 46 200 46Z";
const grad = (id, a, b, op = ".75") => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}" stop-opacity="${op}"/></linearGradient>`;

/** id -> the ghost's body (inside .sc-gb). */
export const GHOST_LOOK = {
  "gh-sheet": () => `<path d="${SHEET}" fill="url(#sc-sheet)" stroke="#fff" stroke-width="1.2" opacity=".9"/>
    ${eyes()}<ellipse class="sc-mouth" cx="200" cy="134" rx="9" ry="7" fill="#160b2c"/>`,

  "gh-ecto": () => `<defs>${grad("sg-ecto", "#d8ffb0", "#3fdc6a", ".55")}</defs>
    <path class="sg-wobble" d="M200 48 C240 46 256 80 254 118 C252 146 262 160 252 176 C244 168 238 186 228 176 C220 190 208 172 200 184 C190 172 180 190 172 176 C162 186 156 168 148 176 C138 160 148 146 146 118 C144 80 160 50 200 48Z" fill="url(#sg-ecto)" stroke="#eaffd0" stroke-width="1.4" opacity=".88"/>
    <g class="sg-drips" fill="#8dff9e" opacity=".8"><path class="sg-drip" d="M172 178 q4 10 0 14 q-4 -4 0 -14Z"/><path class="sg-drip" d="M228 178 q4 10 0 14 q-4 -4 0 -14Z" style="animation-delay:-.9s"/><path class="sg-drip" d="M200 184 q4 10 0 14 q-4 -4 0 -14Z" style="animation-delay:-1.6s"/></g>
    <g class="sg-bubbles" fill="none" stroke="#f2ffe0" stroke-width="1.2" opacity=".7"><circle cx="170" cy="140" r="4"/><circle cx="232" cy="150" r="3"/><circle cx="214" cy="80" r="2.5"/></g>
    ${eyes("#0f3d1c", 8, 9, 106, "#d8ffb0")}<path class="sc-mouth" d="M186 130 Q200 146 214 130 Q200 138 186 130Z" fill="#0f3d1c"/>`,

  "gh-gent": () => `<defs>${grad("sg-gent", "#eef6ff", "#9fc3ff", ".7")}</defs>
    <path d="${SHEET}" fill="url(#sg-gent)" stroke="#fff" stroke-width="1.2" opacity=".9"/>
    <path d="M184 150 L200 160 L216 150 L216 170 L200 162 L184 170Z" fill="#2a1d4a" opacity=".85"/>
    <g class="sg-hat"><rect x="172" y="36" width="56" height="8" rx="3" fill="#1b1230"/><rect x="180" y="4" width="40" height="34" rx="3" fill="#1b1230"/><rect x="180" y="28" width="40" height="6" fill="#7a3a8e"/></g>
    ${eyes("#1b1230", 6, 8, 104)}<circle class="sg-mono" cx="216" cy="104" r="12" fill="none" stroke="#E2B04A" stroke-width="2.4"/><path d="M228 106 q8 16 2 34" fill="none" stroke="#E2B04A" stroke-width="1.2"/>
    <path class="sg-tache" d="M200 124 q-10 -6 -20 2 q-6 4 -10 -2 M200 124 q10 -6 20 2 q6 4 10 -2" fill="none" stroke="#1b1230" stroke-width="4" stroke-linecap="round"/>
    <ellipse class="sc-mouth" cx="200" cy="136" rx="5" ry="3.5" fill="#1b1230"/>`,

  "gh-wisp": () => `<defs><radialGradient id="sg-wisp" cx="50%" cy="65%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9fdcff"/><stop offset="1" stop-color="#2a6bff" stop-opacity=".55"/></radialGradient></defs>
    <circle cx="200" cy="130" r="64" fill="#7fc8ff" opacity=".18"/>
    <path class="sg-flick" d="M200 30 C214 62 250 84 248 128 C246 164 224 184 200 184 C176 184 154 164 152 128 C150 96 176 82 182 58 C188 74 194 76 196 66 C198 54 196 42 200 30Z" fill="url(#sg-wisp)" stroke="#e6f6ff" stroke-width="1.2"/>
    <g class="sg-orbit" fill="#e6f6ff"><circle cx="200" cy="40" r="3"/><circle cx="268" cy="130" r="2.4"/><circle cx="132" cy="140" r="2"/></g>
    ${eyes("#0b1f5c", 6, 9, 120)}<path class="sc-mouth" d="M190 144 Q200 152 210 144" fill="none" stroke="#0b1f5c" stroke-width="3" stroke-linecap="round"/>`,

  "gh-polter": () => `<defs>${grad("sg-polter", "#e9c8ff", "#7b3fd0", ".6")}</defs>
    <g class="sg-twist"><path d="M162 132 C150 156 190 162 178 180 C200 176 214 190 200 206 C226 190 224 170 246 160 C226 158 252 138 238 132Z" fill="#9b5de5" opacity=".7"/></g>
    <path d="M200 46 C238 46 254 78 250 116 C248 136 240 148 226 156 L174 156 C160 148 152 136 150 116 C146 78 162 46 200 46Z" fill="url(#sg-polter)" stroke="#f3e0ff" stroke-width="1.2" opacity=".92"/>
    <path d="M172 90 L194 100 M228 90 L206 100" stroke="#2a0b4a" stroke-width="5" stroke-linecap="round"/>
    ${eyes("#ff3b6b", 6, 7, 110, "#ff7fa0")}<path class="sc-mouth" d="M180 130 L186 138 L192 130 L198 138 L204 130 L210 138 L216 130 L220 136 L176 136Z" fill="#2a0b4a" stroke="#fff" stroke-width="1"/>
    <g class="sg-cup"><path d="M266 60 h18 l-3 14 h-12Z" fill="#fff8ea" stroke="#E2B04A" stroke-width="1.4"/><path d="M284 63 q7 1 4 7 q-2 3 -5 2" fill="none" stroke="#E2B04A" stroke-width="1.4"/></g>
    <g class="sg-book"><rect x="110" y="56" width="22" height="16" rx="2" fill="#5a1830" stroke="#E2B04A" stroke-width="1.2"/><path d="M121 56 v16" stroke="#E2B04A" stroke-width="1"/></g>`,

  "gh-banshee": () => `<defs>${grad("sg-banshee", "#f6f0ff", "#b9a6d8", ".55")}</defs>
    <g class="sg-hair" fill="none" stroke="#e9e2ff" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M164 70 C140 100 150 140 126 176"/><path d="M236 70 C260 100 250 140 274 176" style="animation-delay:-.6s"/><path d="M172 60 C150 96 166 150 146 190" style="animation-delay:-1.1s"/><path d="M228 60 C250 96 234 150 254 190" style="animation-delay:-.3s"/></g>
    <path d="M200 46 C232 46 246 74 246 108 C246 140 258 170 250 192 L236 178 L222 194 L208 180 L200 196 L192 180 L178 194 L164 178 L150 192 C142 170 154 140 154 108 C154 74 168 46 200 46Z" fill="url(#sg-banshee)" stroke="#fff" stroke-width="1.2" opacity=".9"/>
    ${eyes("#2b1b45", 6, 11, 104)}<path d="M176 92 L192 98 M224 92 L208 98" stroke="#2b1b45" stroke-width="3" stroke-linecap="round"/>
    <ellipse class="sc-mouth sg-wail" cx="200" cy="140" rx="10" ry="16" fill="#2b1b45"/>`,

  "gh-cat": () => `<defs>${grad("sg-cat", "#ffffff", "#d6cfee", ".8")}</defs>
    <path class="sg-tail" d="M244 164 C276 160 286 130 270 112" fill="none" stroke="#e9e4f8" stroke-width="10" stroke-linecap="round" opacity=".9"/>
    <path d="M162 74 L156 36 L186 58Z M238 74 L244 36 L214 58Z" fill="#f4f1ff" stroke="#fff" stroke-width="1.2"/><path d="M164 66 L160 46 L178 60Z M236 66 L240 46 L222 60Z" fill="#ffb3d1"/>
    <path d="${SHEET}" fill="url(#sg-cat)" stroke="#fff" stroke-width="1.2" opacity=".92"/>
    <g class="sc-eyes"><path d="M176 108 Q184 98 192 108" fill="none" stroke="#160b2c" stroke-width="4" stroke-linecap="round"/><path d="M208 108 Q216 98 224 108" fill="none" stroke="#160b2c" stroke-width="4" stroke-linecap="round"/></g>
    <path d="M196 118 L204 118 L200 123Z" fill="#ff7fb0"/><path class="sc-mouth" d="M190 126 Q195 132 200 126 Q205 132 210 126" fill="none" stroke="#160b2c" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M168 120 h-18 M168 126 h-16 M232 120 h18 M232 126 h16" stroke="#9a93b8" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="172" cy="124" rx="6" ry="3.5" fill="#ffb3d1" opacity=".6"/><ellipse cx="228" cy="124" rx="6" ry="3.5" fill="#ffb3d1" opacity=".6"/>`,
};
export const DEFAULT_GHOST = "gh-sheet";
export const ghostBody = (id) => (GHOST_LOOK[id] || GHOST_LOOK[DEFAULT_GHOST])();

export const ghostShop = {
  kind: "ghost",
  label: "👻 Ghost avatars",
  items: [
    { id: "gh-sheet", name: "Bedsheet ghost", note: "The classic. Two eyes, one sheet, no feet", price: 0 },
    { id: "gh-cat", name: "Ghost cat", note: "Ears, whiskers and a swishing tail. Purrs from beyond", price: 90 },
    { id: "gh-ecto", name: "Ectoplasm", note: "Green, wobbly and dripping. Séance 'ectoplasm' was often cheesecloth", price: 100 },
    { id: "gh-wisp", name: "Will-o'-the-wisp", note: "A blue flame with a face. Marsh lights, likely burning marsh gas", price: 120 },
    { id: "gh-gent", name: "Victorian gentleman", note: "Top hat, monocle and a moustache. Tips his hat when summoned", price: 140 },
    { id: "gh-polter", name: "Poltergeist", note: "A spinning tail and flying teacups. 'Noisy ghost' in German", price: 160 },
    { id: "gh-banshee", name: "Banshee", note: "Streaming hair and a wail from Irish folklore", price: 180 },
  ],
  talk: {
    open: ["Ghost avatars. Choose who rises over your séance table.", "Every spirit needs a look. Even the dead like to make an entrance."],
    tryon: ["The {item}. Rather striking, for someone who's been dead a while.", "Behold, the {item}. Your séance will never be the same.", "The {item} rises. Say hello. It can hear you."],
    buy: ["The {item} is yours. It will haunt every séance from now on.", "Sold! The {item} moves in tonight. No rent, lots of rattling."],
  },
  preview(id, ctx) { if (ghostShop.draw) { ctx.tableEl.className = "table seance"; ctx.tableEl.innerHTML = ghostShop.draw(id, ctx.prog); ctx.cap("👻 " + (ghostShop.items.find((x) => x.id === id)?.name || "")); ghostShop.cry?.(id); } },
  draw: null, // set by room.js
  cry: null, // set by room.js
};
