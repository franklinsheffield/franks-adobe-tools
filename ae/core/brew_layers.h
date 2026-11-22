// Frank's Brew suite - After Effects core: layer stacks like the Photoshop engines
// return ({ layers: [{ rgba, blend }], overSource }), flattened two ways:
//  - compositeBlack: exactly shared/imgmath.js composite() on a black background
//    (used by the parity tests),
//  - flatten: straight-alpha result for the AE output world.
#pragma once
#include "brew_math.h"

namespace brew {

enum Blend { BL_NORMAL = 0, BL_SCREEN };

struct Layer {
  std::vector<float> rgba;    // 0..255 per channel, interleaved (values already as a Uint8Array would hold them)
  int blend = BL_NORMAL;
};

inline double blendOf(int b, double o, double v) {
  if (b == BL_SCREEN) return 255 - (255 - o) * (255 - v) / 255;
  return v;
}

// shared/imgmath.js composite(res, {type:"black"}, src): RGB, rounded per layer
inline void compositeBlack(const std::vector<Layer>& layers, bool overSource, const Image& src, int w, int h, std::vector<float>& rgb) {
  const size_t n = (size_t)w * h;
  rgb.assign(n * 3, 0.f);
  auto put = [&](size_t i, double v0, double v1, double v2, double a, int bl) {
    if (a <= 0) return;
    double o0 = rgb[i * 3], o1 = rgb[i * 3 + 1], o2 = rgb[i * 3 + 2];
    rgb[i * 3] = (float)jsRound(o0 + (blendOf(bl, o0, v0) - o0) * a);
    rgb[i * 3 + 1] = (float)jsRound(o1 + (blendOf(bl, o1, v1) - o1) * a);
    rgb[i * 3 + 2] = (float)jsRound(o2 + (blendOf(bl, o2, v2) - o2) * a);
  };
  if (overSource) for (size_t i = 0; i < n; i++) put(i, src.R[i], src.G[i], src.B[i], src.A[i] / 255.0, BL_NORMAL);
  for (auto& L : layers) for (size_t i = 0; i < n; i++) put(i, L.rgba[i * 4], L.rgba[i * 4 + 1], L.rgba[i * 4 + 2], L.rgba[i * 4 + 3] / 255.0, L.blend);
}

// Straight-alpha flatten of NORMAL layers (optionally over the source) for AE.
inline void flatten(const std::vector<Layer>& layers, bool overSource, const Image& src, int w, int h, OutImage& out) {
  const size_t n = (size_t)w * h;
  out.resize(w, h);
  if (overSource) for (size_t i = 0; i < n; i++) { float* p = &out.px[i * 4]; p[0] = src.R[i]; p[1] = src.G[i]; p[2] = src.B[i]; p[3] = src.A[i]; }
  for (auto& L : layers) for (size_t i = 0; i < n; i++) {
    const float* s = &L.rgba[i * 4]; float* p = &out.px[i * 4];
    double sa = s[3] / 255.0, da = p[3] / 255.0;
    if (sa <= 0) continue;
    double oa = sa + da * (1 - sa);
    for (int c = 0; c < 3; c++) {
      double sv = s[c], dv = p[c], bv = blendOf(L.blend, dv, sv);
      // blended colour where both exist, plain source colour where the backdrop is empty
      double col = sv * sa * (1 - da) + bv * sa * da + dv * da * (1 - sa);
      p[c] = (float)(oa > 0 ? col / oa : 0);
    }
    p[3] = (float)(oa * 255);
  }
}

// Brightness gain (Pulse / Flicker) on a straight-alpha result
inline void applyGain(OutImage& out, double g) {
  if (g == 1) return;
  for (size_t i = 0; i < out.px.size(); i += 4) for (int c = 0; c < 3; c++) out.px[i + c] = (float)clamp(out.px[i + c] * g, 0, 255);
}

// Shift a plane by integer px (edges clamp) - used for drifting fields
inline void shiftPlane(Plane& f, int w, int h, int dx, int dy) {
  if (!dx && !dy) return;
  Plane o = f;
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) f[(size_t)y * w + x] = o[(size_t)iclamp(y - dy, 0, h - 1) * w + iclamp(x - dx, 0, w - 1)];
}

inline std::string hexOfRgb(double r, double g, double b) {
  char s[8]; snprintf(s, sizeof s, "#%02X%02X%02X", (int)clamp(std::round(r), 0, 255), (int)clamp(std::round(g), 0, 255), (int)clamp(std::round(b), 0, 255));
  return s;
}
inline std::string lerpHex(const std::string& a, const std::string& b, double t) {
  RGB x = hexToRgb(isHex(a) ? a : "#000000"), y = hexToRgb(isHex(b) ? b : "#000000");
  return hexOfRgb(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t);
}
// gradient stops blended through their LUTs (11 stops)
inline std::vector<Stop> lerpStops(const std::vector<Stop>& A, const std::vector<Stop>& B, double t) {
  auto la = gradientLUT(A), lb = gradientLUT(B);
  std::vector<Stop> o;
  for (int s = 0; s <= 10; s++) {
    int j = (int)std::round(s * 25.5) * 3;
    o.push_back({ s * 10.0, hexOfRgb(la[j] + (lb[j] - la[j]) * t, la[j + 1] + (lb[j + 1] - la[j + 1]) * t, la[j + 2] + (lb[j + 2] - la[j + 2]) * t) });
  }
  return o;
}
inline std::vector<Stop> parseStops(const std::string& v) {     // "p:#hex p:#hex ..."
  std::vector<Stop> s; size_t i = 0;
  while (i < v.size()) {
    while (i < v.size() && v[i] == ' ') i++;
    size_t j = v.find(' ', i); if (j == std::string::npos) j = v.size();
    std::string tok = v.substr(i, j - i); auto c = tok.find(':');
    if (c != std::string::npos) s.push_back({ std::stod(tok.substr(0, c)), tok.substr(c + 1) });
    i = j;
  }
  return s;
}

} // namespace brew
