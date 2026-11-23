// Frank's Chrometone Brew 1.1 - C++ port of plugins/chrometone/js/engine.js + fx.js.
// Same rules as the other ports: math in double, Float32Array planes as float,
// Uint8Array stores as rounded+clamped ints, Math.hypot as V8 computes it.
#include "ct_engine.h"
#include <limits>

using namespace brew;

namespace ct {

static const double INF = std::numeric_limits<double>::infinity();
static const double PI = 3.14159265358979323846;

// V8 Math.hypot (scaled, Kahan-compensated sum)
static double jsHypot2(double a, double b) {
  a = std::fabs(a); b = std::fabs(b);
  double m = std::max(a, b);
  if (m == 0) return 0;
  if (std::isinf(m)) return INF;
  double sum = 0, comp = 0;
  double xs[2] = { a / m, b / m };
  for (double x : xs) { double s = x * x - comp, pre = sum + s; comp = (pre - sum) - s; sum = pre; }
  return std::sqrt(sum) * m;
}
static double jsHypot3(double a, double b, double c) {
  a = std::fabs(a); b = std::fabs(b); c = std::fabs(c);
  double m = std::max(a, std::max(b, c));
  if (m == 0) return 0;
  if (std::isinf(m)) return INF;
  double sum = 0, comp = 0;
  double xs[3] = { a / m, b / m, c / m };
  for (double x : xs) { double s = x * x - comp, pre = sum + s; comp = (pre - sum) - s; sum = pre; }
  return std::sqrt(sum) * m;
}
static inline double smooth(double a, double b, double x) { double t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
static inline unsigned char u8(double v) { return (unsigned char)clamp(jsRound(v), 0, 255); }
static RGB hexC(const std::string& h) { return isHex(h) ? hexToRgb(h) : RGB{ 0, 0, 0 }; }
// fx.hexToRgb: parseInt(...) || 0 per channel
static RGB fxHex(const std::string& h) { return isHex(h) ? hexToRgb(h) : RGB{ 255, 255, 255 }; }

static double bandShape(double v, int shape, double soft) {
  double f = v - std::floor(v);
  if (shape == SH_TRIANGLE) return 1 - std::fabs(2 * f - 1);
  if (shape == SH_HARD) {
    double e = std::max(0.001, soft * 0.25);
    double a = clamp((f - 0.5 + e) / (2 * e), 0, 1), b = clamp((f - 1 + e) / (2 * e), 0, 1) + clamp((e - f) / (2 * e), 0, 1);
    return clamp(a - b, 0, 1);
  }
  return 0.5 - 0.5 * std::cos(2 * PI * v);
}
static inline double hash2(double x, double y) {        // engine.js hashNoise (no seed)
  int32_t n = toInt32(x * 374761393.0 + y * 668265263.0);
  n = imul(n ^ (int32_t)((uint32_t)n >> 13), 1274126177);
  uint32_t u = (uint32_t)(n ^ (int32_t)((uint32_t)n >> 16));
  return (u / 4294967295.0) * 2 - 1;
}
static double noise1(double x, double seed) {
  double i = std::floor(x), f = x - i, u = f * f * (3 - 2 * f);
  auto hv = [&](double k) { return hash2(k, seed); };
  return hv(i) + (hv(i + 1) - hv(i)) * u;
}

// ---------------------------------------------------------------- fx: mask
struct Pick { bool outline; bool key; };
static Pick pickMode(const Image& src, int from) {
  if (from == FROM_BRIGHTNESS) return { false, false };
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h;
  size_t transp = 0;
  for (size_t i = 0; i < n; i++) if (src.A[i] < 128) transp++;
  if (transp > n * 0.02) return { true, false };
  if (from == FROM_OUTLINE) return { true, true };
  auto lum = [&](size_t i) { return (0.2126 * src.R[i] + 0.7152 * src.G[i] + 0.0722 * src.B[i]) / 255; };
  int dark = 0, cnt = 0;
  int stepX = std::max(1, (int)std::floor(w / 64.0)), stepY = std::max(1, (int)std::floor(h / 64.0));
  for (int x = 0; x < w; x += stepX) { cnt += 2; if (lum(x) < 0.2) dark++; if (lum((size_t)(h - 1) * w + x) < 0.2) dark++; }
  for (int y = 0; y < h; y += stepY) { cnt += 2; if (lum((size_t)y * w) < 0.2) dark++; if (lum((size_t)y * w + w - 1) < 0.2) dark++; }
  return dark >= cnt * 0.8 ? Pick{ true, true } : Pick{ false, false };
}
static Plane shapeMask(const Image& src, const Plane& L, bool keyOn, double keyPct) {
  size_t n = (size_t)src.w * src.h; Plane M(n);
  double k = clamp(keyPct / 100, 0.005, 0.95), e = 0.04;
  for (size_t i = 0; i < n; i++) { double a = src.A[i] / 255.0; if (keyOn) a *= smooth(k - e, k + e, L[i]); M[i] = (float)a; }
  return M;
}

// ---------------------------------------------------------------- fx: distance transform
static void edt1d(const std::vector<double>& f, int n, std::vector<double>& d, std::vector<int>& v, std::vector<double>& z) {
  int k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (int q = 1; q < n; q++) {
    double s = ((f[q] + (double)q * q) - (f[v[k]] + (double)v[k] * v[k])) / (2.0 * q - 2.0 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + (double)q * q) - (f[v[k]] + (double)v[k] * v[k])) / (2.0 * q - 2.0 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (int q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (double)(q - v[k]) * (q - v[k]) + f[v[k]]; }
}
static Plane insideDistance(const Plane& M, int w, int h) {
  size_t n = (size_t)w * h; Plane D(n); int m = std::max(w, h);
  std::vector<double> f(m), dd(m), z(m + 1); std::vector<int> v(m);
  for (size_t i = 0; i < n; i++) D[i] = M[i] >= 0.5f ? (float)1e20 : 0.f;
  for (int x = 0; x < w; x++) {
    for (int y = 0; y < h; y++) f[y] = D[(size_t)y * w + x];
    edt1d(f, h, dd, v, z);
    for (int y = 0; y < h; y++) D[(size_t)y * w + x] = (float)dd[y];
  }
  for (int y = 0; y < h; y++) {
    size_t o = (size_t)y * w;
    for (int x = 0; x < w; x++) f[x] = D[o + x];
    edt1d(f, w, dd, v, z);
    for (int x = 0; x < w; x++) {
      double r = std::sqrt(dd[x]);
      r = std::min(r, std::min((double)x + 1, std::min((double)w - x, std::min((double)y + 1, (double)h - y))));
      D[o + x] = M[o + x] > 0 ? (float)std::max(0.0, r - 0.5 + ((double)M[o + x] - 0.5)) : 0.f;
    }
  }
  return D;
}
struct BBox { int l, t, r, b; };
static BBox bbox(const Plane& M, int w, int h) {
  int l = w, t = h, r = -1, b = -1;
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (M[(size_t)y * w + x] >= 0.5f) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
  if (r < 0) return { 0, 0, w - 1, h - 1 };
  return { l, t, r, b };
}
static void edgeNormals(const Plane& M, int w, int h, double r, Plane& Ex, Plane& Ey) {
  Plane Mb = M; boxBlur(Mb, w, h, std::max(1.0, r), 2);
  size_t n = (size_t)w * h; Ex.assign(n, 0); Ey.assign(n, 0);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x;
    double gx = (double)Mb[(size_t)y * w + std::min(x + 1, w - 1)] - Mb[(size_t)y * w + std::max(x - 1, 0)];
    double gy = (double)Mb[(size_t)std::min(y + 1, h - 1) * w + x] - Mb[(size_t)std::max(y - 1, 0) * w + x];
    double l = jsHypot2(gx, gy);
    if (l > 1e-5) { Ex[i] = (float)(-gx / l); Ey[i] = (float)(-gy / l); }
  }
}
static Plane bevelHeight(const Plane& D, size_t n, double bw, int profile) {
  Plane H(n);
  for (size_t i = 0; i < n; i++) {
    double t = std::min(D[i] / bw, 1.0), hh;
    if (profile == PR_ROUND) hh = std::sqrt(std::max(0.0, 1 - (1 - t) * (1 - t)));
    else if (profile == PR_RIM) hh = D[i] < bw ? 0.55 * std::sin(PI * t) : 0;
    else hh = t;
    H[i] = (float)(hh * bw);
  }
  return H;
}

// ---------------------------------------------------------------- fx: extrusion
struct Light { double hx, hy; };
struct Wall { std::vector<float> rgba; Plane WA; double Dp; double dir[2]; bool ok = false; };
static Wall extrude(const Plane& M, const Plane& Ex, const Plane& Ey, int w, int h, const Params& P, const std::vector<float>& lut, double sc, Light light) {
  Wall W; size_t n = (size_t)w * h; double Dp = std::max(0.0, P.exDepth * sc);
  Plane S(n, (float)INF), Nx(n, 0.f), Ny(n, 0.f);
  for (size_t i = 0; i < n; i++) if (M[i] >= 0.5f) { S[i] = 0; Nx[i] = Ex[i]; Ny[i] = Ey[i]; }
  if (Dp < 0.5) return W;
  double th = P.exAngle * PI / 180, bx0 = std::cos(th), by0 = -std::sin(th);
  BBox bb = bbox(M, w, h); double cx = (bb.l + bb.r) / 2.0, cy = (bb.t + bb.b) / 2.0, diag = jsHypot2(w, h);
  double persp = clamp(P.exPersp / 100, 0, 1);
  double Ld = persp > 0 ? diag * (1.5 + 6 * (1 - persp)) : 0;
  double vpx = cx + bx0 * Ld, vpy = cy + by0 * Ld;
  bool xMajor = std::fabs(bx0) >= std::fabs(by0);
  auto dirFor = [&](double x, double y, double& dx, double& dy) {
    if (!Ld) { dx = bx0; dy = by0; return; }
    double ddx = vpx - x, ddy = vpy - y, l = jsHypot2(ddx, ddy); if (!l) l = 1;
    dx = ddx / l; dy = ddy / l;
  };
  if (xMajor) {
    int sx = bx0 >= 0 ? 1 : -1;
    for (int k = 0; k < w; k++) {
      int x = sx > 0 ? k : w - 1 - k, xp = x - sx;
      if (xp < 0 || xp >= w) continue;
      for (int y = 0; y < h; y++) {
        size_t i = (size_t)y * w + x;
        if (S[i] == 0) continue;
        double dx, dy; dirFor(x, y, dx, dy);
        double vy = dy / std::fabs(dx ? dx : 1e-6); vy = clamp(vy, -1, 1);
        double len = jsHypot2(1, vy), yf = y - vy; int y0 = (int)std::floor(yf); double t = yf - y0; int y1 = y0 + 1;
        double a = (y0 >= 0 && y0 < h) ? (double)S[(size_t)y0 * w + xp] : INF, b = (y1 >= 0 && y1 < h) ? (double)S[(size_t)y1 * w + xp] : INF;
        double s; size_t j;
        if (a != INF && b != INF) { s = a + (b - a) * t; j = t < 0.5 ? (size_t)y0 * w + xp : (size_t)y1 * w + xp; }
        else if (a != INF && t <= 0.5) { s = a; j = (size_t)y0 * w + xp; }
        else if (b != INF && t >= 0.5) { s = b; j = (size_t)y1 * w + xp; }
        else continue;
        s += len;
        if (s > Dp + 1.5) continue;
        S[i] = (float)s; Nx[i] = Nx[j]; Ny[i] = Ny[j];
      }
    }
  } else {
    int sy = by0 >= 0 ? 1 : -1;
    for (int k = 0; k < h; k++) {
      int y = sy > 0 ? k : h - 1 - k, yp = y - sy;
      if (yp < 0 || yp >= h) continue;
      for (int x = 0; x < w; x++) {
        size_t i = (size_t)y * w + x;
        if (S[i] == 0) continue;
        double dx, dy; dirFor(x, y, dx, dy);
        double vx = dx / std::fabs(dy ? dy : 1e-6); vx = clamp(vx, -1, 1);
        double len = jsHypot2(1, vx), xf = x - vx; int x0 = (int)std::floor(xf); double t = xf - x0; int x1 = x0 + 1;
        double a = (x0 >= 0 && x0 < w) ? (double)S[(size_t)yp * w + x0] : INF, b = (x1 >= 0 && x1 < w) ? (double)S[(size_t)yp * w + x1] : INF;
        double s; size_t j;
        if (a != INF && b != INF) { s = a + (b - a) * t; j = t < 0.5 ? (size_t)yp * w + x0 : (size_t)yp * w + x1; }
        else if (a != INF && t <= 0.5) { s = a; j = (size_t)yp * w + x0; }
        else if (b != INF && t >= 0.5) { s = b; j = (size_t)yp * w + x1; }
        else continue;
        s += len;
        if (s > Dp + 1.5) continue;
        S[i] = (float)s; Nx[i] = Nx[j]; Ny[i] = Ny[j];
      }
    }
  }
  double shadeAmt = clamp(P.exShade / 100, 0, 1), lines = clamp(P.exLines / 100, 0, 1), lw = std::max(0.8, 1.2 * sc);
  W.rgba.assign(n * 4, 0.f); W.WA.assign(n, 0.f);
  auto wallAt = [&](size_t k) { return S[k] > 0 && (double)S[k] != INF; };
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; double s = S[i];
    if (!(s > 0) || s == INF) continue;
    double a = clamp(Dp + 1 - s, 0, 1);
    if (a <= 0) continue;
    double q = clamp(s / Dp, 0, 1); int li = (int)jsRound(q * 255) * 3;
    double nx = Nx[i], ny = Ny[i];
    double facing = nx * light.hx + ny * light.hy;
    double shade = 1 - shadeAmt * (0.5 - 0.5 * facing) * 1.3;
    double spec = std::pow(std::max(0.0, facing), 24) * 0.55;
    double line = 0;
    if (s <= lw + 1) line = std::max(line, 1 - (s - 1) / lw);
    if (Dp - s < lw) line = std::max(line, 0.6 * (1 - (Dp - s) / lw));
    if (x + 1 < w && wallAt(i + 1)) line = std::max(line, clamp((1 - (nx * Nx[i + 1] + ny * Ny[i + 1])) * 3, 0, 1));
    if (y + 1 < h && wallAt(i + w)) line = std::max(line, clamp((1 - (nx * Nx[i + w] + ny * Ny[i + w])) * 3, 0, 1));
    line *= lines;
    for (int ch = 0; ch < 3; ch++) {
      double v = lut[li + ch] * clamp(shade, 0.05, 1.3);
      v = 255 - (255 - v) * (1 - spec);
      v = v + (255 - v) * line;
      W.rgba[i * 4 + ch] = u8(v);
    }
    W.rgba[i * 4 + 3] = (float)jsRound(a * 255);
    W.WA[i] = (float)a;
  }
  W.Dp = Dp; W.dir[0] = bx0; W.dir[1] = by0; W.ok = true;
  return W;
}
static std::vector<float> longShadow(const Plane& M, const Plane* WA, int w, int h, const double dir[2], double Dp, double amt, double sc) {
  size_t n = (size_t)w * h; Plane U(n, 0.f);
  double off = Dp * 0.45 + 6 * sc; int ox = (int)jsRound(dir[0] * off), oy = (int)jsRound(dir[1] * off);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    int xs = x - ox, ys = y - oy;
    if (xs < 0 || ys < 0 || xs >= w || ys >= h) continue;
    size_t j = (size_t)ys * w + xs;
    U[(size_t)y * w + x] = std::max(M[j], WA ? (*WA)[j] : 0.f);
  }
  boxBlur(U, w, h, std::max(1.0, 6 * sc + Dp * 0.25), 3);
  std::vector<float> rgba(n * 4, 0.f); double k = clamp(amt / 100, 0, 1);
  for (size_t i = 0; i < n; i++) rgba[i * 4 + 3] = u8(U[i] * k * 255);
  return rgba;
}

