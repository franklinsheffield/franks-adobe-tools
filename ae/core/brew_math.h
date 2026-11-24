// Frank's Brew suite - After Effects core: C++ port of shared/imgmath.js.
// Bit-for-bit intent: math in double, planes stored as float (like Float32Array),
// so the C++ engines match the Photoshop JS engines to within a level or two.
#pragma once
#include <cmath>
#include <cstdint>
#include <vector>
#include <string>
#include <algorithm>
#include <cstdio>

namespace brew {

inline double clamp(double v, double a, double b) { return v < a ? a : (v > b ? b : v); }
inline int iclamp(int v, int a, int b) { return v < a ? a : (v > b ? b : v); }
// JS Math.round (half up)
inline double jsRound(double v) { return std::floor(v + 0.5); }
// JS `x | 0` for values in int range (truncate toward zero)
inline int jsTrunc(double v) { return (int)v; }
// JS `%` on doubles (sign of dividend)
inline double jsMod(double a, double b) { return std::fmod(a, b); }

typedef std::vector<float> Plane;

struct RGB { double r, g, b; };

inline bool isHex(const std::string& h) {
  std::string s = (!h.empty() && h[0] == '#') ? h.substr(1) : h;
  if (s.size() != 6) return false;
  for (char c : s) if (!isxdigit((unsigned char)c)) return false;
  return true;
}
inline RGB hexToRgb(const std::string& h) {
  std::string s = (!h.empty() && h[0] == '#') ? h.substr(1) : h;
  auto hx = [&](int o) { return (double)std::stoi(s.substr(o, 2), nullptr, 16); };
  return { hx(0), hx(2), hx(4) };
}

// separable box blur, in place, `passes` times (shared/imgmath boxBlur)
inline void boxBlur(Plane& f, int w, int h, double rIn, int passes) {
  int r = (int)jsRound(rIn);
  if (r < 1) return;
  std::vector<float> tmp((size_t)std::max(w, h));
  const double k = 2.0 * r + 1;
  if (passes <= 0) passes = 2;
  for (int p = 0; p < passes; p++) {
    for (int y = 0; y < h; y++) {
      float* row = &f[(size_t)y * w];
      double acc = 0;
      for (int x = -r; x <= r; x++) acc += row[iclamp(x, 0, w - 1)];
      for (int x = 0; x < w; x++) { tmp[x] = (float)(acc / k); acc += (double)row[std::min(x + r + 1, w - 1)] - row[std::max(x - r, 0)]; }
      for (int x = 0; x < w; x++) row[x] = tmp[x];
    }
    for (int x = 0; x < w; x++) {
      double acc = 0;
      for (int y = -r; y <= r; y++) acc += f[(size_t)iclamp(y, 0, h - 1) * w + x];
      for (int y = 0; y < h; y++) { tmp[y] = (float)(acc / k); acc += (double)f[(size_t)std::min(y + r + 1, h - 1) * w + x] - f[(size_t)std::max(y - r, 0) * w + x]; }
      for (int y = 0; y < h; y++) f[(size_t)y * w + x] = tmp[y];
    }
  }
}

struct Stop { double p; std::string c; };

// 256-entry RGB lookup from stops (shared/imgmath gradientLUT)
inline std::vector<float> gradientLUT(const std::vector<Stop>& stopsIn) {
  struct S { double p; RGB c; };
  std::vector<S> s;
  for (auto& x : stopsIn) if (isHex(x.c)) s.push_back({ clamp(x.p, 0, 100) / 100, hexToRgb(x.c) });
  std::stable_sort(s.begin(), s.end(), [](const S& a, const S& b) { return a.p < b.p; });
  if (s.empty()) { s.push_back({ 0, { 0, 0, 0 } }); s.push_back({ 1, { 255, 255, 255 } }); }
  std::vector<float> lut(768);
  for (int i = 0; i < 256; i++) {
    double t = i / 255.0, u = 0;
    S a = s.front(), b = s.back();
    if (t <= s.front().p) { a = b = s.front(); }
    else if (t >= s.back().p) { a = b = s.back(); }
    else {
      for (size_t k = 0; k + 1 < s.size(); k++) if (t >= s[k].p && t <= s[k + 1].p) { a = s[k]; b = s[k + 1]; break; }
      u = b.p > a.p ? (t - a.p) / (b.p - a.p) : 0;
    }
    lut[i * 3] = (float)(a.c.r + (b.c.r - a.c.r) * u);
    lut[i * 3 + 1] = (float)(a.c.g + (b.c.g - a.c.g) * u);
    lut[i * 3 + 2] = (float)(a.c.b + (b.c.b - a.c.b) * u);
  }
  return lut;
}

inline int32_t toInt32(double v) {          // JS ToInt32
  if (!std::isfinite(v)) return 0;
  double m = std::fmod(std::trunc(v), 4294967296.0);
  if (m < 0) m += 4294967296.0;
  return (int32_t)(uint32_t)m;
}
inline int32_t imul(int32_t a, int32_t b) { return (int32_t)((uint32_t)a * (uint32_t)b); }

// deterministic noise in [-1, 1] (shared/imgmath hashNoise)
inline double hashNoise(double x, double y, double seed) {
  int32_t n = toInt32(x * 374761393.0 + y * 668265263.0 + seed * 2147483647.0);
  n = imul(n ^ (int32_t)((uint32_t)n >> 13), 1274126177);
  uint32_t u = (uint32_t)(n ^ (int32_t)((uint32_t)n >> 16));
  return (u / 4294967295.0) * 2 - 1;
}

// mulberry32 (shared/imgmath rng)
struct Rng {
  uint32_t a;
  explicit Rng(double seed) { uint32_t s = (uint32_t)toInt32(seed); a = s ? s : 1; }
  double operator()() {
    a = a + 0x6D2B79F5u;
    int32_t ai = (int32_t)a;
    int32_t t = imul(ai ^ (int32_t)((uint32_t)ai >> 15), 1 | ai);
    t = (int32_t)((uint32_t)t + (uint32_t)imul(t ^ (int32_t)((uint32_t)t >> 7), 61 | t)) ^ t;
    return (uint32_t)(t ^ (int32_t)((uint32_t)t >> 14)) / 4294967296.0;
  }
};

// bilinear sample, clamped (engine.js sample: Math.floor; phase.js uses |0, same for x >= 0)
inline double sample(const Plane& C, int w, int h, double x, double y) {
  x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
  int x0 = (int)std::floor(x), y0 = (int)std::floor(y), x1 = std::min(x0 + 1, w - 1), y1 = std::min(y0 + 1, h - 1);
  double fx = x - x0, fy = y - y0;
  const float* c = C.data();
  double a = c[(size_t)y0 * w + x0] + ((double)c[(size_t)y0 * w + x1] - c[(size_t)y0 * w + x0]) * fx;
  double b = c[(size_t)y1 * w + x0] + ((double)c[(size_t)y1 * w + x1] - c[(size_t)y1 * w + x0]) * fx;
  return a + (b - a) * fy;
}

// Source image as float planes 0..255 (any bit depth is converted to this scale by the host glue)
struct Image {
  int w = 0, h = 0;
  Plane R, G, B, A;           // A 0..255
  void resize(int W, int H) { w = W; h = H; size_t n = (size_t)W * H; R.assign(n, 0); G.assign(n, 0); B.assign(n, 0); A.assign(n, 255); }
};

// Output as float RGBA 0..255 (already clamped where the JS engine clamps);
// the 8-bit host path truncates like a JS Uint8Array store.
struct OutImage {
  int w = 0, h = 0;
  std::vector<float> px;      // RGBA interleaved
  void resize(int W, int H) { w = W; h = H; px.assign((size_t)W * H * 4, 0.f); }
};

// Progress / abort callback: return false to abort
typedef bool (*ProgressFn)(void* ctx, int done, int total);

} // namespace brew
