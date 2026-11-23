// Frank's Paint Brew 1.1 - C++ port of plugins/paint-brew/js/engine.js + styles2.js.
// Uint8Array stores truncate (u8), Float32Array stores are float; math in double like V8;
// rnd() calls are sequenced exactly as JS evaluates them (left to right).
#include "pb_engine.h"
#include <limits>
#include <array>

using namespace brew;

namespace pb {

static const double PI = 3.14159265358979323846;
static const double REF = 3000;
typedef std::vector<uint8_t> U8;
typedef std::array<double, 3> C3;

const char* const STYLE_IDS[6] = { "oil", "watercolour", "impressionism", "ink", "spray", "pastel" };
const char* const STYLE_NAMES[6] = { "Oil", "Watercolour", "Impressionism", "Alcohol Ink", "Spray Paint", "Pastel" };

// JS Uint8Array store (ToUint8: truncate, modulo 256, NaN -> 0)
static inline uint8_t u8(double v) {
  if (v != v || std::isinf(v)) return 0;
  if (v >= 0 && v < 256) return (uint8_t)(int)v;
  double t = std::trunc(v), m = std::fmod(t, 256.0); if (m < 0) m += 256;
  return (uint8_t)(int)m;
}
static inline double jround(double v) { return std::floor(v + 0.5); }
static double jsHypot2(double a, double b) {          // V8 Math.hypot
  a = std::fabs(a); b = std::fabs(b);
  double m = std::max(a, b);
  if (m == 0) return 0;
  if (std::isinf(m)) return std::numeric_limits<double>::infinity();
  double sum = 0, comp = 0, xs[2] = { a / m, b / m };
  for (double x : xs) { double s = x * x - comp, pre = sum + s; comp = (pre - sum) - s; sum = pre; }
  return std::sqrt(sum) * m;
}
static inline double smooth(double a, double b, double v) { double t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
static inline double lum(double r, double g, double b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
static inline double jsSign(double v) { return v > 0 ? 1 : v < 0 ? -1 : v; }
static RGB hexC(const std::string& h, const char* dflt) { return isHex(h) ? hexToRgb(h) : hexToRgb(dflt); }

// ---------------------------------------------------------------- noise
static double vnoise(double x, double y, double seed) {
  double xi = std::floor(x), yi = std::floor(y), fx = x - xi, fy = y - yi;
  double sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  double a = hashNoise(xi, yi, seed), b = hashNoise(xi + 1, yi, seed), c = hashNoise(xi, yi + 1, seed), d = hashNoise(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
static double fbm(double x, double y, double seed, int oct) {
  double s = 0, amp = 0.5, f = 1, norm = 0;
  for (int o = 0; o < oct; o++) { s += amp * vnoise(x * f, y * f, seed + o * 131); norm += amp; amp *= 0.5; f *= 2.03; }
  return s / norm;
}

// ---------------------------------------------------------------- colour
static C3 rgb2hsv(double r, double g, double b) {
  r /= 255; g /= 255; b /= 255;
  double mx = std::max(r, std::max(g, b)), mn = std::min(r, std::min(g, b)), d = mx - mn, h = 0;
  if (d > 1e-6) { if (mx == r) h = std::fmod((g - b) / d, 6.0); else if (mx == g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return { h, mx > 0 ? d / mx : 0, mx };
}
static C3 hsv2rgb(double h, double s, double v) {
  h = std::fmod(std::fmod(h, 1.0) + 1, 1.0); s = clamp(s, 0, 1); v = clamp(v, 0, 1);
  double i = std::floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  double m[6][3] = { { v, t, p }, { q, v, p }, { p, v, t }, { p, q, v }, { t, p, v }, { v, p, q } };
  int k = ((int)i) % 6;
  return { m[k][0] * 255, m[k][1] * 255, m[k][2] * 255 };
}
static void adjustColour(Plane& R, Plane& G, Plane& B, size_t n, double sat, double warm) {
  double s = 1 + sat / 100, wr = warm * 0.5, wb = -warm * 0.5;
  for (size_t i = 0; i < n; i++) {
    double l = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i];
    R[i] = (float)clamp(l + (R[i] - l) * s + wr, 0, 255);
    G[i] = (float)clamp(l + (G[i] - l) * s + warm * 0.1, 0, 255);
    B[i] = (float)clamp(l + (B[i] - l) * s + wb, 0, 255);
  }
}
static int nearest(const std::vector<C3>& C, double r, double g, double b) {
  int best = 0; double bd = 1e12;
  for (size_t c = 0; c < C.size(); c++) { double d0 = C[c][0] - r, d1 = C[c][1] - g, d2 = C[c][2] - b, d = d0 * d0 + d1 * d1 + d2 * d2; if (d < bd) { bd = d; best = (int)c; } }
  return best;
}
static std::vector<C3> palette(const Plane& R, const Plane& G, const Plane& B, size_t n, double count, Rng& rnd) {
  size_t S = std::min(n, (size_t)4000);
  std::vector<double> sx(S), sy(S), sz(S);
  for (size_t j = 0; j < S; j++) { size_t i = (size_t)std::floor(rnd() * n); sx[j] = R[i]; sy[j] = G[i]; sz[j] = B[i]; }
  std::vector<C3> C;
  for (int c = 0; c < count; c++) { size_t j = (size_t)std::floor((c + 0.5) / count * S); C.push_back({ sx[j], sy[j], sz[j] }); }
  std::vector<int> asg(S);
  for (int it = 0; it < 10; it++) {
    for (size_t j = 0; j < S; j++) asg[j] = nearest(C, sx[j], sy[j], sz[j]);
    std::vector<std::array<double, 4>> acc(C.size(), { 0, 0, 0, 0 });
    for (size_t j = 0; j < S; j++) { auto& a = acc[asg[j]]; a[0] += sx[j]; a[1] += sy[j]; a[2] += sz[j]; a[3]++; }
    for (size_t c = 0; c < C.size(); c++) { auto& a = acc[c]; if (a[3]) C[c] = { a[0] / a[3], a[1] / a[3], a[2] / a[3] }; }
  }
  return C;
}

// ---------------------------------------------------------------- analysis
static Plane blur(const Plane& f, int w, int h, double r, int p = 3) { Plane o = f; boxBlur(o, w, h, r, p); return o; }
struct P3 { Plane R, G, B; };
static P3 abstraction(const Plane& R, const Plane& G, const Plane& B, int w, int h, double radIn) {
  int rad = (int)std::max(1.0, jround(radIn));
  size_t n = (size_t)w * h; Plane L(n), L2(n);
  for (size_t i = 0; i < n; i++) { double l = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]; L[i] = (float)l; L2[i] = (float)(l * l); }
  Plane mR = blur(R, w, h, rad, 1), mG = blur(G, w, h, rad, 1), mB = blur(B, w, h, rad, 1);
  boxBlur(L, w, h, rad, 1); boxBlur(L2, w, h, rad, 1);
  P3 o{ Plane(n), Plane(n), Plane(n) };
  const int off[4][2] = { { -rad, -rad }, { rad, -rad }, { -rad, rad }, { rad, rad } };
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double sw = 0, r = 0, g = 0, b = 0;
    for (int q = 0; q < 4; q++) {
      size_t j = (size_t)iclamp(y + off[q][1], 0, h - 1) * w + iclamp(x + off[q][0], 0, w - 1);
      double v = std::max(0.0, (double)L2[j] - (double)L[j] * L[j]) + 4;
      double wt = 1 / (v * v);
      sw += wt; r += mR[j] * wt; g += mG[j] * wt; b += mB[j] * wt;
    }
    size_t i = (size_t)y * w + x;
    o.R[i] = (float)(r / sw); o.G[i] = (float)(g / sw); o.B[i] = (float)(b / sw);
  }
  return o;
}
struct Flow { Plane TX, TY; };
static Flow flowField(const Plane& R, const Plane& G, const Plane& B, int w, int h, double k, double seed) {
  size_t n = (size_t)w * h; Plane L(n);
  for (size_t i = 0; i < n; i++) L[i] = (float)((0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]) / 255);
  boxBlur(L, w, h, std::max(1.0, 1.5 * k), 2);
  Plane Exx(n), Eyy(n), Exy(n);
  auto l = [&](int x, int y) -> double { return L[(size_t)iclamp(y, 0, h - 1) * w + iclamp(x, 0, w - 1)]; };
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double gx = l(x + 1, y - 1) + 2 * l(x + 1, y) + l(x + 1, y + 1) - l(x - 1, y - 1) - 2 * l(x - 1, y) - l(x - 1, y + 1);
    double gy = l(x - 1, y + 1) + 2 * l(x, y + 1) + l(x + 1, y + 1) - l(x - 1, y - 1) - 2 * l(x, y - 1) - l(x + 1, y - 1);
    size_t i = (size_t)y * w + x;
    Exx[i] = (float)(gx * gx); Eyy[i] = (float)(gy * gy); Exy[i] = (float)(gx * gy);
  }
  double tr = std::max(1.0, 6 * k);
  boxBlur(Exx, w, h, tr, 3); boxBlur(Eyy, w, h, tr, 3); boxBlur(Exy, w, h, tr, 3);
  Flow F{ Plane(n), Plane(n) };
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; double a = Exx[i], b = Eyy[i], c = Exy[i];
    double d = std::sqrt((a - b) * (a - b) + 4 * c * c), sum = a + b + 1e-9;
    double coh = clamp(d / sum, 0, 1) * clamp(sum * 400, 0, 1);
    double c2 = (a - b) / (d + 1e-12), s2 = 2 * c / (d + 1e-12);
    c2 = -c2; s2 = -s2;
    double na = fbm(x / k / 420, y / k / 420, seed, 2) * PI * 2;
    double nc = std::cos(na), ns = std::sin(na);
    double mc = c2 * coh + nc * (1 - coh), ms = s2 * coh + ns * (1 - coh);
    double ang = 0.5 * std::atan2(ms, mc);
    F.TX[i] = (float)std::cos(ang); F.TY[i] = (float)std::sin(ang);
  }
  return F;
}

// ---------------------------------------------------------------- strokes
struct Buf { Plane P0, P1, P2, PA; explicit Buf(size_t n) : P0(n), P1(n), P2(n), PA(n) {} };
static U8 bufToRGBA(const Buf& b, size_t n) {
  U8 out(n * 4, 0);
  for (size_t i = 0, p = 0; i < n; i++, p += 4) {
    double a = b.PA[i];
    if (a <= 0.002) continue;
    out[p] = (uint8_t)clamp(jround(b.P0[i] / a), 0, 255); out[p + 1] = (uint8_t)clamp(jround(b.P1[i] / a), 0, 255);
    out[p + 2] = (uint8_t)clamp(jround(b.P2[i] / a), 0, 255); out[p + 3] = (uint8_t)clamp(jround(a * 255), 0, 255);
  }
  return out;
}
struct StyleS { int bristles = 5; double bristle = 0, rough = 0, dry = 0, load = 1, thick = 1, cap = 0.5; bool knife = false; double mix = 0; };
struct Ctx {
  int w, h; const Plane* TX; const Plane* TY;
  std::vector<int32_t> mark; Plane cov; int sid = 0;
  bool hasCanvas = false; Plane cv[3];
  bool hasH = false; Plane H;
  double reveal = 1;
};
struct Ex { bool has = false, hasCol2 = false, hasThick = false; C3 col2{}; double thick = 1; };
typedef std::vector<std::array<double, 2>> Pts;

static void rasterStroke(Ctx& ctx, Buf& buf, const Pts& pts, double rad, const C3& col, int sid, const StyleS& st, const Ex& ex) {
  const int w = ctx.w, h = ctx.h;
  const int nSeg = std::max(1, (int)pts.size() - 1); const bool single = pts.size() == 1;
  const bool knife = st.knife; const int nBr = knife ? 26 : st.bristles; const double seedB = sid * 7.0 + 3;
  const double aa = std::min(1.0, (knife ? 0.7 : 1.2) / std::max(0.5, rad));
  const bool hasCol2 = ex.has && ex.hasCol2; const double mix = hasCol2 ? st.mix : 0;
  const double thick = st.thick * (ex.has && ex.hasThick ? ex.thick : 1);
  std::vector<float> BN(nBr + 1), CUT(nBr + 1), SW(nBr + 1);
  for (int b = 0; b <= nBr; b++) {
    BN[b] = (float)hashNoise(b, seedB, 5); CUT[b] = (float)(1 - st.dry * (0.55 + 0.45 * hashNoise(b, seedB, 9)));
    double sw = 0.5 + 0.5 * hashNoise(b, seedB, 13); SW[b] = (float)(sw < 1 - mix ? 0 : std::min(1.0, (sw - (1 - mix)) / std::max(0.05, mix) * 1.6));
  }
  std::vector<float> segLen(nSeg + 1, 0.f);
  for (size_t j = 0; j + 1 < pts.size(); j++) segLen[j + 1] = (float)(segLen[j] + jsHypot2(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]));
  std::vector<float> WB(nSeg + 1);
  for (int j = 0; j <= nSeg; j++) WB[j] = (float)(1 + (knife ? 0.35 : 1) * st.rough * vnoise(segLen[j] / (rad * 0.9 + 1), sid, 11));
  for (int j = 0; j < nSeg; j++) {
    const auto& A = pts[j]; const auto& Bp = single ? pts[0] : pts[j + 1];
    double ax = A[0], ay = A[1], dx = Bp[0] - ax, dy = Bp[1] - ay, len2 = dx * dx + dy * dy, len = std::sqrt(len2); if (!len) len = 1;
    double R1 = rad * 1.15 + 1;
    double x0d = std::max(0.0, std::floor(std::min(ax, Bp[0]) - R1)), x1d = std::min((double)w - 1, std::ceil(std::max(ax, Bp[0]) + R1));
    double y0d = std::max(0.0, std::floor(std::min(ay, Bp[1]) - R1)), y1d = std::min((double)h - 1, std::ceil(std::max(ay, Bp[1]) + R1));
    if (x0d > x1d || y0d > y1d) continue;
    int x0 = (int)x0d, x1 = (int)x1d, y0 = (int)y0d, y1 = (int)y1d;
    for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++) {
      double px = x - ax, py = y - ay;
      double t0 = len2 > 0 ? (px * dx + py * dy) / len2 : 0;
      double over = 0;
      if (!single && ((t0 < 0 && j == 0) || (t0 > 1 && j == nSeg - 1))) { over = (t0 < 0 ? -t0 : t0 - 1) * len / std::max(0.5, rad); if (over > st.cap) continue; }
      if (t0 > 1 && j < nSeg - 1) continue;
      double t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
      double qx = px - dx * t, qy = py - dy * t;
      double dist = over > 0 ? std::fabs(dx * py - dy * px) / len : std::sqrt(qx * qx + qy * qy);
      double side = (dx * py - dy * px) >= 0 ? 1 : -1;
      double u = single ? 0.5 : (j + t) / nSeg;
      double uu = u < 0 ? 0 : u > 1 ? 1 : u;
      double wob = WB[j] + ((double)WB[j + 1] - WB[j]) * t;
      double rr = rad * (knife ? 0.78 + 0.34 * uu : 0.86 + 0.56 * uu * (1 - uu)) * wob;
      double v = dist / rr;
      if (v >= 1) continue;
      double a = clamp((1 - v) / aa, 0, 1) * st.load;
      double vp = std::min(0.999, std::fabs(dx * py - dy * px) / len / rr);
      int bi = (int)std::min((double)nBr, std::floor((side * vp + 1) * 0.5 * nBr));
      double bn = BN[bi];
      if (over > 0) { double lim = st.cap * (0.725 + 0.275 * bn); if (over > lim) continue; a *= clamp((lim - over) * rad / 1.2, 0, 1); }
      if (st.dry > 0 && !single) { double cut = CUT[bi]; if (u > cut) a *= clamp(1 - (u - cut) * 12, 0, 1); }
      if (a <= 0.003) continue;
      size_t i = (size_t)y * w + x;
      double bf = 1 + st.bristle * bn * (knife ? 0.35 : 1);
      double r0 = col[0], r1 = col[1], r2 = col[2];
      if (mix > 0) { double mw = SW[bi] * (0.35 + 0.65 * uu); if (mw > 0) { r0 += (ex.col2[0] - r0) * mw; r1 += (ex.col2[1] - r1) * mw; r2 += (ex.col2[2] - r2) * mw; } }
      double c0 = clamp(r0 * bf, 0, 255), c1 = clamp(r1 * bf, 0, 255), c2 = clamp(r2 * bf, 0, 255);
      double hv = 0;
      if (ctx.hasH) {
        if (knife) hv = thick * (0.72 + 0.08 * bn + 0.55 * smooth(0.82, 1, uu) + 0.3 * smooth(0.86, 0.97, vp));
        else hv = thick * ((0.5 + 0.5 * bn) * (0.78 + 0.22 * smooth(0.6, 1, uu)) + 0.28 * smooth(0.74, 0.9, vp) * (1 - smooth(0.9, 1, vp)) + 0.3 * smooth(0.8, 1, uu));
        if (over > 0) hv *= 0.6;
      }
      if (ctx.mark[i] == sid) {
        double a0 = ctx.cov[i];
        if (a <= a0 || a0 >= 0.999) continue;
        double f = (1 - a) / (1 - a0);
        buf.P0[i] = (float)(c0 + (buf.P0[i] - c0) * f); buf.P1[i] = (float)(c1 + (buf.P1[i] - c1) * f); buf.P2[i] = (float)(c2 + (buf.P2[i] - c2) * f); buf.PA[i] = (float)(1 + (buf.PA[i] - 1) * f);
        if (ctx.hasH) ctx.H[i] = (float)(hv + (ctx.H[i] - hv) * f);
      } else {
        ctx.mark[i] = sid;
        double ia = 1 - a;
        buf.P0[i] = (float)(c0 * a + buf.P0[i] * ia); buf.P1[i] = (float)(c1 * a + buf.P1[i] * ia); buf.P2[i] = (float)(c2 * a + buf.P2[i] * ia); buf.PA[i] = (float)(a + buf.PA[i] * ia);
        if (ctx.hasH) ctx.H[i] = (float)(hv * a + ctx.H[i] * ia);
      }
      ctx.cov[i] = (float)a;
    }
  }
}

