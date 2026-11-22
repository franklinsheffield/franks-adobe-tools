#include "dc_engine.h"

namespace dc {
using namespace brew;

static const int QY[64] = { 16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99 };
static const int QC32[32] = { 17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99 };
static std::vector<double> qTable(const int* base, double quality) {
  double q = clamp(quality, 1, 100), s = q < 50 ? 5000 / q : 200 - 2 * q;
  std::vector<double> t(64);
  for (int i = 0; i < 64; i++) t[i] = clamp(std::floor((base[i] * s + 50) / 100), 1, 255);
  return t;
}
static float COS[64];
static bool cosInit = [] { for (int x = 0; x < 8; x++) for (int u = 0; u < 8; u++) COS[x * 8 + u] = (float)(std::cos((2 * x + 1) * u * 3.14159265358979323846 / 16) * (u == 0 ? 0.70710678118654752440 : 1) / 2); return true; }();

static void dctPlane(Plane& P, int w, int h, const std::vector<double>& qt, int shiftX, int shiftY) {
  float blk[64], tmp[64], co[64];
  for (int by = -shiftY; by < h; by += 8) for (int bx = -shiftX; bx < w; bx += 8) {
    for (int y = 0; y < 8; y++) for (int x = 0; x < 8; x++) blk[y * 8 + x] = (float)((double)P[(size_t)iclamp(by + y, 0, h - 1) * w + iclamp(bx + x, 0, w - 1)] - 128);
    for (int y = 0; y < 8; y++) for (int u = 0; u < 8; u++) { double s = 0; for (int x = 0; x < 8; x++) s += (double)blk[y * 8 + x] * COS[x * 8 + u]; tmp[y * 8 + u] = (float)s; }
    for (int u = 0; u < 8; u++) for (int v = 0; v < 8; v++) { double s = 0; for (int y = 0; y < 8; y++) s += (double)tmp[y * 8 + u] * COS[y * 8 + v]; double q = qt[v * 8 + u]; co[v * 8 + u] = (float)(jsRound(s / q) * q); }
    for (int u = 0; u < 8; u++) for (int y = 0; y < 8; y++) { double s = 0; for (int v = 0; v < 8; v++) s += (double)co[v * 8 + u] * COS[y * 8 + v]; tmp[y * 8 + u] = (float)s; }
    for (int y = 0; y < 8; y++) for (int x = 0; x < 8; x++) {
      int yy = by + y, xx = bx + x;
      if (yy < 0 || xx < 0 || yy >= h || xx >= w) continue;
      double s = 0; for (int u = 0; u < 8; u++) s += (double)tmp[y * 8 + u] * COS[x * 8 + u];
      P[(size_t)yy * w + xx] = (float)clamp(s + 128, 0, 255);
    }
  }
}

bool render(const Image& src, const Params& P, Layer& outL, ProgressFn pf, void* ctx) {
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h; const double sc = P.scale;
  Plane R(n), G(n), B(n);
  for (size_t i = 0; i < n; i++) { R[i] = src.R[i]; G[i] = src.G[i]; B[i] = src.B[i]; }
  const Plane R0 = R, G0 = G, B0 = B;
  Plane Y(n), Cb(n), Cr(n);
  for (size_t i = 0; i < n; i++) {
    Y[i] = (float)(0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]);
    Cb[i] = (float)(128 - 0.168736 * R[i] - 0.331264 * G[i] + 0.5 * B[i]);
    Cr[i] = (float)(128 + 0.5 * R[i] - 0.418688 * G[i] - 0.081312 * B[i]);
  }
  const int cw = P.chroma == C411 ? 4 : P.chroma == C420 ? 2 : 1, ch = P.chroma == C420 ? 2 : 1;
  if (cw > 1 || ch > 1) for (Plane* Cp : { &Cb, &Cr }) { Plane& C = *Cp; for (int y = 0; y < h; y += ch) for (int x = 0; x < w; x += cw) {
    double s = 0; int k = 0;
    for (int yy = y; yy < std::min(h, y + ch); yy++) for (int xx = x; xx < std::min(w, x + cw); xx++) { s += C[(size_t)yy * w + xx]; k++; }
    s /= k;
    for (int yy = y; yy < std::min(h, y + ch); yy++) for (int xx = x; xx < std::min(w, x + cw); xx++) C[(size_t)yy * w + xx] = (float)s;
  } }
  if (P.jpegOn) {
    int QC[64]; for (int i = 0; i < 64; i++) QC[i] = i < 32 ? QC32[i] : 99;
    auto qy = qTable(QY, P.quality), qc = qTable(QC, P.quality);
    const int gx = ((int)std::round(P.gridX) % 8 + 8) % 8, gy = ((int)std::round(P.gridY) % 8 + 8) % 8;
    const int gens = (int)P.generations;
    for (int g = 0; g < gens; g++) {
      int shift = g % 3, sx = (shift + gx) % 8, sy = (shift + gy) % 8;
      dctPlane(Y, w, h, qy, sx, sy);
      if (pf && !pf(ctx, g * 2 + 1, gens * 2 + 2)) return false;
      dctPlane(Cb, w, h, qc, sx, sy); dctPlane(Cr, w, h, qc, sx, sy);
      if (pf && !pf(ctx, g * 2 + 2, gens * 2 + 2)) return false;
    }
  }
  for (size_t i = 0; i < n; i++) {
    double y = Y[i], cb = (double)Cb[i] - 128, cr = (double)Cr[i] - 128;
    R[i] = (float)(y + 1.402 * cr); G[i] = (float)(y - 0.344136 * cb - 0.714136 * cr); B[i] = (float)(y + 1.772 * cb);
  }
  if (P.bits < 8) {
    double lv = std::pow(2, P.bits) - 1;
    for (Plane* Cp : { &R, &G, &B }) for (size_t i = 0; i < n; i++) (*Cp)[i] = (float)(jsRound(clamp((*Cp)[i], 0, 255) / 255 * lv) / lv * 255);
  }
  Rng rnd(P.seed * 7919 + 1);
  if (P.moshAmount > 0) {
    const int bs = std::max(2, (int)jsRound(P.moshBlock * sc)); const double ang = P.moshDir * 3.14159265358979323846 / 180;
    const int dx = (int)jsRound(std::cos(ang) * bs), dy = (int)jsRound(-std::sin(ang) * bs);
    const int nbx = (int)std::ceil((double)w / bs), nby = (int)std::ceil((double)h / bs);
    for (int by = 0; by < nby; by++) for (int bx = 0; bx < nbx; bx++) {
      if (rnd() > P.moshAmount / 100) continue;
      int steps = 1 + (int)std::floor(rnd() * 6);
      for (int s = 1; s <= steps; s++) {
        int ox = bx * bs + dx * s, oy = by * bs + dy * s;
        for (int y = 0; y < bs; y++) for (int x = 0; x < bs; x++) {
          int sx = bx * bs + x, sy = by * bs + y, tx = ox + x, ty = oy + y;
          if (sx >= w || sy >= h || tx < 0 || ty < 0 || tx >= w || ty >= h) continue;
          size_t si = (size_t)sy * w + sx, ti = (size_t)ty * w + tx;
          R[ti] = R[si]; G[ti] = G[si]; B[ti] = B[si];
        }
      }
    }
  }
  const double fullH = P.fullH > 0 ? P.fullH : h;
  const int nsl = (int)P.slices;
  std::vector<float> row((size_t)w * 3);
  for (int k = 0; k < nsl; k++) {
    int y0 = (int)std::floor(rnd() * h); int bh = std::max(1, (int)jsRound((2 + rnd() * 0.04 * fullH) * sc));
    int off = (int)jsRound((rnd() * 2 - 1) * P.offset * sc);
    if (!off) continue;
    if (P.sliceRoll != 0) { y0 = (int)(((long)y0 + (long)std::round(P.sliceRoll * sc)) % h); if (y0 < 0) y0 += h; }
    for (int y = y0; y < std::min(h, y0 + bh); y++) {
      for (int x = 0; x < w; x++) { size_t i = (size_t)y * w + x; row[x * 3] = R[i]; row[x * 3 + 1] = G[i]; row[x * 3 + 2] = B[i]; }
      for (int x = 0; x < w; x++) { int sx = ((x - off) % w + w) % w; size_t i = (size_t)y * w + x; R[i] = row[sx * 3]; G[i] = row[sx * 3 + 1]; B[i] = row[sx * 3 + 2]; }
    }
  }
  const double mix = P.mix / 100;
  if (mix < 1) for (size_t i = 0; i < n; i++) {
    R[i] = (float)(R0[i] + ((double)R[i] - R0[i]) * mix); G[i] = (float)(G0[i] + ((double)G[i] - G0[i]) * mix); B[i] = (float)(B0[i] + ((double)B[i] - B0[i]) * mix);
  }
  outL.blend = BL_NORMAL; outL.rgba.assign(n * 4, 0.f);
  for (size_t i = 0; i < n; i++) {
    outL.rgba[i * 4] = (float)clamp(jsRound(R[i]), 0, 255); outL.rgba[i * 4 + 1] = (float)clamp(jsRound(G[i]), 0, 255);
    outL.rgba[i * 4 + 2] = (float)clamp(jsRound(B[i]), 0, 255); outL.rgba[i * 4 + 3] = (float)(int)clamp(src.A[i], 0, 255);
  }
  return true;
}