// ---------------------------------------------------------------- fx: glow / shine helpers
static inline void screenAdd(Plane& acc, size_t i, const double col[3], double v) {
  if (v <= 0) return;
  v = std::min(v, 1.0);
  for (int ch = 0; ch < 3; ch++) { double c = col[ch] / 255 * v; acc[i * 3 + ch] = (float)(1 - (1 - (double)acc[i * 3 + ch]) * (1 - c)); }
}
static std::vector<float> accToRGBA(const Plane& acc, size_t n) {
  std::vector<float> out(n * 4, 0.f);
  for (size_t i = 0; i < n; i++) {
    double r = acc[i * 3], g = acc[i * 3 + 1], b = acc[i * 3 + 2], a = std::max(r, std::max(g, b));
    if (a <= 1.0 / 512) continue;
    out[i * 4] = u8(r / a * 255); out[i * 4 + 1] = u8(g / a * 255); out[i * 4 + 2] = u8(b / a * 255); out[i * 4 + 3] = u8(a * 255);
  }
  return out;
}
static void star(Plane& acc, int w, int h, double cx, double cy, double len, double rays, double rot, double gain, const double col[3]) {
  int R = (int)std::ceil(len); double wd = std::max(0.55, len * 0.03), core = std::max(0.8, len * 0.1);
  std::vector<double> angs; for (int k = 0; k < rays / 2; k++) angs.push_back(rot + k * PI * 2 / rays);
  for (int y = std::max(0, (int)std::floor(cy - R)); y <= std::min(h - 1, (int)std::ceil(cy + R)); y++) {
    for (int x = std::max(0, (int)std::floor(cx - R)); x <= std::min(w - 1, (int)std::ceil(cx + R)); x++) {
      double dx = x - cx, dy = y - cy, r = jsHypot2(dx, dy);
      if (r > len) continue;
      double v = std::exp(-(r * r) / (core * core));
      for (size_t k = 0; k < angs.size(); k++) {
        double perp = std::fabs(dx * std::sin(angs[k]) - dy * std::cos(angs[k]));
        double fall = std::pow(1 - r / len, 1.6) * (k % 2 ? 0.6 : 1);
        v = std::max(v, std::exp(-(perp * perp) / (wd * wd)) * fall);
      }
      screenAdd(acc, (size_t)y * w + x, col, v * gain);
    }
  }
}
static void drawLine(Plane& A, int w, int h, double x0, double y0, double x1, double y1, double wd, double val) {
  double len = jsHypot2(x1 - x0, y1 - y0); int steps = std::max(1, (int)std::ceil(len * 2));
  for (int s = 0; s <= steps; s++) {
    double px = x0 + (x1 - x0) * s / steps, py = y0 + (y1 - y0) * s / steps;
    for (int y = (int)std::floor(py - wd - 1); y <= (int)std::ceil(py + wd + 1); y++) {
      if (y < 0 || y >= h) continue;
      for (int x = (int)std::floor(px - wd - 1); x <= (int)std::ceil(px + wd + 1); x++) {
        if (x < 0 || x >= w) continue;
        double v = clamp(wd + 0.5 - jsHypot2(x - px, y - py), 0, 1) * val; size_t i = (size_t)y * w + x;
        if (v > A[i]) A[i] = (float)v;
      }
    }
  }
}
struct Pt { double x, y; };
static std::vector<Pt> boltPath(Rng& rand, double ax, double ay, double bx, double by, double jag, int depth) {
  std::vector<Pt> pts = { { ax, ay }, { bx, by } };
  double disp = jsHypot2(bx - ax, by - ay) * jag;
  for (int d = 0; d < depth; d++) {
    std::vector<Pt> nx;
    for (size_t k = 0; k + 1 < pts.size(); k++) {
      Pt p = pts[k], q = pts[k + 1]; double mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      double dx = q.x - p.x, dy = q.y - p.y, l = jsHypot2(dx, dy); if (!l) l = 1;
      double o = (rand() * 2 - 1) * disp;
      nx.push_back(p); nx.push_back({ mx - dy / l * o, my + dx / l * o });
    }
    nx.push_back(pts.back());
    pts = nx; disp *= 0.55;
  }
  return pts;
}