enum ColFn { CF_NONE = 0, CF_PAL, CF_BROKEN, CF_PASTEL, CF_PASTEL_HI };
struct PassOpts {
  double seed = 0, radius = 1, spacing = 1; bool fillAll = false; double thresh = 0, minLen = 1, maxLen = 2, step = 0.6, follow = 0.7, jitter = 0;
  double stopAfter = 1, stopDiff = 200, outsideSuppress = 0, outsideGrow = 0, thickLights = 0, maxBend = 0;
  int colourFn = CF_NONE; StyleS style;
};
struct Painter {           // the colour functions' captured state
  const std::vector<C3>* pal = nullptr; double jit = 0;
  const Plane *R = nullptr, *G = nullptr, *B = nullptr; int w = 0;
  C3 apply(int fn, const C3& col, Rng& r, int x, int y) const {
    if (fn == CF_PAL) return pal ? (*pal)[nearest(*pal, col[0], col[1], col[2])] : col;
    if (fn == CF_BROKEN) {
      C3 c = pal ? (*pal)[nearest(*pal, col[0], col[1], col[2])] : col;
      C3 hsv = rgb2hsv(c[0], c[1], c[2]);
      double h1 = hsv[0] + (r() - 0.5) * 0.22 * jit;
      double s1 = hsv[1] * (1 + 0.3 * jit) + (r() - 0.5) * 0.35 * jit;
      double v1 = hsv[2] * (1 + (r() - 0.5) * 0.4 * jit);
      return hsv2rgb(h1, s1, v1);
    }
    if (fn == CF_PASTEL) {
      C3 c = pal ? (*pal)[nearest(*pal, col[0], col[1], col[2])] : col; double v = 1 + (r() - 0.5) * 0.22;
      return { c[0] * v, c[1] * v, c[2] * v };
    }
    if (fn == CF_PASTEL_HI) {
      size_t i = (size_t)y * w + x; C3 c = apply(CF_PASTEL, { (double)(*R)[i], (double)(*G)[i], (double)(*B)[i] }, r, x, y);
      return { c[0] + (255 - c[0]) * 0.45, c[1] + (255 - c[1]) * 0.45, c[2] + (255 - c[2]) * 0.4 };
    }
    return col;
  }
};

static int strokePass(Ctx& ctx, Buf& buf, const Plane* ref[3], const PassOpts& o, const Painter& pt) {
  const int w = ctx.w, h = ctx.h; const Plane& TX = *ctx.TX; const Plane& TY = *ctx.TY;
  Rng rnd(o.seed);
  int cell = (int)std::max(1.0, jround(o.spacing));
  int gw = (w + cell - 1) / cell, gh = (h + cell - 1) / cell;
  std::vector<int32_t> order((size_t)gw * gh);
  for (size_t i = 0; i < order.size(); i++) order[i] = (int32_t)i;
  for (size_t i = order.size() - 1; i > 0; i--) { size_t j = (size_t)std::floor(rnd() * (i + 1)); std::swap(order[i], order[j]); }
  const Plane &rR = *ref[0], &rG = *ref[1], &rB = *ref[2];
  size_t qEnd = order.size();
  if (ctx.reveal < 1) qEnd = (size_t)std::ceil(order.size() * clamp(ctx.reveal, 0, 1));
  int count = 0;
  for (size_t q = 0; q < qEnd; q++) {
    int cx = (order[q] % gw) * cell, cy = (order[q] / gw) * cell;
    double best = -1, sum = 0; long bi = -1; int cnt = 0;
    for (int y = cy; y < std::min(h, cy + cell); y++) for (int x = cx; x < std::min(w, cx + cell); x++) {
      size_t i = (size_t)y * w + x;
      double e = ctx.hasCanvas ? std::fabs((double)ctx.cv[0][i] - rR[i]) + std::fabs((double)ctx.cv[1][i] - rG[i]) + std::fabs((double)ctx.cv[2][i] - rB[i]) : 0;
      sum += e; cnt++;
      if (e > best) { best = e; bi = (long)i; }
    }
    if (bi < 0) continue;
    int px = (int)(bi % w), py = (int)(bi / w);
    if (o.fillAll) { px = std::min(w - 1, cx + (int)std::floor(rnd() * cell)); py = std::min(h - 1, cy + (int)std::floor(rnd() * cell)); }
    const double fc = 1;
    double th = o.thresh * (1 + (1 - fc) * o.outsideSuppress);
    if (!o.fillAll && sum / cnt < th) continue;
    size_t i0 = (size_t)py * w + px;
    C3 col = { (double)rR[i0], (double)rG[i0], (double)rB[i0] };
    if (o.colourFn) col = pt.apply(o.colourFn, col, rnd, px, py);
    double rad = o.radius * (1 + (1 - fc) * o.outsideGrow) * (0.85 + 0.3 * rnd());
    Pts pts; pts.push_back({ (double)px, (double)py });
    double dxp = TX[i0], dyp = TY[i0];
    if (o.jitter) { double ja = (rnd() - 0.5) * 2 * o.jitter; double c = std::cos(ja), s = std::sin(ja); double nx = dxp * c - dyp * s; dyp = dxp * s + dyp * c; dxp = nx; }
    if (rnd() < 0.5) { dxp = -dxp; dyp = -dyp; }
    double x = px, y = py;
    double steps = o.minLen + std::floor(rnd() * (o.maxLen - o.minLen + 1));
    double bent = 0;
    for (int s = 0; s < steps; s++) {
      size_t j = (size_t)iclamp((int)jround(y), 0, h - 1) * w + iclamp((int)jround(x), 0, w - 1);
      double tx = TX[j], ty = TY[j];
      if (tx * dxp + ty * dyp < 0) { tx = -tx; ty = -ty; }
      double nx = dxp * (1 - o.follow) + tx * o.follow, ny = dyp * (1 - o.follow) + ty * o.follow;
      double nl = jsHypot2(nx, ny); if (!nl) nl = 1; nx /= nl; ny /= nl;
      if (o.maxBend) {
        double turn = std::atan2(dxp * ny - dyp * nx, dxp * nx + dyp * ny);
        bent += std::fabs(turn);
        if (bent > o.maxBend && s >= 2) break;
      }
      x += nx * rad * o.step; y += ny * rad * o.step;
      if (x < -rad || y < -rad || x > w + rad || y > h + rad) break;
      size_t k2 = (size_t)iclamp((int)jround(y), 0, h - 1) * w + iclamp((int)jround(x), 0, w - 1);
      if (s >= o.stopAfter && std::fabs(rR[k2] - col[0]) + std::fabs(rG[k2] - col[1]) + std::fabs(rB[k2] - col[2]) > o.stopDiff) break;
      pts.push_back({ x, y }); dxp = nx; dyp = ny;
    }
    Pts dpts;
    if (pts.size() > 3) { for (size_t qi = 0; qi < pts.size(); qi++) if (qi % 2 == 0 || qi == pts.size() - 1) dpts.push_back(pts[qi]); }
    else dpts = pts;
    Ex ex;
    if (o.style.mix > 0 || o.thickLights > 0) {
      ex.has = true;
      if (o.style.mix > 0) {
        const auto& e = pts.back(); double side = (rnd() < 0.5 ? -1 : 1) * rad * 1.6;
        int sx = (int)clamp(jround(e[0] + (pts.size() > 1 ? 0 : side)), 0, w - 1), sy = (int)clamp(jround(e[1] + (pts.size() > 1 ? side * 0.6 : 0)), 0, h - 1);
        size_t j2 = (size_t)sy * w + sx;
        C3 c2 = { (double)rR[j2], (double)rG[j2], (double)rB[j2] };
        ex.col2 = o.colourFn ? pt.apply(o.colourFn, c2, rnd, sx, sy) : c2; ex.hasCol2 = true;
      }
      if (o.thickLights > 0) { double l = (0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2]) / 255; ex.thick = 1 - o.thickLights + o.thickLights * (0.25 + 1.1 * l); ex.hasThick = true; }
    }
    rasterStroke(ctx, buf, dpts, rad, col, ++ctx.sid, o.style, ex);
    count++;
  }
  return count;
}
static void overCanvas(Plane cv[3], const U8& rgba, size_t n) {
  for (size_t i = 0, p = 0; i < n; i++, p += 4) {
    double a = rgba[p + 3] / 255.0; if (!a) continue;
    cv[0][i] = (float)(cv[0][i] + (rgba[p] - cv[0][i]) * a); cv[1][i] = (float)(cv[1][i] + (rgba[p + 1] - cv[1][i]) * a); cv[2][i] = (float)(cv[2][i] + (rgba[p + 2] - cv[2][i]) * a);
  }
}
static U8 toRGBA(const Plane& R, const Plane& G, const Plane& B, const U8* A, size_t n) {
  U8 out(n * 4);
  for (size_t i = 0; i < n; i++) {
    out[i * 4] = (uint8_t)clamp(jround(R[i]), 0, 255); out[i * 4 + 1] = (uint8_t)clamp(jround(G[i]), 0, 255); out[i * 4 + 2] = (uint8_t)clamp(jround(B[i]), 0, 255);
    out[i * 4 + 3] = A ? (*A)[i] : 255;
  }
  return out;
}
static U8 litLayer(const Plane& Hf, int w, int h, double angleDeg, double amp, bool gloss) {
  size_t n = (size_t)w * h; U8 out(n * 4); double a = angleDeg * PI / 180, lx = std::cos(a), ly = -std::sin(a);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x;
    double gx = (double)Hf[(size_t)y * w + std::min(w - 1, x + 1)] - Hf[(size_t)y * w + std::max(0, x - 1)];
    double gy = (double)Hf[(size_t)std::min(h - 1, y + 1) * w + x] - Hf[(size_t)std::max(0, y - 1) * w + x];
    double g = -(gx * lx + gy * ly) * amp;
    if (gloss) g = g > 0 ? g * 1.25 + g * g / 160 : g * 0.6;
    double v = 128 + g;
    uint8_t u = (uint8_t)clamp(jround(v), 0, 255);
    out[i * 4] = u; out[i * 4 + 1] = u; out[i * 4 + 2] = u; out[i * 4 + 3] = 255;
  }
  return out;
}
static Plane weaveField(int w, int h, double k, double period, double seed, double ox, double oy) {
  size_t n = (size_t)w * h; Plane F(n); double p = std::max(1.0, period);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double X = x + ox, Y = y + oy;
    double ux = X / k + 0.7 * fbm(X / k / 60, Y / k / 60, seed, 2) * p, uy = Y / k + 0.7 * fbm(X / k / 60 + 9, Y / k / 60, seed, 2) * p;
    double cx = std::floor(ux / p), cy = std::floor(uy / p), fx = ux / p - cx, fy = uy / p - cy;
    bool horiz = (((int64_t)(cx + cy)) & 1) == 0;
    double thread = horiz ? std::sin(PI * fy) * (0.75 + 0.25 * std::sin(PI * fx)) : std::sin(PI * fx) * (0.75 + 0.25 * std::sin(PI * fy));
    F[(size_t)y * w + x] = (float)(thread * (0.85 + 0.15 * hashNoise(cx, cy, seed)));
  }
  return F;
}

