// Sacred Geometry Builder levels. Coordinates are in the board's frame (x right, y down, centre 0,0; the board shows
// about 400 × 300). Each construction has given points and objects, the model solution as steps (circle: centre c through
// p; segment: a to b), the goal (indexes of steps that must be on the board; default all), the Oracle's lesson, written
// steps (shown at Apprentice and Adept), the fact told on completion, a question, a Codex entry and its source.
// Three tiers, like the Séance's levels: Apprentice (the next move glows), Adept (written steps, "Show me" costs a
// star), Master (only the goal).
const rad = (d) => (d * Math.PI) / 180;
const pol = (r, deg, o = [0, 0]) => [o[0] + r * Math.cos(rad(deg)), o[1] + r * Math.sin(rad(deg))];
const C = (c, p) => ({ t: "c", c, p });
const S = (a, b) => ({ t: "s", a, b });
const pt = (p, label) => [p[0], p[1], label];
const range = (n) => Array.from({ length: n }, (_, i) => i);

export const TIERS = [
  { n: 1, name: "Apprentice", what: "Foundations", note: "The next move glows on the board." },
  { n: 2, name: "Adept", what: "Proportions", note: "Written steps. 💡 Show me costs a star." },
  { n: 3, name: "Master", what: "Mysteries", note: "Only the goal. Work out the moves yourself." },
];

// ---- Apprentice ----
const O = [0, 0];
const g1 = { id: "g1", tier: 1, title: "Point, Line and Circle", emoji: "⊙",
  given: { pts: [pt(O, "O"), pt([90, 0], "P")] },
  steps: [C(O, [90, 0]), S(O, [90, 0])],
  lesson: "Every figure in this room is made with two tools only. The straightedge draws a straight line between two points. The compass draws a circle around one point, through another. Those are Euclid's rules, written in Alexandria about 300 BCE. Draw a circle around O through P, then join O to P.",
  how: ["🧭 Compass: tap O (the centre), then P.", "📏 Straightedge: tap O, then P."],
  fact: "Euclid's first three postulates are exactly these moves: join two points with a line, extend a line, and draw a circle with any centre and radius. The line from O to P is a radius, and every point on the circle is that same distance from O.",
  q: { ask: "Why does a compass draw a circle?", choices: ["Every point it marks is the same distance from the centre", "It follows the path of the Moon", "Its legs are made of iron", "It doubles the radius each turn"], right: 0,
    why: "A circle is the set of all points at one distance (the radius) from a centre. The compass simply holds that distance fixed." },
  codex: "Circle and radius", src: "Euclid, Elements, Book I, Postulates 1-3 (about 300 BCE)" };

const A2 = [-45, 0], B2 = [45, 0];
const g2 = { id: "g2", tier: 1, title: "Vesica Piscis", emoji: "🐟",
  given: { pts: [pt(A2, "A"), pt(B2, "B")] },
  steps: [C(A2, B2), C(B2, A2)],
  lesson: "Two circles of the same size, each one centred on the other's edge. The almond shape where they overlap is the vesica piscis, Latin for 'fish bladder'. Draw a circle around A through B, then one around B through A.",
  how: ["🧭 Compass: centre A, through B.", "🧭 Compass: centre B, through A."],
  fact: "The vesica is exactly √3 times as tall as it is wide, about 1.732. Its two tips and the two centres make two equilateral triangles back to back. Archimedes used the fraction 265/153 as a close estimate of √3. Medieval masons laid out pointed Gothic arches and windows with this figure.",
  q: { ask: "How many times taller than wide is the vesica?", choices: ["√3 times, about 1.73", "Exactly 2 times", "φ times, about 1.618", "The same height and width"], right: 0,
    why: "The width is one radius; the height is two heights of an equilateral triangle with side one radius, 2 × (√3 / 2) = √3." },
  codex: "Vesica piscis", src: "Archimedes, Measurement of a Circle (√3 ≈ 265/153)" };

