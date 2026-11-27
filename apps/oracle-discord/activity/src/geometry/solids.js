// The five Platonic solids: real vertex coordinates; edges are found as the pairs of corners at the shortest distance.
const PHI = (1 + Math.sqrt(5)) / 2;
const cyc = (pts) => pts.flatMap(([a, b, c]) => [[a, b, c], [b, c, a], [c, a, b]]);
const signs = (v) => { let out = [[...v]]; for (let i = 0; i < 3; i++) if (v[i]) out = out.flatMap((p) => [p, p.map((x, j) => (j === i ? -x : x))]); return out; };
const uniq = (pts) => pts.filter((p, i) => pts.findIndex((q) => q.every((x, j) => Math.abs(x - p[j]) < 1e-9)) === i);

const VERTS = {
  tetra: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  cube: signs([1, 1, 1]),
  octa: uniq(cyc(signs([1, 0, 0]))),
  icosa: uniq(cyc(signs([0, 1, PHI]))),
  dodeca: uniq([...signs([1, 1, 1]), ...cyc(signs([0, 1 / PHI, PHI]))]),
};
function edgesOf(v) {
  let min = Infinity; const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, d(v[i], v[j]));
  const e = []; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (d(v[i], v[j]) < min + 1e-6) e.push([i, j]);
  return e;
}
const norm = (v) => { const m = Math.max(...v.map((p) => Math.hypot(...p))); return v.map((p) => p.map((x) => x / m)); };

export const SOLIDS = [
  { id: "tetra", name: "Tetrahedron", faces: 4, face: "triangles", meet: 3, element: "fire", why: "Plato gave it to fire: the sharpest, lightest solid, with points that sting." },
  { id: "cube", name: "Cube (hexahedron)", faces: 6, face: "squares", meet: 3, element: "earth", why: "Plato gave it to earth: the steadiest solid, sitting firm on a square face." },
  { id: "octa", name: "Octahedron", faces: 8, face: "triangles", meet: 4, element: "air", why: "Plato gave it to air, between fire and water in sharpness and weight." },
  { id: "dodeca", name: "Dodecahedron", faces: 12, face: "pentagons", meet: 3, element: "the heavens", why: "Plato said the god used it 'for the whole', arranging the constellations. Later writers tied it to aether, the fifth element." },
  { id: "icosa", name: "Icosahedron", faces: 20, face: "triangles", meet: 5, element: "water", why: "Plato gave it to water: the roundest of the triangle solids, so it rolls and flows." },
].map((s) => { const v = norm(VERTS[s.id]); return { ...s, v, e: edgesOf(v) }; });

/** Faces to choose from for a solid: the right count and three near misses. */
export function faceChoices(s) {
  const pool = [4, 6, 8, 10, 12, 16, 20, 24].filter((n) => n !== s.faces);
  const near = pool.sort((a, b) => Math.abs(a - s.faces) - Math.abs(b - s.faces)).slice(0, 3);
  return [s.faces, ...near].sort((a, b) => a - b);
}

/** Wireframe SVG of a solid, turned by angle t (radians), back edges dimmer. */
export function solidSvg(s, t, size = 120) {
  const ca = Math.cos(t), sa = Math.sin(t), cb = Math.cos(0.5 + t * 0.37), sb = Math.sin(0.5 + t * 0.37);
  const P = s.v.map(([x, y, z]) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb; return [x1 * size, y1 * size, z2]; });
  const lines = s.e.map(([i, j]) => ({ i, j, z: (P[i][2] + P[j][2]) / 2 })).sort((a, b) => a.z - b.z)
    .map(({ i, j, z }) => `<line x1="${P[i][0].toFixed(1)}" y1="${P[i][1].toFixed(1)}" x2="${P[j][0].toFixed(1)}" y2="${P[j][1].toFixed(1)}" class="geo-edge" opacity="${(0.35 + 0.65 * (z + 1) / 2).toFixed(2)}"/>`).join("");
  const dots = P.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" class="geo-corner" opacity="${(0.35 + 0.65 * (p[2] + 1) / 2).toFixed(2)}"/>`).join("");
  return lines + dots;
}
