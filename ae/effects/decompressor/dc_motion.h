// Frank's Decompressor Brew for After Effects - decay motion + Look B morph.
// The real temporal datamosh (frames between I-frames) is fetched by the AE glue
// and handed in as `moshed`; everything else runs on that picture.
#pragma once
#include "dc_engine.h"
#include "../../core/motion.h"

namespace dc {

struct DcMotion {
  double iEvery = 0;                 // frames between clean I-frames (0 = no temporal datamosh)
  double bleed = 0;                  // % of the real frame let back in each frame
  double search = 16;                // px motion search
  double qualityWave = 0, qualityRate = 0.5;   // % quality swing, Hz
  double sliceRoll = 0;              // px/s glitch slices travel down
};

// Shared group mapping: Drift = the 8x8 block grid crawls, Spin = block-mosh direction turns,
// Boil/Seed = glitch slices and mosh re-roll, Pulse/Flicker = brightness.
inline Params applyMotion(Params P, const DcMotion& dm, const brew::Motion& m, const brew::Clock& c) {
  if (!c.on) return P;
  const double TAU = 6.28318530717958647692;
  P.gridX += c.drift(m.driftX, 8); P.gridY += c.drift(m.driftY, 8);
  P.moshDir = std::fmod(P.moshDir + m.spin * c.te, 360);
  if (m.boil > 0 || m.seed > 0) P.seed = P.seed + (m.boil > 0 ? (double)c.randomTick(m) * 31 : 0) + m.seed;
  if (dm.qualityWave > 0) P.quality = brew::clamp(P.quality * (1 + dm.qualityWave / 100 * std::sin(TAU * c.cycles(dm.qualityRate))), 1, 100);
  if (dm.sliceRoll != 0) P.sliceRoll += c.drift(dm.sliceRoll, P.fullH > 0 ? P.fullH : 1080);
  return P;
}

inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  Params o = t >= 1 ? B : A;
  o.scale = A.scale; o.fullH = A.fullH;
  if (t >= 1) return o;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  o.quality = L(A.quality, B.quality); o.generations = std::round(L(A.generations, B.generations)); o.bits = L(A.bits, B.bits);
  o.moshAmount = L(A.moshAmount, B.moshAmount); o.moshDir = L(A.moshDir, B.moshDir); o.moshBlock = L(A.moshBlock, B.moshBlock);
  o.slices = std::round(L(A.slices, B.slices)); o.offset = L(A.offset, B.offset); o.mix = L(A.mix, B.mix);
  if (t >= 0.5) { o.jpegOn = B.jpegOn; o.chroma = B.chroma; o.seed = B.seed; }
  return o;
}

inline bool renderOne(const brew::Image& src, const Params& P, double gain, brew::OutImage& out, brew::ProgressFn pf, void* ctx) {
  brew::Layer L; if (!render(src, P, L, pf, ctx)) return false;
  out.resize(src.w, src.h); out.px = L.rgba;
  brew::applyGain(out, gain);
  return true;
}

// `src` is the picture to decay (the temporal datamosh result when that is on); `orig` is the
// untouched current frame used by Reveal.
inline bool renderFrame(const brew::Image& src, const brew::Image& orig, const Params& A, const Params* B, const DcMotion& dm,
                        const brew::Motion& m, const brew::Clock& c, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0, g = brew::motionGain(m, c);
  Params base = B ? morph(A, *B, t) : A;
  if (!renderOne(src, applyMotion(base, dm, m, c), g, out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && (A.jpegOn != B->jpegOn || A.chroma != B->chroma)) {
    const Params& S = t < 0.5 ? *B : A; Params other = base; other.jpegOn = S.jpegOn; other.chroma = S.chroma;
    brew::OutImage o2; if (!renderOne(src, applyMotion(other, dm, m, c), g, o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t), wO = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wO);
  }
  brew::motionPost(m, c, orig, out, A.scale);
  return true;
}

}
