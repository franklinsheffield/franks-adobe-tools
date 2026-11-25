// Worlds Lab app: surface layers on the GPU.
// The same steps as engine/surface.js (the ray tracer's reference maths), as GLSL injected into a Three.js
// MeshPhysicalMaterial: wrap (box / cylinder / sphere / top / model UVs), tile, offset, rotation, opacity,
// blend mode, mask (height / slope / bitmap), relief (bump), shine and glow. Changing a dial only updates uniforms;
// adding or removing layers or pictures rebuilds the material.
import * as THREE from "three";

const SF = window.require("../engine/surface.js");
const WRAP_I = { Box: 0, Cylinder: 1, Sphere: 2, Top: 3, UV: 4 }, BLEND_I = { Normal: 0, Multiply: 1, Screen: 2, Overlay: 3, Add: 4, Relief: 5 }, MASK_I = { None: 0, Height: 1, Slope: 2, Bitmap: 3 };

// pictures -> textures, cached per picture object (colour pictures decode sRGB; masks stay raw like the ray tracer)
const cache = new WeakMap();
export function picTexture(img, isMask) {
  let per = cache.get(img); if (!per) { per = {}; cache.set(img, per); }
  const k = isMask ? "m" : "c"; if (per[k]) return per[k];
  const t = new THREE.DataTexture(img.d, img.w, img.h, THREE.RGBAFormat);
  t.colorSpace = isMask ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = true;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true;
  per[k] = t; return t;
}
const live = (o) => (o.layers || []).filter((L) => L.on && L.img);
// what needs a rebuild (anything else is a uniform)
export function layersKey(o) {
  const id = (p) => (p ? p.__k || (p.__k = Math.random().toString(36).slice(2)) : "-");
  return live(o).map((L) => id(L.img) + ":" + (L.mask === "Bitmap" && L.mimg ? id(L.mimg) : "-")).join(",");
}

const COMMON = `
varying vec3 wbLP; varying vec3 wbLN; varying vec3 wbWN; varying vec2 wbUV;
uniform vec3 wbC; uniform vec3 wbE; uniform float wbA; uniform float wbHasUV;
vec2 wbPlace(vec4 P, vec2 uv) { float cs = cos(P.w), sn = sin(P.w); vec2 x = uv - 0.5; return vec2(cs * x.x - sn * x.y, sn * x.x + cs * x.y) * P.x + 0.5 + P.yz; }
vec2 wbTurn(vec4 P, vec2 d) { float cs = cos(P.w), sn = sin(P.w); return vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y) * P.x; }
vec4 wbAt(sampler2D T, vec4 P, vec2 uv, vec2 dx, vec2 dy) { return textureGrad(T, wbPlace(P, uv), wbTurn(P, dx), wbTurn(P, dy)); }
vec4 wbAtW(sampler2D T, vec4 P, vec2 uv) { vec2 dx = dFdx(uv), dy = dFdy(uv); dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5); return wbAt(T, P, uv, dx, dy); }   // u wraps around (no seam line)
vec4 wbSample(sampler2D T, vec4 P, float wrap, vec3 q, vec3 n) {
  if (wrap < 0.5 || (wrap > 3.5 && wbHasUV < 0.5)) {   // box: three planar projections blended by the normal
    vec3 w = pow(abs(n), vec3(4.0)); w /= max(w.x + w.y + w.z, 1e-5);
    vec2 a = q.zy * 0.5 + 0.5, b = q.xz * 0.5 + 0.5, c = q.xy * 0.5 + 0.5;
    return wbAt(T, P, a, dFdx(a), dFdy(a)) * w.x + wbAt(T, P, b, dFdx(b), dFdy(b)) * w.y + wbAt(T, P, c, dFdx(c), dFdy(c)) * w.z;
  }
  if (wrap < 1.5) return wbAtW(T, P, vec2(atan(q.x, q.z) / 6.2831853 + 0.5, q.y * 0.5 + 0.5));
  if (wrap < 2.5) { vec3 d = normalize(q); return wbAtW(T, P, vec2(atan(d.x, d.z) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5)); }
  if (wrap < 3.5) { vec2 t = vec2(q.x * 0.5 + 0.5, -q.z * 0.5 + 0.5); return wbAt(T, P, t, dFdx(t), dFdy(t)); }
  return wbAt(T, P, wbUV, dFdx(wbUV), dFdy(wbUV));
}
float wbBand(vec4 K, float x) { float s = max(0.001, K.w); float k = K.y <= 0.0 ? 1.0 : smoothstep(K.y - s, K.y + s, x); if (K.z < 1.0) k *= 1.0 - smoothstep(K.z - s, K.z + s, x); return k; }
vec3 wbBlend(float m, vec3 b, vec3 t) {
  if (m < 0.5) return t; if (m < 1.5) return b * t; if (m < 2.5) return 1.0 - (1.0 - b) * (1.0 - t);
  if (m < 3.5) return mix(2.0 * b * t, 1.0 - 2.0 * (1.0 - b) * (1.0 - t), step(0.5, b)); if (m < 4.5) return min(vec3(1.0), b + t); return b;
}
float wbLum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 wbRelief(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {   // bump from a height in metres (unnormalised screen derivatives keep it to scale)
  vec3 sx = dFdx(surf_pos), sy = dFdy(surf_pos), R1 = cross(sy, surf_norm), R2 = cross(surf_norm, sx);
  float det = dot(sx, R1) * faceDir; vec3 g = sign(det) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(det) * surf_norm - g);
}
`;
function layerGLSL(i, hasMask) {
  return `
  { vec4 c = wbSample(wbT${i}, wbP${i}, wbQ${i}.z, q, ln);
    float k0 = wbQ${i}.x * c.a, k = k0, mt = wbK${i}.x;
    if (mt > 0.5 && mt < 1.5) k *= wbBand(wbK${i}, clamp(q.y * 0.5 + 0.5, 0.0, 1.0));
    else if (mt > 1.5 && mt < 2.5) k *= wbBand(wbK${i}, clamp(wn.y, 0.0, 1.0));
    ${hasMask ? `else if (mt > 2.5) k *= wbLum(wbSample(wbM${i}, wbP${i}, wbQ${i}.z, q, ln).rgb);` : ""}
    if (wbS${i}.w > 0.5 && mt > 0.5) k = k0 - k;
    if (k > 0.001) {
      col = mix(col, wbBlend(wbQ${i}.y, col, c.rgb), k);
      if (wbS${i}.x > 0.5) { rough = mix(rough, wbS${i}.y, k); metal = mix(metal, wbS${i}.z, k); }
      glow += c.rgb * wbQ${i}.w * k;
      H += wbLum(c.rgb) * wbB${i} * k;
    } }`;
}