const A3 = [-50, 45], B3 = [50, 45], C3 = [0, 45 - 50 * Math.sqrt(3)];
const g3 = { id: "g3", tier: 1, title: "Equilateral Triangle", emoji: "🔺",
  given: { pts: [pt(A3, "A"), pt(B3, "B")], objs: [S(A3, B3)] },
  steps: [C(A3, B3), C(B3, A3), S(A3, C3), S(B3, C3)], goal: [2, 3], names: [pt(C3, "C")],
  lesson: "Euclid's very first proposition: build a triangle with all three sides equal on the line AB. Make a vesica on AB; its top tip is the third corner.",
  how: ["🧭 Compass: centre A, through B.", "🧭 Compass: centre B, through A.", "📏 Straightedge: A to the top crossing C.", "📏 Straightedge: B to C."],
  fact: "AC equals AB because both are radii of the circle around A, and BC equals BA because both are radii of the circle around B. So all three sides match, and each angle is 60°. This is Proposition 1 of Book I of the Elements, the first proof in what became the most-copied maths book in history.",
  q: { ask: "Why is side AC the same length as AB?", choices: ["Both are radii of the circle around A", "Because the triangle points up", "C lies halfway between A and B", "All straight lines are equal"], right: 0,
    why: "Every radius of a circle has the same length, and AB and AC are both radii of the circle centred on A." },
  codex: "Euclid I.1: equilateral triangle", src: "Euclid, Elements I.1" };

const R4 = 90, H4 = range(6).map((k) => pol(R4, 60 * k));
const g4 = { id: "g4", tier: 1, title: "Hexagon", emoji: "⬡",
  given: { pts: [pt(O, "O"), pt(H4[0], "P")], objs: [C(O, H4[0])] },
  steps: [C(H4[0], O), C(H4[1], O), C(H4[2], O), C(H4[3], O), ...range(6).map((k) => S(H4[k], H4[(k + 1) % 6]))], goal: range(6).map((k) => k + 4),
  lesson: "A circle's radius fits around its own edge exactly six times. Keep the compass at that size and walk it around the circle: each new circle is centred where the last one crossed the edge. Then join the six corners.",
  how: ["🧭 Compass: centre P, through O.", "🧭 Compass: centre the next crossing on the circle, through O.", "🧭 Keep walking around: two more circles.", "📏 Join the six corners all the way around."],
  fact: "Each side of a regular hexagon equals the radius, because the hexagon is six equilateral triangles meeting at the centre. Hexagons also split a flat surface into equal cells with the least total wall, which Thomas Hales proved in 1999. Honeycombs use the same shape and so save wax.",
  q: { ask: "How many radius-length chords fit around the circle?", choices: ["6", "5", "2π, about 6.28", "7"], right: 0,
    why: "Six straight chords of length r close the hexagon. The curved circumference is 2πr, a little longer, because arcs bulge past the chords." },
  codex: "Regular hexagon", src: "Euclid, Elements IV.15; T. C. Hales, The Honeycomb Conjecture (1999)" };

const R5 = 55, H5 = range(6).map((k) => pol(R5, -90 + 60 * k));
const g5 = { id: "g5", tier: 1, title: "Seed of Life", emoji: "🌸",
  given: { pts: [pt(O, "O"), pt(H5[0], "P")], objs: [C(O, H5[0])] },
  steps: range(6).map((k) => C(H5[k], O)),
  lesson: "Seven circles of one size: one in the middle and six around it, each centred on the middle circle's edge, where the last one crossed it. It's the hexagon walk again, but keeping the circles. New Age writers call this the Seed of Life.",
  how: ["🧭 Compass: centre P, through O.", "🧭 Centre the next crossing on the middle circle, through O.", "🧭 Keep going around until there are six petals' worth of circles."],
  fact: "The six outer centres are the corners of a regular hexagon, so the Seed is the last level's hexagon drawn in circles. Rosettes of overlapping circles like this are carved and painted in many cultures, from Roman mosaics to medieval churches. The name 'Seed of Life' is modern, from late-20th-century New Age books.",
  q: { ask: "The six outer centres of the Seed of Life are the corners of…", choices: ["A regular hexagon", "A pentagon", "A square and two extra points", "An eight-pointed star"], right: 0,
    why: "Each outer centre is one radius from its neighbours and from the middle: the same walk that drew the hexagon." },
  codex: "Seed of Life", src: "Overlapping-circle rosettes: Roman and medieval examples" };

