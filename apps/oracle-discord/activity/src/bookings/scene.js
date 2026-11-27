// Bookings drawing (SVG, 320 x 240): a playbill pasted by the stage door. The venue, the client's request, your name
// set as big as your billing, and the stage-door light (shop look). A good show stamps SOLD OUT; a flop, CANCELLED.
import { venueOf, CLIENTS, BILLINGS } from "./bill.js";
const PAPER = { "bk-cream": ["#efe2c2", "#2a1a10", "#a3122a"], "bk-red": ["#b3122a", "#fff1d8", "#ffd36a"], "bk-black": ["#141018", "#f3e6c8", "#E2B04A"] };
const TYPE = { "bk-slab": ["Georgia,serif", 900, "none"], "bk-fancy": ["Georgia,serif", 700, "italic"], "bk-gilt": ["Georgia,serif", 900, "none"] };
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function lamp(id) {
  if (id === "bk-bulbs") return `<g>${Array.from({ length: 13 }, (_, i) => `<circle class="bk-bulb" style="--d:${(i % 4) * 0.2}s" cx="${70 + i * 15}" cy="12" r="4" fill="#ffe9a8"/>`).join("")}</g>`;
  if (id === "bk-neon") return `<text class="bk-neon" x="160" y="22" font-size="16" text-anchor="middle" fill="none" stroke="#ff5ad8" stroke-width="1.6" font-family="Georgia,serif" letter-spacing="3">TONIGHT</text>`;
  return `<g><path d="M276 30h18" stroke="#555" stroke-width="3"/><path d="M286 30v8" stroke="#555" stroke-width="2"/><path d="M279 38h14l-3 14h-8z" fill="#2a2a2a" stroke="#888"/><circle class="bk-glow" cx="286" cy="46" r="18" fill="#FFE3A3" opacity=".18"/><circle cx="286" cy="45" r="3.5" fill="#FFE3A3"/></g>`;
}
/** The playbill for booking b. opts: { look, name, billing (0-3), state: null | "won" | "flop" }. */
export function billSvg(b, { look = {}, name = "You", billing = 0, state = null } = {}) {
  const [bg, ink, hi] = PAPER[look.paper] || PAPER["bk-cream"], [ff, fw, fs] = TYPE[look.type] || TYPE["bk-slab"], gilt = look.type === "bk-gilt";
  const v = b ? venueOf(b.venue) : null, c = b ? CLIENTS[b.client] : null, size = [16, 20, 24, 28][billing] || 16, nm = String(name).slice(0, 18);
  return `<svg viewBox="0 0 320 240" role="img" aria-label="${xmlEsc(v ? v.name : "The stage door")}">
  <defs><linearGradient id="bk-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#E2B04A"/><stop offset="1" stop-color="#9a6a18"/></linearGradient></defs>
  <rect width="320" height="240" fill="#1a1012"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M0 ${40 * i + 20}h320" stroke="#2a1a1c" stroke-width="2"/>`).join("")}
  ${lamp(look.lamp)}
  <g class="bk-bill"><rect x="70" y="30" width="180" height="200" fill="${bg}" stroke="#0006"/><path d="M70 30l8 6l-8 6M250 30l-8 6l8 6" fill="#0003"/>
    <text x="160" y="52" font-size="9" text-anchor="middle" fill="${ink}" font-family="${ff}" letter-spacing="1.5"${v && v.name.length > 16 ? ' textLength="160" lengthAdjust="spacingAndGlyphs"' : ""}>${v ? xmlEsc(v.name.toUpperCase()) : "THE STAGE DOOR"}</text>
    <path d="M86 58h148" stroke="${hi}" stroke-width="1.5"/>
    <text x="160" y="90" font-size="30" text-anchor="middle">${v ? v.e : "🎟️"}</text>
    <text x="160" y="110" font-size="8" text-anchor="middle" fill="${ink}" font-family="${ff}" font-style="italic">${c ? xmlEsc(c.name + " presents") : "Tonight's Bill"}</text>
    <text x="160" y="${138 + size / 3}" font-size="${size}" text-anchor="middle" fill="${gilt ? "url(#bk-gold)" : hi}" font-family="${ff}" font-weight="${fw}" font-style="${fs}"${nm.length * size * 0.72 > 160 ? ' textLength="160" lengthAdjust="spacingAndGlyphs"' : ""}>${xmlEsc(nm.toUpperCase())}</text>
    <text x="160" y="168" font-size="8" text-anchor="middle" fill="${ink}" font-family="${ff}" letter-spacing="2">${xmlEsc((BILLINGS[billing] || BILLINGS[0]).name.toUpperCase())}</text>
    <text x="160" y="190" font-size="9" text-anchor="middle" fill="${ink}" font-family="${ff}">${b ? "★".repeat(b.lv) + " LEVEL " + b.lv : "★ ★ ★"}</text>
    <path d="M86 202h148" stroke="${hi}" stroke-width="1.5"/><text x="160" y="218" font-size="7" text-anchor="middle" fill="${ink}" font-family="${ff}" textLength="164" lengthAdjust="spacingAndGlyphs">NO SPIRITS WERE CONTACTED IN THIS PERFORMANCE</text>
    ${state ? `<g class="bk-stamp"><rect x="104" y="112" width="112" height="30" rx="3" fill="none" stroke="${state === "won" ? "#1f8a4a" : "#c8203a"}" stroke-width="3" transform="rotate(-10 160 127)"/><text x="160" y="133" font-size="15" font-weight="700" fill="${state === "won" ? "#1f8a4a" : "#c8203a"}" text-anchor="middle" transform="rotate(-10 160 127)" font-family="Georgia,serif">${state === "won" ? "SOLD OUT" : "CANCELLED"}</text></g>` : ""}</g></svg>`;
}
