// Text form of dt::Params (same keys as the Photoshop state).
#pragma once
#include "dt_engine.h"
#include <sstream>
#include <map>
namespace dt {
inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  std::map<std::string, double*> num = {
    {"depth.smooth", &P.smooth}, {"depth.near", &P.near_}, {"depth.far", &P.far_}, {"depth.levels", &P.levels},
    {"look.fog", &P.fog}, {"lines.width", &P.lineWidth}, {"lines.every", &P.every},
    {"light.angle", &P.lightAngle}, {"light.shadow", &P.shadow}, {"light.strength", &P.lightStrength},
    {"scale", &P.scale}, {"fullH", &P.fullH}, {"m.depthPhase", &P.depthPhase}, {"m.shiftX", &P.shiftX}, {"m.shiftY", &P.shiftY} };
  auto it = num.find(k);
  if (it != num.end()) { *it->second = std::stod(v); return true; }
  if (k == "depth.invert") { P.invert = v == "true"; return true; }
  if (k == "style") { P.style = v == "contours" ? CONTOURS : v == "relief" ? RELIEF : TERRACES; return true; }
  if (k == "look.stops") { P.stops = brew::parseStops(v); return true; }
  if (k == "look.fogColor") { P.fogColor = v; return true; }
  if (k == "lines.colorBy") { P.colorByDepth = v == "depth"; return true; }
  if (k == "lines.color") { P.lineColor = v; return true; }
  if (k == "lines.fill") { P.fill = v == "true"; return true; }
  return false;
}
inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) { auto sp = line.find(' '); if (sp != std::string::npos) setParam(P, line.substr(0, sp), line.substr(sp + 1)); }
}
}
