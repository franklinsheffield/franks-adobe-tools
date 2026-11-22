// Frank's Chrometone Brew for After Effects - chrome motion + Look B morph.
#pragma once
#include "ct_engine.h"
#include "../../core/motion.h"

namespace ct {

struct CtMotion {
  double bandFlow = 0;               // deg/s of band phase (liquid flowing through the metal)
  double sweepTravel = 0;            // %/s the shine sweep moves across (wraps)
  double twinkle = 0, twinkleRate = 3;   // % glint size flutter, Hz
};

// Shared group mapping: Spin = light orbit (deg/s), Drift = reflection scroll (px/s),
// Pulse/Flicker = brightness (glue), Boil/Seed = grain re-roll.
inline Params applyMotion(Params P, const CtMotion& cm, const brew::Motion& m, const brew::Clock& c) {
  using brew::Clock;
  if (!c.on) return P;
  const double TAU = 6.28318530717958647692;
  P.angle = std::fmod(P.angle + m.spin * c.te + 36000, 360);
  P.bandPhase = std::fmod(P.bandPhase + c.drift(cm.bandFlow, 360) + 36000, 360);
  P.horizonX += c.drift(m.driftX, 0); P.horizonY += c.drift(m.driftY, 0);
  if (cm.sweepTravel != 0) { double p = std::fmod(P.swPos + 20 + c.drift(cm.sweepTravel, 140), 140); if (p < 0) p += 140; P.swPos = p - 20; }
  if (cm.twinkle > 0) P.glSize *= 1 + cm.twinkle / 100 * 0.5 * std::sin(TAU * c.cycles(cm.twinkleRate));
  if (P.grain > 0) { long t = c.randomTick(m); P.grainX = (double)t * 9973 + m.seed * 131; P.grainY = (double)t * 7919; }
  return P;
}

// discrete settings (switches and menus) of `src` copied onto `o`
inline void copyDiscrete(Params& o, const Params& s) {
  o.invert = s.invert; o.bandShape = s.bandShape; o.from = s.from; o.profile = s.profile; o.reflect = s.reflect; o.exOn = s.exOn;
  for (int i = 0; i < 4; i++) { o.glow[i].on = s.glow[i].on; o.glow[i].type = s.glow[i].type; }
  o.glOn = s.glOn; o.swOn = s.swOn; o.rimOn = s.rimOn; o.arcOn = s.arcOn;
  o.bandCount = s.bandCount; o.glCount = s.glCount; o.glRays = s.glRays; o.arcCount = s.arcCount;
}
inline bool discreteDiffers(const Params& a, const Params& b) {
  Params x = a; copyDiscrete(x, b);
  bool g = false; for (int i = 0; i < 4; i++) g = g || a.glow[i].on != b.glow[i].on || a.glow[i].type != b.glow[i].type;
  return g || a.invert != b.invert || a.bandShape != b.bandShape || a.from != b.from || a.profile != b.profile || a.reflect != b.reflect ||
         a.exOn != b.exOn || a.glOn != b.glOn || a.swOn != b.swOn || a.rimOn != b.rimOn || a.arcOn != b.arcOn ||
         a.bandCount != b.bandCount || a.glCount != b.glCount || a.glRays != b.glRays || a.arcCount != b.arcCount;
}

inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  Params o = t >= 1 ? B : A;
  o.scale = A.scale;
  if (t >= 1) return o;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  auto H = [&](const std::string& a, const std::string& b) { return brew::lerpHex(a, b, t); };
  o.stops = brew::lerpStops(A.stops, B.stops, t); o.sky = brew::lerpStops(A.sky, B.sky, t); o.ground = brew::lerpStops(A.ground, B.ground, t);
  o.exStops = brew::lerpStops(A.exStops, B.exStops, t);
  o.blur = L(A.blur, B.blur); o.contrast = L(A.contrast, B.contrast); o.mid = L(A.mid, B.mid);
  o.bandPhase = L(A.bandPhase, B.bandPhase); o.bandSoft = L(A.bandSoft, B.bandSoft); o.bandMix = L(A.bandMix, B.bandMix);
  o.depth = L(A.depth, B.depth); o.angle = L(A.angle, B.angle); o.gloss = L(A.gloss, B.gloss); o.spec = L(A.spec, B.spec); o.reliefSoft = L(A.reliefSoft, B.reliefSoft);
  o.grain = L(A.grain, B.grain); o.bloom = L(A.bloom, B.bloom); o.mix = L(A.mix, B.mix);
  o.key = L(A.key, B.key); o.bevel = L(A.bevel, B.bevel); o.horizon = L(A.horizon, B.horizon); o.wave = L(A.wave, B.wave); o.waveSize = L(A.waveSize, B.waveSize);
  o.exDepth = L(A.exDepth, B.exDepth); o.exAngle = L(A.exAngle, B.exAngle); o.exPersp = L(A.exPersp, B.exPersp);
  o.exShade = L(A.exShade, B.exShade); o.exLines = L(A.exLines, B.exLines); o.exShadow = L(A.exShadow, B.exShadow);
  for (int i = 0; i < 4; i++) { o.glow[i].color = H(A.glow[i].color, B.glow[i].color); o.glow[i].size = L(A.glow[i].size, B.glow[i].size); o.glow[i].strength = L(A.glow[i].strength, B.glow[i].strength); }
  o.glSize = L(A.glSize, B.glSize); o.glRot = L(A.glRot, B.glRot); o.glColor = H(A.glColor, B.glColor);
  o.swAngle = L(A.swAngle, B.swAngle); o.swPos = L(A.swPos, B.swPos); o.swWidth = L(A.swWidth, B.swWidth); o.swStrength = L(A.swStrength, B.swStrength);
  o.rimColor = H(A.rimColor, B.rimColor); o.rimWidth = L(A.rimWidth, B.rimWidth);
  o.arcColor = H(A.arcColor, B.arcColor); o.arcSpread = L(A.arcSpread, B.arcSpread);
  copyDiscrete(o, t < 0.5 ? A : B);
  return o;
}

inline bool renderFrame(const brew::Image& src, const Params& A, const Params* B, const CtMotion& cm, const brew::Motion& m,
                        const brew::Clock& c, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0;
  Params base = B ? morph(A, *B, t) : A;
  if (!renderOut(src, applyMotion(base, cm, m, c), out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && discreteDiffers(A, *B)) {      // crossfade the switches so the morph never jumps
    Params other = base; copyDiscrete(other, t < 0.5 ? *B : A);
    brew::OutImage o2; if (!renderOut(src, applyMotion(other, cm, m, c), o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t), wO = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wO);
  }
  brew::applyGain(out, brew::motionGain(m, c));
  brew::motionPost(m, c, src, out, A.scale);
  return true;
}

}
