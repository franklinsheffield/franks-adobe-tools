// Frank's CRT Phaser Brew for After Effects - engine. See crt_engine.h.
// Ported line by line from plugins/crt-phaser/js/engine.js (classic tube) and
// js/phase.js (Phase FX), merged-output path. Motion inputs are folded in at
// the points marked MOTION; at their defaults they change nothing.
#include "crt_engine.h"
#include <cmath>

using namespace brew;

namespace crt {

static const double PI = 3.14159265358979323846;
static inline double pmod(double a, double b) { double m = std::fmod(a, b); return m < 0 ? m + b : m; }
static inline int imod(int a, int b) { int m = a % b; return m < 0 ? m + b : m; }

// MOTION: vertical hold. Returns the source y to read and a darkening factor for the roll bar.
static inline double holdY(double py, int h, double roll, double& bar) {
  bar = 1;
  if (roll == 0) return py;
  double H = h - 1, y = pmod(py + roll * H, H);
  double edge = std::min(y, H - y) / (H * 0.035 + 1e-9);
  if (edge < 1) bar = 0.15 + 0.85 * edge;
  return y;
}
// MOTION: channel-change tearing. Horizontal offset (px) for this row.
static inline double tearX(double py, int w, double amt, double seed, double sc) {
  if (amt <= 0) return 0;
  double band = std::floor(py / std::max(2.0, 6 * sc));
  double n = hashNoise(band, 17, seed), n2 = hashNoise(band, 29, seed);
  if (n2 < 0.2) return 0;
  return n * amt * w * 0.08;
}

static bool tick(ProgressFn pf, void* ctx, int d, int t) { return pf ? pf(ctx, d, t) : true; }

static const double TINTS[4][3] = { {1, 1, 1}, {0.35, 1.08, 0.45}, {1.1, 0.72, 0.2}, {1, 1, 1.04} };

// ------------------------------------------------------------- classic tube
static bool renderClassic(const Image& S, const Params& P, OutImage& O, ProgressFn pf, void* ctx) {
  const int w = S.w, h = S.h; const size_t n = (size_t)w * h;
  const double sc = P.scale, fullH = P.fullH > 0 ? P.fullH : h;
  const double lines = std::max(60.0, std::min(2000.0, P.screenLines));
  const double lineH = std::max(1.0, fullH / lines) * sc;
  Plane VR(n), VG(n), VB(n);
  for (int y = 0; y < h; y++) {
    int ly = (int)std::floor(y / lineH), y0 = (int)std::floor(ly * lineH);
    int y1 = std::min(h, std::max(y0 + 1, (int)std::floor((ly + 1) * lineH)));
    for (int x = 0; x < w; x++) {
      double r = 0, g = 0, b = 0;
      for (int yy = y0; yy < y1; yy++) { size_t i = (size_t)yy * w + x; r += S.R[i]; g += S.G[i]; b += S.B[i]; }
      int k = y1 - y0; size_t i = (size_t)y * w + x; VR[i] = (float)(r / k); VG[i] = (float)(g / k); VB[i] = (float)(b / k);
    }
  }
  boxBlur(VR, w, h, 0.6 * sc, 1); boxBlur(VG, w, h, 0.6 * sc, 1); boxBlur(VB, w, h, 0.6 * sc, 1);
  if (!tick(pf, ctx, 1, 4)) return false;
  const double bloom = P.bloom / 100;
  Plane BR, BG, BB;
  if (bloom > 0) {
    auto t = [](const Plane& V) { Plane o(V.size()); for (size_t i = 0; i < V.size(); i++) o[i] = (float)(std::max(0.0, (double)V[i] - 150) * 1.6); return o; };
    BR = t(VR); BG = t(VG); BB = t(VB);
    boxBlur(BR, w, h, 10 * sc, 3); boxBlur(BG, w, h, 10 * sc, 3); boxBlur(BB, w, h, 10 * sc, 3);
  }
  if (!tick(pf, ctx, 2, 4)) return false;
  const double curv = P.curve / 100 * 0.25, cx = P.convX * sc, cy = P.convY * sc;
  const int maskType = P.maskType; const double ms = std::max(1.0, P.maskScale * sc), mStr = P.maskStrength / 100;
  const double sStr = P.scanStrength / 100, beam = clamp(P.scanWidth / 100, 0.1, 1);
  const double vig = P.vignette / 100, rad = P.corner / 100 * 0.12 * std::min(w, h);
  const double noise = (P.noise + P.snow) / 100 * 40, rollY = P.roll / 100, rollA = P.rollStrength / 100;
  const double bri = P.brightness / 100, con = P.contrast / 100;
  const double* tint = P.tint > 0 && P.tint < 4 ? TINTS[P.tint] : nullptr;
  const double scanVis = clamp((lineH - 1.2) / 1.6, 0, 1), maskVis = std::pow(clamp(P.maskScale * sc, 0, 1), 2);
  const double scanSh = P.scanShift * sc, maskSh = P.maskShiftX * sc;
  O.resize(w, h);
  float* out = O.px.data();
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x;
      double u = (double)x / (w - 1) * 2 - 1, v = (double)y / (h - 1) * 2 - 1, r2 = u * u + v * v;
      double su = u * (1 + curv * r2), sv = v * (1 + curv * r2);
      if (std::fabs(su) > 1 || std::fabs(sv) > 1) { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0; out[i * 4 + 3] = 255; continue; }
      double px = (su + 1) / 2 * (w - 1), py = (sv + 1) / 2 * (h - 1);
      double bar; double sy = holdY(py, h, P.holdRoll, bar);                 // MOTION
      double sx = px + tearX(py, w, P.glitch, P.glitchSeed, sc);              // MOTION
      double r = sample(VR, w, h, sx + cx, sy + cy), g = sample(VG, w, h, sx, sy), b = sample(VB, w, h, sx - cx, sy - cy);
      if (!BR.empty()) { r += sample(BR, w, h, sx, sy) * bloom; g += sample(BG, w, h, sx, sy) * bloom; b += sample(BB, w, h, sx, sy) * bloom; }
      if (tint) { double L = 0.299 * r + 0.587 * g + 0.114 * b; r = L * tint[0]; g = L * tint[1]; b = L * tint[2]; }
      if (maskType != MASK_NONE && mStr > 0) {   // classic: "dots" falls into the slot branch, as in engine.js
        int col = (int)std::floor((px + maskSh) / ms), row = (int)std::floor((py + scanSh) / ms);
        int ph;
        if (maskType == MASK_GRILLE) ph = imod(col, 3);
        else if (maskType == MASK_SHADOW) ph = imod((int)(col + imod(row, 2) * 1.5), 3);
        else { ph = imod(col, 3); if (imod(row + imod((int)std::floor(col / 3.0), 2) * 2, 4) == 3) { r *= 1 - mStr * 0.6; g *= 1 - mStr * 0.6; b *= 1 - mStr * 0.6; } }
        double lo = 1 - mStr * 0.7, hi = 1 + mStr * 0.35, mean = (hi + 2 * lo) / 3;
        auto q = [&](double t) { return mean + (t - mean) * maskVis; };
        r *= q(ph == 0 ? hi : lo); g *= q(ph == 1 ? hi : lo); b *= q(ph == 2 ? hi : lo);
      }
      double f = pmod(py + scanSh, lineH) / lineH - 0.5, lum = (r + g + b) / 765;
      double bw = beam * (0.6 + 0.4 * clamp(lum, 0, 1));
      auto prof = [&](double ff) { return 1 - sStr * (1 - std::exp(-(ff * ff) / (2 * bw * bw * 0.09))); };
      double sl = prof(f);
      if (scanVis < 1) { double m = 0; for (int s = 0; s < 8; s++) m += prof((s + 0.5) / 8 - 0.5); sl = m / 8 + (sl - m / 8) * scanVis; }
      double vg = 1 - vig * std::pow(r2 / 2, 1.5) * 1.6;
      double corner = 1;
      if (rad > 0) {
        double qx = std::min(x, w - 1 - x), qy = std::min(y, h - 1 - y);
        if (qx < rad && qy < rad) { double d = std::hypot(rad - qx, rad - qy); corner = clamp(rad - d + 1, 0, 1); }
      }
      double nz = noise ? hashNoise(jsRound(x / sc), jsRound(y / sc), 3 + P.noiseSeed) * noise : 0;
      double band = rollA ? rollA * 0.35 * std::exp(-std::pow(((double)y / h - rollY) * 12, 2)) : 0;
      double k = vg * corner * (1 + band) * bar * P.gain;
      auto fin = [&](double c) { return clamp(((c * sl * k + nz) - 128) * con + 128 + (bri - 1) * 128, 0, 255); };
      out[i * 4] = (float)fin(r); out[i * 4 + 1] = (float)fin(g); out[i * 4 + 2] = (float)fin(b);
      out[i * 4 + 3] = corner < 1 ? 255.f : S.A[i];
    }
    if ((y & 63) == 0 && !tick(pf, ctx, 2 * h + y, 3 * h)) return false;
  }
  return true;
}

