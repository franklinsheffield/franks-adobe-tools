// Frank's Mobglow Brew for After Effects - glow motion + Look B morph.
#pragma once
#include "mob_engine.h"
#include "../../core/motion.h"

namespace mob {

struct MobMotion {
  double breathe = 0, breatheRate = 0.5;   // % radius swell, Hz
  double shimmer = 0, shimmerRate = 8;     // % threshold flutter, Hz
};

// Shared group mapping: Spin = glow hue spin (deg/s), Drift = glow trails off the lights,
// Pulse/Flicker = glow strength, Boil/Seed = grain re-roll.
inline Params applyMotion(Params P, const MobMotion& mm, const brew::Motion& m, const brew::Clock& c) {
  using brew::Clock;
  if (!c.on) return P;
  const double TAU = 6.28318530717958647692;
  if (mm.breathe > 0) P.radius *= 1 + mm.breathe / 100 * 0.8 * std::sin(TAU * c.cycles(mm.breatheRate));
  if (mm.shimmer > 0) { long tick = (long)std::floor(c.cycles(mm.shimmerRate)); P.threshold *= 1 + mm.shimmer / 100 * 0.3 * (Clock::rnd(tick, 31, m.seed) * 2 - 1); }
  P.hueShift += m.spin * c.te;
  P.shiftX += c.drift(m.driftX, 0); P.shiftY += c.drift(m.driftY, 0);
  P.gain *= brew::motionGain(m, c);
  if (P.grain > 0) P.grainSeed = 7 + (double)c.randomTick(m) * 13 + m.seed;
  return P;
}

inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  Params o = t >= 1 ? B : A;
  o.scale = A.scale; o.fullW = A.fullW; o.fullH = A.fullH;
  if (t >= 1) return o;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  o.radius = L(A.radius, B.radius); o.strength = L(A.strength, B.strength); o.threshold = L(A.threshold, B.threshold);
  o.gamma = L(A.gamma, B.gamma); o.sat = L(A.sat, B.sat); o.grain = L(A.grain, B.grain); o.darken = L(A.darken, B.darken);
  o.colorHex = brew::lerpHex(A.colorHex, B.colorHex, t);
  if (t >= 0.5) o.colorOn = B.colorOn;
  return o;
}

inline bool renderFrame(const brew::Image& src, const Params& A, const Params* B, const MobMotion& mm, const brew::Motion& m,
                        const brew::Clock& c, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0;
  Params base = B ? morph(A, *B, t) : A;
  if (!renderOut(src, applyMotion(base, mm, m, c), out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && A.colorOn != B->colorOn) {        // crossfade the switch so the morph never jumps
    Params other = base; other.colorOn = t < 0.5 ? B->colorOn : A.colorOn;
    brew::OutImage o2; if (!renderOut(src, applyMotion(other, mm, m, c), o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t), wO = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wO);
  }
  brew::motionPost(m, c, src, out, A.scale);
  return true;
}

}
