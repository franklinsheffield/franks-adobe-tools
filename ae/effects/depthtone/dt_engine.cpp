#include "dt_engine.h"

namespace dt {
using namespace brew;

bool render(const Image& src, const Params& P, std::vector<Layer>& layers, ProgressFn pf, void* ctx) {
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h; const double sc = P.scale;
  Plane L(n); std::vector<float> A(n);
  for (size_t i = 0; i < n; i++) { L[i] = (float)((0.2126 * src.R[i] + 0.7152 * src.G[i] + 0.0722 * src.B[i]) / 255); A[i] = (float)(int)clamp(src.A[i], 0, 255); }
  if (P.shiftX != 0 || P.shiftY != 0) shiftPlane(L, w, h, (int)std::round(P.shiftX * sc), (int)std::round(P.shiftY * sc));
  if (P.invert) for (size_t i = 0; i < n; i++) L[i] = (float)(1 - (double)L[i]);
  if (P.smooth > 0) boxBlur(L, w, h, P.smooth * sc, 3);
  if (pf && !pf(ctx, 1, 4)) return false;
  const double lo = P.far_ / 100, hi = std::max(lo + 0.01, P.near_ / 100); const int lv = std::max(2, (int)jsRound(P.levels));
  std::vector<int> Q(n); Plane D(n);
  for (size_t i = 0; i < n; i++) {
    double d = clamp(((double)L[i] - lo) / (hi - lo), 0, 1);
    int q = std::min(lv - 1, (int)std::floor(d * lv + P.depthPhase));
    Q[i] = q; D[i] = (float)((double)q / (lv - 1));
  }
  const std::vector<float> lut = gradientLUT(P.stops);
  const RGB fog = hexToRgb(isHex(P.fogColor) ? P.fogColor : "#C9D6DF"); const double fogAmt = P.fog / 100;
  auto colourOf = [&](double t, float* out) {
    int q = (int)jsRound(t * 255) * 3; double f = fogAmt * (1 - t) * (1 - t);
    out[0] = (float)(lut[q] + (fog.r - lut[q]) * f); out[1] = (float)(lut[q + 1] + (fog.g - lut[q + 1]) * f); out[2] = (float)(lut[q + 2] + (fog.b - lut[q + 2]) * f);
  };
  auto u8 = [](double v) { return (float)(int)clamp(v, 0, 255); };      // Uint8Array store of an in-range value
  layers.clear();
  const double az = P.lightAngle * 3.14159265358979323846 / 180, ldx = std::cos(az), ldy = -std::sin(az);

  if (P.style == CONTOURS) {
    Plane LN(n, 0.f);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x; int q = Q[i];
      if ((x + 1 < w && Q[i + 1] != q) || (y + 1 < h && Q[i + w] != q)) LN[i] = 1;
    }
    int r = std::max(0, (int)jsRound((P.lineWidth * sc - 1) / 2));
    if (r > 0) { boxBlur(LN, w, h, r, 1); for (size_t i = 0; i < n; i++) LN[i] = LN[i] > 0.5 / (2 * r + 1) ? 1.f : 0.f; }
    int every = std::max(1, (int)jsRound(P.every));
    RGB lc = hexToRgb(isHex(P.lineColor) ? P.lineColor : "#111111");
    Layer out; out.rgba.assign(n * 4, 0.f); float tmp[3];
    for (size_t i = 0; i < n; i++) {
      if (!LN[i] || ((Q[i] % every) != 0 && every > 1)) continue;
      if (P.colorByDepth) { colourOf(D[i], tmp); out.rgba[i * 4] = u8(tmp[0]); out.rgba[i * 4 + 1] = u8(tmp[1]); out.rgba[i * 4 + 2] = u8(tmp[2]); }
      else { out.rgba[i * 4] = (float)lc.r; out.rgba[i * 4 + 1] = (float)lc.g; out.rgba[i * 4 + 2] = (float)lc.b; }
      out.rgba[i * 4 + 3] = A[i];
    }
    if (P.fill) {
      Layer fl; fl.rgba.assign(n * 4, 0.f);
      for (size_t i = 0; i < n; i++) { colourOf(D[i], tmp); fl.rgba[i * 4] = u8(tmp[0]); fl.rgba[i * 4 + 1] = u8(tmp[1]); fl.rgba[i * 4 + 2] = u8(tmp[2]); fl.rgba[i * 4 + 3] = A[i]; }
      layers.push_back(std::move(fl));
    }
    layers.push_back(std::move(out));
    return true;
  }

  std::vector<float> C(n * 3);
  for (size_t i = 0; i < n; i++) colourOf(D[i], &C[i * 3]);
  if (P.style == TERRACES) {
    const int dist = std::max(1, (int)jsRound(P.shadow * sc)); const double amt = P.lightStrength / 100;
    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        size_t i = (size_t)y * w + x; double s = 0;
        for (int k = 1; k <= dist; k++) {
          int sx = (int)jsRound(x + ldx * k), sy = (int)jsRound(y + ldy * k);
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) break;
          if (Q[(size_t)sy * w + sx] > Q[i]) { s = 1 - (double)(k - 1) / dist; break; }
        }
        double m = 1 - amt * 0.6 * s;
        C[i * 3] = (float)(C[i * 3] * m); C[i * 3 + 1] = (float)(C[i * 3 + 1] * m); C[i * 3 + 2] = (float)(C[i * 3 + 2] * m);
      }
      if ((y & 63) == 0 && pf && !pf(ctx, 2, 4)) return false;
    }
  } else {
    Plane H = D;
    boxBlur(H, w, h, std::max(1.0, 1.5 * sc), 1);
    const double el = 45 * 3.14159265358979323846 / 180, lx = ldx * std::cos(el), ly = ldy * std::cos(el), lz = std::sin(el);
    const double k = 8 * (P.lightStrength / 100) / std::max(0.25, sc);
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x;
      double dx = ((double)H[(size_t)y * w + std::min(x + 1, w - 1)] - H[(size_t)y * w + std::max(x - 1, 0)]) * k;
      double dy = ((double)H[(size_t)std::min(y + 1, h - 1) * w + x] - H[(size_t)std::max(y - 1, 0) * w + x]) * k;
      double nl = std::sqrt(dx * dx + dy * dy + 1), diff = std::max(0.0, (-dx * lx - dy * ly + lz) / nl);
      double m = clamp(0.35 + 0.65 * diff / lz, 0, 1.5);
      C[i * 3] = (float)(C[i * 3] * m); C[i * 3 + 1] = (float)(C[i * 3 + 1] * m); C[i * 3 + 2] = (float)(C[i * 3 + 2] * m);
    }
  }
  Layer out; out.rgba.assign(n * 4, 0.f);
  for (size_t i = 0; i < n; i++) { out.rgba[i * 4] = u8(C[i * 3]); out.rgba[i * 4 + 1] = u8(C[i * 3 + 1]); out.rgba[i * 4 + 2] = u8(C[i * 3 + 2]); out.rgba[i * 4 + 3] = A[i]; }
  layers.push_back(std::move(out));
  return true;
}

}
