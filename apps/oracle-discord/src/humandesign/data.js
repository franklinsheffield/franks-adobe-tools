// Human Design structure: gate wheel, centres, channels, incarnation cross names.
// Structural facts only (no interpretive text). Cross names cross-checked with natalengine (MIT).

// Gates in zodiac order starting at 302° (2°00' Aquarius, Gate 41). Each gate spans 5.625°, each line 0.9375°.
export const WHEEL_START = 302;
export const WHEEL = [41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12,
  15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11,
  10, 58, 38, 54, 61, 60];

export const CENTERS = {
  head: { name: "Head", gates: [64, 61, 63], kind: "pressure" },
  ajna: { name: "Ajna", gates: [47, 24, 4, 17, 43, 11], kind: "awareness" },
  throat: { name: "Throat", gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16], kind: "expression" },
  g: { name: "G Centre", gates: [1, 13, 25, 46, 2, 15, 10, 7], kind: "identity" },
  heart: { name: "Heart (Ego)", gates: [21, 40, 26, 51], kind: "motor" },
  sacral: { name: "Sacral", gates: [5, 14, 29, 59, 9, 3, 42, 27, 34], kind: "motor" },
  solar: { name: "Solar Plexus", gates: [6, 37, 22, 36, 30, 55, 49], kind: "motor+awareness" },
  spleen: { name: "Spleen", gates: [48, 57, 44, 50, 32, 28, 18], kind: "awareness" },
  root: { name: "Root", gates: [53, 60, 52, 19, 39, 41, 58, 38, 54], kind: "pressure+motor" },
};
export const MOTORS = ["heart", "sacral", "solar", "root"];
export const GATE_CENTER = Object.fromEntries(Object.entries(CENTERS).flatMap(([c, v]) => v.gates.map((g) => [g, c])));

export const CHANNELS = [
  [1, 8, "Inspiration"], [2, 14, "The Beat"], [3, 60, "Mutation"], [4, 63, "Logic"], [5, 15, "Rhythm"],
  [6, 59, "Intimacy"], [7, 31, "The Alpha"], [9, 52, "Concentration"], [10, 20, "Awakening"], [10, 34, "Exploration"],
  [10, 57, "Perfected Form"], [11, 56, "Curiosity"], [12, 22, "Openness"], [13, 33, "The Prodigal"], [16, 48, "The Wavelength"],
  [17, 62, "Acceptance"], [18, 58, "Judgment"], [19, 49, "Synthesis"], [20, 34, "Charisma"], [20, 57, "The Brainwave"],
  [21, 45, "Money"], [23, 43, "Structuring"], [24, 61, "Awareness"], [25, 51, "Initiation"], [26, 44, "Surrender"],
  [27, 50, "Preservation"], [28, 38, "Struggle"], [29, 46, "Discovery"], [30, 41, "Recognition"], [32, 54, "Transformation"],
  [34, 57, "Power"], [35, 36, "Transitoriness"], [37, 40, "Community"], [39, 55, "Emoting"], [42, 53, "Maturation"],
  [47, 64, "Abstraction"],
].map(([a, b, name]) => ({ gates: [a, b], name, key: `${a}-${b}`, centers: [GATE_CENTER[a], GATE_CENTER[b]] }));

// Planets in standard Human Design order.
export const PLANETS = [
  ["sun", "Sun", "☉"], ["earth", "Earth", "⊕"], ["northNode", "North Node", "☊"], ["southNode", "South Node", "☋"],
  ["moon", "Moon", "☽"], ["mercury", "Mercury", "☿"], ["venus", "Venus", "♀"], ["mars", "Mars", "♂"], ["jupiter", "Jupiter", "♃"],
  ["saturn", "Saturn", "♄"], ["uranus", "Uranus", "♅"], ["neptune", "Neptune", "♆"], ["pluto", "Pluto", "♇"],
].map(([key, name, glyph]) => ({ key, name, glyph }));

