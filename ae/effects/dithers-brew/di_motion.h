// Frank's Dithers Brew for After Effects - dither motion + Look B morph.
#pragma once
#include "di_engine.h"
#include "../../core/motion.h"

namespace di {

struct DiMotion {
  double breathe = 0, breatheRate = 0.5;   // % the screen / pixel / line spacing / glyph size swells, Hz
  double tone = 0, toneRate = 0.5;         // % the ink threshold sweeps (darker <-> lighter), Hz
};

// Shared group mapping: Spin = screen angles (deg/s), Drift = pattern scroll (px/s, full res),
// Boil / Seed = re-roll grain, noise, distress and jitter; Pulse / Flicker = brightness (glue).
inline Params applyMotion(Params P, const DiMotion& dm, const brew::Motion& m, const brew::Clock& c) {
  if (!c.on) return P;
  const double TAU = 6.28318530717958647692;
  if (m.spin != 0) {
    const double a = m.spin * c.te;
    P.angle += a; for (auto& t : P.tonalAngles) t += a;
    for (int i = 0; i < 4; i++) P.cmykAngles[i] += a;
    for (int i = 0; i < 3; i++) P.rgbAngles[i] += a;
  }
  P.mox += c.drift(m.driftX, 0) * P.scale; P.moy += c.drift(m.driftY, 0) * P.scale;
  P.seedOff = (int)(c.randomTick(m) * 7919 % 100003) + (int)m.seed * 131;
  if (dm.breathe > 0) {
    const double k = 1 + dm.breathe / 100 * 0.5 * std::sin(TAU * c.cycles(dm.breatheRate));
    P.lpi = brew::clamp(P.lpi / k, 3, 300); P.pixel = std::max(1.0, P.pixel * k); P.tSpacing = std::max(2.0, P.tSpacing * k); P.aSize = std::max(1.0, P.aSize * k);
  }
  if (dm.tone > 0) P.tThreshold = brew::clamp(P.tThreshold + dm.tone / 2 * std::sin(TAU * c.cycles(dm.toneRate)), 0, 100);
  return P;
}

// discrete settings (switches, menus, counts, text) of `s` copied onto `o`
inline void copyDiscrete(Params& o, const Params& s) {
  o.engine = s.engine; o.algoHalftone = s.algoHalftone; o.algoDither = s.algoDither; o.algoAscii = s.algoAscii; o.mode = s.mode; o.aa = s.aa;
  o.tDirection = s.tDirection; o.aCustom = s.aCustom; o.aKeepOrder = s.aKeepOrder; o.aTextMode = s.aTextMode; o.aText = s.aText;
  o.monoPaper = s.monoPaper.empty() ? "" : (o.monoPaper.empty() ? s.monoPaper : o.monoPaper);
  o.tonalPaper = s.tonalPaper.empty() ? "" : (o.tonalPaper.empty() ? s.tonalPaper : o.tonalPaper);
  if (o.tonalInks.size() != s.tonalInks.size()) o.tonalInks = s.tonalInks;
  if (o.gradeColors.size() != s.gradeColors.size()) o.gradeColors = s.gradeColors;
  o.gradeOff = s.gradeOff; o.skipLightest = s.skipLightest;
  for (int i = 0; i < 4; i++) o.cmykOn[i] = s.cmykOn[i];
  for (int i = 0; i < 3; i++) o.rgbOn[i] = s.rgbOn[i];
  o.preOn = s.preOn; o.edgesOn = s.edgesOn; o.dtfOn = s.dtfOn; o.dots = s.dots;
  o.gainOn = s.gainOn; o.misregOn = s.misregOn; o.cleanOn = s.cleanOn; o.distressOn = s.distressOn;
}
inline bool discreteDiffers(const Params& a, const Params& b) {
  bool d = a.engine != b.engine || a.algoHalftone != b.algoHalftone || a.algoDither != b.algoDither || a.algoAscii != b.algoAscii || a.mode != b.mode ||
           a.aa != b.aa || a.tDirection != b.tDirection || a.aCustom != b.aCustom || a.aKeepOrder != b.aKeepOrder || a.aTextMode != b.aTextMode ||
           a.aText != b.aText || a.monoPaper.empty() != b.monoPaper.empty() || a.tonalPaper.empty() != b.tonalPaper.empty() ||
           a.tonalInks.size() != b.tonalInks.size() || a.gradeColors.size() != b.gradeColors.size() || a.gradeOff != b.gradeOff ||
           a.skipLightest != b.skipLightest || a.preOn != b.preOn || a.edgesOn != b.edgesOn || a.dtfOn != b.dtfOn || a.dots != b.dots ||
           a.gainOn != b.gainOn || a.misregOn != b.misregOn || a.cleanOn != b.cleanOn || a.distressOn != b.distressOn;
  for (int i = 0; i < 4; i++) d = d || a.cmykOn[i] != b.cmykOn[i];
  for (int i = 0; i < 3; i++) d = d || a.rgbOn[i] != b.rgbOn[i];
  return d;
}

inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  Params o = t >= 1 ? B : A;
  o.scale = A.scale; o.ppi = A.ppi;
  if (t >= 1) return o;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  auto H = [&](const std::string& a, const std::string& b) { return a.empty() || b.empty() ? (t < 0.5 ? a : b) : brew::lerpHex(a, b, t); };
  o.lpi = L(A.lpi, B.lpi); o.angle = L(A.angle, B.angle); o.pixel = L(A.pixel, B.pixel);
  o.tThreshold = L(A.tThreshold, B.tThreshold); o.tStrength = L(A.tStrength, B.tStrength); o.tWeight = L(A.tWeight, B.tWeight);
  o.tSpacing = L(A.tSpacing, B.tSpacing); o.tJitter = L(A.tJitter, B.tJitter); o.aSize = L(A.aSize, B.aSize); o.aEdge = L(A.aEdge, B.aEdge);
  o.monoInk = H(A.monoInk, B.monoInk); o.monoPaper = H(A.monoPaper, B.monoPaper); o.tonalPaper = H(A.tonalPaper, B.tonalPaper);
  if (A.tonalInks.size() == B.tonalInks.size()) for (size_t i = 0; i < A.tonalInks.size(); i++) o.tonalInks[i] = H(A.tonalInks[i], B.tonalInks[i]);
  for (size_t i = 0; i < o.tonalAngles.size() && i < A.tonalAngles.size() && i < B.tonalAngles.size(); i++) o.tonalAngles[i] = L(A.tonalAngles[i], B.tonalAngles[i]);
  if (A.gradeColors.size() == B.gradeColors.size()) for (size_t i = 0; i < A.gradeColors.size(); i++) o.gradeColors[i] = H(A.gradeColors[i], B.gradeColors[i]);
  o.gradeSpread = L(A.gradeSpread, B.gradeSpread); o.gcr = L(A.gcr, B.gcr);
  for (int i = 0; i < 4; i++) o.cmykAngles[i] = L(A.cmykAngles[i], B.cmykAngles[i]);
  for (int i = 0; i < 3; i++) { o.rgbAngles[i] = L(A.rgbAngles[i], B.rgbAngles[i]); o.rgbStrength[i] = L(A.rgbStrength[i], B.rgbStrength[i]); }
  // effect amounts fade from 0 when only one look uses them
  auto F = [&](bool aOn, bool bOn, double a, double b, double zero) { return L(aOn ? a : zero, bOn ? b : zero); };
  o.brightness = F(A.preOn, B.preOn, A.brightness, B.brightness, 0); o.contrast = F(A.preOn, B.preOn, A.contrast, B.contrast, 0);
  o.gamma = F(A.preOn, B.preOn, A.gamma, B.gamma, 1); o.black = F(A.preOn, B.preOn, A.black, B.black, 0); o.white = F(A.preOn, B.preOn, A.white, B.white, 255);
  o.blur = F(A.preOn, B.preOn, A.blur, B.blur, 0); o.sharpen = F(A.preOn, B.preOn, A.sharpen, B.sharpen, 0); o.radius = L(A.radius, B.radius);
  o.noise = F(A.preOn, B.preOn, A.noise, B.noise, 0); o.haze = F(A.preOn, B.preOn, A.haze, B.haze, 0); o.invert = F(A.preOn, B.preOn, A.invert, B.invert, 0);
  o.edgeStrength = L(A.edgeStrength, B.edgeStrength); o.edgeThick = L(A.edgeThick, B.edgeThick);
  o.garment = H(A.garment, B.garment); o.fuzz = L(A.fuzz, B.fuzz); o.feather = L(A.feather, B.feather);
  o.gainAmount = L(A.gainAmount, B.gainAmount); o.misregAmount = L(A.misregAmount, B.misregAmount);
  o.cleanMm = L(A.cleanMm, B.cleanMm); o.distressAmount = F(A.distressOn, B.distressOn, A.distressAmount, B.distressAmount, 0);
  copyDiscrete(o, t < 0.5 ? A : B);
  o.preOn = A.preOn || B.preOn; o.distressOn = A.distressOn || B.distressOn;
  return o;
}

inline bool renderFrame(const brew::Image& src, const Params& A, const Params* B, bool transparent, const DiMotion& dm, const brew::Motion& m,
                        const brew::Clock& c, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0;
  Params base = B ? morph(A, *B, t) : A;
  if (!renderOut(src, applyMotion(base, dm, m, c), transparent, out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && discreteDiffers(A, *B)) {      // crossfade the switches so the morph never jumps
    Params other = base; copyDiscrete(other, t < 0.5 ? *B : A);
    other.preOn = base.preOn; other.distressOn = base.distressOn;
    brew::OutImage o2; if (!renderOut(src, applyMotion(other, dm, m, c), transparent, o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t), wO = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wO);
  }
  brew::applyGain(out, brew::motionGain(m, c));
  brew::motionPost(m, c, src, out, A.scale);
  return true;
}

}