// ---------------------------------------------------------------- 1.1: outline face
struct Face { Plane R, S, D; BBox bb; };
static bool outlineFace(const Plane& M, int w, int h, const Params& P, double sc, Face& F) {
  size_t n = (size_t)w * h;
  F.D = insideDistance(M, w, h);
  double bw = std::max(1.0, P.bevel * sc);
  Plane H = bevelHeight(F.D, n, bw, P.profile);
  boxBlur(H, w, h, std::max(1.0, P.reliefSoft * sc * 0.5), 2);
  BBox bb = bbox(M, w, h); F.bb = bb;
  double bh = std::max(1, bb.b - bb.t + 1), bwd = std::max(1, bb.r - bb.l + 1);
  double depth = P.depth / 100, tilt = 0.4 + 1.6 * depth;
  double az = P.angle * PI / 180, el = 50 * PI / 180;
  double lx = std::cos(az) * std::cos(el), ly = -std::sin(az) * std::cos(el), lz = std::sin(el);
  double hx = lx, hy = ly, hz = lz + 1, hl = jsHypot3(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
  double shin = 4 + P.gloss * 1.2, sAmt = P.spec / 100;
  bool horizon = P.reflect == RF_HORIZON;
  auto lut = gradientLUT(P.stops), sky = gradientLUT(P.sky), ground = gradientLUT(P.ground);
  double bc = P.bandCount, bph = P.bandPhase / 360, bmix = P.bandMix / 100, bsoft = P.bandSoft / 100; bool inv = P.invert;
  double amp = P.wave / 100 * 0.14, freq = 1.5 + P.waveSize / 100 * 10, hz0 = P.horizon / 100 + P.horizonY / bh, e = 1.2 / bh;
  Plane hline(w);
  for (int x = 0; x < w; x++) {
    double fx = (x - bb.l + P.horizonX * sc) / bwd;
    hline[x] = (float)clamp(hz0 + amp * (0.7 * noise1(fx * freq, 7) + 0.3 * noise1(fx * freq * 2.7, 13)), 0.02, 0.98);
  }
  F.R.assign(n * 3, 0.f); F.S.assign(n, 0.f);
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x;
      if (M[i] <= 0) continue;
      double gx = ((double)H[(size_t)y * w + std::min(x + 1, w - 1)] - H[(size_t)y * w + std::max(x - 1, 0)]) * 0.5 * tilt;
      double gy = ((double)H[(size_t)std::min(y + 1, h - 1) * w + x] - H[(size_t)std::max(y - 1, 0) * w + x]) * 0.5 * tilt;
      double nl = jsHypot3(gx, gy, 1), nx = -gx / nl, ny = -gy / nl, nz = 1 / nl;
      double u = (y - bb.t) / bh + ny * 0.55 + std::fabs(nx) * 0.08;
      double r, g, b;
      if (horizon) {
        double hv = hline[x], m = smooth(hv - e, hv + e, u);
        int us = (int)jsRound(clamp(u / hv, 0, 1) * 255) * 3, ug = (int)jsRound(clamp((u - hv) / (1 - hv), 0, 1) * 255) * 3;
        r = sky[us] + (ground[ug] - sky[us]) * m; g = sky[us + 1] + (ground[ug + 1] - sky[us + 1]) * m; b = sky[us + 2] + (ground[ug + 2] - sky[us + 2]) * m;
      } else {
        double t = clamp(u, 0, 1);
        if (inv) t = 1 - t;
        if (bc > 0 && bmix > 0) t = t + (bandShape(t * bc + bph, P.bandShape, bsoft) - t) * bmix;
        int q = (int)jsRound(clamp(t, 0, 1) * 255) * 3;
        r = lut[q]; g = lut[q + 1]; b = lut[q + 2];
      }
      double diff = std::max(0.0, nx * lx + ny * ly + nz * lz);
      double m = clamp(1 - depth * 0.75 * (1 - diff / lz), 0, 1.4);
      F.R[i * 3] = (float)(r * m); F.R[i * 3 + 1] = (float)(g * m); F.R[i * 3 + 2] = (float)(b * m);
      F.S[i] = (float)clamp(std::pow(std::max(0.0, nx * hx + ny * hy + nz * hz), shin) * sAmt, 0, 1);
    }
  }
  return true;
}

