// Text form of ct::Params ("key value" lines, same keys as the Photoshop state; arrays by index).
#pragma once
#include "ct_engine.h"
#include <sstream>
#include <map>

namespace ct {

inline int enumOf(const std::string& v, std::initializer_list<const char*> names, int dflt = 0) {
  int i = 0; for (auto n : names) { if (v == n) return i; i++; } return dflt;
}

inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  std::map<std::string, double*> num = {
    {"tone.blur", &P.blur}, {"tone.contrast", &P.contrast}, {"tone.mid", &P.mid},
    {"bands.count", &P.bandCount}, {"bands.phase", &P.bandPhase}, {"bands.soft", &P.bandSoft}, {"bands.mix", &P.bandMix},
    {"relief.depth", &P.depth}, {"relief.angle", &P.angle}, {"relief.gloss", &P.gloss}, {"relief.spec", &P.spec}, {"relief.soft", &P.reliefSoft},
    {"finish.grain", &P.grain}, {"finish.bloom", &P.bloom}, {"finish.mix", &P.mix},
    {"surface.key", &P.key}, {"surface.bevel", &P.bevel}, {"surface.horizon", &P.horizon}, {"surface.wave", &P.wave}, {"surface.waveSize", &P.waveSize},
    {"extrude.depth", &P.exDepth}, {"extrude.angle", &P.exAngle}, {"extrude.persp", &P.exPersp}, {"extrude.shade", &P.exShade}, {"extrude.lines", &P.exLines}, {"extrude.shadow", &P.exShadow},
    {"shine.glints.count", &P.glCount}, {"shine.glints.size", &P.glSize}, {"shine.glints.rays", &P.glRays}, {"shine.glints.rot", &P.glRot},
    {"shine.sweep.angle", &P.swAngle}, {"shine.sweep.pos", &P.swPos}, {"shine.sweep.width", &P.swWidth}, {"shine.sweep.strength", &P.swStrength},
    {"shine.rim.width", &P.rimWidth}, {"shine.arcs.count", &P.arcCount}, {"shine.arcs.spread", &P.arcSpread},
    {"scale", &P.scale},
    {"m.grainX", &P.grainX}, {"m.grainY", &P.grainY}, {"m.horizonX", &P.horizonX}, {"m.horizonY", &P.horizonY} };
  auto it = num.find(k);
  if (it != num.end()) { *it->second = std::stod(v); return true; }
  std::map<std::string, bool*> bools = { {"look.invert", &P.invert}, {"extrude.on", &P.exOn}, {"shine.glints.on", &P.glOn},
    {"shine.sweep.on", &P.swOn}, {"shine.rim.on", &P.rimOn}, {"shine.arcs.on", &P.arcOn} };
  auto ib = bools.find(k);
  if (ib != bools.end()) { *ib->second = v == "true"; return true; }
  std::map<std::string, std::string*> strs = { {"shine.glints.color", &P.glColor}, {"shine.rim.color", &P.rimColor}, {"shine.arcs.color", &P.arcColor} };
  auto is = strs.find(k);
  if (is != strs.end()) { *is->second = v; return true; }
  if (k == "look.stops") { P.stops = brew::parseStops(v); return true; }
  if (k == "surface.sky") { P.sky = brew::parseStops(v); return true; }
  if (k == "surface.ground") { P.ground = brew::parseStops(v); return true; }
  if (k == "extrude.stops") { P.exStops = brew::parseStops(v); return true; }
  if (k == "bands.shape") { P.bandShape = enumOf(v, {"sine", "triangle", "hard"}); return true; }
  if (k == "surface.from") { P.from = enumOf(v, {"brightness", "auto", "outline"}); return true; }
  if (k == "surface.profile") { P.profile = enumOf(v, {"chamfer", "round", "rim"}); return true; }
  if (k == "surface.reflect") { P.reflect = enumOf(v, {"gradient", "horizon"}); return true; }
  if (k.compare(0, 13, "glow.modules.") == 0 && k.size() > 15) {
    int m = k[13] - '0'; if (m < 0 || m > 3) return false;
    std::string f = k.substr(15); GlowMod& g = P.glow[m];
    if (f == "on") g.on = v == "true";
    else if (f == "type") g.type = enumOf(v, {"dreamy", "halo", "neon", "bloom", "inner"});
    else if (f == "color") g.color = v;
    else if (f == "size") g.size = std::stod(v);
    else if (f == "strength") g.strength = std::stod(v);
    else return false;
    return true;
  }
  return false;
}
inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) { auto sp = line.find(' '); if (sp != std::string::npos) setParam(P, line.substr(0, sp), line.substr(sp + 1)); }
}
}