// ------------------------------------------------------------- Phase FX
static Plane flowNoise(int w, int h, double cell, int seed, double ox, double oy) {
  Plane out((size_t)w * h, 0.f);
  double amp = 1, norm = 0;
  for (int o = 0; o < 3; o++) {
    double c = std::max(2.0, cell / std::pow(2, o));
    int gw = (int)std::ceil(w / c) + 2, gh = (int)std::ceil(h / c) + 2;
    Rng rnd((double)seed * 31 + o * 7 + 1);
    std::vector<float> g((size_t)gw * gh);
    for (auto& v : g) v = (float)(rnd() * 2 - 1);
    // MOTION: offset scrolls the noise; lattice wraps (gw x gh) so offset 0 is exact
    double sx = ox / c, sy = oy / c;
    auto G = [&](int X, int Y) { return (double)g[(size_t)imod(Y, gh) * gw + imod(X, gw)]; };
    for (int y = 0; y < h; y++) {
      double gy = y / c + sy; int y0 = (int)std::floor(gy); double fy = gy - y0, syy = fy * fy * (3 - 2 * fy);
      for (int x = 0; x < w; x++) {
        double gx = x / c + sx; int x0 = (int)std::floor(gx); double fx = gx - x0, sxx = fx * fx * (3 - 2 * fx);
        double a = G(x0, y0), b = G(x0 + 1, y0), cc = G(x0, y0 + 1), d = G(x0 + 1, y0 + 1);
        double top = a + (b - a) * sxx, bot = cc + (d - cc) * sxx;
        size_t i = (size_t)y * w + x;
        out[i] = (float)(out[i] + amp * (top + (bot - top) * syy));
      }
    }
    norm += amp; amp *= 0.5;
  }
  for (auto& v : out) v = (float)(v / norm);
  return out;
}
static void hsvRainbow(double t, double c[3]) {
  double hh = clamp(t, 0, 1) * 0.8 * 6; int i = (int)hh; double f = hh - i, q = 1 - f;
  const double T[6][3] = { {1, f, 0}, {q, 1, 0}, {0, 1, f}, {0, q, 1}, {f, 0, 1}, {1, 0, q} };
  for (int k = 0; k < 3; k++) c[k] = T[i % 6][k];
}
static double sample3(const std::vector<float>& C, int w, int h, double x, double y, int ch) {
  x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
  int x0 = (int)x, y0 = (int)y, x1 = std::min(x0 + 1, w - 1), y1 = std::min(y0 + 1, h - 1); double fx = x - x0, fy = y - y0;
  auto g = [&](int xx, int yy) { return (double)C[((size_t)yy * w + xx) * 3 + ch]; };
  double a = g(x0, y0) + (g(x1, y0) - g(x0, y0)) * fx, b = g(x0, y1) + (g(x1, y1) - g(x0, y1)) * fx;
  return a + (b - a) * fy;
}

