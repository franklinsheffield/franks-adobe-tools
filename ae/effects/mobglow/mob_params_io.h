// Text form of mob::Params ("key value" lines, same keys as the Photoshop state).
#pragma once
#include "mob_engine.h"
#include <sstream>
#include <map>
namespace mob {
inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  std::map<std::string, double*> num = {
    {"glow.radius", &P.radius}, {"glow.strength", &P.strength}, {"glow.threshold", &P.threshold}, {"glow.gamma", &P.gamma}, {"glow.sat", &P.sat},
    {"finish.grain", &P.grain}, {"finish.darken", &P.darken}, {"scale", &P.scale}, {"fullW", &P.fullW}, {"fullH", &P.fullH},
    {"m.grainSeed", &P.grainSeed}, {"m.hueShift", &P.hueShift}, {"m.shiftX", &P.shiftX}, {"m.shiftY", &P.shiftY}, {"m.gain", &P.gain} };
  auto it = num.find(k);
  if (it != num.end()) { *it->second = std::stod(v); return true; }
  if (k == "color.on") { P.colorOn = (v == "true"); return true; }
  if (k == "color.hex") { P.colorHex = v; return true; }
  return false;
}
inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) { auto sp = line.find(' '); if (sp != std::string::npos) setParam(P, line.substr(0, sp), line.substr(sp + 1)); }
}
}
