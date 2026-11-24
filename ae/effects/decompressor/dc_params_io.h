// Text form of dc::Params (same keys as the Photoshop state).
#pragma once
#include "dc_engine.h"
#include <sstream>
#include <map>
namespace dc {
inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  std::map<std::string, double*> num = {
    {"jpeg.quality", &P.quality}, {"jpeg.generations", &P.generations}, {"crush.bits", &P.bits},
    {"mosh.amount", &P.moshAmount}, {"mosh.dir", &P.moshDir}, {"mosh.block", &P.moshBlock},
    {"glitch.slices", &P.slices}, {"glitch.offset", &P.offset}, {"glitch.seed", &P.seed}, {"finish.mix", &P.mix},
    {"scale", &P.scale}, {"fullH", &P.fullH}, {"m.gridX", &P.gridX}, {"m.gridY", &P.gridY}, {"m.sliceRoll", &P.sliceRoll} };
  auto it = num.find(k);
  if (it != num.end()) { *it->second = std::stod(v); return true; }
  if (k == "jpeg.on") { P.jpegOn = v == "true"; return true; }
  if (k == "jpeg.chroma") { P.chroma = v == "411" ? C411 : v == "420" ? C420 : C444; return true; }
  return false;
}
inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) { auto sp = line.find(' '); if (sp != std::string::npos) setParam(P, line.substr(0, sp), line.substr(sp + 1)); }
}
}
