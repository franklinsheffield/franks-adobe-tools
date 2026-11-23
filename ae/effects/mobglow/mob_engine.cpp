#include "mob_engine.h"

namespace mob {
using namespace brew;

static float TO_LIN[256];
static bool lutInit = [] { for (int i = 0; i < 256; i++) { double c = i / 255.0; TO_LIN[i] = (float)(c <= 0.04045 ? c / 12.92 : std::pow((c + 0.055) / 1.055, 2.4)); } return true; }();
static double fromSrgb(double c) { return c <= 0.04045 ? c / 12.92 : std::pow((c + 0.055) / 1.055, 2.4); }
static double toSrgb(double x) { x = x <= 0 ? 0 : x >= 1 ? 1 : x; return x <= 0.0031308 ? x * 12.92 : 1.055 * std::pow(x, 1 / 2.4) - 0.055; }
static const double KNEE = 0.8;
static double shoulder(double x) { return x <= KNEE ? x : KNEE + (1 - KNEE) * (1 - std::exp(-(x - KNEE) / (1 - KNEE))); }
// 8-bit values use the JS table; deeper values convert exactly
static double lin(float v) { double r = std::round(v); return std::fabs(v - r) < 1e-4 ? TO_LIN[(int)clamp(r, 0, 255)] : fromSrgb(clamp(v, 0, 255) / 255.0); }

struct Small { Plane f; int w, h; };
static Small down(const Plane& f, int w, int h, int d) {
  int W = std::max(1, (int)std::ceil((double)w / d)), H = std::max(1, (int)std::ceil((double)h / d));
  Small s{ Plane((size_t)W * H, 0.f), W, H }; Plane c((size_t)W * H, 0.f);
  for (int y = 0; y < h; y++) { int Y = y / d; for (int x = 0; x < w; x++) { size_t j = (size_t)Y * W + x / d; s.f[j] = (float)((double)s.f[j] + f[(size_t)y * w + x]); c[j] = c[j] + 1; } }
  for (size_t j = 0; j < s.f.size(); j++) s.f[j] = (float)(s.f[j] / (c[j] ? (double)c[j] : 1.0));
  return s;
}
static void upAdd(Plane& acc, const Small& s, int w, int h, int d, double k) {
  const int W = s.w, H = s.h; const float* f = s.f.data();
  for (int y = 0; y < h; y++) {
    double fy = clamp((y + 0.5) / d - 0.5, 0, H - 1); int y0 = (int)fy, y1 = std::min(H - 1, y0 + 1); double ty = fy - y0;
    for (int x = 0; x < w; x++) {
      double fx = clamp((x + 0.5) / d - 0.5, 0, W - 1); int x0 = (int)fx, x1 = std::min(W - 1, x0 + 1); double tx = fx - x0;
      double a = f[(size_t)y0 * W + x0] + ((double)f[(size_t)y0 * W + x1] - f[(size_t)y0 * W + x0]) * tx;
      double b = f[(size_t)y1 * W + x0] + ((double)f[(size_t)y1 * W + x1] - f[(size_t)y1 * W + x0]) * tx;
      size_t i = (size_t)y * w + x; acc[i] = (float)((double)acc[i] + (a + (b - a) * ty) * k);
    }
  }
}
static void blurAdd(Plane& acc, const Plane& plane, int w, int h, double r, double k) {
  double rb = r / 1.7;
  if (rb < 1) { for (size_t i = 0; i < acc.size(); i++) acc[i] = (float)((double)acc[i] + plane[i] * k); return; }
  int d = 1;
  while (rb / (d * 2) >= 4 && d < 64) d *= 2;
  if (d == 1) { Plane b = plane; boxBlur(b, w, h, rb, 3); for (size_t i = 0; i < acc.size(); i++) acc[i] = (float)((double)acc[i] + b[i] * k); return; }
  Small s = down(plane, w, h, d);
  boxBlur(s.f, s.w, s.h, rb / d, 3);
  upAdd(acc, s, w, h, d, k);
}
// hue rotation in RGB (Rodrigues around the grey axis)
static void hueRot(double deg, double& r, double& g, double& b) {
  if (deg == 0) return;
  double a = deg * 3.14159265358979 / 180, c = std::cos(a), s = std::sin(a), k = (1 - c) / 3, q = std::sqrt(1 / 3.0) * s;
  double R = r * (c + k) + g * (k - q) + b * (k + q), G = r * (k + q) + g * (c + k) + b * (k - q), B = r * (k - q) + g * (k + q) + b * (c + k);
  r = R; g = G; b = B;
}

// returns glow planes + the base planes needed for the Screen layer
struct Glow { Plane GR, GG, GB, LR, LG, LB, A; double ref; };

static bool makeGlow(const Image& src, const Params& P, Glow& G, ProgressFn pf, void* ctx) {
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h; const double sc = P.scale;
  G.LR.assign(n, 0); G.LG.assign(n, 0); G.LB.assign(n, 0); G.A.assign(n, 0);
  Plane Y(n); std::vector<uint32_t> hist(1024, 0);
  for (size_t i = 0; i < n; i++) {
    float r = (float)lin(src.R[i]), gg = (float)lin(src.G[i]), b = (float)lin(src.B[i]);
    G.LR[i] = r; G.LG[i] = gg; G.LB[i] = b; G.A[i] = (float)(src.A[i] / 255.0);
    double y = 0.2126 * r + 0.7152 * gg + 0.0722 * b; Y[i] = (float)y;
    if (G.A[i] > 0) hist[std::min(1023, (int)(y * 1023))]++;
  }
  double total = 0; for (int i = 0; i < 1024; i++) total += hist[i];
  double ref = 1, acc = 0;
  for (int i = 1023; i >= 0; i--) { acc += hist[i]; if (acc >= total * 0.005) { ref = (i + 0.5) / 1023; break; } }
  ref = std::max(0.05, ref); G.ref = ref;
  const double t = ref * clamp(P.threshold, 0, 3) / 2, knee = 0.5 * t + 1e-4, gam = clamp(P.gamma, 0.1, 3), satK = clamp(P.sat, 0, 100) / 100 * 3;
  bool useTint = P.colorOn; double tint[3] = { 0, 0, 0 };
  if (useTint) {
    RGB c = hexToRgb(isHex(P.colorHex) ? P.colorHex : "#E0305A");
    double cr = c.r, cg = c.g, cb = c.b;
    hueRot(P.hueShift, cr, cg, cb);
    double cl[3] = { TO_LIN[(int)clamp(std::round(cr), 0, 255)], TO_LIN[(int)clamp(std::round(cg), 0, 255)], TO_LIN[(int)clamp(std::round(cb), 0, 255)] };
    double l = std::max(0.02, 0.2126 * cl[0] + 0.7152 * cl[1] + 0.0722 * cl[2]);
    for (int k = 0; k < 3; k++) tint[k] = cl[k] / l;
  }
  Plane BR(n), BG(n), BB(n);
  for (size_t i = 0; i < n; i++) {
    double y = Y[i], x = clamp(y - t + knee, 0, 2 * knee), soft = x * x / (4 * knee);
    double wgt = std::max(soft, y - t) / std::max(y, 1e-4) * G.A[i] / ref;
    double r = std::pow(G.LR[i] * wgt, gam), gg = std::pow(G.LG[i] * wgt, gam), b = std::pow(G.LB[i] * wgt, gam);
    double m = (r + gg + b) / 3;
    if (useTint) { r = m * tint[0]; gg = m * tint[1]; b = m * tint[2]; }
    else { r = m + (r - m) * satK; gg = m + (gg - m) * satK; b = m + (b - m) * satK; if (P.hueShift != 0) hueRot(P.hueShift, r, gg, b); }
    BR[i] = (float)std::max(0.0, r); BG[i] = (float)std::max(0.0, gg); BB[i] = (float)std::max(0.0, b);
  }
  if (pf && !pf(ctx, 1, 8)) return false;
  double fw = P.fullW > 0 ? P.fullW : w / sc, fh = P.fullH > 0 ? P.fullH : h / sc;
  const double R = std::max(1.0, P.radius) * std::max(fw, fh) / 2048 * sc;
  const double k = clamp(P.strength, 0, 500) / 100 * 3 * ref / 6 * P.gain;
  G.GR.assign(n, 0); G.GG.assign(n, 0); G.GB.assign(n, 0);
  const double fr[6] = { 1 / 32.0, 1 / 16.0, 1 / 8.0, 1 / 4.0, 1 / 2.0, 1 };
  for (int s = 0; s < 6; s++) {
    double r = std::max(0.5, R * fr[s]);
    blurAdd(G.GR, BR, w, h, r, k); blurAdd(G.GG, BG, w, h, r, k); blurAdd(G.GB, BB, w, h, r, k);
    if (pf && !pf(ctx, 2 + s, 8)) return false;
  }
  if (P.shiftX != 0 || P.shiftY != 0) {
    int dx = (int)std::round(P.shiftX * sc), dy = (int)std::round(P.shiftY * sc);
    shiftPlane(G.GR, w, h, dx, dy); shiftPlane(G.GG, w, h, dx, dy); shiftPlane(G.GB, w, h, dx, dy);
  }
  return true;
}

bool render(const Image& src, const Params& P, std::vector<Layer>& layers, ProgressFn pf, void* ctx) {
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h; const double sc = P.scale;
  Glow G; if (!makeGlow(src, P, G, pf, ctx)) return false;
  const double gAmt = P.grain / 100 * 0.12, dkA = clamp(P.darken / 100, 0, 1);
  Layer glow; glow.blend = BL_SCREEN; glow.rgba.assign(n * 4, 0.f);
  const Plane* L[3] = { &G.LR, &G.LG, &G.LB }; const Plane* S0[3] = { &src.R, &src.G, &src.B };
  for (size_t i = 0; i < n; i++) {
    double nz = 0;
    if (gAmt) { int x = (int)(i % w), y = (int)(i / w); nz = hashNoise(jsRound(x / sc), jsRound(y / sc), P.grainSeed) * gAmt * std::min(1.0, ((double)G.GR[i] + G.GG[i] + G.GB[i]) * 2); }
    double fd = 1 - dkA * G.A[i], gl[3] = { G.GR[i] + nz, G.GG[i] + nz, G.GB[i] + nz };
    for (int c = 0; c < 3; c++) {
      double S = (*S0[c])[i] / 255.0 * fd, pl = fd == 1 ? (*L[c])[i] : fromSrgb(S);
      double O = toSrgb(std::max(pl, shoulder(pl + std::max(0.0, gl[c]))));
      glow.rgba[i * 4 + c] = S >= 0.999 ? 0.f : (float)jsRound(clamp(1 - (1 - O) / (1 - S), 0, 1) * 255);
    }
    glow.rgba[i * 4 + 3] = 255;
  }
  layers.clear();
  if (P.darken > 0) {
    Layer dk; dk.rgba.assign(n * 4, 0.f); double a = jsRound(P.darken / 100 * 255);
    for (size_t i = 0; i < n; i++) dk.rgba[i * 4 + 3] = (float)clamp(jsRound(a * G.A[i]), 0, 255);
    layers.push_back(std::move(dk));
  }
  layers.push_back(std::move(glow));
  return true;
}

bool renderOut(const Image& src, const Params& P, OutImage& out, ProgressFn pf, void* ctx) {
  std::vector<Layer> layers;
  if (!render(src, P, layers, pf, ctx)) return false;
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h;
  std::vector<float> rgb; compositeBlack(layers, true, src, w, h, rgb);
  // premultiplied-over-black result -> straight alpha; glow lights empty areas too
  out.resize(w, h);
  for (size_t i = 0; i < n; i++) {
    double r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    double a = clamp(std::max((double)src.A[i], std::max(r, std::max(g, b))), 0, 255);
    float* p = &out.px[i * 4];
    if (a <= 0) { p[0] = p[1] = p[2] = p[3] = 0; continue; }
    double k = 255 / a;
    p[0] = (float)clamp(r * k, 0, 255); p[1] = (float)clamp(g * k, 0, 255); p[2] = (float)clamp(b * k, 0, 255); p[3] = (float)a;
  }
  return true;
}

}
