// Motion test CLI: tool_frames <tool> <in.rgba> <w> <h> <params.txt> <out_prefix> <frames> <fps>
// params.txt: look keys + "mo.<field>" (shared Motion) + "tm.<field>" (tool motion) + "B.<look key>" (Look B).
// The source pans 3 px/frame to the right so the temporal datamosh has motion to grab.
#include "../effects/mobglow/mob_params_io.h"
#include "../effects/mobglow/mob_motion.h"
#include "../effects/depthtone/dt_params_io.h"
#include "../effects/depthtone/dt_motion.h"
#include "../effects/decompressor/dc_params_io.h"
#include "../effects/decompressor/dc_motion.h"
#include <fstream>
#include <iterator>
using namespace brew;
static bool setMotion(Motion& m, const std::string& k, double v) {
  std::map<std::string, double*> M = {
    {"mo.speed", &m.speed}, {"mo.loopFrames", &m.loopFrames}, {"mo.seed", &m.seed}, {"mo.boil", &m.boil},
    {"mo.driftX", &m.driftX}, {"mo.driftY", &m.driftY}, {"mo.spin", &m.spin}, {"mo.pulse", &m.pulse}, {"mo.pulseRate", &m.pulseRate},
    {"mo.flicker", &m.flicker}, {"mo.flickerRate", &m.flickerRate}, {"mo.jitter", &m.jitter}, {"mo.jitterRate", &m.jitterRate},
    {"mo.reveal", &m.reveal}, {"mo.revealAngle", &m.revealAngle}, {"mo.morph", &m.morph} };
  if (k == "mo.animate") { m.animate = v != 0; return true; }
  if (k == "mo.revealMode") { m.revealMode = (int)v; return true; }
  auto it = M.find(k); if (it == M.end()) return false; *it->second = v; return true;
}
static Image panned(const Image& im, int dx) {
  Image o; o.resize(im.w, im.h);
  for (int y = 0; y < im.h; y++) for (int x = 0; x < im.w; x++) {
    size_t i = (size_t)y * im.w + x, j = (size_t)y * im.w + ((x - dx) % im.w + im.w) % im.w;
    o.R[i] = im.R[j]; o.G[i] = im.G[j]; o.B[i] = im.B[j]; o.A[i] = im.A[j];
  }
  return o;
}
int main(int argc, char** argv) {
  if (argc < 9) return 2;
  std::string tool = argv[1]; int w = atoi(argv[3]), h = atoi(argv[4]), N = atoi(argv[7]); double fps = atof(argv[8]);
  std::ifstream fi(argv[2], std::ios::binary); std::vector<unsigned char> d((std::istreambuf_iterator<char>(fi)), {});
  Image im; im.resize(w, h);
  for (int i = 0; i < w * h; i++) { im.R[i] = d[i * 4]; im.G[i] = d[i * 4 + 1]; im.B[i] = d[i * 4 + 2]; im.A[i] = d[i * 4 + 3]; }
  std::ifstream fp(argv[5]); std::string line, aTxt, bTxt; Motion m; std::map<std::string, double> tm; bool hasB = false;
  while (std::getline(fp, line)) {
    auto sp = line.find(' '); if (sp == std::string::npos) continue;
    std::string k = line.substr(0, sp), v = line.substr(sp + 1);
    if (k.rfind("mo.", 0) == 0) setMotion(m, k, std::stod(v));
    else if (k.rfind("tm.", 0) == 0) tm[k.substr(3)] = std::stod(v);
    else if (k.rfind("B.", 0) == 0) { bTxt += k.substr(2) + " " + v + "\n"; hasB = true; }
    else aTxt += line + "\n";
  }
  auto T = [&](const char* k, double dflt) { auto it = tm.find(k); return it == tm.end() ? dflt : it->second; };
  std::vector<Image> history;
  for (int f = 0; f < N; f++) {
    Clock c = Clock::make(m, f / fps, fps); OutImage out;
    Image cur = tool == "decompressor" ? panned(im, f * 3) : im;
    if (T("cut", 0) > 0 && f >= T("cut", 0)) {     // scene cut: mirrored, zooming source (motion without new colour)
      Image o; o.resize(w, h); double z = 1 + (f - T("cut", 0)) * 0.03;
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        int sx = iclamp((int)(w / 2 + (w - 1 - x - w / 2) / z), 0, w - 1), sy = iclamp((int)(h / 2 + (y - h / 2) / z), 0, h - 1);
        size_t i = (size_t)y * w + x, j = (size_t)sy * w + sx; o.R[i] = im.R[j]; o.G[i] = im.G[j]; o.B[i] = im.B[j]; o.A[i] = im.A[j];
      }
      cur = o;
    }
    if (tool == "mobglow") {
      mob::Params A, B; mob::parseParams(A, aTxt); mob::parseParams(B, aTxt); mob::parseParams(B, bTxt);
      mob::MobMotion mm; mm.breathe = T("breathe", 0); mm.breatheRate = T("breatheRate", 0.5); mm.shimmer = T("shimmer", 0); mm.shimmerRate = T("shimmerRate", 8);
      mob::renderFrame(cur, A, hasB ? &B : nullptr, mm, m, c, out);
    } else if (tool == "depthtone") {
      dt::Params A, B; dt::parseParams(A, aTxt); dt::parseParams(B, aTxt); dt::parseParams(B, bTxt);
      dt::DtMotion dm; dm.flow = T("flow", 0); dm.fogBreathe = T("fogBreathe", 0); dm.fogRate = T("fogRate", 0.25); dm.rangeWave = T("rangeWave", 0); dm.rangeRate = T("rangeRate", 0.25);
      dt::renderFrame(cur, A, hasB ? &B : nullptr, dm, m, c, T("over", 0) != 0, out);
    } else {
      dc::Params A, B; dc::parseParams(A, aTxt); dc::parseParams(B, aTxt); dc::parseParams(B, bTxt);
      dc::DcMotion dm; dm.iEvery = T("iEvery", 0); dm.bleed = T("bleed", 0); dm.search = T("search", 16); dm.qualityWave = T("qualityWave", 0); dm.sliceRoll = T("sliceRoll", 0);
      history.push_back(cur);
      Image moshed = cur;
      if (c.on && dm.iEvery > 0) {
        long k = c.frame % (long)dm.iEvery; std::vector<const Image*> fr;
        for (long j = (long)history.size() - 1 - k; j < (long)history.size(); j++) fr.push_back(&history[(size_t)std::max(0L, j)]);
        dc::temporalMosh(fr, 16, (int)dm.search, dm.bleed / 100, moshed);
      }
      dc::renderFrame(moshed, cur, A, hasB ? &B : nullptr, dm, m, c, out);
    }
    std::vector<unsigned char> b(out.px.size());
    for (size_t i = 0; i < b.size(); i++) b[i] = (unsigned char)(int)clamp(out.px[i], 0, 255);
    char fn[512]; snprintf(fn, sizeof fn, "%s%03d.rgba", argv[6], f);
    std::ofstream fo(fn, std::ios::binary); fo.write((char*)b.data(), b.size());
  }
  return 0;
}
