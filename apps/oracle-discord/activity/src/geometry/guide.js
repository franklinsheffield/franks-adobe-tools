// Sacred Geometry Builder study guide: everything the levels' questions ask, plus the history and the myths.
// Shown under the Oracle's text from the room's menus; free to read at any time.
export const GUIDE = {
  title: "Study guide: compass, straightedge and sacred geometry",
  sections: [
    { h: "The rules: compass and straightedge", p: [
      "Euclid's Elements (Alexandria, about 300 BCE) builds geometry from a few postulates. Three of them are drawing moves: join any two points with a straight line, extend a straight line, and draw a circle with any centre through any point.",
      "The straightedge has no markings, so it can't measure. The compass draws circles only. Euclid's compass even 'collapses' when lifted, yet his Proposition I.2 shows it can still copy any length, so nothing is lost.",
      "In this room you can only start a line or circle on a point that already exists: a given point or a place where two lines or circles cross. That is the whole game, and it's how every figure here was drawn for 2,000 years.",
    ] },
    { h: "Circles, the vesica and √3", p: [
      "A circle is every point at one distance (the radius) from a centre. Two equal circles, each through the other's centre, overlap in the vesica piscis ('fish bladder').",
      "The vesica is √3 ≈ 1.732 times as tall as it is wide, because its tips and the two centres form two equilateral triangles. Archimedes bounded √3 between 265/153 and 1351/780.",
      "Euclid's very first proposition, I.1, uses the vesica to build an equilateral triangle: the sides are all radii of equal circles, so they're equal.",
    ] },
    { h: "Hexagons, the Seed and the Flower", p: [
      "A circle's radius steps around its own edge exactly six times, giving a regular hexagon whose side equals the radius (Euclid IV.15). The circumference, 2πr ≈ 6.28r, is a bit longer than the six straight sides.",
      "Thomas Hales proved in 1999 that hexagons divide a flat surface into equal areas with the least total boundary, the 'honeycomb conjecture'.",
      "Drawing the six circles of that walk gives the Seed of Life (7 circles). Twelve more give the Flower of Life (19). Overlapping-circle rosettes appear in Roman mosaics and in medieval art, and Leonardo da Vinci studied the grid in his notebooks (Codex Atlanticus).",
      "The names 'Seed of Life' and 'Flower of Life' are modern, popularised by Drunvalo Melchizedek's books in the 1990s. The drawings on a pillar of the Osireion at Abydos are often called ancient Egyptian, but they were added long after the temple was built and their date is debated.",
    ] },
    { h: "Right angles and squares", p: [
      "Two equal circles around A and B cross at two points; the line through them is the perpendicular bisector of AB (Euclid I.10-I.11). Every point on it is equally far from A and B, and it meets AB at 90° at the midpoint.",
      "Two diameters at right angles end at the four corners of a square inscribed in the circle (Euclid IV.6). The square's diagonal is the diameter, so its side is the diameter ÷ √2.",
      "The circle-and-square pairing is old: China's 'round heaven, square earth', and Leonardo's Vitruvian Man (about 1490), based on the Roman architect Vitruvius' writing on human proportion.",
    ] },
    { h: "The golden ratio φ", p: [
      "Cut a line so the whole is to the longer part as the longer part is to the shorter. That ratio is φ (phi) = (1 + √5) ÷ 2 = 1.6180339… Euclid called it 'extreme and mean ratio' (II.11, VI.30).",
      "One method: on AB stand BC at right angles, half as long. A circle around C through B cuts AC at D; a circle around A through D cuts AB at S. Then AB ÷ AS = AS ÷ SB = φ.",
      "Fibonacci numbers (1, 1, 2, 3, 5, 8, 13, 21…) each add the two before. Their neighbouring ratios close in on φ: 13/8 = 1.625, 21/13 ≈ 1.615.",
      "Real in nature: sunflower heads and pine cones place seeds about 137.5° apart, the golden angle, giving spirals in Fibonacci numbers.",
      "Myths: measured carefully, the Parthenon, the Great Pyramid and the Mona Lisa don't show φ, and the nautilus spiral is not a golden spiral (George Markowsky, 1992, and later studies). Science is Magic checks before it believes.",
    ] },
    { h: "Pentagons and pentagrams", p: [
      "Ptolemy's Almagest (about 150 CE) gives a pentagon method: halve a radius at M, swing a circle around M through the top point T onto the diameter at N; the length TN is the pentagon's side.",
      "In a regular pentagon each diagonal is φ times a side, and the diagonals cut each other in the golden ratio. The pentagram inside is full of φ.",
      "The Pythagoreans used the pentagram as a symbol of health and as a sign of recognition between members.",
    ] },
    { h: "The five Platonic solids", p: [
      "A Platonic solid has identical regular faces with the same number meeting at every corner. There are exactly five: tetrahedron (4 triangles), cube (6 squares), octahedron (8 triangles), dodecahedron (12 pentagons) and icosahedron (20 triangles).",
      "Why only five: at each corner the face angles must total less than 360°. Three, four or five triangles (180°, 240°, 300°), three squares (270°) or three pentagons (324°) work; nothing else does. Euclid proves it in Elements XIII.18; the mathematician Theaetetus is credited with early work on them.",
      "Plato's Timaeus (about 360 BCE) matched fire with the tetrahedron, earth with the cube, air with the octahedron and water with the icosahedron, and said the dodecahedron was used for the whole heaven.",
      "Euler's formula (1750): corners − edges + faces = 2 for every convex solid. Tetrahedron 4 − 6 + 4, cube 8 − 12 + 6, octahedron 6 − 12 + 8, dodecahedron 20 − 30 + 12, icosahedron 12 − 30 + 20.",
      "Johannes Kepler (Mysterium Cosmographicum, 1596) nested the five solids between the six known planets' orbits. It was wrong, but his search for the real pattern led to his laws of planetary motion.",
    ] },
    { h: "Metatron's Cube", p: [
      "Take 13 equal circles: one in the centre, six around it, and six more beyond (the Fruit of Life). Joining every pair of centres gives 13 × 12 ÷ 2 = 78 lines: Metatron's Cube.",
      "The name comes from Metatron, an angel in Jewish mystical writing such as 3 Enoch. The figure itself was popularised by modern sacred-geometry books.",
      "A cube appears in it seen corner-on: the outer hexagon plus three spokes. The octahedron and two interlocking tetrahedra also show as flat shadows. The dodecahedron and icosahedron need golden-ratio lengths this 60° grid doesn't contain, so claims that 'all five solids' are in it are only approximately true.",
    ] },
    { h: "What compass and straightedge can't do", p: [
      "Three famous Greek problems are impossible with these tools alone: trisecting any angle and doubling a cube (Pierre Wantzel proved it in 1837), and squaring the circle (impossible because π is transcendental, proved by Ferdinand von Lindemann in 1882).",
      "Some regular polygons can't be drawn either: a regular heptagon (7 sides) is impossible. At 18, Carl Friedrich Gauss showed in 1796 that a regular 17-gon can be drawn.",
    ] },
  ],
};
