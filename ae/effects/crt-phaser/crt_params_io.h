// Text form of crt::Params ("key value" lines), shared by the test CLI and the
// preset generator so Photoshop looks load into the AE effect unchanged.
#pragma once
#include "crt_engine.h"
#include <sstream>
#include <map>
#include <functional>

namespace crt {

inline int enumOf(const std::string& v, std::initializer_list<const char*> names) {
  int i = 0; for (auto n : names) { if (v == n) return i; i++; } return 0;
}

inline bool setParam(Params& P, const std::string& k, const std::string& v) {
  std::map<std::string, double*> num = {
    {"screen.lines", &P.screenLines}, {"conv.x", &P.convX}, {"conv.y", &P.convY},
    {"mask.scale", &P.maskScale}, {"mask.strength", &P.maskStrength},
    {"scan.strength", &P.scanStrength}, {"scan.width", &P.scanWidth},
    {"tube.bloom", &P.bloom}, {"tube.curve", &P.curve}, {"tube.corner", &P.corner}, {"tube.vignette", &P.vignette},
    {"signal.noise", &P.noise}, {"signal.roll", &P.roll}, {"signal.rollStrength", &P.rollStrength},
    {"finish.brightness", &P.brightness}, {"finish.contrast", &P.contrast},
    {"phase.lines", &P.phLines}, {"phase.amp", &P.phAmp}, {"phase.smooth", &P.phSmooth}, {"phase.width", &P.phWidth},
    {"phase.threshold", &P.phThreshold}, {"phase.angle", &P.phAngle}, {"phase.warp", &P.phWarp}, {"phase.detail", &P.phDetail},
    {"phase.dots", &P.phDots}, {"phase.glow", &P.phGlow}, {"phase.fringe", &P.phFringe}, {"phase.debris", &P.phDebris},
    {"phase.flare", &P.phFlare}, {"phase.grain", &P.phGrain}, {"phase.seed", &P.phSeed},
    {"scale", &P.scale}, {"fullH", &P.fullH},
    {"m.scanShift", &P.scanShift}, {"m.maskShiftX", &P.maskShiftX}, {"m.holdRoll", &P.holdRoll}, {"m.noiseSeed", &P.noiseSeed},
    {"m.snow", &P.snow}, {"m.fieldShift", &P.fieldShift}, {"m.flowX", &P.flowX}, {"m.flowY", &P.flowY},
    {"m.gain", &P.gain}, {"m.glitch", &P.glitch}, {"m.glitchSeed", &P.glitchSeed},
  };
  auto it = num.find(k);
  if (it != num.end()) { *it->second = std::stod(v); return true; }
  if (k == "mask.type") { P.maskType = enumOf(v, {"none", "grille", "shadow", "slot", "dots"}); return true; }
  if (k == "finish.tint") { P.tint = enumOf(v, {"none", "green", "amber", "white"}); return true; }
  if (k == "phase.mode") { P.phaseMode = enumOf(v, {"off", "waveform", "linear", "flux", "fluxdots"}); return true; }
  if (k == "phase.color") { P.phColorFull = (v == "full"); return true; }
  if (k == "phase.base") { P.phBase = v; return true; }
  if (k == "phase.ramp") {             // "p:#hex p:#hex ..."
    P.phRamp.clear(); std::istringstream ss(v); std::string tok;
    while (ss >> tok) { auto c = tok.find(':'); if (c != std::string::npos) P.phRamp.push_back({ std::stod(tok.substr(0, c)), tok.substr(c + 1) }); }
    return true;
  }
  return false;
}

inline void parseParams(Params& P, const std::string& text) {
  std::istringstream in(text); std::string line;
  while (std::getline(in, line)) {
    auto sp = line.find(' '); if (sp == std::string::npos) continue;
    setParam(P, line.substr(0, sp), line.substr(sp + 1));
  }
}

} // namespace crt