// ---- Adept ----
const A6 = [-45, 0], B6 = [45, 0], P6 = [0, -45 * Math.sqrt(3)], Q6 = [0, 45 * Math.sqrt(3)];
const a1 = { id: "a1", tier: 2, title: "Perpendicular Bisector", emoji: "✚",
  given: { pts: [pt(A6, "A"), pt(B6, "B")], objs: [S(A6, B6)] },
  steps: [C(A6, B6), C(B6, A6), S(P6, Q6)], goal: [2], names: [pt(P6, "X"), pt(Q6, "Y")],
  lesson: "Cut AB exactly in half, at a right angle, without measuring anything. Builders and surveyors have done this for thousands of years.",
  how: ["🧭 Compass: centre A, through B.", "🧭 Compass: centre B, through A.", "📏 Straightedge: join the two crossings X and Y."],
  fact: "Every point on XY is the same distance from A as from B. It crosses AB at the exact midpoint, at 90°. Euclid proves this in Book I, Propositions 10 and 11. Greek writers called Egyptian surveyors 'rope-stretchers'; how exactly they set out right angles isn't recorded.",
  q: { ask: "Every point on the line XY is…", choices: ["The same distance from A and from B", "Closer to A than to B", "On the circle around A", "Exactly one unit above AB"], right: 0,
    why: "X and Y are each one radius from both A and B, and the line through them is the set of all points equally far from A and B." },
  codex: "Perpendicular bisector", src: "Euclid, Elements I.10-I.11" };

// The circles of radius 2R around L and R cross at (0, ±√3 R).
const R7 = 60, L7 = [-R7, 0], Rt7 = [R7, 0], X7 = [0, -R7 * Math.sqrt(3)], Y7 = [0, R7 * Math.sqrt(3)];
const T7 = [0, -R7], U7 = [0, R7];
const a2 = { id: "a2", tier: 2, title: "Square in a Circle", emoji: "◻",
  given: { pts: [pt(O, "O"), pt(L7, "L"), pt(Rt7, "R")], objs: [C(O, L7), S(L7, Rt7)] },
  steps: [C(L7, Rt7), C(Rt7, L7), S(X7, Y7), S(L7, T7), S(T7, Rt7), S(Rt7, U7), S(U7, L7)], goal: [3, 4, 5, 6], names: [pt(T7, "T"), pt(U7, "U")],
  lesson: "Draw a square inside the circle. First you need a second diameter at right angles to LR: bisect LR the way you just learned, then join the four ends.",
  how: ["🧭 Compass: centre L, through R.", "🧭 Compass: centre R, through L.", "📏 Join the two far crossings: the line passes through O and cuts the circle at T and U.", "📏 Join L, T, R and U all the way round."],
  fact: "The two diameters cross at 90°, so their ends are a quarter-turn apart and make a square. Its diagonal is the circle's diameter, so its side is the diameter divided by √2. Ancient China paired the two shapes in the saying 'round heaven, square earth', and Leonardo's Vitruvian Man sets a body in both.",
  q: { ask: "The square's diagonal is the same length as…", choices: ["The circle's diameter", "The circle's radius", "The circumference", "Two sides of the square"], right: 0,
    why: "The diagonal LR runs through the centre from edge to edge: that's a diameter. By Pythagoras, side = diameter ÷ √2." },
  codex: "Square in a circle", src: "Euclid, Elements IV.6; Leonardo da Vinci, Vitruvian Man (about 1490)" };

