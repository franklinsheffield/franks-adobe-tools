// Motion test CLI: crt_frames <in.rgba> <w> <h> <params.txt> <out_prefix> <frames> <fps>
// params.txt: look keys (crt_params_io.h) + "mo.<field>" (shared Motion) + "cm.<field>" (CRT motion).
#include "../effects/crt-phaser/crt_params_io.h"
#include "../effects/crt-phaser/crt_motion.h"
#include <fstream>
#include <iterator>
using namespace brew;
static bool setMotion(Motion& m, crt::CrtMotion& c, const std::string& k, double v) {
  std::map<std::string, double*> M = {
    {"mo.speed", &m.speed}, {"mo.loopFrames", &m.loopFrames}, {"mo.seed", &m.seed}, {"mo.boil", &m.boil},
    {"mo.driftX", &m.driftX}, {"mo.driftY", &m.driftY}, {"mo.spin", &m.spin}, {"mo.pulse", &m.pulse}, {"mo.pulseRate", &m.pulseRate},
    {"mo.flicker", &m.flicker}, {"mo.flickerRate", &m.flickerRate}, {"mo.jitter", &m.jitter}, {"mo.jitterRate", &m.jitterRate},
    {"mo.reveal", &m.reveal}, {"mo.revealAngle", &m.revealAngle}, {"mo.morph", &m.morph},
    {"cm.rollSpeed", &c.rollSpeed}, {"cm.holdSpeed", &c.holdSpeed}, {"cm.snow", &c.snow}, {"cm.tubeFlicker", &c.tubeFlicker},
    {"cm.glitchRate", &c.glitchRate}, {"cm.glitchLength", &c.glitchLength}, {"cm.glitchAmount", &c.glitchAmount},
    {"cm.convWobble", &c.convWobble}, {"cm.fieldFlow", &c.fieldFlow}, {"cm.warpFlow", &c.warpFlow} };
  if (k == "mo.animate") { m.animate = v != 0; return true; }
  if (k == "mo.revealMode") { m.revealMode = (int)v; return true; }
  auto it = M.find(k); if (it == M.end()) return false; *it->second = v; return true;
}
int main(int argc, char** argv) {
  if (argc < 8) return 2;
  int w = atoi(argv[2]), h = atoi(argv[3]), N = atoi(argv[6]); double fps = atof(argv[7]);
  std::ifstream fi(argv[1], std::ios::binary); std::vector<unsigned char> d((std::istreambuf_iterator<char>(fi)), {});
  Image im; im.resize(w, h);
  for (int i = 0; i < w * h; i++) { im.R[i] = d[i * 4]; im.G[i] = d[i * 4 + 1]; im.B[i] = d[i * 4 + 2]; im.A[i] = d[i * 4 + 3]; }
  std::ifstream fp(argv[4]); std::string line;
  crt::Params A, B; Motion m; crt::CrtMotion cm; bool hasB = false;
  while (std::getline(fp, line)) {
    auto sp = line.find(' '); if (sp == std::string::npos) continue;
    std::string k = line.substr(0, sp), v = line.substr(sp + 1);
    if (k.rfind("mo.", 0) == 0 || k.rfind("cm.", 0) == 0) setMotion(m, cm, k, std::stod(v));
    else if (k.rfind("B.", 0) == 0) { hasB = true; crt::setParam(B, k.substr(2), v); }
    else crt::setParam(A, k, v);
  }
  B.scale = A.scale; B.fullH = A.fullH;
  for (int f = 0; f < N; f++) {
    Clock c = Clock::make(m, f / fps, fps);
    OutImage o; crt::renderFrame(im, A, hasB ? &B : nullptr, cm, m, c, o);
    std::vector<unsigned char> b(o.px.size());
    for (size_t i = 0; i < b.size(); i++) { double v = o.px[i]; b[i] = (unsigned char)(int)(v < 0 ? 0 : v > 255 ? 255 : v); }
    std::ofstream fo(std::string(argv[5]) + std::to_string(f) + ".rgba", std::ios::binary); fo.write((char*)b.data(), b.size());
  }
  return 0;
}
