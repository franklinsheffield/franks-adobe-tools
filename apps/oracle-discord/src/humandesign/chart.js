// Human Design bodygraph from a UTC birth instant: activations, centres, channels, type, authority, profile, cross.
import { positions, solarArcBefore, norm } from "../ephemeris.js";
import { WHEEL, WHEEL_START, CENTERS, MOTORS, GATE_CENTER, CHANNELS, PLANETS, CROSSES } from "./data.js";

const GATE = 360 / 64, LINE = GATE / 6, COLOR = LINE / 6, TONE = COLOR / 6, BASE = TONE / 5;

/** Longitude -> { gate, line, color, tone, base }. */
export function activation(lon) {
  const x = norm(lon - WHEEL_START), i = Math.floor(x / GATE), r = x - i * GATE;
  const line = Math.floor(r / LINE), r2 = r - line * LINE, color = Math.floor(r2 / COLOR), r3 = r2 - color * COLOR;
  const tone = Math.floor(r3 / TONE), base = Math.floor((r3 - tone * TONE) / BASE);
  return { gate: WHEEL[i], line: line + 1, color: color + 1, tone: tone + 1, base: base + 1, lon: norm(lon) };
}

function side(date, node) {
  const p = positions(date, { node });
  const lon = { sun: p.sun.lon, earth: p.sun.lon + 180, northNode: p.node.lon, southNode: p.node.lon + 180,
    moon: p.moon.lon, mercury: p.mercury.lon, venus: p.venus.lon, mars: p.mars.lon, jupiter: p.jupiter.lon,
    saturn: p.saturn.lon, uranus: p.uranus.lon, neptune: p.neptune.lon, pluto: p.pluto.lon };
  return Object.fromEntries(PLANETS.map(({ key }) => [key, activation(lon[key])]));
}

const RIGHT = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6"], LEFT = ["5/1", "5/2", "6/2", "6/3"];

/** Full chart. `birthUtc` is a Date. Options: { node: 'true' | 'mean' }. */
export function bodygraph(birthUtc, { node = "true" } = {}) {
  const designUtc = solarArcBefore(birthUtc, 88);
  const personality = side(birthUtc, node), design = side(designUtc, node);

  const gates = new Map(); // gate -> { personality: bool, design: bool }
  for (const [who, s] of [["personality", personality], ["design", design]])
    for (const a of Object.values(s)) { const g = gates.get(a.gate) || { personality: false, design: false }; g[who] = true; gates.set(a.gate, g); }

  const channels = CHANNELS.filter((c) => gates.has(c.gates[0]) && gates.has(c.gates[1]));
  const defined = new Set(channels.flatMap((c) => c.centers));

  // Connected groups of defined centres (via defined channels).
  const adj = Object.fromEntries(Object.keys(CENTERS).map((c) => [c, new Set()]));
  for (const c of channels) { adj[c.centers[0]].add(c.centers[1]); adj[c.centers[1]].add(c.centers[0]); }
  const groupOf = {}, groups = [];
  for (const c of defined) {
    if (groupOf[c] !== undefined) continue;
    const q = [c], g = []; groupOf[c] = groups.length;
    while (q.length) { const x = q.pop(); g.push(x); for (const y of adj[x]) if (groupOf[y] === undefined) { groupOf[y] = groups.length; q.push(y); } }
    groups.push(g);
  }
  const linked = (a, b) => defined.has(a) && defined.has(b) && groupOf[a] === groupOf[b];
  const motorToThroat = MOTORS.some((m) => linked(m, "throat"));

  let type;
  if (defined.size === 0) type = "Reflector";
  else if (defined.has("sacral")) type = motorToThroat ? "Manifesting Generator" : "Generator";
  else type = motorToThroat ? "Manifestor" : "Projector";

  let authority;
  if (type === "Reflector") authority = "Lunar";
  else if (defined.has("solar")) authority = "Emotional";
  else if (defined.has("sacral")) authority = "Sacral";
  else if (defined.has("spleen")) authority = "Splenic";
  else if (defined.has("heart")) authority = linked("heart", "throat") ? "Ego Manifested" : "Ego Projected";
  else if (defined.has("g") && linked("g", "throat")) authority = "Self-Projected";
  else authority = "Mental (Outer)";

  const definition = ["None", "Single", "Split", "Triple Split", "Quadruple Split"][groups.length];
  const profile = `${personality.sun.line}/${design.sun.line}`;
  const angle = profile === "4/1" ? "Juxtaposition" : LEFT.includes(profile) ? "Left Angle" : "Right Angle";
  const name = CROSSES[personality.sun.gate][angle === "Right Angle" ? 0 : angle === "Juxtaposition" ? 1 : 2];
  const cross = { angle, name, gates: [personality.sun.gate, personality.earth.gate, design.sun.gate, design.earth.gate],
    full: `${angle} Cross of ${name.replace(/^The /, "the ")} (${personality.sun.gate}/${personality.earth.gate} | ${design.sun.gate}/${design.earth.gate})` };

  return {
    birthUtc, designUtc, node, personality, design,
    gates: Object.fromEntries([...gates].sort((a, b) => a[0] - b[0])),
    channels: channels.map(({ key, name, gates, centers }) => ({ key, name, gates, centers })),
    centers: Object.fromEntries(Object.keys(CENTERS).map((c) => [c, defined.has(c)])),
    type, strategy: STRATEGY[type], authority, definition, profile, cross,
    signature: SIGNATURE[type],
  };
}

export const STRATEGY = { Generator: "Wait to respond", "Manifesting Generator": "Wait to respond, then inform",
  Manifestor: "Inform before you act", Projector: "Wait for the invitation", Reflector: "Wait a lunar cycle (about 28 days)" };
export const SIGNATURE = { Generator: ["Satisfaction", "Frustration"], "Manifesting Generator": ["Satisfaction", "Frustration and anger"],
  Manifestor: ["Peace", "Anger"], Projector: ["Success", "Bitterness"], Reflector: ["Surprise", "Disappointment"] };