const A8 = [-100, 40], B8 = [60, 40], C8 = [60, -40];
const AC8 = Math.hypot(160, 80), D8 = [A8[0] + (160 * (AC8 - 80)) / AC8, A8[1] + (-80 * (AC8 - 80)) / AC8], S8 = [A8[0] + (AC8 - 80), 40];
const a3 = { id: "a3", tier: 2, title: "The Golden Section", emoji: "φ",
  given: { pts: [pt(A8, "A"), pt(B8, "B"), pt(C8, "C")], objs: [S(A8, B8), S(B8, C8), S(A8, C8)] },
  steps: [C(C8, B8), C(A8, D8)], names: [pt(D8, "D"), pt(S8, "S")],
  lesson: "Cut AB into two parts so the whole is to the longer part as the longer part is to the shorter. Euclid called it 'extreme and mean ratio'. We call it the golden ratio, φ, phi. BC stands at right angles to AB and is half as long.",
  how: ["🧭 Compass: centre C, through B. It crosses AC at a new point D.", "🧭 Compass: centre A, through D. It crosses AB at S, the golden cut."],
  fact: "AB ÷ AS = AS ÷ SB = φ = (1 + √5) ÷ 2 ≈ 1.618. Ratios of neighbouring Fibonacci numbers, 8/5, 13/8, 21/13…, close in on φ. Careful with the legends: when measured, the Parthenon, the pyramids and the Mona Lisa don't show φ, and the nautilus shell's spiral isn't golden. Where it is real is sunflower and pine-cone spirals, whose seeds sit about 137.5° apart, the golden angle.",
  q: { ask: "The golden ratio φ is about…", choices: ["1.618", "3.1416", "1.414", "2.718"], right: 0,
    why: "φ = (1 + √5) ÷ 2 = 1.6180339… The others are π (3.14), √2 (1.414) and e (2.718): famous numbers with different jobs." },
  codex: "Golden section φ", src: "Euclid, Elements II.11 and VI.30; Markowsky, Misconceptions about the Golden Ratio (1992)" };

const a4 = { id: "a4", tier: 2, kind: "solids", title: "The Five Platonic Solids", emoji: "🎲", steps: [],
  lesson: "A Platonic solid has faces that are all the same regular shape, with the same number meeting at every corner. There are only five. Watch each one turn and count its faces.",
  how: ["Count the faces of each solid as it turns.", "Then: what do corners minus edges plus faces always make?"],
  fact: "Euclid's last book proves there can only be five: at any corner, the face angles must add up to less than 360°, which only five combinations of triangles, squares and pentagons allow. Plato's Timaeus matched four with the elements (fire, earth, air, water) and the dodecahedron with the heavens. Kepler in 1596 nested them between the planets' orbits. The idea was wrong, but the search led him to his laws of planetary motion.",
  q: { ask: "For every one of them, corners − edges + faces equals…", choices: ["2", "0", "1", "6"], right: 0,
    why: "Euler described this in 1750: V − E + F = 2 for any convex polyhedron. A cube: 8 − 12 + 6 = 2." },
  codex: "The five Platonic solids", src: "Plato, Timaeus 53c-56c; Euclid, Elements XIII.18; Kepler, Mysterium Cosmographicum (1596); Euler (1750)" };

// ---- Master ----
const R9 = 85, O9 = [0, 15], T9 = [0, 15 - R9], Lf9 = [-R9, 15], Rt9 = [R9, 15], M9 = [R9 / 2, 15];
const N9 = [M9[0] - Math.hypot(R9 / 2, R9), 15];
const P9 = range(5).map((k) => pol(R9, -90 + 72 * k, O9)); // P9[0] = T
const m1 = { id: "m1", tier: 3, title: "Pentagon and Pentagram", emoji: "⛤",
  given: { pts: [pt(O9, "O"), pt(T9, "T"), pt(Lf9, ""), pt(Rt9, ""), pt(M9, "M")], objs: [C(O9, T9), S(Lf9, Rt9), S(O9, T9)] },
  steps: [C(M9, T9), C(T9, N9), C(P9[1], T9), C(P9[4], T9), ...range(5).map((k) => S(P9[k], P9[(k + 1) % 5]))], goal: range(5).map((k) => k + 4), names: [pt(N9, "N")],
  lesson: "Ptolemy's method for a perfect pentagon. M is halfway along the radius. A circle around M through T lands on the diameter at a point N, and the distance from T to N is exactly one side of the pentagon. Step it around the circle and join the five corners.",
  how: ["🧭 Compass: centre M, through T. It crosses the diameter at N.", "🧭 Compass: centre T, through N. It marks two corners on the circle.", "🧭 From each new corner, a circle through T marks the next corner.", "📏 Join the five corners."],
  fact: "This is Ptolemy's construction from the Almagest, about 150 CE. In a regular pentagon each diagonal is φ times a side, so the pentagram drawn inside it is a web of golden ratios. The Pythagoreans used the pentagram as a sign of health and as a mark of recognition between members.",
  q: { ask: "In a regular pentagon, a diagonal divided by a side equals…", choices: ["φ, about 1.618", "√2, about 1.414", "Exactly 2", "π ÷ 2"], right: 0,
    why: "The diagonals cut each other in the golden ratio, and diagonal ÷ side = (1 + √5) ÷ 2." },
  codex: "Ptolemy's pentagon", src: "Ptolemy, Almagest I.10 (about 150 CE); Euclid, Elements IV.11" };