// ---------------------------------------------------------------- 1.1: extras
static bool anyShine(const Params& P) { return P.glOn || P.swOn || P.rimOn || P.arcOn; }
static bool extrasOn(const Params& P) {
  bool g = false; for (auto& m : P.glow) g = g || m.on;
  return P.exOn || g || anyShine(P);
}
struct L4 { std::vector<float> rgba; int blend; };   // blend: 0 normal, 1 screen, 2 multiply

static void extras(int w, int h, double sc, const Params& P, const Plane& face, Plane* faceD, const BBox* bbIn,
                   const std::vector<float>& colour, std::vector<L4>& below, std::vector<L4>& above) {
  size_t n = (size_t)w * h;
  double az = P.angle * PI / 180; Light light = { std::cos(az), -std::sin(az) };
  bool needEdges = P.exOn || P.rimOn;
  Plane Ex, Ey; if (needEdges) edgeNormals(face, w, h, 1.5 * std::max(sc, 0.7), Ex, Ey);
  Plane Dloc; const Plane* D = faceD;
  auto getD = [&]() -> const Plane& { if (!D) { Dloc = insideDistance(face, w, h); D = &Dloc; } return *D; };
  BBox bb = bbIn ? *bbIn : bbox(face, w, h); double bh = std::max(1, bb.b - bb.t + 1), bwd = std::max(1, bb.r - bb.l + 1);

  Plane WAv; bool haveWA = false;
  if (P.exOn) {
    Wall wall = extrude(face, Ex, Ey, w, h, P, gradientLUT(P.exStops), sc, light);
    if (wall.ok) {
      WAv = wall.WA; haveWA = true;
      if (P.exShadow > 0) below.push_back({ longShadow(face, &WAv, w, h, wall.dir, wall.Dp, P.exShadow, sc), 2 });
      below.push_back({ wall.rgba, 0 });
    }
  }
  Plane U(n);
  for (size_t i = 0; i < n; i++) U[i] = haveWA ? std::max(face[i], WAv[i]) : face[i];
  Plane lumF(n);
  for (size_t i = 0; i < n; i++) {
    double l = (0.2126 * colour[i * 4] + 0.7152 * colour[i * 4 + 1] + 0.0722 * colour[i * 4 + 2]) / 255;
    lumF[i] = (float)((1 - (1 - l) * (1 - 0)) * face[i]);
  }
  Plane lo(n * 3, 0.f), hi(n * 3, 0.f); bool loUsed = false, hiUsed = false;
  for (auto& m : P.glow) {
    if (!m.on || !(m.strength > 0)) continue;
    RGB c = fxHex(m.color); double col[3] = { c.r, c.g, c.b }; double r = std::max(1.0, m.size * sc), k = m.strength / 100;
    if (m.type == GT_DREAMY || m.type == GT_HALO) {
      Plane B = U; boxBlur(B, w, h, r, 3);
      if (m.type == GT_DREAMY) {
        Plane B2 = U, B3 = U; boxBlur(B2, w, h, r * 2.5, 3); boxBlur(B3, w, h, r * 6, 3);
        for (size_t i = 0; i < n; i++) screenAdd(lo, i, col, (0.55 * B[i] + 0.4 * B2[i] + 0.3 * B3[i]) * k * 1.3);
      } else for (size_t i = 0; i < n; i++) screenAdd(lo, i, col, B[i] * k * 1.5);
      loUsed = true;
    } else if (m.type == GT_NEON) {
      Plane Mb = face; boxBlur(Mb, w, h, std::max(1.0, 1.2 * sc), 2);
      Plane E(n); for (size_t i = 0; i < n; i++) E[i] = (float)(4.0 * Mb[i] * (1 - (double)Mb[i]));
      Plane B = E; boxBlur(B, w, h, r, 3);
      for (size_t i = 0; i < n; i++) screenAdd(hi, i, col, (E[i] * 0.9 + B[i] * 2.5) * k);
      hiUsed = true;
    } else if (m.type == GT_INNER) {
      const Plane& Dd = getD();
      for (size_t i = 0; i < n; i++) if (face[i] > 0) screenAdd(hi, i, col, face[i] * std::exp(-Dd[i] / r) * k);
      hiUsed = true;
    } else if (m.type == GT_BLOOM) {
      Plane B(n); for (size_t i = 0; i < n; i++) B[i] = (float)(std::max(0.0, lumF[i] - 0.7) * 3.3);
      boxBlur(B, w, h, r, 3);
      for (size_t i = 0; i < n; i++) screenAdd(hi, i, col, B[i] * k * 1.6);
      hiUsed = true;
    }
  }
  const double WHITE[3] = { 255, 255, 255 };
  if (P.swOn && P.swStrength > 0) {
    double a = P.swAngle * PI / 180, ca = std::cos(a), sa = -std::sin(a);
    double cx = (bb.l + bb.r) / 2.0, cy = (bb.t + bb.b) / 2.0, ext = std::fabs(bwd * ca) + std::fabs(bh * sa); if (!ext) ext = 1;
    double pos = P.swPos / 100, wd = std::max(0.005, P.swWidth / 100 * 0.25), k = P.swStrength / 100;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x; if (face[i] <= 0) continue;
      double b = ((x - cx) * ca + (y - cy) * sa) / ext + 0.5, z = (b - pos) / wd;
      screenAdd(hi, i, WHITE, std::exp(-z * z) * k * face[i]);
    }
    hiUsed = true;
  }
  if (P.rimOn && P.rimWidth > 0) {
    const Plane& Dd = getD(); double wp = std::max(0.8, P.rimWidth * sc); RGB c = fxHex(P.rimColor); double col[3] = { c.r, c.g, c.b };
    for (size_t i = 0; i < n; i++) {
      if (face[i] <= 0 || Dd[i] >= wp) continue;
      double away = std::max(0.0, -(Ex[i] * light.hx + Ey[i] * light.hy));
      double f = 1 - Dd[i] / wp;
      screenAdd(hi, i, col, f * f * away * face[i] * 1.1);
    }
    hiUsed = true;
  }
  if (P.glOn && P.glCount > 0) {
    int g = std::max(3, (int)jsRound(std::min(bwd, bh) / 10));
    struct C { double v; size_t i; }; std::vector<C> cand;
    for (int cy = bb.t; cy <= bb.b; cy += g) for (int cx = bb.l; cx <= bb.r; cx += g) {
      double best = -1; long bi = -1;
      for (int y = cy; y < std::min(cy + g, h); y++) for (int x = cx; x < std::min(cx + g, w); x++) { size_t i = (size_t)y * w + x; if (lumF[i] > best) { best = lumF[i]; bi = (long)i; } }
      if (best > 0.55) cand.push_back({ best, (size_t)bi });
    }
    std::stable_sort(cand.begin(), cand.end(), [](const C& a, const C& b) { return a.v != b.v ? a.v > b.v : a.i < b.i; });
    double len = std::max(2.0, P.glSize * sc), minD = std::max((double)g, len * 0.8);
    struct Pk { double x, y, v; }; std::vector<Pk> picked;
    for (auto& cd : cand) {
      if (picked.size() >= P.glCount) break;
      double x = (double)(cd.i % w), y = (double)(cd.i / w);
      bool near = false; for (auto& p : picked) if (jsHypot2(p.x - x, p.y - y) < minD) { near = true; break; }
      if (near) continue;
      picked.push_back({ x, y, cd.v });
    }
    double rot = P.glRot * PI / 180; RGB c = fxHex(P.glColor.empty() ? "#FFFFFF" : P.glColor); double col[3] = { c.r, c.g, c.b };
    for (auto& p : picked) star(hi, w, h, p.x, p.y, len * (0.6 + 0.4 * p.v), P.glRays, rot, 0.6 + 0.4 * p.v, col);
    if (!picked.empty()) hiUsed = true;
  }
  if (P.arcOn && P.arcCount > 0) {
    const Plane& Dd = getD(); std::vector<Pt> pts;
    int stride = std::max(1, (int)jsRound(2 * std::max(sc, 0.5)));
    for (int y = 0; y < h; y += stride) for (int x = 0; x < w; x += stride) { size_t i = (size_t)y * w + x; if (face[i] >= 0.5f && Dd[i] <= 1.5f) pts.push_back({ (double)x, (double)y }); }
    if (pts.size() > 2) {
      Rng rand(4242 + P.arcCount * 7 + jsRound(P.arcSpread)); Plane A(n, 0.f);
      double diag = jsHypot2(bwd, bh), spread = P.arcSpread / 100, target = (0.1 + 0.3 * spread) * diag;
      double wd = std::max(0.5, 0.9 * sc);
      for (int k = 0; k < P.arcCount; k++) {
        Pt a = pts[(size_t)std::floor(rand() * pts.size())];
        Pt b{ 0, 0 }; double bd = INF;
        for (int t = 0; t < 16; t++) { Pt q = pts[(size_t)std::floor(rand() * pts.size())]; double dd = std::fabs(jsHypot2(q.x - a.x, q.y - a.y) - target); if (dd < bd) { bd = dd; b = q; } }
        auto path = boltPath(rand, a.x, a.y, b.x, b.y, 0.12 + 0.2 * spread, 6);
        for (size_t j = 0; j + 1 < path.size(); j++) drawLine(A, w, h, path[j].x, path[j].y, path[j + 1].x, path[j + 1].y, wd, 1);
        for (int br = 0; br < 2; br++) {
          Pt p = path[(size_t)std::floor(rand() * (path.size() - 1))]; double ang = rand() * PI * 2, bl = jsHypot2(b.x - a.x, b.y - a.y) * (0.15 + rand() * 0.2);
          auto bp = boltPath(rand, p.x, p.y, p.x + std::cos(ang) * bl, p.y + std::sin(ang) * bl, 0.25, 4);
          for (size_t j = 0; j + 1 < bp.size(); j++) drawLine(A, w, h, bp[j].x, bp[j].y, bp[j + 1].x, bp[j + 1].y, wd * 0.7, 0.7);
        }
      }
      Plane B = A; boxBlur(B, w, h, std::max(1.0, 5 * sc), 3);
      RGB c = fxHex(P.arcColor); double col[3] = { c.r, c.g, c.b }, core[3] = { (c.r + 510) / 3, (c.g + 510) / 3, (c.b + 510) / 3 };
      for (size_t i = 0; i < n; i++) { screenAdd(hi, i, col, B[i] * 2.4); screenAdd(hi, i, core, A[i]); }
      hiUsed = true;
    }
  }
  if (loUsed) below.insert(below.begin(), { accToRGBA(lo, n), 1 });
  if (hiUsed) above.push_back({ accToRGBA(hi, n), 1 });
}

