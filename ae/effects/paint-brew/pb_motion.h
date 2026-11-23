// Frank's Paint Brew for After Effects - paint motion + Look B morph.
#pragma once
#include "pb_engine.h"
#include "../../core/motion.h"

namespace pb {

struct PbMotion {
  double paintOn = 0;                    // seconds to paint the picture in (0 = painted from the first frame)
  double breathe = 0, breatheRate = 0.5; // % the brush size swells, Hz
};

// Shared group mapping: Spin = the light orbits (impasto, weave, paper texture), Drift = the canvas /
// wall / paper surface slides under the paint, Boil / Seed = re-paint the strokes; Pulse / Flicker = brightness.
inline Params applyMotion(Params P, const PbMotion& pm, const brew::Motion& m, const brew::Clock& c) {
  if (!c.on) return P;
  const double TAU = 6.28318530717958647692;
  if (m.spin != 0) { P.tLight = std::fmod(P.tLight + m.spin * c.te, 360); P.paperLight = std::fmod(P.paperLight + m.spin * c.te, 360); }
  P.ox += c.drift(m.driftX, 0) * P.scale; P.oy += c.drift(m.driftY, 0) * P.scale;
  if (m.boil > 0 || m.seed > 0) P.seed = P.seed + (m.boil > 0 ? (double)c.randomTick(m) * 17 : 0) + std::round(m.seed);
  if (pm.breathe > 0) P.bSize = std::max(2.0, P.bSize * (1 + pm.breathe / 100 * 0.5 * std::sin(TAU * c.cycles(pm.breatheRate))));
  if (pm.paintOn > 0) P.reveal = brew::clamp(c.te / pm.paintOn, 0, 1);
  return P;
}

// discrete settings (style, menus, switches) of `s` copied onto `o`
inline void copyDiscrete(Params& o, const Params& s) {
  o.style = s.style; o.seed = s.seed; o.bTool = s.bTool; o.iMetal = s.iMetal; o.sWall = s.sWall; o.sBlend = s.sBlend;
  o.sBrickPattern = s.sBrickPattern; o.sWoodDir = s.sWoodDir; o.sWoodFinish = s.sWoodFinish; o.pHatch = s.pHatch; o.pOil = s.pOil;
  o.cPalette = s.cPalette;
}
inline bool discreteDiffers(const Params& a, const Params& b) {
  return a.style != b.style || a.seed != b.seed || a.bTool != b.bTool || a.iMetal != b.iMetal || a.sWall != b.sWall || a.sBlend != b.sBlend ||
         a.sBrickPattern != b.sBrickPattern || a.sWoodDir != b.sWoodDir || a.sWoodFinish != b.sWoodFinish || a.pHatch != b.pHatch ||
         a.pOil != b.pOil || a.cPalette != b.cPalette;
}

inline Params morph(const Params& A, const Params& B, double t) {
  if (t <= 0) return A;
  Params o = t >= 1 ? B : A;
  o.scale = A.scale; o.fullW = A.fullW; o.fullH = A.fullH;
  if (t >= 1) return o;
  auto L = [&](double a, double b) { return a + (b - a) * t; };
  auto H = [&](const std::string& a, const std::string& b) { return brew::lerpHex(a, b, t); };
  o.bSize = L(A.bSize, B.bSize); o.bLength = L(A.bLength, B.bLength); o.bDetail = L(A.bDetail, B.bDetail); o.bRandomness = L(A.bRandomness, B.bRandomness);
  o.bFollow = L(A.bFollow, B.bFollow); o.bMix = L(A.bMix, B.bMix);
  o.cSimplify = L(A.cSimplify, B.cSimplify); o.cSaturation = L(A.cSaturation, B.cSaturation); o.cWarmth = L(A.cWarmth, B.cWarmth); o.cJitter = L(A.cJitter, B.cJitter);
  o.tImpasto = L(A.tImpasto, B.tImpasto); o.tLight = L(A.tLight, B.tLight); o.tBristle = L(A.tBristle, B.tBristle); o.tCanvas = L(A.tCanvas, B.tCanvas);
  o.tCanvasScale = L(A.tCanvasScale, B.tCanvasScale); o.tLift = L(A.tLift, B.tLift); o.tThickLights = L(A.tThickLights, B.tThickLights);
  o.wPaper = H(A.wPaper, B.wPaper); o.wDensity = L(A.wDensity, B.wDensity); o.wWetEdge = L(A.wWetEdge, B.wWetEdge); o.wGranulation = L(A.wGranulation, B.wGranulation);
  o.wBleed = L(A.wBleed, B.wBleed); o.wPaperTexture = L(A.wPaperTexture, B.wPaperTexture); o.wPencil = L(A.wPencil, B.wPencil);
  o.wSplashes = std::round(L(A.wSplashes, B.wSplashes)); o.wSplashSize = L(A.wSplashSize, B.wSplashSize); o.wFade = L(A.wFade, B.wFade);
  o.iFlow = L(A.iFlow, B.iFlow); o.iRim = L(A.iRim, B.iRim); o.iCells = L(A.iCells, B.iCells); o.iBlend = L(A.iBlend, B.iBlend); o.iVeins = L(A.iVeins, B.iVeins);
  o.sCans = L(A.sCans, B.sCans); o.sSoft = L(A.sSoft, B.sSoft); o.sOverspray = L(A.sOverspray, B.sOverspray); o.sSpeckle = L(A.sSpeckle, B.sSpeckle);
  o.sHalftone = L(A.sHalftone, B.sHalftone); o.sDrips = L(A.sDrips, B.sDrips); o.sDripLength = L(A.sDripLength, B.sDripLength); o.sOutline = L(A.sOutline, B.sOutline);
  o.sHighlight = L(A.sHighlight, B.sHighlight); o.sWallColour = H(A.sWallColour, B.sWallColour); o.sRelief = L(A.sRelief, B.sRelief); o.sBare = L(A.sBare, B.sBare);
  o.sPaintOpacity = L(A.sPaintOpacity, B.sPaintOpacity); o.sGrime = L(A.sGrime, B.sGrime); o.sCracks = L(A.sCracks, B.sCracks);
  o.sBrickSize = L(A.sBrickSize, B.sBrickSize); o.sMortar = L(A.sMortar, B.sMortar); o.sMortarColour = H(A.sMortarColour, B.sMortarColour);
  o.sBrickVariation = L(A.sBrickVariation, B.sBrickVariation); o.sPlankWidth = L(A.sPlankWidth, B.sPlankWidth); o.sGrain = L(A.sGrain, B.sGrain); o.sKnots = L(A.sKnots, B.sKnots);
  o.pPaper = H(A.pPaper, B.pPaper); o.pTooth = L(A.pTooth, B.pTooth); o.pSmudge = L(A.pSmudge, B.pSmudge); o.pPressure = L(A.pPressure, B.pPressure); o.pAngle = L(A.pAngle, B.pAngle);
  o.fFalloff = L(A.fFalloff, B.fFalloff); o.fOutside = L(A.fOutside, B.fOutside);
  copyDiscrete(o, t < 0.5 ? A : B);
  return o;
}

inline bool renderFrame(const brew::Image& src, const Params& A, const Params* B, const PbMotion& pm, const brew::Motion& m,
                        const brew::Clock& c, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr) {
  double t = B ? brew::clamp(m.morph / 100, 0, 1) : 0;
  Params base = B ? morph(A, *B, t) : A;
  if (!renderOut(src, applyMotion(base, pm, m, c), out, pf, ctx)) return false;
  if (B && t > 0 && t < 1 && discreteDiffers(A, *B)) {      // crossfade the styles / switches so the morph never jumps
    Params other = base; copyDiscrete(other, t < 0.5 ? *B : A);
    brew::OutImage o2; if (!renderOut(src, applyMotion(other, pm, m, c), o2, pf, ctx)) return false;
    double sB = t * t * (3 - 2 * t), wO = t < 0.5 ? sB : 1 - sB;
    for (size_t i = 0; i < out.px.size(); i++) out.px[i] = (float)(out.px[i] + (o2.px[i] - out.px[i]) * wO);
  }
  brew::applyGain(out, brew::motionGain(m, c));
  brew::motionPost(m, c, src, out, A.scale);
  return true;
}

}
