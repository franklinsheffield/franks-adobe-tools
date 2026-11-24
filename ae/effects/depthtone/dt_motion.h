// Frank's Depthtone Brew for After Effects - depth motion + Look B morph.
#pragma once
#include "dt_engine.h"
#include "../../core/motion.h"

namespace dt {

struct DtMotion {
  double flow = 0;                      // levels/s: contours and terraces march (+ = toward near)
  double fogBreathe = 0, fogRate = 0.25;   // % fog swell, Hz
  double rangeWave = 0, rangeRate = 0.25;  // % near/far sweep, Hz
};

// Shared group mapping: Spin = light orbit (deg/s), Drift = the depth field slides,
// Pulse/Flicker = brightness.
inline Params applyMotion(Params P, const DtMotion& dm, const brew::Motion& m, const brew::Clock& c) {
  if (!c.on) return P;
  const double TAU = 6.28318530717958647692;
  if (dm.flow != 0) { double ph = c.drift(dm.flow, 1); P.depthPhase = ph - std::floor(ph); }
  P.lightAngle = std::fmod(P.lightAngle + m.spin * c.te, 360);
  P.shiftX += c.drift(m.driftX, 0); P.shiftY += c.drift(m.driftY, 0);
  if (dm.fogBreathe > 0) P.fog = brew::clamp(P.fog + dm.fogBreathe * 0.5 * (1 + std::sin(TAU * c.cycles(dm.fogRate))), 0, 100);
  if (dm.rangeWave > 0) { double s = dm.rangeWave / 100 * 30 * std::sin(TAU * c.cycles(dm.rangeRate)); P.near_ = brew::clamp(P.near_ + s, 1, 100); P.far_ = brew::clamp(P.far_ + s, 0, 99); }
  return P;
}

inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  Params o = t >= 1 ? B : A;
  o.scale = A.scale; o.fullH = A.fullH;
  if (t >= 1) return o;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  o.smooth = L(A.smooth, B.smooth); o.near_ = L(A.near_, B.near_); o.far_ = L(A.far_, B.far_); o.levels = L(A.levels, B.levels);
  o.fog = L(A.fog, B.fog); o.lineWidth = L(A.lineWidth, B.lineWidth); o.every = L(A.every, B.every);
  o.lightAngle = L(A.lightAngle, B.lightAngle); o.shadow = L(A.shadow, B.shadow); o.lightStrength = L(A.lightStrength, B.lightStrength);
  o.stops = brew::lerpStops(A.stops, B.stops, t);
  o.fogColor = brew::lerpHex(A.fogColor, B.fogColor, t); o.lineColor = brew::lerpHex(A.lineColor, B.lineColor, t);
  if (t >= 0.5) { o.style = B.style; o.invert = B.invert; o.colorByDepth = B.colorByDepth; o.fill = B.fill; }
  return o;
}

inline bool sameSwitches(const Params& a, const Params& b) { return a.style == b.style && a.invert == b.invert && a.colorByDepth == b.colorByDepth && a.fill == b.fill; }

// One AE frame: layers flattened (optionally over the original), gain, Jitter/Reveal.
inline bool renderOne(const brew::Image& src, const Params& P, bool overOriginal, double gain, brew::OutImage& out, brew::ProgressFn pf, void* ctx) {
  std::vector<brew::Layer> L;
  if (!render(src, P, L, pf, ctx)) return false;
  brew::flatten(L, overOriginal, src, src.w, src.h, out);
  brew::applyGain(out, gain);
  return true;
}

inline bool renderFrame(const brew::Image& src, const Params& A, const Params* B, const DtMotion& dm, const brew::Motion& m,
                        const brew::Clock& c, bool overOriginal, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0, g = brew::motionGain(m, c);
  Params base = B ? morph(A, *B, t) : A;
  if (!renderOne(src, applyMotion(base, dm, m, c), overOriginal, g, out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && !sameSwitches(A, *B)) {
    const Params& S = t < 0.5 ? *B : A; Params other = base;
    other.style = S.style; other.invert = S.invert; other.colorByDepth = S.colorByDepth; other.fill = S.fill;
    brew::OutImage o2; if (!renderOne(src, applyMotion(other, dm, m, c), overOriginal, g, o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t), wO = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wO);
  }
  brew::motionPost(m, c, src, out, A.scale);
  return true;
}

}
