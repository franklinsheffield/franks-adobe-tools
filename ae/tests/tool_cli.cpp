// Parity CLI for the wave-2 tools: tool_cli <tool> <in.rgba> <w> <h> <params.txt> <out.rgb|out.rgba>
// mobglow / depthtone: writes the Photoshop layer stack composited on black (RGB, like imgmath composite()).
// decompressor / chrometone: write the single (merged) layer (RGBA).
// dithers-brew: engine.js composite(result, {type: "white"}) (RGB).
#include "../effects/mobglow/mob_params_io.h"
#include "../effects/depthtone/dt_params_io.h"
#include "../effects/decompressor/dc_params_io.h"
#include "../effects/chrometone/ct_params_io.h"
#include "../effects/dithers-brew/di_params_io.h"
#include <fstream>
#include <iterator>
#include <cstring>
using namespace brew;
int main(int argc, char** argv) {
  if (argc < 7) { fprintf(stderr, "usage\n"); return 2; }
  std::string tool = argv[1]; int w = atoi(argv[3]), h = atoi(argv[4]);
  std::ifstream fi(argv[2], std::ios::binary); std::vector<unsigned char> d((std::istreambuf_iterator<char>(fi)), {});
  Image im; im.resize(w, h);
  for (int i = 0; i < w * h; i++) { im.R[i] = d[i * 4]; im.G[i] = d[i * 4 + 1]; im.B[i] = d[i * 4 + 2]; im.A[i] = d[i * 4 + 3]; }
  std::ifstream fp(argv[5]); std::string txt((std::istreambuf_iterator<char>(fp)), {});
  std::vector<unsigned char> b;
  auto rgbOut = [&](const std::vector<Layer>& L, bool over) { std::vector<float> rgb; compositeBlack(L, over, im, w, h, rgb); b.resize(rgb.size()); for (size_t i = 0; i < rgb.size(); i++) b[i] = (unsigned char)(int)clamp(rgb[i], 0, 255); };
  if (tool == "mobglow") { mob::Params P; mob::parseParams(P, txt); std::vector<Layer> L; mob::render(im, P, L); rgbOut(L, true); }
  else if (tool == "depthtone") { dt::Params P; dt::parseParams(P, txt); std::vector<Layer> L; dt::render(im, P, L); rgbOut(L, false); }
  else if (tool == "decompressor") {
    dc::Params P; dc::parseParams(P, txt); Layer L; dc::render(im, P, L);
    b.resize(L.rgba.size()); for (size_t i = 0; i < b.size(); i++) b[i] = (unsigned char)(int)clamp(L.rgba[i], 0, 255);
  } else if (tool == "chrometone") {
    ct::Params P; ct::parseParams(P, txt); Layer L; ct::render(im, P, L);
    b.resize(L.rgba.size()); for (size_t i = 0; i < b.size(); i++) b[i] = (unsigned char)(int)clamp(L.rgba[i], 0, 255);
  } else if (tool == "dithers-brew") {
    di::Params P; di::parseParams(P, txt); di::Result R; di::render(im, P, R); di::compositeWhite(R, b);
  } else return 3;
  std::ofstream fo(argv[6], std::ios::binary); fo.write((char*)b.data(), b.size());
  return 0;
}