// ------------------------------------------------------------ temporal datamosh
// luma at 1/4 size for fast block matching
static Plane lumaQuarter(const Image& im, int& W, int& H) {
  W = std::max(1, im.w / 4); H = std::max(1, im.h / 4);
  Plane q((size_t)W * H, 0.f);
  for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
    double s = 0;
    for (int yy = 0; yy < 4; yy++) for (int xx = 0; xx < 4; xx++) {
      size_t i = (size_t)std::min(im.h - 1, y * 4 + yy) * im.w + std::min(im.w - 1, x * 4 + xx);
      s += 0.299 * im.R[i] + 0.587 * im.G[i] + 0.114 * im.B[i];
    }
    q[(size_t)y * W + x] = (float)(s / 16);
  }
  return q;
}

void temporalMosh(const std::vector<const Image*>& frames, int block, int search, double bleed, Image& out) {
  out = *frames[0];
  if (frames.size() < 2) return;
  const int w = out.w, h = out.h;
  const int bq = std::max(2, block / 4), rq = std::max(1, search / 4);
  int W, H; Plane prevQ = lumaQuarter(*frames[0], W, H);
  for (size_t f = 1; f < frames.size(); f++) {
    const Image& cur = *frames[f];
    int W2, H2; Plane curQ = lumaQuarter(cur, W2, H2);
    Image next = out;
    for (int by = 0; by < H; by += bq) for (int bx = 0; bx < W; bx += bq) {
      // best offset (in the previous frame) for this block of the current frame
      double best = 1e30; int mx = 0, my = 0;
      for (int oy = -rq; oy <= rq; oy++) for (int ox = -rq; ox <= rq; ox++) {
        double sad = 0;
        for (int y = by; y < std::min(H, by + bq); y++) for (int x = bx; x < std::min(W, bx + bq); x++) {
          int px = iclamp(x + ox, 0, W - 1), py = iclamp(y + oy, 0, H - 1);
          sad += std::fabs((double)curQ[(size_t)y * W + x] - prevQ[(size_t)py * W + px]);
        }
        sad += (std::abs(ox) + std::abs(oy)) * 0.5;          // prefer still blocks on ties
        if (sad < best) { best = sad; mx = ox; my = oy; }
      }
      // motion-compensate the stale picture (no residual = datamosh)
      const int x0 = bx * 4, y0 = by * 4, x1 = std::min(w, (bx + bq) * 4), y1 = std::min(h, (by + bq) * 4);
      for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) {
        size_t i = (size_t)y * w + x, j = (size_t)iclamp(y + my * 4, 0, h - 1) * w + iclamp(x + mx * 4, 0, w - 1);
        next.R[i] = out.R[j]; next.G[i] = out.G[j]; next.B[i] = out.B[j]; next.A[i] = out.A[j];
      }
    }
    if (bleed > 0) for (size_t i = 0; i < next.R.size(); i++) {
      next.R[i] = (float)(next.R[i] + (cur.R[i] - next.R[i]) * bleed); next.G[i] = (float)(next.G[i] + (cur.G[i] - next.G[i]) * bleed);
      next.B[i] = (float)(next.B[i] + (cur.B[i] - next.B[i]) * bleed); next.A[i] = (float)(next.A[i] + (cur.A[i] - next.A[i]) * bleed);
    }
    out = std::move(next); prevQ = std::move(curQ);
  }
}

}