static std::vector<float> flattenLayers(const std::vector<const L4*>& layers, size_t n) {
  std::vector<float> out(n * 4, 0.f);
  for (size_t i = 0; i < n; i++) {
    double r = 0, g = 0, bl = 0, ab = 0;
    for (auto* L : layers) {
      const float* s = &L->rgba[i * 4]; double as = s[3] / 255.0;
      if (as <= 0) continue;
      double ao = as + ab * (1 - as);
      auto f = [&](double b, double sv) { return L->blend == 1 ? 255 - (255 - b) * (255 - sv) / 255 : L->blend == 2 ? b * sv / 255 : sv; };
      auto mix = [&](double cb, double cs) { return (as * (1 - ab) * cs + as * ab * f(cb, cs) + (1 - as) * ab * cb) / ao; };
      r = mix(r, s[0]); g = mix(g, s[1]); bl = mix(bl, s[2]); ab = ao;
    }
    out[i * 4] = u8(r); out[i * 4 + 1] = u8(g); out[i * 4 + 2] = u8(bl); out[i * 4 + 3] = u8(ab * 255);
  }
  return out;
}

bool render(const Image& src, const Params& P, Layer& outL, ProgressFn pf, void* ctx) {
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h;
  const double sc = P.scale;
  auto prog = [&](int d) { return !pf || pf(ctx, d, 10); };
  Plane L(n);
  for (size_t i = 0; i < n; i++) L[i] = (float)((0.2126 * src.R[i] + 0.7152 * src.G[i] + 0.0722 * src.B[i]) / 255);
  Pick pick = pickMode(src, P.from);
  bool outline = pick.outline;
  Plane Mf; if (outline) Mf = shapeMask(src, L, pick.key, P.key);
  Plane R, S; Face F; bool haveFace = false;
  if (outline) {
    outlineFace(Mf, w, h, P, sc, F); R = F.R; S = F.S; haveFace = true;
  } else {
    if (P.blur > 0) boxBlur(L, w, h, P.blur * sc, 3);
    if (!prog(2)) return false;
    double k = P.contrast / 100, mid = P.mid / 100; bool inv = P.invert;
    double bc = P.bandCount, bph = P.bandPhase / 360, bmix = P.bandMix / 100, bsoft = P.bandSoft / 100;
    Plane T(n);
    for (size_t i = 0; i < n; i++) {
      double t = clamp((L[i] - mid) * k + 0.5, 0, 1);
      if (inv) t = 1 - t;
      if (bc > 0 && bmix > 0) t = t + (bandShape(t * bc + bph, P.bandShape, bsoft) - t) * bmix;
      T[i] = (float)t;
    }
    auto lut = gradientLUT(P.stops);
    R.assign(n * 3, 0.f);
    for (size_t i = 0; i < n; i++) { int q = (int)jsRound(T[i] * 255.0) * 3; R[i * 3] = lut[q]; R[i * 3 + 1] = lut[q + 1]; R[i * 3 + 2] = lut[q + 2]; }
    double depth = P.depth / 100;
    S.assign(n, 0.f);
    if (depth > 0 || P.spec > 0) {
      Plane H = T; boxBlur(H, w, h, std::max(1.0, P.reliefSoft * sc), 2);
      double az = P.angle * PI / 180, el = 50 * PI / 180;
      double lx = std::cos(az) * std::cos(el), ly = -std::sin(az) * std::cos(el), lz = std::sin(el);
      double hx = lx, hy = ly, hz = lz + 1, hl = jsHypot3(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
      double strength = 6 * depth / std::max(0.25, sc), shin = 4 + P.gloss * 1.2, sAmt = P.spec / 100;
      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
          size_t i = (size_t)y * w + x;
          double dx = ((double)H[(size_t)y * w + std::min(x + 1, w - 1)] - H[(size_t)y * w + std::max(x - 1, 0)]) * strength;
          double dy = ((double)H[(size_t)std::min(y + 1, h - 1) * w + x] - H[(size_t)std::max(y - 1, 0) * w + x]) * strength;
          double nl = jsHypot3(dx, dy, 1), nx = -dx / nl, ny = -dy / nl, nz = 1 / nl;
          double diff = std::max(0.0, nx * lx + ny * ly + nz * lz);
          double shade = 1 - depth * 0.75 * (1 - diff / lz);
          double sp = std::pow(std::max(0.0, nx * hx + ny * hy + nz * hz), shin) * sAmt;
          S[i] = (float)clamp(sp, 0, 1);
          double m = clamp(shade, 0, 1.4);
          R[i * 3] = (float)(R[i * 3] * m); R[i * 3 + 1] = (float)(R[i * 3 + 1] * m); R[i * 3 + 2] = (float)(R[i * 3 + 2] * m);
        }
      }
    }
  }
  if (!prog(5)) return false;
  if (P.bloom > 0) {
    Plane B(n);
    for (size_t i = 0; i < n; i++) { double l = (0.2126 * R[i * 3] + 0.7152 * R[i * 3 + 1] + 0.0722 * R[i * 3 + 2]) / 255; B[i] = (float)(std::max(0.0, std::max(l, (double)S[i]) - 0.75) * 4); }
    boxBlur(B, w, h, 8 * sc, 3);
    double amt = P.bloom / 100;
    for (size_t i = 0; i < n; i++) S[i] = (float)clamp(S[i] + B[i] * amt * 0.6, 0, 1);
  }
  double gAmt = P.grain / 100 * 40, mix = P.mix / 100;
  std::vector<float> colour(n * 4);
  const Plane* srcC[3] = { &src.R, &src.G, &src.B };
  for (size_t i = 0; i < n; i++) {
    int x = (int)(i % w), y = (int)(i / w);
    double g = gAmt ? hash2(jsRound(x / std::max(sc, 0.0001)) + P.grainX, jsRound(y / std::max(sc, 0.0001)) + P.grainY) * gAmt : 0;
    for (int ch = 0; ch < 3; ch++) {
      double v = R[i * 3 + ch] + g;
      if (mix > 0) v = v + ((*srcC[ch])[i] - v) * mix;
      v = 255 - (255 - v) * (1 - (double)S[i]);
      colour[i * 4 + ch] = u8(v);
    }
    colour[i * 4 + 3] = outline ? (float)jsRound(Mf[i] * 255.0) : (float)(int)src.A[i];
  }
  outL.blend = BL_NORMAL;
  if (!extrasOn(P)) { outL.rgba = colour; return prog(10); }
  Plane face(n);
  for (size_t i = 0; i < n; i++) face[i] = outline ? Mf[i] : (float)((int)src.A[i] / 255.0);
  std::vector<L4> below, above;
  extras(w, h, sc, P, face, haveFace ? &F.D : nullptr, haveFace ? &F.bb : nullptr, colour, below, above);
  L4 mid = { colour, 0 };
  std::vector<const L4*> all;
  for (auto& b : below) all.push_back(&b);
  all.push_back(&mid);
  for (auto& a : above) all.push_back(&a);
  outL.rgba = flattenLayers(all, n);
  return prog(10);
}

bool renderOut(const Image& src, const Params& P, OutImage& out, ProgressFn pf, void* ctx) {
  Layer L; if (!render(src, P, L, pf, ctx)) return false;
  out.resize(src.w, src.h); out.px = L.rgba;
  return true;
}

}