/* Put the layer stack on a material. F = SF.frame(o). The material keeps an update(o, node) to refresh uniforms. */
export function attachLayers(mat, o) {
  const Ls = live(o), n = Ls.length, U = { wbC: { value: new THREE.Vector3() }, wbE: { value: new THREE.Vector3(1, 1, 1) }, wbA: { value: 0 }, wbHasUV: { value: 0 }, wbScale: { value: new THREE.Vector3(1, 1, 1) } };
  const masks = Ls.map((L) => L.mask === "Bitmap" && !!L.mimg);
  Ls.forEach((L, i) => {
    U["wbT" + i] = { value: picTexture(L.img, false) };
    if (masks[i]) U["wbM" + i] = { value: picTexture(L.mimg, true) };
    U["wbP" + i] = { value: new THREE.Vector4() }; U["wbQ" + i] = { value: new THREE.Vector4() }; U["wbK" + i] = { value: new THREE.Vector4() }; U["wbS" + i] = { value: new THREE.Vector4() }; U["wbB" + i] = { value: 0 };
  });
  const decl = Ls.map((_, i) => `uniform sampler2D wbT${i}; ${masks[i] ? `uniform sampler2D wbM${i};` : ""} uniform vec4 wbP${i}; uniform vec4 wbQ${i}; uniform vec4 wbK${i}; uniform vec4 wbS${i}; uniform float wbB${i};`).join("\n");
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 wbLP; varying vec3 wbLN; varying vec3 wbWN; varying vec2 wbUV; uniform vec3 wbScale; attribute vec2 wbuv;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n  wbLP = position * wbScale; wbLN = normalize(objectNormal / wbScale); wbWN = normalize(mat3(modelMatrix) * (objectNormal / wbScale)); wbUV = wbuv;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + COMMON + decl)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  { vec3 q = (wbLP - wbC) / wbE, ln = normalize(wbLN), wn = normalize(wbWN);
    vec3 col = diffuseColor.rgb, glow = vec3(0.0); float rough = roughnessFactor, metal = metalnessFactor, H = 0.0;
    ${Ls.map((L, i) => layerGLSL(i, masks[i])).join("")}
    diffuseColor.rgb = col; roughnessFactor = rough; metalnessFactor = metal; totalEmissiveRadiance += glow * 1.4;
    if (wbA > 0.0) normal = wbRelief(-vViewPosition, normal, vec2(dFdx(H), dFdy(H)) * wbA, faceDirection);
  }`);
  };
  mat.customProgramCacheKey = () => "wbL" + n + ":" + masks.map((m) => (m ? 1 : 0)).join("");
  mat.userData.wbUpdate = (obj, node) => {
    const F = SF.frame(obj), live2 = live(obj);
    U.wbC.value.set(F.c[0], F.c[1], F.c[2]); U.wbE.value.set(F.e[0], F.e[1], F.e[2]);
    if (node) U.wbScale.value.copy(node.scale);
    U.wbHasUV.value = obj.type === "mesh" && obj.mesh && obj.mesh.uv ? 1 : 0;
    const E = Math.max(...F.e); U.wbA.value = live2.some((L) => L.bump) ? 0.015 * E : 0;
    live2.forEach((L, i) => { if (!U["wbP" + i]) return;
      U["wbP" + i].value.set(L.tile || 1, L.ox || 0, L.oy || 0, (L.rot || 0) * Math.PI / 180);
      U["wbQ" + i].value.set((L.opacity == null ? 100 : L.opacity) / 100, BLEND_I[L.blend] || 0, WRAP_I[L.wrap] || 0, L.glow || 0);
      U["wbK" + i].value.set(MASK_I[L.mask] === 3 && !masks[i] ? 0 : MASK_I[L.mask] || 0, L.lo || 0, L.hi == null ? 1 : L.hi, L.soft == null ? 0.1 : L.soft);
      U["wbS" + i].value.set(L.shine ? 1 : 0, L.rough == null ? 0.5 : L.rough, L.metal || 0, L.inv ? 1 : 0);
      U["wbB" + i].value = L.bump || 0;
    });
  };
  mat.userData.wbUpdate(o);
  return mat;
}