struct Setup { int w, h; size_t n; double k, seed, rad0, simp; Plane R, G, B; };
static Setup setup(const Image& src, const Params& P) {
  Setup S; S.w = src.w; S.h = src.h; S.n = (size_t)S.w * S.h;
  double sc = P.scale;
  double fullLong = std::max(std::max(P.fullW ? P.fullW : S.w / sc, P.fullH ? P.fullH : S.h / sc), 1.0);
  S.k = std::max(0.02, sc * fullLong / REF);
  S.R = src.R; S.G = src.G; S.B = src.B;
  for (size_t i = 0; i < S.n; i++) {
    float A = (float)(int)src.A[i];
    if (A < 255) { double t = A / 255.0; S.R[i] = (float)(S.R[i] * t + 255 * (1 - t)); S.G[i] = (float)(S.G[i] * t + 255 * (1 - t)); S.B[i] = (float)(S.B[i] * t + 255 * (1 - t)); }
  }
  adjustColour(S.R, S.G, S.B, S.n, P.cSaturation, P.cWarmth);
  S.seed = toInt32(P.seed) + 1.0;
  S.rad0 = std::max(0.8, P.bSize * S.k); S.simp = 0.25 + P.cSimplify / 100;
  return S;
}
static void push(Result& res, U8&& rgba, int blend, double opacity = 100) { PLayer L; L.rgba = std::move(rgba); L.blend = blend; L.opacity = opacity; res.layers.push_back(std::move(L)); }
static bool tick(ProgressFn pf, void* c, int d, int t) { return !pf || pf(c, d, t); }

// ---------------------------------------------------------------- Oil / Impressionism
static bool paintStrokes(const Image& src, const Params& P, Result& res, bool oil, ProgressFn pf, void* pctx) {
  Setup S = setup(src, P); const int w = S.w, h = S.h; const size_t n = S.n; const double k = S.k, seed = S.seed;
  const Plane &R = S.R, &G = S.G, &Bl = S.B;
  Rng rnd(seed * 977);
  std::vector<C3> palV; bool hasPal = P.cPalette > 1;
  if (hasPal) palV = palette(R, G, Bl, n, P.cPalette, rnd);
  Flow flow = flowField(R, G, Bl, w, h, k, seed);
  Ctx ctx; ctx.w = w; ctx.h = h; ctx.TX = &flow.TX; ctx.TY = &flow.TY; ctx.mark.assign(n, 0); ctx.cov.assign(n, 0.f); ctx.reveal = P.reveal;
  if (oil) { ctx.hasH = true; ctx.H.assign(n, 0.f); }
  const double rad0 = S.rad0, simp = S.simp; const bool knife = P.bTool == "knife";
  Plane gR, gG, gB;
  if (oil) { P3 a = abstraction(R, G, Bl, w, h, rad0 * 0.6 * simp); gR = std::move(a.R); gG = std::move(a.G); gB = std::move(a.B); }
  else {
    gR = blur(R, w, h, rad0 * 1.2); gG = blur(G, w, h, rad0 * 1.2); gB = blur(Bl, w, h, rad0 * 1.2);
    const double tone[3] = { 196, 150, 96 };
    for (size_t i = 0; i < n; i++) { gR[i] = (float)(gR[i] * 0.8 + tone[0] * 0.2); gG[i] = (float)(gG[i] * 0.8 + tone[1] * 0.2); gB[i] = (float)(gB[i] * 0.8 + tone[2] * 0.2); }
  }
  push(res, toRGBA(gR, gG, gB, nullptr, n), PB_NORMAL);
  ctx.hasCanvas = true; ctx.cv[0] = gR; ctx.cv[1] = gG; ctx.cv[2] = gB;
  Painter pt; pt.pal = hasPal ? &palV : nullptr; pt.jit = P.cJitter / 100;
  StyleS style;
  if (oil) {
    style.bristles = 7 + (int)jround(P.bSize / 6); style.bristle = 0.06 + P.tBristle / 100 * 0.18; style.rough = 0.12;
    style.dry = knife ? 0.05 + P.bRandomness / 100 * 0.1 : 0.12 + P.bRandomness / 100 * 0.2; style.load = 1; style.thick = 1;
    style.cap = knife ? 0.06 : 0.35; style.knife = knife; style.mix = (P.bMix ? P.bMix : 0) / 100;
  } else { style.bristles = 5; style.bristle = 0.04 + P.tBristle / 100 * 0.12; style.rough = 0.2; style.dry = 0.05; style.load = 0.96; style.thick = 1; style.cap = 0.6; }
  const int passes = (int)clamp(jround(P.bDetail), 1, 4);
  const double follow = P.bFollow / 100, fOut = P.fOutside / 100;
  std::vector<std::vector<int>> groups = oil ? std::vector<std::vector<int>>{ { 0 }, { 1, 2, 3 } } : std::vector<std::vector<int>>{ { 0 }, { 1 }, { 2, 3 } };
  int done = 0;
  for (auto& idxs : groups) {
    std::vector<int> use; for (int p : idxs) if (p < passes) use.push_back(p);
    if (use.empty()) continue;
    Buf buf(n);
    for (int p : use) {
      if (!tick(pf, pctx, done++, passes + 2)) return false;
      double minR = (oil ? 5 : 4) * k, f = oil ? 0.5 : 0.55;
      if (p > 0 && rad0 * std::pow(f, p - 1) <= minR * 1.05) continue;
      double r = std::max(std::max(0.6, minR), rad0 * std::pow(f, p));
      P3 refAbs = abstraction(R, G, Bl, w, h, std::max(1.0, r * 0.5 * simp));
      const Plane* ref[3] = { &refAbs.R, &refAbs.G, &refAbs.B };
      PassOpts o;
      if (oil) {
        o.seed = seed * 31 + p; o.radius = r * (knife ? 1.25 : 1); o.spacing = r * (p == 0 ? 1.1 : 1.0); o.fillAll = p == 0; o.thresh = 30 + 12 * p;
        o.minLen = std::max(3.0, jround((p == 0 ? 6 : 4) * P.bLength)); o.maxLen = std::max(4.0, jround((p == 0 ? 14 : 10) * P.bLength)); o.step = 0.6; o.follow = follow;
        o.jitter = P.bRandomness / 100 * 0.5; o.stopAfter = std::max(3.0, jround(5 * P.bLength)); o.stopDiff = 90 + 50 * (1 - p / 3.0);
        o.outsideSuppress = (1 - fOut) * 3; o.outsideGrow = (1 - fOut) * 0.8; o.colourFn = CF_PAL; o.style = style; o.style.thick = 1 - p * 0.18;
        o.thickLights = (P.tThickLights ? P.tThickLights : 0) / 100; o.maxBend = knife ? 0.45 : 1.1;
      } else {
        o.seed = seed * 31 + p; o.radius = r; o.spacing = r * 1.05; o.fillAll = p == 0; o.thresh = 34 + 10 * p;
        o.minLen = std::max(1.0, jround(2 * P.bLength)); o.maxLen = std::max(2.0, jround(3.2 * P.bLength)); o.step = 0.8; o.follow = follow * 0.6;
        o.jitter = 0.35 + P.bRandomness / 100 * 0.9; o.stopAfter = 1; o.stopDiff = 200; o.outsideSuppress = (1 - fOut) * 3; o.outsideGrow = (1 - fOut) * 0.7;
        o.colourFn = CF_BROKEN; o.style = style;
      }
      strokePass(ctx, buf, ref, o, pt);
    }
    U8 rgba = bufToRGBA(buf, n);
    overCanvas(ctx.cv, rgba, n);
    push(res, std::move(rgba), PB_NORMAL);
  }
  const double weaveAmt = P.tCanvas / 100;
  Plane weave; if (weaveAmt > 0) weave = weaveField(w, h, k, P.tCanvasScale, seed + 5, P.ox, P.oy);
  if (oil && P.tImpasto > 0) {
    boxBlur(ctx.H, w, h, std::max(1.0, 1.4 * k), 2);
    push(res, litLayer(ctx.H, w, h, P.tLight, P.tImpasto / 100 * 190 / std::max(0.6, k * 1.2), true), PB_OVERLAY);
  }
  if (P.tLift > 0) {
    U8 out(n * 4); uint8_t a = (uint8_t)jround(P.tLift / 100 * 255);
    const double shadow[3] = { oil ? 60.0 : 70.0, oil ? 84.0 : 80.0, oil ? 170.0 : 190.0 }, light[3] = { 255, oil ? 200.0 : 214.0, oil ? 110.0 : 140.0 };
    for (size_t i = 0, p = 0; i < n; i++, p += 4) {
      double l = (0.299 * ctx.cv[0][i] + 0.587 * ctx.cv[1][i] + 0.114 * ctx.cv[2][i]) / 255, t = l * l * (3 - 2 * l);
      out[p] = u8(shadow[0] + (light[0] - shadow[0]) * t); out[p + 1] = u8(shadow[1] + (light[1] - shadow[1]) * t); out[p + 2] = u8(shadow[2] + (light[2] - shadow[2]) * t); out[p + 3] = a;
    }
    push(res, std::move(out), PB_SOFTLIGHT);
  }
  if (weaveAmt > 0) {
    Plane Hf(n); double amp = weaveAmt * 90;
    for (size_t i = 0; i < n; i++) Hf[i] = (float)(weave[i] * (ctx.hasH ? 1 - 0.75 * clamp(ctx.H[i], 0, 1) : 1));
    push(res, litLayer(Hf, w, h, P.tLight, amp, false), PB_OVERLAY);
  }
  res.w = w; res.h = h;
  return true;
}