static bool renderPhase(const Image& S, const Params& P, OutImage& O, ProgressFn pf, void* ctx) {
  const int w = S.w, h = S.h; const size_t n = (size_t)w * h;
  const double sc = P.scale, fullH = P.fullH > 0 ? P.fullH : h;
  const int mode = P.phaseMode; const int seed = (int)P.phSeed;
  const double sp = std::max(1.5, fullH / clamp(P.phLines, 20, 1200) * sc);
  const double th = clamp(P.phThreshold / 100, 0, 0.95);
  Plane L(n);
  for (size_t i = 0; i < n; i++) L[i] = (float)((0.2126 * S.R[i] + 0.7152 * S.G[i] + 0.0722 * S.B[i]) / 255 * (S.A[i] / 255.0));
  Plane Ld = L, Ls = L;
  boxBlur(Ld, w, h, std::max(1.0, sp * 0.5 * (1.2 - P.phDetail / 100)), 2);
  boxBlur(Ls, w, h, std::max(1.0, sp * (0.6 + 3 * P.phSmooth / 100)), 3);
  if (!tick(pf, ctx, 1, 6)) return false;

  Plane F(n); const double bend = P.phAmp / 100 * 10;
  const double ang = P.phAngle * PI / 180, ca = std::cos(ang), sa = std::sin(ang);
  Plane flow;
  if (mode == PH_FLUX || mode == PH_FLUXDOTS || P.phWarp > 0) flow = flowNoise(w, h, sp * 6, seed, P.flowX * sc, P.flowY * sc);
  const double warp = P.phWarp / 100 * 1.5, levels = 2 + P.phAmp / 100 * 10;
  for (int y = 0, i = 0; y < h; y++) for (int x = 0; x < w; x++, i++) {
    double t = ang != 0 ? -x * sa + y * ca : y;
    double fl = flow.empty() ? 0 : flow[i], v;
    if (mode == PH_WAVEFORM) v = t / sp - bend * (0.7 * Ls[i] + 0.3 * Ld[i]) + (flow.empty() ? 0 : warp * 0.4 * fl);
    else if (mode == PH_LINEAR) v = t / sp + (flow.empty() ? 0 : warp * 0.25 * fl);
    else v = (t / sp) * 0.35 + levels * (0.55 * Ld[i] + 0.45 * Ls[i]) + warp * fl;
    F[i] = (float)(v + P.fieldShift);                                         // MOTION
  }
  if (!tick(pf, ctx, 2, 6)) return false;

  Plane I(n, 0.f), core(n, 0.f);
  const double wBase = clamp(P.phWidth / 100, 0.05, 1) * sp * 0.32, dots = P.phDots / 100;
  const double pitch = std::max(2.0, sp * 0.55);
  const double dp3 = std::max(2.5, sp * (0.45 + 0.5 * P.phDots / 100));
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x;
      double gx = ((double)F[(size_t)y * w + std::min(x + 1, w - 1)] - F[(size_t)y * w + std::max(x - 1, 0)]) / ((x > 0 && x < w - 1) ? 2 : 1);
      double gy = ((double)F[(size_t)std::min(y + 1, h - 1) * w + x] - F[(size_t)std::max(y - 1, 0) * w + x]) / ((y > 0 && y < h - 1) ? 2 : 1);
      double gm = std::max(std::hypot(gx, gy), 0.15 / sp);
      double fr = F[i] - jsRound(F[i]), d = std::fabs(fr) / gm;
      if (mode == PH_FLUXDOTS) {
        int row = (int)std::floor(y / dp3); double ox = (row & 1) ? dp3 / 2 : 0;
        double cxp = std::floor((x + ox) / dp3) * dp3 + dp3 / 2 - ox, cyp = row * dp3 + dp3 / 2;
        size_t ci = (size_t)std::min(h - 1, std::max(0, (int)cyp)) * w + std::min(w - 1, std::max(0, (int)cxp));
        double vc = std::pow(clamp((Ld[ci] - th) / (1 - th), 0, 1), 1.25);
        if (vc <= 0) continue;
        double fc = F[ci] - jsRound(F[ci]), dc = std::fabs(fc) / gm;
        double sg = std::max(1.1, wBase * (1.3 + 1.1 * vc));
        double pc = std::exp(-(dc * dc) / (2 * sg * sg)), amt = std::min(1.0, std::pow(vc, 0.7) * (0.82 * pc + 0.18));
        if (amt < 0.04) continue;
        double rad = dp3 * 0.55 * std::sqrt(amt), disc = clamp(rad - std::hypot(x - cxp, y - cyp) + 0.5, 0, 1);
        if (disc <= 0) continue;
        I[i] = (float)(std::min(1.0, amt * 1.6) * disc); core[i] = (float)(disc * std::pow(pc, 3) * vc * vc);
        continue;
      }
      double v = std::pow(clamp((Ld[i] - th) / (1 - th), 0, 1), 1.25);
      if (v <= 0) continue;
      double sig = std::max(0.55, wBase * (mode == PH_LINEAR ? (0.25 + 1.1 * v) : (0.45 + 0.55 * v)));
      double prof = std::exp(-(d * d) / (2 * sig * sig));
      double k = std::min(1.0, std::pow(v, 0.8) * prof * 1.2);
      if (dots > 0) {
        double along = (mode == PH_LINEAR ? (x * ca + y * sa) : x) / pitch;
        double dp = 0.5 + 0.5 * std::cos(2 * PI * along);
        k *= 1 - dots * std::pow(1 - v, 0.6) * (1 - dp * dp);
      }
      I[i] = (float)k; core[i] = (float)(std::pow(prof, 5) * v * v);
    }
    if ((y & 63) == 0 && !tick(pf, ctx, 2 * h + y, 6 * h)) return false;
  }

  Plane LR(n, 0.f), LG(n, 0.f), LB(n, 0.f);
  std::vector<float> lut; if (!P.phColorFull) lut = gradientLUT(P.phRamp);
  for (size_t i = 0; i < n; i++) {
    double k = I[i]; if (k <= 0) continue;
    if (!lut.empty()) { int j = (int)clamp(jsRound(k * 255), 0, 255) * 3; LR[i] = lut[j]; LG[i] = lut[j + 1]; LB[i] = lut[j + 2]; }
    else { double s = 1.7 * k; LR[i] = (float)(S.R[i] * s); LG[i] = (float)(S.G[i] * s); LB[i] = (float)(S.B[i] * s); }
    double c = core[i] * 120.0; LR[i] = (float)(LR[i] + c); LG[i] = (float)(LG[i] + c); LB[i] = (float)(LB[i] + c);
  }
  if (P.phDebris > 0) {
    int bs = std::max(4, (int)jsRound(sp * 3)), bx = (int)std::ceil((double)w / bs), by = (int)std::ceil((double)h / bs);
    double amt = P.phDebris / 100;
    double dc[3] = { 140, 160, 170 };
    if (!lut.empty()) { dc[0] = lut[300]; dc[1] = lut[301]; dc[2] = lut[302]; }
    double ds = seed + P.noiseSeed;                                           // MOTION: boil re-rolls debris
    for (int j = 0; j < by; j++) for (int q = 0; q < bx; q++) {
      double hsh = (hashNoise(q, j, ds + 11) + 1) / 2;
      int run = 1 + (int)std::floor(((hashNoise(q, j, ds + 12) + 1) / 2) * 5);
      if (hsh > amt * 0.45) continue;
      int cx = std::min(w - 1, (int)(q * bs + bs / 2.0)), cy = std::min(h - 1, (int)(j * bs + bs / 2.0));
      double lv = Ls[(size_t)cy * w + cx]; if (lv > th + 0.25) continue;
      double strength = 0.22 + 0.3 * ((hashNoise(q, j, ds + 13) + 1) / 2);
      double spm = std::max(2.0, sp), pm = std::max(2.0, pitch);
      for (int yy = j * bs; yy < std::min(h, (j + 1) * bs); yy++) {
        double ry = std::fmod(yy, spm) / spm; if (ry > 0.45) continue;
        for (int xx = q * bs; xx < std::min(w, (q + run) * bs); xx++) {
          double rx = std::fmod(xx, pm) / pm; if (rx > 0.5) continue;
          size_t i = (size_t)yy * w + xx;
          LR[i] = (float)(LR[i] + dc[0] * strength); LG[i] = (float)(LG[i] + dc[1] * strength); LB[i] = (float)(LB[i] + dc[2] * strength);
        }
      }
    }
  }
  if (!tick(pf, ctx, 4, 6)) return false;

  const double glow = P.phGlow / 100;
  Plane GR, GG, GB;
  if (glow > 0) {
    double r1 = std::max(1.0, sp * 0.9), r2 = std::max(2.0, sp * 4.5);
    auto mk = [&](const Plane& C) { Plane a = C, b = C; boxBlur(a, w, h, r1, 2); boxBlur(b, w, h, r2, 3); for (size_t i = 0; i < n; i++) a[i] = (float)(((double)a[i] * 0.9 + (double)b[i] * 1.1) * glow); return a; };
    GR = mk(LR); GG = mk(LG); GB = mk(LB);
  }
  std::vector<float> FL;
  if (P.phFlare > 0) {
    FL.assign(n * 3, 0.f);
    Rng rnd((double)seed * 97 + 5);
    int count = 1 + (int)jsRound(P.phFlare / 100 * 2); double mn = std::min(w, h);
    for (int s = 0; s < count; s++) {
      double cx = (0.1 + 0.8 * rnd()) * w, cy = (0.1 + 0.8 * rnd()) * h, a = (-35 - 40 * rnd()) * PI / 180;
      double len = mn * (0.07 + 0.08 * rnd()), wid = len * 0.16, ux = std::cos(a), uy = std::sin(a), str = P.phFlare / 100 * 255;
      int x0 = std::max(0, (int)(cx - len)), x1 = std::min(w - 1, (int)(cx + len)), y0 = std::max(0, (int)(cy - len)), y1 = std::min(h - 1, (int)(cy + len));
      for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++) {
        double dx = x - cx, dy = y - cy, t = (dx * ux + dy * uy) / len, c = (-dx * uy + dy * ux) / (wid * (1 - 0.6 * std::fabs(t)) + 0.5);
        if (std::fabs(t) >= 1) continue;
        double k = std::exp(-c * c * 1.5) * std::sin((t + 1) / 2 * PI) * str, col[3]; hsvRainbow(1 - (c * 0.5 + 0.5), col);
        size_t i = ((size_t)y * w + x) * 3; FL[i] = (float)(FL[i] + col[0] * k); FL[i + 1] = (float)(FL[i + 1] + col[1] * k); FL[i + 2] = (float)(FL[i + 2] + col[2] * k);
      }
    }
  }
  if (!tick(pf, ctx, 5, 6)) return false;

  const double curv = P.curve / 100 * 0.25, frg = P.phFringe / 100 * sp * 0.9;
  const double ccx = P.convX * sc, ccy = P.convY * sc;
  const int maskType = P.maskType; const double ms = std::max(1.0, P.maskScale * sc), mStr = P.maskStrength / 100;
  const double sStr = P.scanStrength / 100, beam = clamp(P.scanWidth / 100, 0.1, 1);
  const double vig = P.vignette / 100, rad = P.corner / 100 * 0.12 * std::min(w, h);
  const double grain = (P.phGrain + P.snow) / 100 * 34, bri = P.brightness / 100, con = P.contrast / 100;
  const double lineH = std::max(1.0, fullH / std::max(60.0, std::min(2000.0, P.screenLines))) * sc;
  const double scanVis = clamp((lineH - 1.2) / 1.6, 0, 1), maskVis = std::pow(clamp(P.maskScale * sc, 0, 1), 2);
  RGB base = hexToRgb(isHex(P.phBase) ? P.phBase : "#000000");
  const double scanSh = P.scanShift * sc, maskSh = P.maskShiftX * sc;
  auto fin = [&](double c) { return clamp((c - 128) * con + 128 + (bri - 1) * 128, 0, 255); };
  O.resize(w, h);
  float* out = O.px.data();
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x;
      double u = (double)x / (w - 1) * 2 - 1, v = (double)y / (h - 1) * 2 - 1, r2 = u * u + v * v;
      double su = u * (1 + curv * r2), sv = v * (1 + curv * r2);
      if (std::fabs(su) > 1 || std::fabs(sv) > 1) { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0; out[i * 4 + 3] = 255; continue; }
      double px = (su + 1) / 2 * (w - 1), py = (sv + 1) / 2 * (h - 1);
      double bar; double sy = holdY(py, h, P.holdRoll, bar);                 // MOTION
      double sx = px + tearX(py, w, P.glitch, P.glitchSeed, sc);              // MOTION
      double rr = std::sqrt(r2 / 2), fx = frg * (0.35 + rr) * (u >= 0 ? 1 : -1);
      double lr = sample(LR, w, h, sx + ccx + fx, sy + ccy), lg = sample(LG, w, h, sx, sy), lb = sample(LB, w, h, sx - ccx - fx, sy - ccy);
      double gr = 0, gg = 0, gb = 0;
      if (!GR.empty()) { gr = sample(GR, w, h, sx + fx * 2, sy); gg = sample(GG, w, h, sx, sy); gb = sample(GB, w, h, sx - fx * 2, sy); }
      double mr = 1, mg = 1, mb = 1;
      if (maskType != MASK_NONE && mStr > 0) {
        double mx = px + maskSh, my = py + scanSh;
        if (maskType == MASK_DOTS) {
          double p3 = ms * 3; int row = (int)std::floor(my / p3); double ox = imod(row, 2) * p3 / 2;
          double qx = pmod(mx + ox, p3) / p3 - 0.5, qy = pmod(my, p3) / p3 - 0.5, dd = std::sqrt(qx * qx + qy * qy);
          double dot = clamp(1 - (dd - 0.28) * 6, 0, 1);
          double m = 1 - mStr * (1 - dot) * 0.85, mean = 1 - mStr * 0.85 * 0.6;
          mr = mg = mb = mean + (m - mean) * maskVis;
        } else {
          int col = (int)std::floor(mx / ms), row = (int)std::floor(my / ms);
          int ph; double slot = 1;
          if (maskType == MASK_GRILLE) ph = imod(col, 3);
          else if (maskType == MASK_SHADOW) ph = imod((int)(col + imod(row, 2) * 1.5), 3);
          else { ph = imod(col, 3); if (imod(row + imod((int)std::floor(col / 3.0), 2) * 2, 4) == 3) slot = 1 - mStr * 0.6; }
          double lo = 1 - mStr * 0.7, hi = 1 + mStr * 0.35, mean = (hi + 2 * lo) / 3;
          auto q = [&](double t) { return (mean + (t - mean) * maskVis) * slot; };
          mr = q(ph == 0 ? hi : lo); mg = q(ph == 1 ? hi : lo); mb = q(ph == 2 ? hi : lo);
        }
      }
      if (sStr > 0) {
        double f = pmod(py + scanSh, lineH) / lineH - 0.5;
        auto prof = [&](double ff) { return 1 - sStr * (1 - std::exp(-(ff * ff) / (2 * beam * beam * 0.09))); };
        double sl = prof(f);
        if (scanVis < 1) { double mm = 0; for (int s = 0; s < 8; s++) mm += prof((s + 0.5) / 8 - 0.5); sl = mm / 8 + (sl - mm / 8) * scanVis; }
        mr *= sl; mg *= sl; mb *= sl;
      }
      double vg = 1 - vig * std::pow(r2 / 2, 1.5) * 1.6;
      double corner = 1;
      if (rad > 0) {
        double qx = std::min(x, w - 1 - x), qy = std::min(y, h - 1 - y);
        if (qx < rad && qy < rad) { double d = std::hypot(rad - qx, rad - qy); corner = clamp(rad - d + 1, 0, 1); }
      }
      double k = std::max(0.0, vg) * corner * bar * P.gain;
      double gs = std::max(sc, 0.35);
      double gn = grain ? hashNoise(jsRound(x / gs), jsRound(y / gs), seed + 3 + P.noiseSeed) * grain : 0;
      double r = base.r + gn * 0.6 + 6 + lr + gr, g = base.g + gn * 0.6 + 4 + lg + gg, b = base.b + gn * 0.6 + 3 + lb + gb;
      r = fin(r * mr * k); g = fin(g * mg * k); b = fin(b * mb * k);
      if (!FL.empty()) {
        double f0 = sample3(FL, w, h, px, py, 0), f1 = sample3(FL, w, h, px, py, 1), f2 = sample3(FL, w, h, px, py, 2);
        r = 255 - (255 - r) * (255 - clamp(f0 * k, 0, 255)) / 255; g = 255 - (255 - g) * (255 - clamp(f1 * k, 0, 255)) / 255; b = 255 - (255 - b) * (255 - clamp(f2 * k, 0, 255)) / 255;
      }
      out[i * 4] = (float)r; out[i * 4 + 1] = (float)g; out[i * 4 + 2] = (float)b; out[i * 4 + 3] = 255;
    }
    if ((y & 63) == 0 && !tick(pf, ctx, 5 * h + y, 6 * h)) return false;
  }
  return true;
}

bool render(const Image& src, const Params& P, OutImage& out, ProgressFn pf, void* ctx) {
  if (src.w < 2 || src.h < 2) { out.resize(src.w, src.h); return true; }
  if (P.phaseMode != PH_OFF) return renderPhase(src, P, out, pf, ctx);
  return renderClassic(src, P, out, pf, ctx);
}

} // namespace crt