// [Right Angle, Juxtaposition, Left Angle] cross names by Personality Sun gate.
export const CROSSES = {
  1: ["The Sphinx", "Self-Expression", "Defiance"], 2: ["The Sphinx", "The Driver", "Defiance"], 3: ["Laws", "Mutation", "Wishes"],
  4: ["Explanation", "Formulization", "Revolution"], 5: ["Consciousness", "Habits", "Separation"], 6: ["Eden", "Conflict", "The Plane"],
  7: ["The Sphinx", "Interaction", "The Masks"], 8: ["Contagion", "Contribution", "Uncertainty"], 9: ["Planning", "Focus", "Identification"],
  10: ["The Vessel of Love", "Behavior", "Prevention"], 11: ["Eden", "Ideas", "Education"], 12: ["Eden", "Articulation", "Education"],
  13: ["The Sphinx", "Listening", "The Masks"], 14: ["Contagion", "Empowering", "Uncertainty"], 15: ["The Vessel of Love", "Extremes", "Prevention"],
  16: ["Planning", "Experimentation", "Identification"], 17: ["Service", "Opinions", "Upheaval"], 18: ["Service", "Correction", "Upheaval"],
  19: ["The Four Ways", "Need", "Refinement"], 20: ["The Sleeping Phoenix", "The Now", "Duality"], 21: ["Tension", "Control", "Endeavor"],
  22: ["Rulership", "Grace", "Informing"], 23: ["Explanation", "Assimilation", "Dedication"], 24: ["The Four Ways", "Rationalization", "Incarnation"],
  25: ["The Vessel of Love", "Innocence", "Healing"], 26: ["Rulership", "The Trickster", "Confrontation"], 27: ["The Unexpected", "Caring", "Alignment"],
  28: ["The Unexpected", "Risks", "Alignment"], 29: ["Contagion", "Commitment", "Industry"], 30: ["Contagion", "Fates", "Industry"],
  31: ["The Unexpected", "Influence", "The Alpha"], 32: ["Maya", "Conservation", "Limitation"], 33: ["The Four Ways", "Retreat", "Refinement"],
  34: ["The Sleeping Phoenix", "Power", "Duality"], 35: ["Consciousness", "Experience", "Separation"], 36: ["Eden", "Crisis", "The Plane"],
  37: ["Planning", "Bargains", "Migration"], 38: ["Tension", "Opposition", "Individualism"], 39: ["Tension", "Provocation", "Individualism"],
  40: ["Planning", "Denial", "Migration"], 41: ["The Unexpected", "Fantasy", "The Alpha"], 42: ["Maya", "Completion", "Limitation"],
  43: ["Explanation", "Insight", "Dedication"], 44: ["The Four Ways", "Alertness", "Incarnation"], 45: ["Rulership", "Possession", "Confrontation"],
  46: ["The Vessel of Love", "Serendipity", "Healing"], 47: ["Rulership", "Oppression", "Informing"], 48: ["Tension", "Depth", "Endeavor"],
  49: ["Explanation", "Principles", "Revolution"], 50: ["Laws", "Values", "Wishes"], 51: ["Penetration", "Shock", "The Clarion"],
  52: ["Service", "Stillness", "Demands"], 53: ["Penetration", "Beginnings", "Cycles"], 54: ["Penetration", "Ambition", "Cycles"],
  55: ["The Sleeping Phoenix", "Moods", "Spirit"], 56: ["Laws", "Stimulation", "Distraction"], 57: ["Penetration", "Intuition", "The Clarion"],
  58: ["Service", "Vitality", "Demands"], 59: ["The Sleeping Phoenix", "Strategy", "Spirit"], 60: ["Laws", "Limitation", "Distraction"],
  61: ["Maya", "Thinking", "Obscuration"], 62: ["Maya", "Details", "Obscuration"], 63: ["Consciousness", "Doubts", "Dominion"],
  64: ["Consciousness", "Confusion", "Dominion"],
};