// ---------------------------------------------------------------- Watercolour
static bool paintWatercolour(const Image& src, const Params& P, Result& res, ProgressFn pf, void* pctx) {
  Setup S = setup(src, P); const int w = S.w, h = S.h; const size_t n = S.n; const double k = S.k, seed = S.seed;
  const Plane &R = S.R, &G = S.G, &Bl = S.B;
  const double rad0 = S.rad0, simp = S.simp;
  P3 a1 = abstraction(R, G, Bl, w, h, rad0 * 0.5 * simp);
  P3 A = abstraction(a1.R, a1.G, a1.B, w, h, rad0 * 0.3 * simp);
  Plane &aR = A.R, &aG = A.G, &aB = A.B;
  if (!tick(pf, pctx, 1, 6)) return false;
  if (P.cPalette > 1) {
    Rng pr(seed * 977); auto pal = palette(aR, aG, aB, n, P.cPalette, pr);
    for (size_t i = 0; i < n; i++) { const C3& c = pal[nearest(pal, aR[i], aG[i], aB[i])]; aR[i] = (float)(aR[i] * 0.35 + c[0] * 0.65); aG[i] = (float)(aG[i] * 0.35 + c[1] * 0.65); aB[i] = (float)(aB[i] * 0.35 + c[2] * 0.65); }
  }
  const double bl = P.wBleed * k; Plane wR(n), wG(n), wB(n);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double ux = x / k, uy = y / k;
    int sx = (int)clamp(jround(x + bl * fbm(ux / 90, uy / 90, seed + 1, 3)), 0, w - 1), sy = (int)clamp(jround(y + bl * fbm(ux / 90 + 5.3, uy / 90, seed + 2, 3)), 0, h - 1);
    size_t j = (size_t)sy * w + sx, i = (size_t)y * w + x;
    wR[i] = aR[j]; wG[i] = aG[j]; wB[i] = aB[j];
  }
  double br = std::max(1.0, bl * 0.25);
  boxBlur(wR, w, h, br, 2); boxBlur(wG, w, h, br, 2); boxBlur(wB, w, h, br, 2);
  if (!tick(pf, pctx, 2, 6)) return false;
  const double fade = P.wFade / 100; Plane F(n);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; double nx = ((double)x / w - 0.5) * 2, ny = ((double)y / h - 0.5) * 2;
    double r = std::sqrt(nx * nx * 0.9 + ny * ny * 0.9) + 0.35 * fbm(x / k / 260, y / k / 260, seed + 3, 4);
    double vig = 1 - clamp((r - (1.15 - fade * 0.75)) / 0.28, 0, 1);
    double f = 1;
    f = std::min(f, fade > 0 ? vig : 1.0);
    F[i] = (float)clamp(f, 0, 1);
  }
  const double dens = P.wDensity / 100; RGB paper = hexC(P.wPaper, "#F7F2E6");
  Plane washR(n), washG(n), washB(n);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x;
    double d = dens * F[i] * (0.82 + 0.3 * fbm(x / k / 140, y / k / 140, seed + 4, 3));
    washR[i] = (float)clamp(255 - (255 - wR[i] * 255.0 / std::max(1.0, paper.r)) * d, 0, 255);
    washG[i] = (float)clamp(255 - (255 - wG[i] * 255.0 / std::max(1.0, paper.g)) * d, 0, 255);
    washB[i] = (float)clamp(255 - (255 - wB[i] * 255.0 / std::max(1.0, paper.b)) * d, 0, 255);
  }
  push(res, toRGBA(washR, washG, washB, nullptr, n), PB_MULTIPLY);
  if (P.wWetEdge > 0) {
    double er = std::max(1.0, 2.2 * k); Plane Lw(n);
    for (size_t i = 0; i < n; i++) Lw[i] = (float)(0.299 * washR[i] + 0.587 * washG[i] + 0.114 * washB[i]);
    Plane Lb = blur(Lw, w, h, er, 2); U8 out(n * 4); double g = P.wWetEdge / 100 * 0.07;
    for (size_t i = 0, p = 0; i < n; i++, p += 4) {
      double dl = (double)Lb[i] - Lw[i];
      double e = clamp(dl * g * 3, 0, 1) + clamp(std::fabs(dl) * g, 0, 0.6);
      out[p] = u8((double)washR[i] * washR[i] / 255); out[p + 1] = u8((double)washG[i] * washG[i] / 255); out[p + 2] = u8((double)washB[i] * washB[i] / 255);
      out[p + 3] = u8(jround(clamp(e, 0, 1) * 255));
    }
    push(res, std::move(out), PB_MULTIPLY);
  }
  if (!tick(pf, pctx, 3, 6)) return false;
  if (P.wGranulation > 0) {
    U8 out(n * 4); double g = P.wGranulation / 100;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x, p = i * 4;
      double pig = 1 - (0.299 * washR[i] + 0.587 * washG[i] + 0.114 * washB[i]) / 255;
      double X = x + P.ox, Y = y + P.oy;
      double nz = 0.5 + 0.5 * fbm(X / k / 2.2, Y / k / 2.2, seed + 6, 2);
      double v = clamp(255 - g * pig * nz * nz * 150, 0, 255);
      out[p] = u8(v); out[p + 1] = u8(v); out[p + 2] = u8(v * 0.98); out[p + 3] = 255;
    }
    push(res, std::move(out), PB_MULTIPLY);
  }
  if (P.wPencil > 0) {
    Plane L(n);
    for (size_t i = 0; i < n; i++) L[i] = (float)(0.299 * R[i] + 0.587 * G[i] + 0.114 * Bl[i]);
    Plane s1 = blur(L, w, h, std::max(1.0, 1.2 * k), 2), s2 = blur(L, w, h, std::max(1.0, 2.4 * k), 2);
    U8 out(n * 4); double st = P.wPencil / 100;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x, p = i * 4;
      double d = (double)s2[i] - s1[i];
      double line = clamp((d - 2.5) / 7, 0, 1);
      line *= 0.55 + 0.45 * (0.5 + 0.5 * fbm(x / k / 3 + y / k / 9, y / k / 3, seed + 7, 2));
      double vis = clamp(F[i] * 1.6 + 0.15, 0, 1);
      double v = 255 - st * line * vis * 170;
      out[p] = u8(v); out[p + 1] = u8(v); out[p + 2] = u8(clamp(v + 4, 0, 255)); out[p + 3] = 255;
    }
    push(res, std::move(out), PB_MULTIPLY);
  }
  if (!tick(pf, pctx, 4, 6)) return false;
  if (P.wSplashes > 0) {
    U8 out(n * 4, 0); Rng rnd(seed * 4099);
    int cnt = (int)jround(P.wSplashes);
    for (int s = 0; s < cnt; s++) {
      double cx = 0, cy = 0;
      for (int tries = 0; tries < 12; tries++) {
        cx = rnd() * w; cy = rnd() * h;
        double f = F[(size_t)std::floor(cy) * w + (size_t)std::floor(cx)];
        if (f > 0.15 && f < 0.85) break;
      }
      size_t j = (size_t)std::floor(cy) * w + (size_t)std::floor(cx);
      C3 hsv = rgb2hsv(aR[j], aG[j], aB[j]);
      C3 col = hsv2rgb(hsv[0], std::min(1.0, hsv[1] * 1.3 + 0.15), std::min(1.0, hsv[2] * 0.95 + 0.05));
      double rs = P.wSplashSize * k * (0.5 + rnd());
      std::vector<C3> blobs; blobs.push_back({ cx, cy, rs });
      int nd = 6 + (int)std::floor(rnd() * 14);
      for (int d = 0; d < nd; d++) {
        double a = rnd() * PI * 2; double dist = rs * (1.1 + rnd() * 2.2); double r3 = rs * (0.04 + rnd() * 0.16);
        blobs.push_back({ cx + std::cos(a) * dist, cy + std::sin(a) * dist, r3 });
      }
      double sd = seed * 13 + s;
      for (auto& bb : blobs) {
        double bx = bb[0], by = bb[1], br0 = bb[2], R1 = br0 * 1.4 + 1;
        int ya = (int)std::max(0.0, std::floor(by - R1)), yb = (int)std::min((double)h - 1, std::ceil(by + R1));
        int xa = (int)std::max(0.0, std::floor(bx - R1)), xb = (int)std::min((double)w - 1, std::ceil(bx + R1));
        for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) {
          double dx = x - bx, dy = y - by, dist = jsHypot2(dx, dy), ang = std::atan2(dy, dx);
          double rr = br0 * (1 + 0.3 * fbm(std::cos(ang) * 2 + sd, std::sin(ang) * 2, sd, 3));
          if (dist >= rr) continue;
          double t = dist / rr, a = clamp((1 - t) * rr / 1.2, 0, 1) * (0.55 + 0.45 * t * t) * 0.85;
          size_t p = ((size_t)y * w + x) * 4; double a0 = out[p + 3] / 255.0, na = a + a0 * (1 - a);
          if (na <= 0) continue;
          for (int c = 0; c < 3; c++) out[p + c] = (uint8_t)clamp(jround((col[c] * a + out[p + c] * a0 * (1 - a)) / na), 0, 255);
          out[p + 3] = u8(jround(na * 255));
        }
      }
    }
    push(res, std::move(out), PB_MULTIPLY);
  }
  if (P.wPaperTexture > 0) {
    Plane Hf(n);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      double X = x + P.ox, Y = y + P.oy;
      Hf[(size_t)y * w + x] = (float)(fbm(X / k / 7, Y / k / 7, seed + 8, 3) * 0.7 + fbm(X / k / 1.8, Y / k / 1.8, seed + 9, 2) * 0.3);
    }
    push(res, litLayer(Hf, w, h, P.paperLight, P.wPaperTexture / 100 * 140 / std::max(0.6, k), false), PB_OVERLAY);
  }
  res.w = w; res.h = h; res.hasPaper = true; res.paper = paper;
  return true;
}

// ---------------------------------------------------------------- shared 1.1 helpers
static Plane labelEdges(const U8& L, int w, int h) {
  Plane E((size_t)w * h, 0.f);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; uint8_t a = L[i];
    if ((x + 1 < w && L[i + 1] != a) || (y + 1 < h && L[i + w] != a)) { E[i] = 1; if (x + 1 < w) E[i + 1] = 1; if (y + 1 < h) E[i + w] = 1; }
  }
  return E;
}
static inline double lineGain(double r) { return (2 * std::max(1.0, jround(r)) + 1) / 3; }
static void dot(U8& out, int w, int h, double cx, double cy, double r, const double* col, double alpha) {
  double R1 = r + 1;
  int ya = (int)std::max(0.0, std::floor(cy - R1)), yb = (int)std::min((double)h - 1, std::ceil(cy + R1));
  int xa = (int)std::max(0.0, std::floor(cx - R1)), xb = (int)std::min((double)w - 1, std::ceil(cx + R1));
  for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) {
    double d = jsHypot2(x + 0.5 - cx, y + 0.5 - cy);
    double a = clamp(r + 0.5 - d, 0, 1) * alpha;
    if (a <= 0.003) continue;
    size_t p = ((size_t)y * w + x) * 4; double a0 = out[p + 3] / 255.0, na = a + a0 * (1 - a);
    for (int c = 0; c < 3; c++) out[p + c] = (uint8_t)clamp(jround((col[c] * a + out[p + c] * a0 * (1 - a)) / na), 0, 255);
    out[p + 3] = u8(jround(na * 255));
  }
}

