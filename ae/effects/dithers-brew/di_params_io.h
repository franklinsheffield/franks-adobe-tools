// Text form of di::Params ("key value" lines, same keys as the Photoshop state; arrays by index).
#pragma once
#include "di_engine.h"
#include <sstream>
#include <map>
#include <cstring>

namespace di {

inline int enumOf(const std::string& v, std::initializer_list<const char*> names, int dflt = 0) {
  int i = 0; for (auto n : names) { if (v == n) return i; i++; } return dflt;
}
// "a.b.N" -> N (or -1)
inline int idxOf(const std::string& k, const char* prefix) {
  size_t L = strlen(prefix); if (k.compare(0, L, prefix) != 0 || k.size() <= L) return -1;
  for (size_t i = L; i < k.size(); i++) if (!isdigit((unsigned char)k[i])) return -1;
  return atoi(k.c_str() + L);
}
template <class T> inline void putAt(std::vector<T>& v, int i, const T& x) { if (i == 0) v.clear(); if ((int)v.size() <= i) v.resize(i + 1); v[i] = x; }

inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  auto num = [&](double* d) { *d = v.empty() ? 0 : std::stod(v); return true; };
  auto bol = [&](bool* b) { *b = v == "true"; return true; };
  std::map<std::string, double*> nums = {
    {"lpi", &P.lpi}, {"angle", &P.angle}, {"pixel", &P.pixel}, {"ppi", &P.ppi}, {"scale", &P.scale},
    {"tune.threshold", &P.tThreshold}, {"tune.strength", &P.tStrength}, {"tune.weight", &P.tWeight}, {"tune.spacing", &P.tSpacing}, {"tune.jitter", &P.tJitter},
    {"ascii.size", &P.aSize}, {"ascii.edge", &P.aEdge}, {"grade.spread", &P.gradeSpread}, {"cmyk.gcr", &P.gcr},
    {"fx.pre.brightness", &P.brightness}, {"fx.pre.contrast", &P.contrast}, {"fx.pre.gamma", &P.gamma}, {"fx.pre.black", &P.black}, {"fx.pre.white", &P.white},
    {"fx.pre.blur", &P.blur}, {"fx.pre.sharpen", &P.sharpen}, {"fx.pre.radius", &P.radius}, {"fx.pre.noise", &P.noise}, {"fx.pre.haze", &P.haze},
    {"fx.edges.strength", &P.edgeStrength}, {"fx.edges.thick", &P.edgeThick}, {"fx.dtf.fuzz", &P.fuzz}, {"fx.dtf.feather", &P.feather},
    {"fx.gain.amount", &P.gainAmount}, {"fx.misreg.amount", &P.misregAmount}, {"fx.clean.mm", &P.cleanMm}, {"fx.distress.amount", &P.distressAmount},
  };
  auto it = nums.find(k); if (it != nums.end()) return num(it->second);
  std::map<std::string, bool*> bools = {
    {"aa", &P.aa}, {"ascii.keepOrder", &P.aKeepOrder}, {"ascii.textMode", &P.aTextMode}, {"grade.skipLightest", &P.skipLightest},
    {"fx.pre.on", &P.preOn}, {"fx.edges.on", &P.edgesOn}, {"fx.dtf.on", &P.dtfOn}, {"fx.dtf.dots", &P.dots}, {"fx.gain.on", &P.gainOn},
    {"fx.misreg.on", &P.misregOn}, {"fx.clean.on", &P.cleanOn}, {"fx.distress.on", &P.distressOn},
  };
  auto ib = bools.find(k); if (ib != bools.end()) return bol(ib->second);
  std::map<std::string, std::string*> strs = {
    {"algo.halftone", &P.algoHalftone}, {"algo.dither", &P.algoDither}, {"algo.ascii", &P.algoAscii}, {"tune.direction", &P.tDirection},
    {"ascii.custom", &P.aCustom}, {"ascii.text", &P.aText}, {"mono.ink", &P.monoInk}, {"mono.paper", &P.monoPaper},
    {"tonal.paper", &P.tonalPaper}, {"fx.dtf.garment", &P.garment},
  };
  auto is = strs.find(k); if (is != strs.end()) { *is->second = v; return true; }
  if (k == "engine") { P.engine = enumOf(v, {"halftone", "dither", "ascii"}); return true; }
  if (k == "mode") { P.mode = enumOf(v, {"mono", "tonal", "grade", "rgb", "cmyk"}); return true; }
  if (k == "fx.pre.invert") { P.invert = v == "true" ? 100 : v == "false" || v.empty() ? 0 : std::stod(v); return true; }
  if (k == "grade.off") { P.gradeOff.clear(); return true; }
  int i;
  if ((i = idxOf(k, "tonal.inks.")) >= 0) { putAt(P.tonalInks, i, v); return true; }
  if ((i = idxOf(k, "tonal.angles.")) >= 0) { putAt(P.tonalAngles, i, std::stod(v)); return true; }
  if ((i = idxOf(k, "grade.colors.")) >= 0) { putAt(P.gradeColors, i, v); return true; }
  if ((i = idxOf(k, "grade.off.")) >= 0) { putAt(P.gradeOff, i, atoi(v.c_str())); return true; }
  if ((i = idxOf(k, "cmyk.angles.")) >= 0 && i < 4) { P.cmykAngles[i] = std::stod(v); return true; }
  if ((i = idxOf(k, "cmyk.on.")) >= 0 && i < 4) { P.cmykOn[i] = v == "true"; return true; }
  if ((i = idxOf(k, "rgb.angles.")) >= 0 && i < 3) { P.rgbAngles[i] = std::stod(v); return true; }
  if ((i = idxOf(k, "rgb.on.")) >= 0 && i < 3) { P.rgbOn[i] = v == "true"; return true; }
  if ((i = idxOf(k, "rgb.strength.")) >= 0 && i < 3) { P.rgbStrength[i] = std::stod(v); return true; }
  return false;   // tonal.tone, grade.palette, grade.count, fx.dtf.view: panel-only
}
inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) { auto sp = line.find(' '); if (sp != std::string::npos) setParam(P, line.substr(0, sp), line.substr(sp + 1)); }
}
}