const R10 = 40, H10 = range(6).map((k) => pol(R10, -90 + 60 * k)), G10 = range(6).map((k) => pol(R10 * Math.sqrt(3), -60 + 60 * k)), F10 = range(6).map((k) => pol(2 * R10, -90 + 60 * k));
const m2 = { id: "m2", tier: 3, title: "Flower of Life", emoji: "🌼",
  given: { pts: [pt(O, ""), ...H10.map((h) => pt(h, ""))], objs: [C(O, H10[0]), ...H10.map((h) => C(h, O))] },
  steps: [...range(6).map((k) => C(G10[k], H10[k])), ...range(6).map((k) => C(F10[k], H10[k]))],
  lesson: "Grow the Seed into the Flower: twelve more circles, all the same size, each centred where two circles already cross, and each passing through a centre you already have. Hint: start in the gaps between the outer petals.",
  how: ["🧭 Six circles centred in the gaps between petals, each through the nearest petal centre.", "🧭 Six more centred on the outermost crossings, each through the nearest petal centre."],
  fact: "Nineteen circles make the full Flower. The name 'Flower of Life' was popularised by Drunvalo Melchizedek's books in the 1990s, but the circle grid is far older. Leonardo da Vinci drew it and studied its geometry in his notebooks. The famous examples drawn on a pillar of the Osireion at Abydos were added long after the temple was built, and their exact date is still debated.",
  q: { ask: "Who sketched this circle grid in his notebooks around 1500?", choices: ["Leonardo da Vinci", "Isaac Newton", "Euclid", "Johannes Kepler"], right: 0,
    why: "Leonardo's Codex Atlanticus has pages of overlapping-circle studies, worked out with compass and straightedge." },
  codex: "Flower of Life", src: "Leonardo da Vinci, Codex Atlanticus; Overlapping circles grid, Wikipedia" };

const R11 = 20, ring1 = range(6).map((k) => pol(2 * R11, -90 + 60 * k)), ring2 = range(6).map((k) => pol(4 * R11, -90 + 60 * k));
const fruit = [O, ...ring1, ...ring2];
const m3 = { id: "m3", tier: 3, title: "Metatron's Cube", emoji: "🧊",
  given: { pts: fruit.map((p) => pt(p, "")), objs: fruit.map((p) => C(p, [p[0] + R11, p[1]])) },
  steps: [...range(6).map((k) => S(ring2[k], ring2[(k + 1) % 6])), S(O, ring2[1]), S(O, ring2[3]), S(O, ring2[5])],
  lesson: "These are the 13 circles of the Fruit of Life. Join every centre to every other and you get Metatron's Cube. Your task is to find the cube hidden inside: draw the outer hexagon, then three spokes from the middle to every other corner.",
  how: ["📏 Join the six outer centres into a hexagon.", "📏 Three spokes from the middle to every other corner."],
  fact: "Those nine lines are a cube seen corner-on. Add the other three spokes and you can see it from either corner. The name comes from Metatron, an angel in Jewish mystical texts, while the figure itself was popularised by modern sacred-geometry books. They often say all five Platonic solids hide in it. The cube, the octahedron and a pair of tetrahedra do appear as flat shadows, but the dodecahedron and icosahedron need golden-ratio lengths that this 60° grid can't give exactly.",
  q: { ask: "How many lines join every pair of the 13 centres?", choices: ["78", "13", "26", "169"], right: 0,
    why: "Each of the 13 centres joins 12 others: 13 × 12 ÷ 2 = 78, since each line has two ends." },
  codex: "Metatron's Cube", src: "Metatron in 3 Enoch; Euclid, Elements XIII" };
export const FRUIT = { centres: fruit, r: R11 };

export const LEVELS = [g1, g2, g3, g4, g5, a1, a2, a3, a4, m1, m2, m3];
export const byId = (id) => LEVELS.find((l) => l.id === id);