// ---------------------------------------------------------------- Alcohol Ink
static bool paintInk(const Image& src, const Params& P, Result& res, ProgressFn pf, void* pctx) {
  Setup S = setup(src, P); const int w = S.w, h = S.h; const size_t n = S.n; const double k = S.k, seed = S.seed, rad0 = S.rad0, simp = S.simp;
  Plane &R = S.R, &G = S.G, &B = S.B;
  adjustColour(R, G, B, n, 25, 0);
  P3 A = abstraction(R, G, B, w, h, rad0 * 1.0 * simp); Plane &aR = A.R, &aG = A.G, &aB = A.B;
  { double sb = std::max(1.0, rad0 * 0.5 * simp); boxBlur(aR, w, h, sb, 2); boxBlur(aG, w, h, sb, 2); boxBlur(aB, w, h, sb, 2); }
  if (!tick(pf, pctx, 1, 5)) return false;
  double count = P.cPalette > 1 ? P.cPalette : 7;
  Rng pr(seed * 977); auto pal = palette(aR, aG, aB, n, count, pr);
  U8 lab(n);
  for (size_t i = 0; i < n; i++) lab[i] = (uint8_t)nearest(pal, aR[i], aG[i], aB[i]);
  const double flow = P.iFlow / 100, outside = P.fOutside / 100;
  const double D = rad0 * (0.3 + 1.2 * flow), sc = std::max(6.0, P.bSize * 12);
  U8 L(n); Plane cR(n), cG(n), cB(n);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; double ux = x / k / sc, uy = y / k / sc;
    const double fc = 1; double d = D * (1 + (1 - fc) * (1 - outside) * 1.5);
    double wx = fbm(ux, uy, seed + 21, 3), wy = fbm(ux + 7.1, uy - 3.3, seed + 22, 3);
    int sx = (int)clamp(jround(x + d * (wx + 0.35 * fbm(ux * 3 + wx, uy * 3 + wy, seed + 23, 2))), 0, w - 1);
    int sy = (int)clamp(jround(y + d * (wy + 0.35 * fbm(ux * 3 - wy, uy * 3 + wx, seed + 24, 2))), 0, h - 1);
    size_t j = (size_t)sy * w + sx; const C3& c = pal[lab[j]];
    L[i] = lab[j];
    cR[i] = (float)(c[0] * 0.78 + aR[j] * 0.22); cG[i] = (float)(c[1] * 0.78 + aG[j] * 0.22); cB[i] = (float)(c[2] * 0.78 + aB[j] * 0.22);
  }
  { double br = std::max(1.0, (0.2 + P.iBlend / 100 * 0.5) * rad0); boxBlur(cR, w, h, br, 2); boxBlur(cG, w, h, br, 2); boxBlur(cB, w, h, br, 2); }
  Plane E = labelEdges(L, w, h), Eb = blur(E, w, h, std::max(1.0, rad0 * 0.45), 2);
  if (!tick(pf, pctx, 2, 5)) return false;
  {
    U8 sheen(n * 4);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t p = ((size_t)y * w + x) * 4; double v = 250 + 4 * (0.5 + 0.5 * fbm(x / k / 900, y / k / 900, seed + 25, 2));
      sheen[p] = u8(v); sheen[p + 1] = u8(v); sheen[p + 2] = u8(clamp(v + 1, 0, 255)); sheen[p + 3] = 255;
    }
    push(res, std::move(sheen), PB_NORMAL);
  }
  {
    U8 pools(n * 4);
    for (size_t i = 0, p = 0; i < n; i++, p += 4) {
      double mid = 1 - clamp(Eb[i] * 2.2, 0, 1), lift = 0.2 * mid * (0.6 + 0.4 * (0.5 + 0.5 * fbm((double)(i % w) / k / 110, (double)(i / w) / k / 110, seed + 26, 3)));
      pools[p] = u8(clamp(cR[i] + (255 - cR[i]) * lift, 0, 255)); pools[p + 1] = u8(clamp(cG[i] + (255 - cG[i]) * lift, 0, 255)); pools[p + 2] = u8(clamp(cB[i] + (255 - cB[i]) * lift, 0, 255));
      pools[p + 3] = u8(jround(255 * (0.86 + 0.14 * (1 - mid))));
    }
    push(res, std::move(pools), PB_NORMAL);
  }
  bool hasCells = false; U8 cellsOut; Plane ring(n, 0.f);
  if (P.iCells > 0) {
    hasCells = true; cellsOut.assign(n * 4, 0);
    Rng rnd(seed * 6007); double c = P.iCells / 100;
    double cs = std::max(2.5, rad0 * 1.1);
    int cnt = (int)std::min(250.0, jround(c * n / (cs * cs) * 0.03));
    for (int s = 0; s < cnt; s++) {
      double cx = rnd() * w; double cy = rnd() * h; double r = cs * (0.35 + rnd() * 1.1), sd = seed * 17 + s;
      size_t j = (size_t)iclamp((int)std::floor(cy), 0, h - 1) * w + iclamp((int)std::floor(cx), 0, w - 1);
      double col[3] = { cR[j] + (255 - cR[j]) * 0.5, cG[j] + (255 - cG[j]) * 0.5, cB[j] + (255 - cB[j]) * 0.5 };
      double R1 = r * 1.5 + 1, rimW = std::max(0.9, 1.1 * k) / r;
      int ya = (int)std::max(0.0, std::floor(cy - R1)), yb = (int)std::min((double)h - 1, std::ceil(cy + R1));
      int xa = (int)std::max(0.0, std::floor(cx - R1)), xb = (int)std::min((double)w - 1, std::ceil(cx + R1));
      for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) {
        double dx = x - cx, dy = y - cy, ang = std::atan2(dy, dx);
        double rr = r * (1 + 0.38 * fbm(std::cos(ang) * 1.3 + sd, std::sin(ang) * 1.3, sd, 3));
        double t = jsHypot2(dx, dy) / rr; size_t i = (size_t)y * w + x;
        if (t >= 1 + 3 * rimW) continue;
        ring[i] = (float)std::max((double)ring[i], std::exp(-((t - 1) * (t - 1)) / (rimW * rimW)) * (0.5 + 0.5 * c));
        if (t >= 1) continue;
        double a = clamp(0.75 * (1 - t * t * t * t), 0, 1) * (0.45 + 0.4 * c); size_t p = i * 4;
        if (a * 255 <= cellsOut[p + 3]) continue;
        cellsOut[p] = u8(col[0]); cellsOut[p + 1] = u8(col[1]); cellsOut[p + 2] = u8(col[2]); cellsOut[p + 3] = u8(jround(a * 255));
      }
    }
  }
  if (!tick(pf, pctx, 3, 5)) return false;
  if (P.iRim > 0) {
    double rw = std::max(1.0, (1.2 + P.iRim / 100 * 3) * k * 2), rg = 2.4 * lineGain(rw); Plane Rb = blur(E, w, h, rw, 2);
    U8 out(n * 4, 0); double g = P.iRim / 100;
    for (size_t i = 0, p = 0; i < n; i++, p += 4) {
      double vary = 0.45 + 0.55 * (0.5 + 0.5 * fbm((double)(i % w) / k / 120, (double)(i / w) / k / 120, seed + 29, 2));
      double a = std::max(clamp(Rb[i] * rg, 0, 1) * vary, ring[i] * 0.8) * g;
      if (a <= 0) continue;
      out[p] = u8((double)cR[i] * cR[i] / 255 * 0.75); out[p + 1] = u8((double)cG[i] * cG[i] / 255 * 0.75); out[p + 2] = u8((double)cB[i] * cB[i] / 255 * 0.75); out[p + 3] = u8(jround(a * 255));
    }
    push(res, std::move(out), PB_MULTIPLY);
  }
  if (hasCells) push(res, std::move(cellsOut), PB_SCREEN);
  if (P.iVeins > 0) {
    double metal[3] = { 214, 172, 62 };
    if (P.iMetal == "silver") { metal[0] = 206; metal[1] = 208; metal[2] = 214; } else if (P.iMetal == "copper") { metal[0] = 190; metal[1] = 112; metal[2] = 58; }
    double v = P.iVeins / 100;
    double lw = std::max(0.8, (2.4 + 3.6 * v) * k * 1.6), vg = 1.6 * lineGain(lw); Plane Vb = blur(E, w, h, lw, 2);
    U8 out(n * 4, 0);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x, p = i * 4;
      double pick = smooth(0.78 - 0.32 * v, 0.88 - 0.32 * v, 0.5 + 0.5 * fbm(x / k / 260, y / k / 260, seed + 27, 2));
      double a = clamp(Vb[i] * vg, 0, 1) * pick;
      if (a <= 0.01) continue;
      double sp = 0.72 + 0.5 * (0.5 + 0.5 * vnoise(x / k / 2.5, y / k / 2.5, seed + 28));
      out[p] = u8(clamp(metal[0] * sp, 0, 255)); out[p + 1] = u8(clamp(metal[1] * sp, 0, 255)); out[p + 2] = u8(clamp(metal[2] * sp, 0, 255)); out[p + 3] = u8(jround(a * 255));
    }
    push(res, std::move(out), PB_NORMAL);
  }
  res.w = w; res.h = h;
  return true;
}

