// Frank's CRT Phaser Brew for After Effects - tool-specific motion + Look B morph.
#pragma once
#include "crt_engine.h"
#include "../../core/motion.h"
#include <cstdio>

namespace crt {

struct CrtMotion {
  double rollSpeed = 0;      // scanlines/s (scanline roll, + = down)
  double holdSpeed = 0;      // screens/s (vertical hold roll)
  double snow = 0;           // 0..100 animated signal snow
  double tubeFlicker = 0;    // 0..100
  double glitchRate = 0;     // channel-change bursts per second
  double glitchLength = 6;   // frames per burst
  double glitchAmount = 60;  // 0..100
  double convWobble = 0;     // px
  double fieldFlow = 0;      // Phase lines per second (iso-lines move)
  double warpFlow = 0;       // Phase warp drift, px/s
};

// The frame's engine params: the look + shared Motion + CRT motion at this time.
inline Params applyMotion(Params P, const CrtMotion& cm, const brew::Motion& m, const brew::Clock& c) {
  using brew::Clock;
  if (!c.on) return P;
  const double fullH = P.fullH > 0 ? P.fullH : 1080;
  const double lineFull = std::max(1.0, fullH / std::max(60.0, std::min(2000.0, P.screenLines)));
  const double maskPeriod = std::max(1.0, P.maskScale) * 3;
  long tick = c.randomTick(m);

  if (m.seed > 0) P.phSeed = P.phSeed + m.seed;
  // patterns: scanline roll + Drift Y move the scanlines/mask down; Drift X moves the mask sideways
  P.scanShift += c.drift(cm.rollSpeed * lineFull + m.driftY, lineFull);
  P.maskShiftX += c.drift(m.driftX, maskPeriod);
  // vertical hold: the whole picture rolls
  if (cm.holdSpeed != 0) { double r = c.cycles(cm.holdSpeed); P.holdRoll = r - std::floor(r); }
  // random parts: snow every frame, or boil every N frames
  if (cm.snow > 0 || m.boil > 0) { P.noiseSeed = (double)(tick + 1); P.snow = cm.snow; }
  // brightness: shared pulse/flicker + tube flicker
  P.gain = brew::motionGain(m, c);
  if (cm.tubeFlicker > 0) P.gain *= 1 - cm.tubeFlicker / 100 * 0.3 * Clock::rnd(c.frame, 9, m.seed);
  // channel-change bursts
  if (cm.glitchRate > 0) {
    double len = std::max(1.0, cm.glitchLength);
    long slot = (long)std::floor(c.frame / len);
    double prob = cm.glitchRate * len / c.fps;
    if (Clock::rnd(slot, 13, m.seed) < prob) {
      double a = cm.glitchAmount / 100;
      P.glitch = a; P.glitchSeed = (double)c.frame;
      P.snow += 40 * a; P.noiseSeed = (double)(c.frame + 1);
      P.holdRoll += (Clock::rnd(c.frame, 19, m.seed) - 0.5) * 0.08 * a;
      if (P.holdRoll < 0) P.holdRoll += 1;
      P.gain *= 1 + 0.25 * a * (Clock::rnd(c.frame, 23, m.seed) - 0.3);
    }
  }
  // convergence wobble
  if (cm.convWobble != 0) {
    P.convX += cm.convWobble * std::sin(2 * 3.14159265358979 * c.cycles(1.3));
    P.convY += cm.convWobble * 0.5 * std::sin(2 * 3.14159265358979 * c.cycles(0.9) + 1);
  }
  // Phase FX
  if (P.phaseMode != PH_OFF) {
    P.fieldShift += c.drift(cm.fieldFlow, 1);
    P.flowX += c.drift(cm.warpFlow + m.driftX, 0);
    P.flowY += c.drift(m.driftY, 0);
    if (m.spin != 0) P.phAngle = std::fmod(P.phAngle + m.spin * c.te, 360);
  }
  return P;
}

// Look B morph: numbers blend, switches flip at 50 %, ramps blend through their LUTs.
inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  if (t >= 1) { Params o = B; o.scale = A.scale; o.fullH = A.fullH; return o; }
  Params o = A;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  o.screenLines = L(A.screenLines, B.screenLines); o.convX = L(A.convX, B.convX); o.convY = L(A.convY, B.convY);
  o.maskScale = L(A.maskScale, B.maskScale); o.maskStrength = L(A.maskStrength, B.maskStrength);
  o.scanStrength = L(A.scanStrength, B.scanStrength); o.scanWidth = L(A.scanWidth, B.scanWidth);
  o.bloom = L(A.bloom, B.bloom); o.curve = L(A.curve, B.curve); o.corner = L(A.corner, B.corner); o.vignette = L(A.vignette, B.vignette);
  o.noise = L(A.noise, B.noise); o.roll = L(A.roll, B.roll); o.rollStrength = L(A.rollStrength, B.rollStrength);
  o.brightness = L(A.brightness, B.brightness); o.contrast = L(A.contrast, B.contrast);
  o.phLines = L(A.phLines, B.phLines); o.phAmp = L(A.phAmp, B.phAmp); o.phSmooth = L(A.phSmooth, B.phSmooth);
  o.phWidth = L(A.phWidth, B.phWidth); o.phThreshold = L(A.phThreshold, B.phThreshold); o.phAngle = L(A.phAngle, B.phAngle);
  o.phWarp = L(A.phWarp, B.phWarp); o.phDetail = L(A.phDetail, B.phDetail); o.phDots = L(A.phDots, B.phDots);
  o.phGlow = L(A.phGlow, B.phGlow); o.phFringe = L(A.phFringe, B.phFringe); o.phDebris = L(A.phDebris, B.phDebris);
  o.phFlare = L(A.phFlare, B.phFlare); o.phGrain = L(A.phGrain, B.phGrain);
  if (t >= 0.5) { o.maskType = B.maskType; o.tint = B.tint; o.phaseMode = B.phaseMode; o.phColorFull = B.phColorFull; o.phSeed = B.phSeed; }
  // ramps: 11 stops sampled from both gradients, colours blended
  auto la = brew::gradientLUT(A.phRamp), lb = brew::gradientLUT(B.phRamp);
  o.phRamp.clear();
  for (int s = 0; s <= 10; s++) {
    int j = (int)std::round(s * 25.5) * 3; char hex[8];
    snprintf(hex, sizeof hex, "#%02X%02X%02X", (int)std::round(L(la[j], lb[j])), (int)std::round(L(la[j + 1], lb[j + 1])), (int)std::round(L(la[j + 2], lb[j + 2])));
    o.phRamp.push_back({ s * 10.0, hex });
  }
  brew::RGB ba = brew::hexToRgb(brew::isHex(A.phBase) ? A.phBase : "#000000"), bb = brew::hexToRgb(brew::isHex(B.phBase) ? B.phBase : "#000000");
  char hb[8]; snprintf(hb, sizeof hb, "#%02X%02X%02X", (int)std::round(L(ba.r, bb.r)), (int)std::round(L(ba.g, bb.g)), (int)std::round(L(ba.b, bb.b)));
  o.phBase = hb;
  return o;
}

} // namespace crt

namespace crt {

// One AE frame: Look A (+ optional Look B morph) -> motion -> engine -> Jitter/Reveal.
// When the two looks differ in a switch (mode, mask, tint, colour), both sides are
// rendered and crossfaded so the morph never jumps.
inline bool renderFrame(const brew::Image& src, const Params& A, const Params* B, const CrtMotion& cm,
                        const brew::Motion& m, const brew::Clock& c, brew::OutImage& out,
                        brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0;
  Params base = B ? morph(A, *B, t) : A;
  if (!render(src, applyMotion(base, cm, m, c), out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && (A.phaseMode != B->phaseMode || A.maskType != B->maskType || A.tint != B->tint || A.phColorFull != B->phColorFull)) {
    Params other = base;
    const Params& S = t < 0.5 ? *B : A;          // the switches `base` did not take
    other.phaseMode = S.phaseMode; other.maskType = S.maskType; other.tint = S.tint; other.phColorFull = S.phColorFull; other.phSeed = S.phSeed;
    brew::OutImage o2;
    if (!render(src, applyMotion(other, cm, m, c), o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t);             // smoothstep weight of the B side
    double wOther = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wOther);
  }
  brew::motionPost(m, c, src, out, A.scale);
  return true;
}

} // namespace crt
