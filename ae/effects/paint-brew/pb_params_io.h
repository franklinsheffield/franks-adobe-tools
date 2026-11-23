// Text form of pb::Params ("key value" lines, same keys as the Photoshop state).
#pragma once
#include "pb_engine.h"
#include <sstream>
#include <map>

namespace pb {

inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  std::map<std::string, double*> nums = {
    {"seed", &P.seed}, {"scale", &P.scale}, {"fullW", &P.fullW}, {"fullH", &P.fullH},
    {"brush.size", &P.bSize}, {"brush.length", &P.bLength}, {"brush.detail", &P.bDetail}, {"brush.randomness", &P.bRandomness}, {"brush.follow", &P.bFollow}, {"brush.mix", &P.bMix},
    {"colour.simplify", &P.cSimplify}, {"colour.saturation", &P.cSaturation}, {"colour.warmth", &P.cWarmth}, {"colour.jitter", &P.cJitter}, {"colour.palette", &P.cPalette},
    {"texture.impasto", &P.tImpasto}, {"texture.light", &P.tLight}, {"texture.bristle", &P.tBristle}, {"texture.canvas", &P.tCanvas}, {"texture.canvasScale", &P.tCanvasScale},
    {"texture.lift", &P.tLift}, {"texture.thickLights", &P.tThickLights},
    {"water.density", &P.wDensity}, {"water.wetEdge", &P.wWetEdge}, {"water.granulation", &P.wGranulation}, {"water.bleed", &P.wBleed}, {"water.paperTexture", &P.wPaperTexture},
    {"water.pencil", &P.wPencil}, {"water.splashes", &P.wSplashes}, {"water.splashSize", &P.wSplashSize}, {"water.fade", &P.wFade},
    {"ink.flow", &P.iFlow}, {"ink.rim", &P.iRim}, {"ink.cells", &P.iCells}, {"ink.blend", &P.iBlend}, {"ink.veins", &P.iVeins},
    {"spray.cans", &P.sCans}, {"spray.soft", &P.sSoft}, {"spray.overspray", &P.sOverspray}, {"spray.speckle", &P.sSpeckle}, {"spray.halftone", &P.sHalftone},
    {"spray.drips", &P.sDrips}, {"spray.dripLength", &P.sDripLength}, {"spray.outline", &P.sOutline}, {"spray.highlight", &P.sHighlight}, {"spray.relief", &P.sRelief},
    {"spray.bare", &P.sBare}, {"spray.paintOpacity", &P.sPaintOpacity}, {"spray.grime", &P.sGrime}, {"spray.cracks", &P.sCracks}, {"spray.brickSize", &P.sBrickSize},
    {"spray.mortar", &P.sMortar}, {"spray.brickVariation", &P.sBrickVariation}, {"spray.plankWidth", &P.sPlankWidth}, {"spray.grain", &P.sGrain}, {"spray.knots", &P.sKnots},
    {"pastel.tooth", &P.pTooth}, {"pastel.smudge", &P.pSmudge}, {"pastel.pressure", &P.pPressure}, {"pastel.angle", &P.pAngle},
    {"focus.falloff", &P.fFalloff}, {"focus.outside", &P.fOutside},
  };
  auto it = nums.find(k); if (it != nums.end()) { *it->second = v.empty() ? 0 : std::stod(v); return true; }
  std::map<std::string, std::string*> strs = {
    {"brush.tool", &P.bTool}, {"water.paperColour", &P.wPaper}, {"ink.metal", &P.iMetal}, {"spray.wall", &P.sWall}, {"spray.wallColour", &P.sWallColour},
    {"spray.blend", &P.sBlend}, {"spray.brickPattern", &P.sBrickPattern}, {"spray.mortarColour", &P.sMortarColour}, {"spray.woodDir", &P.sWoodDir},
    {"spray.woodFinish", &P.sWoodFinish}, {"pastel.paper", &P.pPaper}, {"pastel.hatch", &P.pHatch},
  };
  auto is = strs.find(k); if (is != strs.end()) { *is->second = v; return true; }
  if (k == "pastel.oil") { P.pOil = v == "true"; return true; }
  if (k == "style") { P.style = ST_OIL; for (int i = 0; i < 6; i++) if (v == STYLE_IDS[i]) P.style = i; return true; }
  return false;
}
inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) { auto sp = line.find(' '); if (sp != std::string::npos) setParam(P, line.substr(0, sp), line.substr(sp + 1)); }
}
}