// ---------------------------------------------------------------- Spray Paint walls
static inline double u01(double x, double y, double s) { return 0.5 + 0.5 * hashNoise(x, y, s); }
struct Cell { double cx, cy, e; };
static Cell brickCell(double ux, double uy, double BW, double BH, double MT, const std::string& pattern) {
  double cx, cy, fx, fy, cw, ch;
  if (pattern == "basket") {
    double Sz = BW, bx = std::floor(ux / Sz), by = std::floor(uy / Sz), lx = ux - bx * Sz, ly = uy - by * Sz;
    if (((int64_t)bx + (int64_t)by) & 1) { double sub = ly < Sz / 2 ? 0 : 1; fx = lx; fy = ly - sub * Sz / 2; cw = Sz; ch = Sz / 2; cx = bx * 2 + sub; cy = by; }
    else { double sub = lx < Sz / 2 ? 0 : 1; fx = lx - sub * Sz / 2; fy = ly; cw = Sz / 2; ch = Sz; cx = bx * 2 + sub; cy = by + 7777; }
  } else {
    double row = std::floor(uy / BH);
    fy = uy - row * BH; ch = BH; cy = row;
    int64_t odd = ((int64_t)row) & 1;
    if (pattern == "flemish") {
      double Pp = BW * 1.5, px = ux + odd * BW * 0.75, per = std::floor(px / Pp), q = px - per * Pp;
      if (q < BW) { cx = per * 2; fx = q; cw = BW; } else { cx = per * 2 + 1; fx = q - BW; cw = BW / 2; }
    } else {
      double px = ux + (pattern == "stack" ? 0 : odd * BW / 2);
      cx = std::floor(px / BW); fx = px - cx * BW; cw = BW;
    }
  }
  const double rc = 3, dx = std::min(fx, cw - fx) - MT / 2, dy = std::min(fy, ch - fy) - MT / 2;
  double e = (dx < rc && dy < rc && dx > 0 && dy > 0) ? rc - jsHypot2(rc - dx, rc - dy) : std::min(dx, dy);
  return { cx, cy, e };
}
static Plane reliefShade(const Plane& rel, int w, int h, double k) {
  int d = (int)std::max(1.0, jround(1.6 * k)); Plane out((size_t)w * h);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; int x2 = std::min(w - 1, x + d), y2 = std::min(h - 1, y + d);
    out[i] = (float)clamp(0.45 * rel[i] + 0.9 * ((double)rel[i] - rel[(size_t)y2 * w + x2]), -1, 1);
  }
  return out;
}
struct Wall { U8 rgba; Plane shade; };
static Wall wallLayer(int w, int h, double k, const Params& Q, double seed) {
  size_t n = (size_t)w * h; U8 out(n * 4); RGB base = hexC(Q.sWallColour, "#A8A49C"); Plane rel(n);
  RGB mortarC = hexC(Q.sMortarColour.empty() ? std::string("#CFC8BA") : Q.sMortarColour, "#CFC8BA");
  const std::string& type = Q.sWall; const double fineAmp = clamp((k - 0.08) / 0.5, 0.25, 1);
  const double grime = Q.sGrime / 100, cr = type == "metal" ? 0 : Q.sCracks / 100;
  const double hu = h / k;
  const bool isBrick = type == "brick"; const double bs = (Q.sBrickSize ? Q.sBrickSize : 100) / 100;
  const double BH = isBrick ? 75 * bs : 190, BW = isBrick ? 230 * bs : 390, MT = isBrick ? 2 + Q.sMortar / 100 * 16 : 11;
  const std::string pattern = isBrick ? (Q.sBrickPattern.empty() ? std::string("running") : Q.sBrickPattern) : std::string("running");
  const double bv = Q.sBrickVariation / 100;
  const bool vertical = Q.sWoodDir != "horizontal"; const double PW = 150 * (Q.sPlankWidth ? Q.sPlankWidth : 100) / 100, GAP = vertical ? 6 : 3;
  const double grainS = Q.sGrain / 100, knotS = Q.sKnots / 100; const std::string finish = Q.sWoodFinish.empty() ? std::string("raw") : Q.sWoodFinish;
  const double bareWood[3] = { 138, 106, 72 };
  const double crackW = std::max(1.3, 0.45 / k);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double ux = (x + Q.ox) / k, uy = (y + Q.oy) / k; size_t i = (size_t)y * w + x, p = i * 4;
    double c0 = base.r, c1 = base.g, c2 = base.b, v = 1, r = 0, warm = 0, grey = 0;
    if (type == "concrete") {
      double pxI = std::floor(ux / 1200), pyI = std::floor(uy / 600), lx = ux - pxI * 1200, ly = uy - pyI * 600;
      v = 0.92 + 0.08 * fbm(ux / 90, uy / 90, seed + 31, 3) + 0.04 * hashNoise(pxI, pyI, seed + 52);
      r = 0.4 * fineAmp * fbm(ux / 6, uy / 6, seed + 32, 2) + 0.2 * fbm(ux / 40, uy / 40, seed + 39, 2);
      double seam = std::min(std::min(lx, 1200 - lx), std::min(ly, 600 - ly));
      if (seam < 1.5) { r -= 0.45; v *= 0.93; }
      double tx = lx - 150 - 300 * jround((lx - 150) / 300), ty = ly - 150 - 300 * jround((ly - 150) / 300), td = jsHypot2(tx, ty);
      if (td < 9) { r = -0.95; v *= 0.62; } else if (td < 13) { r += 0.25; v *= 1.04; }
      double ax = std::floor(ux / 2.5), ay = std::floor(uy / 2.5), ah = hashNoise(ax, ay, seed + 53);
      if (ah > 0.86) v *= 1 + 0.12 * fineAmp * (hashNoise(ax, ay, seed + 54) > 0 ? 1 : -1);
      double cx = std::floor(ux / 4), cy = std::floor(uy / 4);
      if (hashNoise(cx, cy, seed + 33) > 0.94 && jsHypot2(ux - cx * 4 - 2, uy - cy * 4 - 2) < 1.1 + 0.7 * hashNoise(cx, cy, seed + 50)) { r = -0.9; v *= 0.85; }
    } else if (type == "stucco") {
      double b = fbm(ux / 9, uy / 9, seed + 40, 4), bump = jsSign(b) * std::pow(std::fabs(b), 0.6);
      r = fineAmp * (0.85 * bump + 0.3 * fbm(ux / 2.6, uy / 2.6, seed + 41, 2));
      v = 0.97 + 0.06 * fbm(ux / 160, uy / 160, seed + 42, 2) + 0.02 * bump * fineAmp;
    } else if (type == "brick" || type == "block") {
      Cell Bc = brickCell(ux, uy, BW, BH, MT, pattern);
      double e = Bc.e;
      double chip = std::max(0.0, fbm(ux / 5, uy / 5, seed + 60, 3) - 0.12) * 16 * (0.3 + 0.7 * u01(Bc.cx, Bc.cy, seed + 63));
      if (e > 0) e -= chip;
      if (e < 0) {
        c0 = mortarC.r; c1 = mortarC.g; c2 = mortarC.b;
        double sand = fbm(ux / 2.2, uy / 2.2, seed + 34, 2);
        r = -0.8 + 0.25 * sand * fineAmp; v = 0.88 + 0.1 * sand * fineAmp;
      } else {
        double h1 = hashNoise(Bc.cx, Bc.cy, seed + 35), h2 = hashNoise(Bc.cx, Bc.cy, seed + 36), h3 = u01(Bc.cx, Bc.cy, seed + 37);
        v = 1 + (isBrick ? 0.34 : 0.12) * bv * h1;
        warm = (isBrick ? 0.12 : 0.03) * bv * h2;
        if (isBrick && h3 > 0.93 - 0.06 * bv) { c0 = c0 * 0.5 + 34; c1 = c1 * 0.45 + 18; c2 = c2 * 0.45 + 14; warm -= 0.03; }
        v *= 1 + 0.08 * fbm(ux / 22 + Bc.cx * 3.1, uy / 22, seed + 61, 3) + 0.05 * fineAmp * fbm(ux / 2, uy / 2, seed + 62, 1)
          + 0.07 * fineAmp * hashNoise(std::floor(ux / 1.6), std::floor(uy / 1.6), seed + 65);
        v *= 0.92 + 0.08 * smooth(0, 14, e);
        r = -0.55 + 0.75 * smooth(0, 4, e) + (isBrick ? 0.22 * fbm(ux / 10, uy / 10, seed + 64, 3) : 0.3 * fineAmp * fbm(ux / 3, uy / 3, seed + 43, 2));
        double pc = isBrick ? 6 : 5, cx = std::floor(ux / pc), cy = std::floor(uy / pc);
        if (hashNoise(cx, cy, seed + 44) > (isBrick ? 0.975 : 0.86) && jsHypot2(ux - cx * pc - pc / 2 + 1.5 * hashNoise(cx, cy, seed + 66), uy - cy * pc - pc / 2) < (isBrick ? 0.6 + 1.2 * u01(cx, cy, seed + 51) : 1.1 + 0.8 * u01(cx, cy, seed + 51))) { r -= 0.8; v *= 0.82; }
      }
    } else if (type == "metal") {
      double ph = uy / 34 * PI * 2;
      r = 0.9 * std::sin(ph);
      v = 0.92 + 0.12 * std::sin(ph - 0.9) + 0.06 * fbm(ux / 3, uy / 160, seed + 46, 2);
      double rust = smooth(0.35, 0.75, 0.5 + 0.5 * fbm(ux / 70, uy / 70, seed + 47, 3));
      v *= 1 - 0.18 * rust; warm += 0.12 * rust;
    } else if (type == "wood") {
      double across = vertical ? ux : uy, along = vertical ? uy : ux;
      double pl = std::floor(across / PW), fa = across - pl * PW;
      double id = pl, ej = 1e9, al = along;
      if (!vertical) {
        double Ll = 900 + 700 * u01(pl, 1, seed + 71), off = Ll * u01(pl, 2, seed + 72), seg = std::floor((along + off) / Ll), fl = along + off - seg * Ll;
        ej = std::min(fl, Ll - fl) - 1.5; id = pl * 977 + seg; al = fl;
      }
      double e = std::min(std::min(fa - GAP / 2, PW - fa - GAP / 2), ej);
      double disp = 0, knot = 0;
      if (knotS > 0) {
        double kc0 = std::floor(along / 600);
        for (double kc = kc0 - 1; kc <= kc0 + 1; kc++) {
          if (u01(id, kc, seed + 73) > knotS * 0.85) continue;
          double ka = kc * 600 + 300 + 220 * hashNoise(id, kc, seed + 74), kf = PW * (0.25 + 0.5 * u01(id, kc, seed + 75));
          double Rk = 10 + 16 * u01(id, kc, seed + 76), d = jsHypot2((fa - kf) / Rk, (along - ka) / (Rk * 1.7));
          double sgn = fa - kf; if (sgn == 0 || sgn != sgn) sgn = 1;
          disp += 3 * Rk * std::exp(-d * d * 0.35) * jsSign(sgn);
          if (d < 1.2) knot = std::max(knot, 1 - smooth(0.6, 1.2, d));
        }
      }
      double t = fa + disp + 24 * fbm(al / 380 + id * 1.37, fa / 70, seed + 70, 3);
      double ringW = 6 + 6 * u01(id, 5, seed + 77);
      double line = 0.75 * std::pow(0.5 + 0.5 * std::sin(t / ringW * PI * 2), 4) + 0.25 * std::pow(0.5 + 0.5 * std::sin(t / (ringW * 0.37) * PI * 2 + 1.3), 3);
      double fibre = fineAmp * fbm(fa / 1.1, al / 40, seed + 78, 2);
      double tone = 0.86 + 0.22 * u01(id, 9, seed + 79);
      if (e < 0) { r = -1; v = 0.35; }
      else {
        double bevel = vertical ? smooth(0, 3, e) : 1;
        double lap = vertical ? 0 : 0.55 - 1.1 * fa / PW;
        if (finish == "painted") {
          double pt = 0.66 - 0.2 * grime, peel = smooth(pt, pt + 0.035, 0.5 + 0.5 * fbm(ux / 45, uy / 45, seed + 80, 4));
          double grainR = 0.25 * grainS * (line - 0.3);
          r = -0.4 + 0.6 * bevel + lap + grainR - 0.35 * peel;
          v = 0.97 + 0.03 * fibre;
          if (peel > 0) {
            double wood[3] = { bareWood[0] * tone, bareWood[1] * tone, bareWood[2] * tone }, gl = 1 - 0.3 * grainS * line;
            c0 = c0 + (wood[0] * gl - c0) * peel; c1 = c1 + (wood[1] * gl - c1) * peel; c2 = c2 + (wood[2] * gl - c2) * peel;
            if (peel > 0.02 && peel < 0.6) v *= 0.85;
          }
        } else {
          bool wth = finish == "weathered";
          v = tone * (1 - 0.42 * grainS * line) * (1 + (wth ? 0.12 : 0.08) * fibre);
          warm = wth ? -0.02 : 0.05 * line * grainS;
          grey = wth ? 0.7 : 0;
          r = -0.4 + 0.6 * bevel + lap + (wth ? 0.6 : 0.2) * grainS * (line - 0.3) + (wth ? 0.3 : 0.1) * fibre;
          if (wth) {
            double ck = std::fabs(fbm(fa / 3 + id * 3.3, al / 320, seed + 81, 2));
            double zone = smooth(0.15, 0.45, fbm(fa / 40 + id, al / 500, seed + 82, 2));
            if (zone > 0 && ck < 0.025 * (0.4 + cr) * fineAmp) { r = std::min(r, -0.5 * fineAmp * zone); v *= 1 - 0.35 * fineAmp * zone; }
          }
          if (knot > 0) { v *= 1 - 0.6 * knot * (0.75 + 0.25 * std::sin(knot * 18)); warm += 0.06 * knot; r -= 0.35 * knot; }
        }
        double nA0 = 0.14 * hu, nA1 = 0.86 * hu;
        double nxs[2] = { vertical ? PW * 0.3 : PW * 0.22, PW * 0.7 }; int nnx = vertical ? 2 : 1;
        for (int a = 0; a < nnx; a++) {
          double dfa = fa - nxs[a];
          if (std::fabs(dfa) > 3.2) continue;
          double dal = vertical ? std::min(std::fabs(along - nA0), std::fabs(along - nA1)) : std::fabs(along - 400 * jround(along / 400));
          if (jsHypot2(dfa, dal) < 2.4) { c0 = 70; c1 = 66; c2 = 62; v = 0.9; r = 0.6; grey = 0; warm = 0; }
        }
      }
    } else {
      v = 1 + 0.025 * fbm(ux / 120, uy / 120, seed + 37, 2);
      r = 0.15 * fineAmp * fbm(ux / 4, uy / 4, seed + 38, 2);
    }
    if (cr > 0 && type != "wood") {
      double reg = smooth(1 - cr, 1.18 - cr, 0.5 + 0.5 * fbm(ux / 500, uy / 500, seed + 93, 2));
      if (reg > 0) {
        double wx = ux + 40 * fbm(ux / 200, uy / 200, seed + 90, 2), wy = uy + 40 * fbm(ux / 200, uy / 200, seed + 91, 2);
        double d1 = std::fabs(fbm(wx / 260, wy / 260, seed + 92, 5)) * 260 * 0.9;
        double d2 = std::fabs(fbm(wx / 110, wy / 110, seed + 94, 2)) * 110 * 0.9 * 1.6;
        double ca = std::max(smooth(crackW, crackW * 0.3, d1), 0.75 * smooth(crackW * 0.8, crackW * 0.2, d2) * smooth(30, 6, d1)) * reg;
        if (ca > 0) { r = r + (-0.95 - r) * ca; v *= 1 - 0.5 * ca; }
      }
    }
    if (grime > 0) {
      double s = 0.5 + 0.5 * fbm(ux / 35, uy / 520, seed + 84, 2);
      double streak = smooth(0.55, 0.85, s) * smooth(0, 0.35, (double)y / h + 0.1);
      double ground = smooth(0.62, 1, (double)y / h) * (0.7 + 0.3 * fbm(ux / 25, uy / 25, seed + 85, 2));
      double patch = smooth(0.25, 0.85, 0.5 + 0.5 * fbm(ux / 260, uy / 260, seed + 86, 2));
      double dirt = grime * (0.3 * streak + 0.3 * ground + 0.12 * patch);
      v *= 1 - dirt; grey += 0.5 * dirt; warm += 0.08 * dirt;
      if ((type == "brick" || type == "block" || type == "concrete") && grime > 0.3) {
        double bloom = smooth(0.7, 0.95, 0.5 + 0.5 * fbm(ux / 70, uy / 70, seed + 87, 3)) * (grime - 0.3) * 0.5;
        c0 += (235 - c0) * bloom; c1 += (232 - c1) * bloom; c2 += (225 - c2) * bloom;
      }
    }
    if (grey > 0) { double g = std::min(1.0, grey), l = lum(c0, c1, c2) * 1.02; c0 += (l - c0) * g; c1 += (l - c1) * g; c2 += (l - c2) * g; }
    rel[i] = (float)clamp(r, -1, 1);
    out[p] = u8(clamp(c0 * v * (1 + warm), 0, 255)); out[p + 1] = u8(clamp(c1 * v, 0, 255)); out[p + 2] = u8(clamp(c2 * v * (1 - warm), 0, 255)); out[p + 3] = 255;
  }
  Plane shade = reliefShade(rel, w, h, k);
  for (size_t i = 0, p = 0; i < n; i++, p += 4) {
    double f = 1 + 0.22 * shade[i];
    out[p] = u8(clamp(out[p] * f, 0, 255)); out[p + 1] = u8(clamp(out[p + 1] * f, 0, 255)); out[p + 2] = u8(clamp(out[p + 2] * f, 0, 255));
  }
  return { std::move(out), std::move(shade) };
}

