// Commissions drawing (SVG): a job board with today's three letters, a wax seal on each, and the stamp when you deliver.
const SEAL = { "cm-red": "#b8322a", "cm-black": "#1c1a1e", "cm-green": "#2f6b3a", "cm-gold": "#d8a838" };
const BOARD = { "cm-oak": ["#6a4426", "#8a5a34"], "cm-slate": ["#2e3338", "#4a5258"], "cm-guild": ["#4a2618", "#7a3a22"] };
const x = (s) => String(s).replace(/[<&>"]/g, "");
/** jobs: [{ e, who, tier, state: ok|done|locked|missing }], focus: index of the letter being delivered, stamp: show the stamp */
export function boardSvg({ jobs = [], look = {}, focus = -1, stamp = false, product = "" } = {}) {
  const seal = SEAL[look.seal] || SEAL["cm-red"], [b1, b2] = BOARD[look.board] || BOARD["cm-oak"];
  const letter = (j, i) => { const cx = 60 + i * 100, on = i === focus, lock = j.state === "locked";
    return `<g class="cm-letter${on ? " on" : ""}" style="--i:${i}"><g transform="translate(${cx - 40} 52)"><rect width="80" height="104" rx="3" fill="${lock ? "#8a8274" : "#efe2c2"}" stroke="#0004"/>
      <circle cx="40" cy="-2" r="5" fill="#c9a24a"/><text x="40" y="34" font-size="26" text-anchor="middle">${lock ? "🔒" : j.e}</text>
      <text x="40" y="58" font-size="8.5" fill="#3a2a18" text-anchor="middle">${x(j.who).slice(0, 18)}</text><text x="40" y="70" font-size="7.5" fill="#6a5434" text-anchor="middle">${"★".repeat(j.tier)}</text>
      <path d="M10 82 h60 M10 90 h44" stroke="#6a543466" stroke-width="2"/>
      ${j.state === "done" || (on && stamp) ? `<g class="cm-stamp"><circle cx="58" cy="88" r="13" fill="${seal}"/><circle cx="58" cy="88" r="8" fill="none" stroke="#fff6" stroke-width="1.5"/><text x="40" y="52" font-size="12" fill="${seal}" text-anchor="middle" transform="rotate(-14 40 52)" font-weight="700">DELIVERED</text></g>` : ""}</g></g>`; };
  return `<svg class="cm-board" viewBox="0 0 320 240" role="img" aria-label="The Commissions job board"><rect width="320" height="240" fill="#141010"/>
    <rect x="8" y="24" width="304" height="160" rx="6" fill="${b1}"/><rect x="16" y="32" width="288" height="144" rx="4" fill="${b2}"/><text x="160" y="20" font-size="11" fill="#e8d6a8" text-anchor="middle" letter-spacing="2">COMMISSIONS</text>
    ${jobs.map(letter).join("")}
    <rect y="196" width="320" height="44" fill="#2a2018"/>${product ? `<g class="cm-crate"><rect x="132" y="186" width="56" height="34" rx="3" fill="#8a5a34" stroke="#0006"/><text x="160" y="181" font-size="10" fill="#f3e6c8" text-anchor="middle">${x(product).slice(0, 26)}</text></g>` : ""}</svg>`;
}
