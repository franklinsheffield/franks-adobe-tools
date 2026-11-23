// Test CLI: crt_cli <in.rgba> <w> <h> <params.txt> <out.rgba>
// Renders one frame with the C++ engine, 8-bit truncating store like JS Uint8Array.
#include "../effects/crt-phaser/crt_params_io.h"
#include <cstdio>
#include <fstream>
#include <iterator>
int main(int argc, char** argv) {
  if (argc < 6) { fprintf(stderr, "usage\n"); return 2; }
  int w = atoi(argv[2]), h = atoi(argv[3]);
  std::ifstream fi(argv[1], std::ios::binary); std::vector<unsigned char> d((std::istreambuf_iterator<char>(fi)), {});
  brew::Image im; im.resize(w, h);
  for (int i = 0; i < w * h; i++) { im.R[i] = d[i * 4]; im.G[i] = d[i * 4 + 1]; im.B[i] = d[i * 4 + 2]; im.A[i] = d[i * 4 + 3]; }
  std::ifstream fp(argv[4]); std::string txt((std::istreambuf_iterator<char>(fp)), {});
  crt::Params P; crt::parseParams(P, txt);
  brew::OutImage o; crt::render(im, P, o);
  std::vector<unsigned char> b(o.px.size());
  for (size_t i = 0; i < b.size(); i++) { double v = o.px[i]; b[i] = (unsigned char)(int)(v < 0 ? 0 : v > 255 ? 255 : v); }
  std::ofstream fo(argv[5], std::ios::binary); fo.write((char*)b.data(), b.size());
  return 0;
}