// ---------------------------------------------------------------- Spray Paint
static bool paintSpray(const Image& src, const Params& P, Result& res, ProgressFn pf, void* pctx) {
  Setup S = setup(src, P); const int w = S.w, h = S.h; const size_t n = S.n; const double k = S.k, seed = S.seed, rad0 = S.rad0, simp = S.simp;
  const Plane &R = S.R, &G = S.G, &B = S.B;
  Wall wall = wallLayer(w, h, k, P, seed);
  push(res, std::move(wall.rgba), PB_NORMAL);
  if (!tick(pf, pctx, 1, 6)) return false;
  P3 A = abstraction(R, G, B, w, h, rad0 * 0.45 * simp); const Plane &aR = A.R, &aG = A.G, &aB = A.B;
  const double bare = P.sBare;
  {
    double br = std::max(2.0, rad0 * 5); Plane fR = blur(aR, w, h, br), fG = blur(aG, w, h, br), fB = blur(aB, w, h, br); U8 Aa(n);
    double keep = 1 - bare / 100;
    for (size_t i = 0; i < n; i++) Aa[i] = u8(jround(keep * (110 + 40 * (0.5 + 0.5 * fbm((double)(i % w) / k / 300, (double)(i / w) / k / 300, seed + 38, 2)))));
    push(res, toRGBA(fR, fG, fB, &Aa, n), PB_NORMAL);
  }
  const int cans = (int)clamp(jround(P.sCans), 3, 8);
  Rng pr(seed * 977); auto pal = palette(aR, aG, aB, n, cans, pr);
  std::stable_sort(pal.begin(), pal.end(), [](const C3& a, const C3& b) { return lum(b[0], b[1], b[2]) - lum(a[0], a[1], a[2]) < 0; });
  U8 lab(n);
  for (size_t i = 0; i < n; i++) lab[i] = (uint8_t)nearest(pal, aR[i], aG[i], aB[i]);
  const double outside = P.fOutside / 100, os = P.sOverspray / 100, sft = P.sSoft / 100;
  const double hr = std::max(1.0, (0.15 + os * 0.9) * rad0);
  const double er = std::max(1.0, 0.7 * k + sft * sft * rad0 * 1.6);
  const double DS = 1.5;
  Plane dotG(n);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) dotG[(size_t)y * w + x] = (float)(0.5 + 0.5 * hashNoise(std::floor(x / k / DS), std::floor(y / k / DS), seed * 5 + 3));
  for (int c = 0; c < cans; c++) {
    if (!tick(pf, pctx, 2, 6)) return false;
    Plane m(n);
    for (size_t i = 0; i < n; i++) m[i] = lab[i] >= c ? 1.f : 0.f;
    Plane core = blur(m, w, h, er, sft > 0.05 ? 2 : 1); boxBlur(m, w, h, hr, 3); const Plane& halo = m;
    U8 out(n * 4, 0); const C3 col = pal[c]; const bool lightest = c == 0;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x, p = i * 4; const double fc = 1; double t = core[i];
      double crisp = clamp(t * 1.6 - 0.3, 0, 1);
      double stip = std::pow(t, 1.3) > dotG[(i + (size_t)c * 7919) % n] ? 1 : 0;
      double fuzzy = 0.45 * smooth(0, 1, t) + 0.55 * stip * smooth(0, 0.35, t);
      double a = crisp * (1 - sft) + fuzzy * sft;
      double grain = dotG[(i + (size_t)c * 104729) % n];
      double hg = halo[i] * (1 + (1 - fc) * (1 - outside)) * 0.55 * grain;
      a = std::max(a, clamp(hg, 0, 0.6));
      if (lightest) a *= 0.8 * (1 - bare / 100);
      if (a <= 0.004) continue;
      out[p] = u8(col[0]); out[p + 1] = u8(col[1]); out[p + 2] = u8(col[2]); out[p + 3] = u8(jround(clamp(a, 0, 0.97) * 255));
    }
    push(res, std::move(out), PB_NORMAL);
  }
  const int half = cans / 2;
  if (P.sHalftone > 0) {
    double ht = P.sHalftone / 100; Plane D(n, 0.f), CR(n, 0.f), CG(n, 0.f), CB(n, 0.f);
    for (size_t i = 0; i < n; i++) if (lab[i] >= half) { const C3& c = pal[lab[i]]; D[i] = 1; CR[i] = (float)c[0]; CG[i] = (float)c[1]; CB[i] = (float)c[2]; }
    double rh = std::max(2.0, (10 + 45 * ht) * k);
    Plane Df = blur(D, w, h, rh, 3); boxBlur(CR, w, h, rh, 3); boxBlur(CG, w, h, rh, 3); boxBlur(CB, w, h, rh, 3);
    U8 out(n * 4, 0); const double cs = 13, s2 = std::sqrt(0.5);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x, p = i * 4;
      if (D[i] || Df[i] < 0.02) continue;
      double ux = x / k, uy = y / k, u = (ux + uy) * s2 / cs, v = (ux - uy) * s2 / cs;
      double d = jsHypot2(u - jround(u), v - jround(v)) * cs;
      double r = std::sqrt(clamp(Df[i] * 1.8, 0, 1)) * cs * 0.55 * (0.4 + 0.6 * ht);
      double a = clamp((r - d) * k + 0.5, 0, 1);
      if (a <= 0.01) continue;
      double f = 1 / (double)Df[i];
      out[p] = u8(clamp(CR[i] * f, 0, 255)); out[p + 1] = u8(clamp(CG[i] * f, 0, 255)); out[p + 2] = u8(clamp(CB[i] * f, 0, 255)); out[p + 3] = u8(jround(a * 235));
    }
    push(res, std::move(out), PB_NORMAL);
  }
  Plane E = labelEdges(lab, w, h);
  if (!tick(pf, pctx, 3, 6)) return false;
  if (P.sSpeckle > 0) {
    U8 out(n * 4, 0); Rng rnd(seed * 811); double sp = P.sSpeckle / 100, area = n / std::max(0.01, k * k);
    Plane Eb = blur(E, w, h, std::max(1.0, hr), 2);
    int cnt = (int)std::min(40000.0, jround(sp * area * 0.0035 + sp * 80));
    for (int s = 0; s < cnt; s++) {
      double x = rnd() * w; double y = rnd() * h; size_t i = std::min(n - 1, (size_t)std::floor(y) * w + (size_t)std::floor(x));
      if (rnd() > 0.25 + 0.75 * clamp(Eb[i] * 3, 0, 1)) continue;
      double rr = std::max(0.4, (1 + rnd() * 2.5) * k * 1.3);
      dot(out, w, h, x, y, rr, pal[lab[i]].data(), 0.9);
    }
    int splats = (int)jround(sp * sp * 16 * area / 6e6);
    double sz = 0.6 + P.bSize / 80;
    for (int s = 0; s < splats; s++) {
      double x = rnd() * w; double y = rnd() * h; size_t i = std::min(n - 1, (size_t)std::floor(y) * w + (size_t)std::floor(x));
      const double* col = pal[std::max(half, (int)lab[i])].data(); double r = (8 + rnd() * 24) * k * sz;
      for (int b = 0; b < 5; b++) { double dx = x + (rnd() - 0.5) * r * 0.7; double dy = y + (rnd() - 0.5) * r * 0.7; double rb = r * (0.55 + rnd() * 0.35); dot(out, w, h, dx, dy, rb, col, 0.95); }
      int drops = 8 + (int)std::floor(rnd() * 10);
      for (int d = 0; d < drops; d++) {
        double ang = rnd() * PI * 2; double dist = r * (1.2 + rnd() * 2.2); double dr = std::max(0.5, r * (0.05 + rnd() * 0.16));
        double ex = x + std::cos(ang) * dist, ey = y + std::sin(ang) * dist;
        dot(out, w, h, ex, ey, dr, col, 0.95);
        if (rnd() < 0.4) for (double t = 0.2; t < 0.9; t += 0.15) dot(out, w, h, x + std::cos(ang) * dist * (1 - t * 0.35), y + std::sin(ang) * dist * (1 - t * 0.35), dr * (1 - t) * 0.8, col, 0.9);
      }
    }
    push(res, std::move(out), PB_NORMAL);
  }
  if (P.sDrips > 0) {
    U8 out(n * 4, 0); Rng rnd(seed * 1999); double dr = P.sDrips / 100;
    double cnt = jround(dr * 50 * std::sqrt(n / std::max(1.0, k * k)) / 400 + dr * 6);
    int made = 0;
    for (double tries = 0; tries < cnt * 600 && made < cnt; tries++) {
      int x = (int)std::floor(rnd() * w), y = (int)std::floor(rnd() * (h - 2));
      size_t i = (size_t)y * w + x; int c = lab[i];
      if (c < 1 || lab[i + w] >= c) continue;
      if (c < half && rnd() < 0.6) continue;
      made++;
      const double* col = pal[c].data(); double wd = std::max(0.7, (3.5 + rnd() * 4) * k * (0.6 + P.bSize / 80));
      double len = (P.sDripLength / 100) * (50 + rnd() * 300) * k;
      double sd = seed * 3 + made;
      for (double t = 0; t <= len; t += std::max(0.5, wd * 0.5)) {
        double xx = x + wd * 0.8 * vnoise(t / std::max(1.0, 30 * k), sd, sd), taper = 1 - 0.35 * (t / std::max(1.0, len));
        dot(out, w, h, xx, y + t, wd * taper, col, 0.95);
      }
      dot(out, w, h, x + wd * 0.8 * vnoise(len / std::max(1.0, 30 * k), sd, sd), y + len, wd * 1.35, col, 0.95);
    }
    push(res, std::move(out), PB_NORMAL);
  }
  int PB = PB_NORMAL;
  if (P.sBlend == "multiply") PB = PB_MULTIPLY; else if (P.sBlend == "linearburn") PB = PB_LINEARBURN; else if (P.sBlend == "overlay") PB = PB_OVERLAY;
  else if (P.sBlend == "softlight") PB = PB_SOFTLIGHT; else if (P.sBlend == "hardlight") PB = PB_HARDLIGHT;
  double pop = clamp(P.sPaintOpacity, 0, 100);
  if (PB != PB_NORMAL || pop < 100) {
    U8 out(n * 4, 0);
    for (size_t li = 1; li < res.layers.size(); li++) {
      const U8& s = res.layers[li].rgba;
      for (size_t p = 0; p < n * 4; p += 4) {
        double a = s[p + 3] / 255.0;
        if (a <= 0) continue;
        double a0 = out[p + 3] / 255.0, na = a + a0 * (1 - a);
        for (int c = 0; c < 3; c++) out[p + c] = u8(jround((s[p + c] * a + out[p + c] * a0 * (1 - a)) / na));
        out[p + 3] = u8(jround(na * 255));
      }
    }
    res.layers.resize(1);
    push(res, std::move(out), PB, jround(pop));
  }
  const double hl = P.sHighlight / 100;
  if (!tick(pf, pctx, 4, 6)) return false;
  if (P.sOutline > 0 || hl > 0) {
    Plane S2(n), L(n);
    for (size_t i = 0; i < n; i++) { const C3& a = pal[lab[i]]; L[i] = (float)lum(a[0], a[1], a[2]); }
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x; double la = L[i], d = 0;
      if (x + 1 < w) d = std::max(d, std::fabs(la - L[i + 1]));
      if (y + 1 < h) d = std::max(d, std::fabs(la - L[i + w]));
      S2[i] = d > 45 ? 1.f : 0.f;
    }
    double g = P.sOutline / 100;
    double lw = std::max(1.0, (2.4 + std::max(g, 0.3) * 6) * k * 1.4), og = 4 * (2 * std::max(1.0, jround(lw)) + 1) / 3; Plane Ob = blur(S2, w, h, lw, 2);
    Plane oa(n, 0.f);
    if (g > 0) {
      U8 out(n * 4, 0);
      for (size_t i = 0, p = 0; i < n; i++, p += 4) {
        double a = clamp(Ob[i] * og - 0.25, 0, 1) * (0.55 + 0.45 * g);
        oa[i] = (float)a;
        if (a <= 0.004) continue;
        out[p] = 18; out[p + 1] = 18; out[p + 2] = 20; out[p + 3] = u8(jround(a * 255));
      }
      push(res, std::move(out), PB_NORMAL);
    }
    if (hl > 0) {
      double hw = lw * (g > 0 ? 2.7 : 1.4); Plane Hb = blur(S2, w, h, hw, 2), Lb = blur(L, w, h, hw, 2);
      double hgain = 4 * (2 * std::max(1.0, jround(hw)) + 1) / 3;
      U8 out(n * 4, 0);
      for (size_t i = 0, p = 0; i < n; i++, p += 4) {
        if (L[i] < Lb[i] + 2.0) continue;
        double a = clamp(Hb[i] * hgain - 0.3, 0, 1) * (1 - oa[i]) * (0.35 + 0.6 * hl);
        if (a <= 0.01) continue;
        out[p] = 250; out[p + 1] = 248; out[p + 2] = 240; out[p + 3] = u8(jround(a * 255));
      }
      push(res, std::move(out), PB_NORMAL);
    }
  }
  const double rv = P.sRelief / 100;
  if (rv > 0) {
    U8 out(n * 4); const Plane& sh = wall.shade; uint8_t al = u8(jround(255 * clamp(rv * 0.9, 0, 1)));
    for (size_t i = 0, p = 0; i < n; i++, p += 4) {
      uint8_t v = u8(clamp(128 + 127 * sh[i], 0, 255));
      out[p] = v; out[p + 1] = v; out[p + 2] = v; out[p + 3] = al;
    }
    push(res, std::move(out), PB_OVERLAY);
  }
  res.w = w; res.h = h;
  return true;
}

// ---------------------------------------------------------------- Pastel
static bool paintPastel(const Image& src, const Params& P, Result& res, ProgressFn pf, void* pctx) {
  Setup S = setup(src, P); const int w = S.w, h = S.h; const size_t n = S.n; const double k = S.k, seed = S.seed, rad0 = S.rad0, simp = S.simp;
  const Plane &R = S.R, &G = S.G, &B = S.B;
  RGB pp = hexC(P.pPaper, "#8E8D88"); const double paper[3] = { pp.r, pp.g, pp.b };
  const bool oil = P.pOil; const double tooth = P.pTooth / 100 * (oil ? 0.3 : 1), press = P.pPressure / 100;
  Plane T(n);
  const double tz = std::max(2.5, 7 * k), tc = clamp(7 * k / 3, 0.35, 1);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double X = x + P.ox, Y = y + P.oy;
    T[(size_t)y * w + x] = (float)(0.5 + 0.5 * tc * (0.75 * fbm(X / tz, Y / tz * 0.55, seed + 41, 3) + 0.25 * vnoise(X / tz * 1.7, Y / tz * 1.7, seed + 42)));
  }
  {
    U8 out(n * 4);
    for (size_t i = 0, p = 0; i < n; i++, p += 4) { double v = 0.95 + 0.1 * T[i] * (0.3 + tooth); out[p] = u8(clamp(paper[0] * v, 0, 255)); out[p + 1] = u8(clamp(paper[1] * v, 0, 255)); out[p + 2] = u8(clamp(paper[2] * v, 0, 255)); out[p + 3] = 255; }
    push(res, std::move(out), PB_NORMAL);
  }
  if (!tick(pf, pctx, 1, 6)) return false;
  Rng rnd(seed * 977);
  std::vector<C3> palV; bool hasPal = P.cPalette > 1;
  if (hasPal) palV = palette(R, G, B, n, P.cPalette, rnd);
  const bool fixed = P.pHatch == "fixed";
  Flow fl;
  if (fixed) { double a = -P.pAngle * PI / 180; fl.TX.assign(n, (float)std::cos(a)); fl.TY.assign(n, (float)std::sin(a)); }
  else fl = flowField(R, G, B, w, h, k, seed);
  Ctx ctx; ctx.w = w; ctx.h = h; ctx.TX = &fl.TX; ctx.TY = &fl.TY; ctx.mark.assign(n, 0); ctx.cov.assign(n, 0.f); ctx.reveal = P.reveal;
  P3 Sm = abstraction(R, G, B, w, h, std::max(1.0, rad0 * 0.8 * simp));
  { double br = std::max(1.0, rad0 * 0.6); boxBlur(Sm.R, w, h, br, 2); boxBlur(Sm.G, w, h, br, 2); boxBlur(Sm.B, w, h, br, 2); }
  const double sa = P.pSmudge / 100 * 0.9;
  if (sa > 0) { U8 smA(n, u8(jround(sa * 255))); push(res, toRGBA(Sm.R, Sm.G, Sm.B, &smA, n), PB_NORMAL); }
  ctx.hasCanvas = true; for (int c = 0; c < 3; c++) ctx.cv[c].assign(n, 0.f);
  for (size_t i = 0; i < n; i++) { ctx.cv[0][i] = (float)(paper[0] + (Sm.R[i] - paper[0]) * sa); ctx.cv[1][i] = (float)(paper[1] + (Sm.G[i] - paper[1]) * sa); ctx.cv[2][i] = (float)(paper[2] + (Sm.B[i] - paper[2]) * sa); }
  Painter pt; pt.pal = hasPal ? &palV : nullptr; pt.R = &R; pt.G = &G; pt.B = &B; pt.w = w;
  StyleS style; style.bristles = 4; style.bristle = 0.05; style.rough = oil ? 0.12 : 0.3; style.dry = oil ? 0.05 : 0.25; style.load = 0.55 + 0.45 * press; style.thick = 0; style.cap = 0.5;
  auto breakUp = [&](Buf& buf, double amt) {
    double cut = 0.22 + (1 - press) * 0.4 + tooth * 0.18;
    for (size_t i = 0; i < n; i++) {
      double a = buf.PA[i]; if (a <= 0) continue;
      double m = 1 - amt * 0.65 * (1 - smooth(cut - 0.22, cut + 0.22, T[i]));
      buf.P0[i] = (float)(buf.P0[i] * m); buf.P1[i] = (float)(buf.P1[i] * m); buf.P2[i] = (float)(buf.P2[i] * m); buf.PA[i] = (float)(buf.PA[i] * m);
    }
  };
  const double fOut = P.fOutside / 100; const int passes = (int)clamp(jround(P.bDetail), 1, 4); const double follow = fixed ? 1 : P.bFollow / 100;
  const double radB = rad0 * (oil ? 0.55 : 0.42);
  Buf buf(n);
  for (int p = 0; p < passes; p++) {
    if (!tick(pf, pctx, 2 + p, passes + 4)) return false;
    double r = std::max(std::max(0.6, 3 * k), radB * std::pow(0.6, p));
    P3 ref = abstraction(R, G, B, w, h, std::max(1.0, r * 0.6 * simp));
    const Plane* rf[3] = { &ref.R, &ref.G, &ref.B };
    PassOpts o; o.seed = seed * 31 + p; o.radius = r; o.spacing = r * 1.1; o.fillAll = p == 0; o.thresh = 30 + 10 * p;
    o.minLen = std::max(2.0, jround(3 * P.bLength)); o.maxLen = std::max(3.0, jround(7 * P.bLength)); o.step = 0.7; o.follow = follow;
    o.jitter = P.bRandomness / 100 * (fixed ? 0.15 : 0.45); o.stopAfter = 2; o.stopDiff = 140; o.outsideSuppress = (1 - fOut) * 3; o.outsideGrow = (1 - fOut) * 0.7;
    o.colourFn = CF_PASTEL; o.style = style;
    strokePass(ctx, buf, rf, o, pt);
  }
  breakUp(buf, 1);
  U8 strokes = bufToRGBA(buf, n);
  overCanvas(ctx.cv, strokes, n);
  push(res, std::move(strokes), PB_NORMAL);
  {
    Buf hb(n); Plane L0(n);
    for (size_t i = 0; i < n; i++) L0[i] = (float)lum(R[i], G[i], B[i]);
    Plane hR(n), hG(n), hB(n);
    for (size_t i = 0; i < n; i++) { bool b = L0[i] > 185; hR[i] = b ? 255.f : ctx.cv[0][i]; hG[i] = b ? 255.f : ctx.cv[1][i]; hB[i] = b ? 255.f : ctx.cv[2][i]; }
    double r = std::max(std::max(0.6, 3 * k), radB * 0.5);
    const Plane* rf[3] = { &hR, &hG, &hB };
    PassOpts o; o.seed = seed * 53; o.radius = r; o.spacing = r * 1.6; o.fillAll = false; o.thresh = 60; o.minLen = 2; o.maxLen = std::max(3.0, jround(5 * P.bLength));
    o.step = 0.7; o.follow = follow; o.jitter = 0.2; o.stopAfter = 1; o.stopDiff = 255; o.outsideSuppress = (1 - fOut) * 3; o.outsideGrow = 0; o.colourFn = CF_PASTEL_HI; o.style = style;
    strokePass(ctx, hb, rf, o, pt);
    breakUp(hb, 1);
    push(res, bufToRGBA(hb, n), PB_NORMAL);
  }
  if (!oil) {
    U8 out(n * 4, 0); Rng r2(seed * 313);
    int cnt = (int)jround(std::min(n * 0.01, n / std::max(1.0, k * k) * 0.00012) * (0.3 + tooth) + 20);
    for (int s = 0; s < cnt; s++) {
      double x = r2() * w; double y = r2() * h; size_t i = std::min(n - 1, (size_t)std::floor(y) * w + (size_t)std::floor(x));
      double rr = std::max(0.5, (0.4 + r2() * 0.9) * k * 1.4);
      double col[3] = { ctx.cv[0][i], ctx.cv[1][i], ctx.cv[2][i] };
      dot(out, w, h, x, y, rr, col, 0.25);
    }
    push(res, std::move(out), PB_SCREEN);
  }
  res.w = w; res.h = h;
  return true;
}

// ---------------------------------------------------------------- render / composite
bool render(const Image& src, const Params& P, Result& res, ProgressFn pf, void* ctx) {
  res = Result(); res.w = src.w; res.h = src.h;
  bool ok;
  switch (P.style) {
    case ST_WATER: ok = paintWatercolour(src, P, res, pf, ctx); break;
    case ST_INK: ok = paintInk(src, P, res, pf, ctx); break;
    case ST_SPRAY: ok = paintSpray(src, P, res, pf, ctx); break;
    case ST_PASTEL: ok = paintPastel(src, P, res, pf, ctx); break;
    case ST_IMPRESS: ok = paintStrokes(src, P, res, false, pf, ctx); break;
    default: ok = paintStrokes(src, P, res, true, pf, ctx);
  }
  if (!ok) return false;
  // paint-on: layers above the base (wall, paper) arrive in soft patches; stroke styles also lay fewer strokes
  if (P.reveal < 1) {
    const int w = res.w, h = res.h; const double rv = clamp(P.reveal, 0, 1), sc = std::max(0.02, P.scale);
    std::vector<float> mask((size_t)w * h);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      double nz = 0.5 + 0.5 * fbm(x / sc / 180, y / sc / 180, 977, 3);
      mask[(size_t)y * w + x] = (float)clamp((rv * 1.3 - nz) / 0.3 + 0.0, 0, 1);
    }
    size_t first = (P.style == ST_INK || P.style == ST_SPRAY || P.style == ST_PASTEL) ? 1 : 0;
    for (size_t li = first; li < res.layers.size(); li++) {
      U8& s = res.layers[li].rgba;
      for (size_t i = 0; i < mask.size(); i++) s[i * 4 + 3] = (uint8_t)(s[i * 4 + 3] * mask[i]);
    }
  }
  return true;
}

static inline double blendOf(int b, double o, double v) {
  switch (b) {
    case PB_SCREEN: return 255 - (255 - o) * (255 - v) / 255;
    case PB_MULTIPLY: return o * v / 255;
    case PB_LIGHTEN: return v > o ? v : o;
    case PB_LINEARDODGE: return std::min(255.0, o + v);
    case PB_LINEARBURN: return std::max(0.0, o + v - 255);
    case PB_HARDLIGHT: return v < 128 ? 2 * o * v / 255 : 255 - 2 * (255 - o) * (255 - v) / 255;
    case PB_OVERLAY: return o < 128 ? 2 * o * v / 255 : 255 - 2 * (255 - o) * (255 - v) / 255;
    case PB_SOFTLIGHT: {
      double a = o / 255, b2 = v / 255;
      double d = a <= 0.25 ? ((16 * a - 12) * a + 4) * a : std::sqrt(a);
      return 255 * (b2 <= 0.5 ? a - (1 - 2 * b2) * a * (1 - a) : a + (2 * b2 - 1) * (d - a));
    }
    default: return v;
  }
}
void compositeWhite(const Result& r, std::vector<uint8_t>& out) {
  const size_t n = (size_t)r.w * r.h;
  out.assign(n * 3, 255);
  auto layer = [&](const uint8_t* s, int blend, double opacity) {
    for (size_t i = 0; i < n; i++) {
      double v0 = s[i * 4], v1 = s[i * 4 + 1], v2 = s[i * 4 + 2], a = s[i * 4 + 3] / 255.0 * (opacity / 100);
      if (a <= 0) continue;
      double o0 = out[i * 3], o1 = out[i * 3 + 1], o2 = out[i * 3 + 2];
      out[i * 3] = u8(jround(o0 + (blendOf(blend, o0, v0) - o0) * a));
      out[i * 3 + 1] = u8(jround(o1 + (blendOf(blend, o1, v1) - o1) * a));
      out[i * 3 + 2] = u8(jround(o2 + (blendOf(blend, o2, v2) - o2) * a));
    }
  };
  if (r.hasPaper) {
    for (size_t i = 0; i < n; i++) { out[i * 3] = u8(r.paper.r); out[i * 3 + 1] = u8(r.paper.g); out[i * 3 + 2] = u8(r.paper.b); }
  }
  for (auto& L : r.layers) layer(L.rgba.data(), L.blend, L.opacity);
}
bool renderOut(const Image& src, const Params& P, OutImage& out, ProgressFn pf, void* ctx) {
  Result r; if (!render(src, P, r, pf, ctx)) return false;
  std::vector<uint8_t> rgb; compositeWhite(r, rgb);
  const size_t n = (size_t)r.w * r.h;
  out.resize(r.w, r.h);
  for (size_t i = 0; i < n; i++) { float* p = &out.px[i * 4]; p[0] = rgb[i * 3]; p[1] = rgb[i * 3 + 1]; p[2] = rgb[i * 3 + 2]; p[3] = 255.f; }
  return true;
}

}
