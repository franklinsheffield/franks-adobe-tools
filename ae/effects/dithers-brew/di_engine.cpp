// Frank's Dithers Brew 1.1 - C++ port of plugins/dithers-brew/js/{engine,lineart,ascii}.js.
// Uint8Array stores truncate (u8), Float32Array stores are float; math in double like V8.
#include "di_engine.h"
#include <functional>
#include <map>
#include <mutex>
#include <cstring>
#include <array>

using namespace brew;

namespace di {

static const double PI = 3.14159265358979323846, TAU = 2 * PI;
static const double SQ3 = std::sqrt(3.0);
typedef std::vector<uint8_t> U8;

static inline uint8_t u8(double v) { return v >= 256 || v != v ? (uint8_t)((int64_t)v & 255) : (v <= -1 ? (uint8_t)((int64_t)v & 255) : (uint8_t)(int)v); }
static inline int jround(double v) { return (int)std::floor(v + 0.5); }

static double hash2(int x, int y, int s) {
  int64_t sum = (int64_t)imul(x, 374761393) + (int64_t)imul(y, 668265263) + (int64_t)imul(s, 1274126177);
  int32_t h = (int32_t)(uint32_t)(uint64_t)sum;
  h = imul(h ^ (int32_t)((uint32_t)h >> 13), 1274126177);
  h ^= (int32_t)((uint32_t)h >> 16);
  return (uint32_t)h / 4294967296.0;
}
static inline double luma(const RGB& c) { return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b; }
static RGB hexRGB(const std::string& h) { return isHex(h) ? hexToRgb(h) : RGB{ 0, 0, 0 }; }

// ---------------------------------------------------------------- catalogues
const char* const SCREEN_IDS[11] = { "round", "ellipse", "diamond", "square", "line", "cross", "hex", "rings", "wave", "checker", "grain" };
const char* const SCREEN_NAMES[11] = { "Round Dot", "Ellipse", "Diamond", "Square", "Line", "Cross-hatch", "Hex Dots", "Concentric Rings", "Wavy Line", "Checker Dot", "Xerox Grain" };

struct Kernel { int d; std::vector<std::array<int, 3>> k; };
static const std::map<std::string, Kernel>& KERNELS() {
  static const std::map<std::string, Kernel> K = {
    { "fs", { 16, { {1,0,7},{-1,1,3},{0,1,5},{1,1,1} } } },
    { "atk", { 8, { {1,0,1},{2,0,1},{-1,1,1},{0,1,1},{1,1,1},{0,2,1} } } },
    { "jjn", { 48, { {1,0,7},{2,0,5},{-2,1,3},{-1,1,5},{0,1,7},{1,1,5},{2,1,3},{-2,2,1},{-1,2,3},{0,2,5},{1,2,3},{2,2,1} } } },
    { "stu", { 42, { {1,0,8},{2,0,4},{-2,1,2},{-1,1,4},{0,1,8},{1,1,4},{2,1,2},{-2,2,1},{-1,2,2},{0,2,4},{1,2,2},{2,2,1} } } },
    { "bur", { 32, { {1,0,8},{2,0,4},{-2,1,2},{-1,1,4},{0,1,8},{1,1,4},{2,1,2} } } },
    { "sl", { 4, { {1,0,2},{-1,1,1},{0,1,1} } } },
    { "sierra3", { 32, { {1,0,5},{2,0,3},{-2,1,2},{-1,1,4},{0,1,5},{1,1,4},{2,1,2},{-1,2,2},{0,2,3},{1,2,2} } } },
    { "sierra2", { 16, { {1,0,4},{2,0,3},{-2,1,1},{-1,1,2},{0,1,3},{1,1,2},{2,1,1} } } },
  };
  return K;
}

enum DT { T_ED = 0, T_ORD, T_IGN, T_WHITE, T_THR, T_LINE };
enum MapT { M_BAYER = 0, M_CLUSTER };
struct Dither { const char* id; const char* name; int t; const char* k; double jit; int mt; int n; const char* kind; };
static const Dither DITHERS[28] = {
  { "fs", "Floyd-Steinberg", T_ED, "fs", 0, 0, 0, "" },
  { "fsj", "Floyd-Steinberg (jittered)", T_ED, "fs", 0.35, 0, 0, "" },
  { "atk", "Atkinson (classic Mac)", T_ED, "atk", 0, 0, 0, "" },
  { "jjn", "Jarvis-Judice-Ninke", T_ED, "jjn", 0, 0, 0, "" },
  { "stu", "Stucki", T_ED, "stu", 0, 0, 0, "" },
  { "bur", "Burkes", T_ED, "bur", 0, 0, 0, "" },
  { "sl", "Sierra Lite", T_ED, "sl", 0, 0, 0, "" },
  { "sierra3", "Sierra", T_ED, "sierra3", 0, 0, 0, "" },
  { "sierra2", "Sierra Two-Row", T_ED, "sierra2", 0, 0, 0, "" },
  { "b2", "Bayer 2x2 (ordered)", T_ORD, "", 0, M_BAYER, 2, "" },
  { "b4", "Bayer 4x4 (ordered)", T_ORD, "", 0, M_BAYER, 4, "" },
  { "b8", "Bayer 8x8 (ordered)", T_ORD, "", 0, M_BAYER, 8, "" },
  { "b16", "Bayer 16x16 (ordered)", T_ORD, "", 0, M_BAYER, 16, "" },
  { "c4", "Clustered Dot 4x4", T_ORD, "", 0, M_CLUSTER, 4, "round" },
  { "c8", "Clustered Dot 8x8", T_ORD, "", 0, M_CLUSTER, 8, "round" },
  { "d8", "Diamond Cluster 8x8", T_ORD, "", 0, M_CLUSTER, 8, "diamond" },
  { "l6", "Line Cluster 6x6", T_ORD, "", 0, M_CLUSTER, 6, "line" },
  { "ign", "Gradient Noise (stochastic)", T_IGN, "", 0, 0, 0, "" },
  { "white", "White Noise (grain)", T_WHITE, "", 0, 0, 0, "" },
  { "thr", "Hard Threshold", T_THR, "", 0, 0, 0, "" },
  { "wavescan", "Wave Scan (line art)", T_LINE, "", 0, 0, 0, "" },
  { "waveamp", "Wave Amplitude (line art)", T_LINE, "", 0, 0, 0, "" },
  { "lineweight", "Line Weight (engraving)", T_LINE, "", 0, 0, 0, "" },
  { "contour", "Contour Lines", T_LINE, "", 0, 0, 0, "" },
  { "spiral", "Spiral Screen", T_LINE, "", 0, 0, 0, "" },
  { "ripple", "Ripple Screen", T_LINE, "", 0, 0, 0, "" },
  { "stipple", "Stipple (blue noise)", T_LINE, "", 0, 0, 0, "" },
  { "crosswave", "Crosswave", T_LINE, "", 0, 0, 0, "" },
};
const char* const DITHER_IDS[28] = { "fs", "fsj", "atk", "jjn", "stu", "bur", "sl", "sierra3", "sierra2", "b2", "b4", "b8", "b16", "c4", "c8", "d8", "l6",
                                     "ign", "white", "thr", "wavescan", "waveamp", "lineweight", "contour", "spiral", "ripple", "stipple", "crosswave" };
const char* const DITHER_NAMES[28] = { "Floyd-Steinberg", "Floyd-Steinberg (jittered)", "Atkinson (classic Mac)", "Jarvis-Judice-Ninke", "Stucki", "Burkes",
  "Sierra Lite", "Sierra", "Sierra Two-Row", "Bayer 2x2 (ordered)", "Bayer 4x4 (ordered)", "Bayer 8x8 (ordered)", "Bayer 16x16 (ordered)", "Clustered Dot 4x4",
  "Clustered Dot 8x8", "Diamond Cluster 8x8", "Line Cluster 6x6", "Gradient Noise (stochastic)", "White Noise (grain)", "Hard Threshold", "Wave Scan (line art)",
  "Wave Amplitude (line art)", "Line Weight (engraving)", "Contour Lines", "Spiral Screen", "Ripple Screen", "Stipple (blue noise)", "Crosswave" };
static const Dither* ditherById(const std::string& id) { for (auto& d : DITHERS) if (id == d.id) return &d; return nullptr; }

// ---------------------------------------------------------------- spot functions
static double spot(const std::string& kind, double u, double v) {
  const double x = 2 * u - 1, y = 2 * v - 1;
  if (kind == "round" || kind == "grain") return 0.5 * (1 - 0.5 * (std::cos(PI * x) + std::cos(PI * y)));
  if (kind == "ellipse") return (0.6 * x * x + y * y) / 1.6;
  if (kind == "diamond") return (std::fabs(2 * u - 1) + std::fabs(2 * v - 1)) / 2;
  if (kind == "square") return std::max(std::fabs(2 * u - 1), std::fabs(2 * v - 1));
  if (kind == "line") return std::fabs(2 * v - 1);
  if (kind == "cross") return std::min(std::fabs(2 * u - 1), std::fabs(2 * v - 1));
  if (kind == "rings") { double t = std::sqrt(x * x + y * y) / 1.41421356 * 2.5; return std::fabs((t - std::floor(t)) - 0.5) * 2; }
  if (kind == "wave") return std::min(1.0, std::fabs(y + 0.4 * std::sin(PI * x)) / 1.4);
  if (kind == "checker") return (1 - std::cos(PI * x) * std::cos(PI * y)) / 2;
  if (kind == "hex") {
    const double X = u, Y = v * SQ3; double d = 1e9;
    const double Pt[5][2] = { { 0, 0 }, { 1, 0 }, { 0.5, SQ3 / 2 }, { 0, SQ3 }, { 1, SQ3 } };
    for (int i = 0; i < 5; i++) { double dx = X - Pt[i][0], dy = Y - Pt[i][1]; double dd = dx * dx + dy * dy; if (dd < d) d = dd; }
    return std::min(1.0, std::sqrt(d) / 0.57735);
  }
  return 0.5 * (1 - 0.5 * (std::cos(PI * x) + std::cos(PI * y)));
}
static int spotKind(const std::string& k) {     // integer id for the hot loops
  for (int i = 0; i < 11; i++) if (k == SCREEN_IDS[i]) return i;
  return 0;
}
static inline double spotFast(int kind, double u, double v) { return spot(SCREEN_IDS[kind], u, v); }
static double screenVS(int kind) { return kind == 6 ? SQ3 : 1; }

static std::mutex cacheMx;
static const std::vector<float>& rankLUT(int kind) {
  static std::map<int, std::vector<float>> cache;
  std::lock_guard<std::mutex> lk(cacheMx);
  auto it = cache.find(kind); if (it != cache.end()) return it->second;
  const int N = 2048, M = 160; std::vector<double> hist(N, 0);
  for (int j = 0; j < M; j++) for (int i = 0; i < M; i++) {
    double val = clamp(spotFast(kind, (i + 0.5) / M, (j + 0.5) / M), 0, 1);
    hist[std::min(N - 1, (int)std::floor(val * N))]++;
  }
  std::vector<float> lut(N); double tot = (double)M * M, acc = 0;
  for (int b = 0; b < N; b++) { lut[b] = (float)((acc + hist[b] * 0.5) / tot); acc += hist[b]; }
  return cache[kind] = lut;
}

struct TMap { const float* m; int n; };
static TMap mapFor(const Dither* D) {
  static std::map<std::string, std::vector<float>> cache;
  std::lock_guard<std::mutex> lk(cacheMx);
  const int n = D->n;
  std::string key = (D->mt == M_BAYER ? "b" : "c") + std::to_string(n) + D->kind;
  auto it = cache.find(key); if (it != cache.end()) return { it->second.data(), n };
  std::vector<float> out((size_t)n * n);
  if (D->mt == M_BAYER) {
    std::vector<std::vector<int>> m = { { 0 } }; int s = 1;
    while (s < n) {
      std::vector<std::vector<int>> nm(s * 2, std::vector<int>(s * 2));
      for (int y = 0; y < s * 2; y++) for (int x = 0; x < s * 2; x++) {
        int add = (y < s) ? ((x < s) ? 0 : 2) : ((x < s) ? 3 : 1);
        nm[y][x] = m[y % s][x % s] * 4 + add;
      }
      m = nm; s *= 2;
    }
    for (int y = 0; y < n; y++) for (int x = 0; x < n; x++) out[y * n + x] = (float)((m[y][x] + 0.5) / (n * n));
  } else {
    struct C { int i; double f; }; std::vector<C> arr;
    for (int y = 0; y < n; y++) for (int x = 0; x < n; x++) arr.push_back({ y * n + x, spot(D->kind, (x + 0.5) / n, (y + 0.5) / n) + 1e-7 * (y * n + x) });
    std::stable_sort(arr.begin(), arr.end(), [](const C& a, const C& b) { return a.f < b.f; });
    for (size_t r = 0; r < arr.size(); r++) out[arr[r].i] = (float)((r + 0.5) / (n * n));
  }
  auto& v = cache[key] = out;
  return { v.data(), n };
}

// ---------------------------------------------------------------- resampling
static U8 downBox(const U8& src, int w, int h, int w2, int h2) {
  U8 out((size_t)w2 * h2);
  std::vector<int> xb(w2 + 1), yb(h2 + 1);
  for (int i = 0; i <= w2; i++) xb[i] = std::min(w, (int)std::floor((double)i * w / w2));
  for (int j = 0; j <= h2; j++) yb[j] = std::min(h, (int)std::floor((double)j * h / h2));
  for (int j = 0; j < h2; j++) for (int i = 0; i < w2; i++) {
    double sum = 0; int cnt = 0;
    int y1 = std::max(yb[j + 1], yb[j] + 1), x1 = std::max(xb[i + 1], xb[i] + 1);
    for (int y = yb[j]; y < y1 && y < h; y++) for (int x = xb[i]; x < x1 && x < w; x++) { sum += src[(size_t)y * w + x]; cnt++; }
    out[(size_t)j * w2 + i] = cnt ? u8((double)(int)(sum / cnt + 0.5)) : 0;
  }
  return out;
}
static U8 upNearest(const U8& src, int w2, int h2, int w, int h) {
  U8 out((size_t)w * h); std::vector<int> sx(w);
  for (int x = 0; x < w; x++) sx[x] = std::min(w2 - 1, (int)std::floor((double)x * w2 / w));
  for (int y = 0; y < h; y++) {
    size_t r = (size_t)std::min(h2 - 1, (int)std::floor((double)y * h2 / h)) * w2, o = (size_t)y * w;
    for (int x = 0; x < w; x++) out[o + x] = src[r + sx[x]];
  }
  return out;
}

// ---------------------------------------------------------------- line art (lineart.js)
struct Tune { double threshold = 50, strength = 100; std::string direction = "h"; double weight = 2, spacing = 6, jitter = 0; };
static inline double tri(double t) { t -= std::floor(t); return std::fabs(2 * t - 1); }

static std::vector<float> blurPlane(const U8& src, int w, int h, double rIn) {
  const size_t n = (size_t)w * h; std::vector<float> out(n);
  int r = std::max(0, jround(rIn));
  if (r < 1) { for (size_t i = 0; i < n; i++) out[i] = (float)(src[i] / 255.0); return out; }
  std::vector<float> tmp(n); const double win = 2 * r + 1;
  for (int y = 0; y < h; y++) {
    size_t o = (size_t)y * w; double s = 0;
    for (int k = -r; k <= r; k++) s += src[o + iclamp(k, 0, w - 1)];
    for (int x = 0; x < w; x++) { tmp[o + x] = (float)(s / win); s += (double)src[o + std::min(w - 1, x + r + 1)] - src[o + std::max(0, x - r)]; }
  }
  for (int x = 0; x < w; x++) {
    double s = 0;
    for (int k = -r; k <= r; k++) s += tmp[(size_t)iclamp(k, 0, h - 1) * w + x];
    for (int y = 0; y < h; y++) { out[(size_t)y * w + x] = (float)(s / win / 255); s += (double)tmp[(size_t)std::min(h - 1, y + r + 1) * w + x] - tmp[(size_t)std::max(0, y - r) * w + x]; }
  }
  return out;
}
static inline void axes(const std::string& dir, double W, double H, double x, double y, double& a, double& b) {
  if (dir == "v") { a = x; b = y; return; }
  if (dir == "d") { const double R2 = std::sqrt(0.5); a = (x - y) * R2; b = (x + y) * R2; return; }
  if (dir == "r") { double dx = x - W / 2, dy = y - H / 2, r = std::sqrt(dx * dx + dy * dy); a = std::atan2(dy, dx) * std::max(r, 1.0); b = r; return; }
  a = y; b = x;
}
struct Blue { std::vector<float> m; int n; };
static const Blue& blueNoise() {
  static Blue B; static bool done = false;
  std::lock_guard<std::mutex> lk(cacheMx);
  if (done) return B;
  const int N = 64, n = N * N, R = 4; const double sig2 = 2 * 1.6 * 1.6;
  std::vector<double> energy(n); std::vector<uint8_t> used(n, 0); std::vector<float> rank(n);
  struct KK { int dx, dy; double g; }; std::vector<KK> ker;
  for (int dy = -R; dy <= R; dy++) for (int dx = -R; dx <= R; dx++) ker.push_back({ dx, dy, std::exp(-(double)(dx * dx + dy * dy) / sig2) });
  for (int i = 0; i < n; i++) {
    uint32_t s = (uint32_t)((uint64_t)i * 2654435761ULL);
    int32_t si = (int32_t)(s ^ (s >> 13));
    energy[i] = (si % 1000) * 1e-9;
  }
  for (int k = 0; k < n; k++) {
    int best = -1; double be = INFINITY;
    for (int i = 0; i < n; i++) if (!used[i] && energy[i] < be) { be = energy[i]; best = i; }
    used[best] = 1; rank[best] = (float)((k + 0.5) / n);
    int bx = best % N, by = best / N;
    for (auto& q : ker) energy[((by + q.dy + N) % N) * N + ((bx + q.dx + N) % N)] += q.g;
  }
  B.m = rank; B.n = N; done = true;
  return B;
}
static inline int pmod(int a, int m) { int r = a % m; return r < 0 ? r + m : r; }

static U8 lineInk(const U8& demand, int w, int h, const std::string& id, const Tune& T, double lsc, int ox, int oy) {
  const size_t n = (size_t)w * h; U8 out(n, 0);
  const double P = std::max(2.0, (T.spacing != 0 ? T.spacing : 6) * (lsc != 0 ? lsc : 1));
  const double st = clamp(T.strength, 0, 100) / 100, wt = clamp(T.weight, 1, 8);
  std::vector<float> D;
  if (id == "wavescan" || id == "waveamp" || id == "contour" || id == "crosswave") D = blurPlane(demand, w, h, P * 0.5);
  if (id == "stipple") {
    const Blue& B = blueNoise(); const int N = B.n;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      size_t i = (size_t)y * w + x;
      if (demand[i] / 255.0 > B.m[pmod(y + oy, N) * N + pmod(x + ox, N)]) out[i] = 255;
    }
    return out;
  }
  const double cx = w / 2.0, cy = h / 2.0;
  const bool spiral = id == "spiral", ripple = id == "ripple", cross = id == "crosswave", contour = id == "contour";
  const bool ws = id == "wavescan", wa = id == "waveamp";
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    size_t i = (size_t)y * w + x; double d = demand[i] / 255.0;
    const double X = x + ox, Y = y + oy;
    bool on = false;
    if (spiral || ripple) {
      double dx = X - cx, dy = Y - cy, r = std::sqrt(dx * dx + dy * dy);
      double t = r / P + (spiral ? std::atan2(dy, dx) / TAU : 0);
      on = tri(t) < d;
    } else if (cross) {
      double c = 1 - std::sqrt(std::max(0.0, 1 - d)), bend = st * wt * 0.25 * D[i];
      on = tri((X + 0.5) / P + bend) < c || tri((Y + 0.5) / P + bend) < c;
    } else if (contour) {
      double L = 2 + wt * 2;
      on = D[i] > 0.02 && tri(D[i] * L + 0.5) > 1 - (0.06 + 0.14 * st);
    } else {
      double a, b; axes(T.direction, w, h, X + 0.5, Y + 0.5, a, b);
      if (ws) on = tri(b / P + st * wt * 0.8 * D[i]) < d;
      else if (wa) on = tri((b + st * wt * 0.5 * P * D[i] * std::sin(TAU * a / (P * 3))) / P) < d;
      else on = tri(b / P) < d;
    }
    if (on) out[i] = 255;
  }
  return out;
}
typedef std::function<double(int, int)> ThrFn;
static ThrFn lineThr(const std::string& id, const Tune& T, double w, double h, double lsc) {
  const double P = std::max(2.0, (T.spacing != 0 ? T.spacing : 6) * (lsc != 0 ? lsc : 1));
  if (id == "stipple") { const Blue* B = &blueNoise(); return [B](int x, int y) { return (double)B->m[(y % B->n) * B->n + (x % B->n)]; }; }
  const double cx = w / 2, cy = h / 2;
  if (id == "spiral" || id == "ripple") { bool sp = id == "spiral"; return [=](int x, int y) { double dx = x - cx, dy = y - cy; return tri(std::sqrt(dx * dx + dy * dy) / P + (sp ? std::atan2(dy, dx) / TAU : 0)); }; }
  std::string dir = T.direction;
  return [=](int x, int y) { double a, b; axes(dir, w, h, x + 0.5, y + 0.5, a, b); return tri(b / P); };
}

// ---------------------------------------------------------------- ASCII (ascii.js)
static const int GW = 5, GH = 7;
typedef std::array<uint8_t, 35> Glyph;
static const std::map<char, Glyph>& FONT() {
  static std::map<char, Glyph> F;
  static bool init = false;
  std::lock_guard<std::mutex> lk(cacheMx);
  if (init) return F;
  static const std::pair<char, const char*> SRC[] = {
    {'A', ".###./#...#/#...#/#####/#...#/#...#/#...#"}, {'B', "####./#...#/#...#/####./#...#/#...#/####."},
    {'C', ".###./#...#/#..../#..../#..../#...#/.###."}, {'D', "####./#...#/#...#/#...#/#...#/#...#/####."},
    {'E', "#####/#..../#..../####./#..../#..../#####"}, {'F', "#####/#..../#..../####./#..../#..../#...."},
    {'G', ".###./#...#/#..../#.###/#...#/#...#/.###."}, {'H', "#...#/#...#/#...#/#####/#...#/#...#/#...#"},
    {'I', ".###./..#../..#../..#../..#../..#../.###."}, {'J', "..###/...#./...#./...#./...#./#..#./.##.."},
    {'K', "#...#/#..#./#.#../##.../#.#../#..#./#...#"}, {'L', "#..../#..../#..../#..../#..../#..../#####"},
    {'M', "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#"}, {'N', "#...#/##..#/#.#.#/#..##/#...#/#...#/#...#"},
    {'O', ".###./#...#/#...#/#...#/#...#/#...#/.###."}, {'P', "####./#...#/#...#/####./#..../#..../#...."},
    {'Q', ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#"}, {'R', "####./#...#/#...#/####./#.#../#..#./#...#"},
    {'S', ".####/#..../#..../.###./....#/....#/####."}, {'T', "#####/..#../..#../..#../..#../..#../..#.."},
    {'U', "#...#/#...#/#...#/#...#/#...#/#...#/.###."}, {'V', "#...#/#...#/#...#/#...#/#...#/.#.#./..#.."},
    {'W', "#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#"}, {'X', "#...#/#...#/.#.#./..#../.#.#./#...#/#...#"},
    {'Y', "#...#/#...#/.#.#./..#../..#../..#../..#.."}, {'Z', "#####/....#/...#./..#../.#.../#..../#####"},
    {'0', ".###./#...#/#..##/#.#.#/##..#/#...#/.###."}, {'1', "..#../.##../..#../..#../..#../..#../.###."},
    {'2', ".###./#...#/....#/...#./..#../.#.../#####"}, {'3', ".###./#...#/....#/..##./....#/#...#/.###."},
    {'4', "...#./..##./.#.#./#..#./#####/...#./...#."}, {'5', "#####/#..../####./....#/....#/#...#/.###."},
    {'6', "..##./.#.../#..../####./#...#/#...#/.###."}, {'7', "#####/....#/...#./..#../.#.../.#.../.#..."},
    {'8', ".###./#...#/#...#/.###./#...#/#...#/.###."}, {'9', ".###./#...#/#...#/.####/....#/...#./.##.."},
    {'.', "...../...../...../...../...../.##../.##.."}, {',', "...../...../...../...../.##../..#../.#..."},
    {':', "...../.##../.##../...../.##../.##../....."}, {';', "...../.##../.##../...../.##../..#../.#..."},
    {'!', "..#../..#../..#../..#../..#../...../..#.."}, {'?', ".###./#...#/....#/...#./..#../...../..#.."},
    {'-', "...../...../...../#####/...../...../....."}, {'_', "...../...../...../...../...../...../#####"},
    {'+', "...../..#../..#../#####/..#../..#../....."}, {'=', "...../...../#####/...../#####/...../....."},
    {'*', "...../#.#.#/.###./#####/.###./#.#.#/....."}, {'#', ".#.#./.#.#./#####/.#.#./#####/.#.#./.#.#."},
    {'%', "##..#/##..#/...#./..#../.#.../#..##/#..##"}, {'@', ".###./#...#/#.###/#.#.#/#.###/#..../.###."},
    {'/', "....#/....#/...#./..#../.#.../#..../#...."}, {'\\', "#..../#..../.#.../..#../...#./....#/....#"},
    {'|', "..#../..#../..#../..#../..#../..#../..#.."}, {'\'', "..#../..#../.#.../...../...../...../....."},
    {'"', ".#.#./.#.#./...../...../...../...../....."}, {'(', "...#./..#../.#.../.#.../.#.../..#../...#."},
    {')', ".#.../..#../...#./...#./...#./..#../.#..."}, {'<', "...#./..#../.#.../#..../.#.../..#../...#."},
    {'>', ".#.../..#../...#./....#/...#./..#../.#..."}, {'[', ".###./.#.../.#.../.#.../.#.../.#.../.###."},
    {']', ".###./...#./...#./...#./...#./...#./.###."}, {'$', "..#../.####/#.#../.###./..#.#/####./..#.."},
    {'&', ".##../#..#./#.#../.#.../#.#.#/#..#./.##.#"}, {'~', "...../...../.#.../#.#.#/...#./...../....."},
    {'^', "..#../.#.#./#...#/...../...../...../....."}, {' ', "...../...../...../...../...../...../....."},
  };
  for (auto& s : SRC) {
    Glyph g{}; const char* p = s.second;
    for (int y = 0; y < GH; y++) for (int x = 0; x < GW; x++) g[y * GW + x] = p[y * 6 + x] == '#' ? 1 : 0;
    F[s.first] = g;
  }
  init = true;
  return F;
}
static const Glyph* glyphBits(char ch) {
  const auto& F = FONT();
  auto it = F.find(ch); if (it != F.end()) return &it->second;
  char u = (char)toupper((unsigned char)ch);
  it = F.find(u); return it != F.end() ? &it->second : nullptr;
}
static int coverage(const Glyph& g) { int c = 0; for (auto b : g) c += b; return c; }

static std::vector<std::vector<int>> bayer8() {
  std::vector<std::vector<int>> m = { { 0 } }; int s = 1;
  while (s < 8) {
    std::vector<std::vector<int>> nm(s * 2, std::vector<int>(s * 2));
    for (int y = 0; y < s * 2; y++) for (int x = 0; x < s * 2; x++) { int add = (y < s) ? ((x < s) ? 0 : 2) : ((x < s) ? 3 : 1); nm[y][x] = m[y % s][x % s] * 4 + add; }
    m = nm; s *= 2;
  }
  return m;
}
const char* const ASCII_IDS[12] = { "classic", "dense", "digits", "binary", "letters", "math", "hatch", "symbols", "blocks", "dots", "bars", "custom" };
const char* const ASCII_NAMES[12] = { "Classic . : - = + * # % @", "Dense ramp", "Digits 0-9", "Binary 0 1", "Letters A-Z", "Math + - = * / % < >",
                                      "Hatch - / \\ X #", "Symbols $ & @ # %", "Blocks (pixel patterns)", "Dots (growing circles)", "Bars (stacked lines)", "My own characters" };
static const char* const ASCII_CHARS[12] = { ".:-=+*#%@", ".,:;!/1ILCGO08@#", "0123456789", "01", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "+-=*/%<>", "-/|\\X#", "$&@#%*", "", "", "", "" };

static std::vector<Glyph> buildRamp(const std::string& setId, const std::string& customChars, bool keepOrder) {
  int si = 0; for (int i = 0; i < 12; i++) if (setId == ASCII_IDS[i]) si = i;
  std::vector<Glyph> glyphs;
  if (si == 8) {          // blocks
    auto B = bayer8(); struct C { int i, v; }; std::vector<C> cells;
    for (int y = 0; y < GH; y++) for (int x = 0; x < GW; x++) cells.push_back({ y * GW + x, B[y][x] });
    std::stable_sort(cells.begin(), cells.end(), [](const C& a, const C& b) { return a.v != b.v ? a.v < b.v : a.i < b.i; });
    const int levels = 9;
    for (int l = 0; l < levels; l++) { Glyph g{}; int n = jround(((double)l / (levels - 1)) * cells.size()); for (int k = 0; k < n; k++) g[cells[k].i] = 1; glyphs.push_back(g); }
  } else if (si == 9) {   // dots
    const int levels = 8;
    for (int l = 0; l < levels; l++) {
      Glyph g{}; double r = 0.4 + ((double)l / (levels - 1)) * 3.4;
      for (int y = 0; y < GH; y++) for (int x = 0; x < GW; x++) { double dx = x - 2, dy = (y - 3) * 0.9; if (std::sqrt(dx * dx + dy * dy) <= r) g[y * GW + x] = 1; }
      glyphs.push_back(g);
    }
  } else if (si == 10) {  // bars
    const std::vector<std::vector<int>> sets = { {}, { 3 }, { 1, 5 }, { 1, 3, 5 }, { 0, 2, 4, 6 }, { 0, 1, 2, 3, 4, 5, 6 } };
    for (auto& rows : sets) { Glyph g{}; for (int r : rows) for (int x = 0; x < GW; x++) g[r * GW + x] = 1; glyphs.push_back(g); }
  } else {
    const bool custom = si == 11;
    std::string chars = custom ? (customChars.empty() ? "FRANK" : customChars) : ASCII_CHARS[si];
    std::map<char, int> seen;
    for (char ch : chars) {
      if (seen[ch]) continue; seen[ch] = 1;
      const Glyph* g = glyphBits(ch);
      if (g && coverage(*g) > 0) glyphs.push_back(*g);
    }
    if (glyphs.empty()) glyphs.push_back(*glyphBits('#'));
    if (!(custom && keepOrder)) std::stable_sort(glyphs.begin(), glyphs.end(), [](const Glyph& a, const Glyph& b) { return coverage(a) < coverage(b); });
    glyphs.insert(glyphs.begin(), Glyph{});
  }
  if (coverage(glyphs[0]) != 0) glyphs.insert(glyphs.begin(), Glyph{});
  return glyphs;
}

struct Asc {
  double k = 4; std::vector<Glyph> ramp; const U8* lum = nullptr; double edgeAmt = 0; bool textMode = false; std::string text = "FRANK";
  std::function<U8*(int, int)> cellMask;
};

static void asciiInk(const U8& demand, int w, int h, const Asc& O, U8& target0) {
  const int k = std::max(1, jround(O.k));
  const int cw = (GW + 1) * k, ch = (GH + 1) * k;
  const int cols = (int)std::ceil((double)w / cw), rows = (int)std::ceil((double)h / ch);
  const auto& ramp = O.ramp; const int nr = (int)ramp.size();
  const double edgeAmt = O.edgeAmt; const U8* lum = O.lum;
  const Glyph* edgeGlyphs[4] = { glyphBits('-'), glyphBits('\\'), glyphBits('|'), glyphBits('/') };
  std::vector<const Glyph*> textGlyphs;
  if (O.textMode) {
    std::string t = O.text.empty() ? "FRANK" : O.text;
    for (char c : t) { const Glyph* g = glyphBits(c); if (g) textGlyphs.push_back(g); }
    if (textGlyphs.empty()) textGlyphs.push_back(glyphBits('#'));
  }
  for (int cy = 0; cy < rows; cy++) {
    const int y0 = cy * ch, y1 = std::min(h, y0 + ch);
    for (int cx = 0; cx < cols; cx++) {
      const int x0 = cx * cw, x1 = std::min(w, x0 + cw);
      double sum = 0, gxx = 0, gxy = 0, mag2 = 0; int cnt = 0;
      for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) { sum += demand[(size_t)y * w + x]; cnt++; }
      if (!cnt) continue;
      const double t = sum / ((double)cnt * 255);
      const Glyph* bits = nullptr;
      if (edgeAmt > 0 && lum) {
        for (int y = std::max(1, y0); y < std::min(h - 1, y1); y++) for (int x = std::max(1, x0); x < std::min(w - 1, x1); x++) {
          const size_t i = (size_t)y * w + x; const U8& L = *lum;
          double gx = ((double)L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1]) - ((double)L[i - w - 1] + 2 * L[i - 1] + L[i + w - 1]);
          double gy = ((double)L[i + w - 1] + 2 * L[i + w] + L[i + w + 1]) - ((double)L[i - w - 1] + 2 * L[i - w] + L[i - w + 1]);
          gxx += gx * gx - gy * gy; gxy += 2 * gx * gy; mag2 += gx * gx + gy * gy;
        }
        double m = std::sqrt(mag2 / cnt) / 1020;
        if (m * 4 * edgeAmt > 0.35) {
          double theta = std::atan2(gxy, gxx) / 2, phi = theta + PI / 2;
          phi = std::fmod(std::fmod(phi, PI) + PI, PI);
          int sector = jround(phi / (PI / 4)) % 4;
          bits = edgeGlyphs[sector];
        }
      }
      U8* target = O.cellMask ? O.cellMask(cx, cy) : &target0;
      if (!target) continue;
      U8& T = *target;
      if (!textGlyphs.empty() && !bits) {
        if (t < 0.04) continue;
        const Glyph& g = *textGlyphs[(cy * cols + cx) % textGlyphs.size()];
        double f = std::sqrt(std::min(1.0, t * 1.15));
        int bw = std::max(1, jround(cw * f * 0.96)), bh = std::max(1, jround(ch * f * 0.96));
        int ox = x0 + (int)std::floor((cw - bw) / 2.0), oy = y0 + (int)std::floor((ch - bh) / 2.0);
        for (int py = 0; py < bh; py++) {
          int yy = oy + py; if (yy < 0 || yy >= h) continue;
          int gy = std::min(GH - 1, (int)std::floor(((double)py / bh) * GH));
          for (int px = 0; px < bw; px++) {
            int xx = ox + px; if (xx < 0 || xx >= w) continue;
            int gx = std::min(GW - 1, (int)std::floor(((double)px / bw) * GW));
            if (g[gy * GW + gx]) T[(size_t)yy * w + xx] = 255;
          }
        }
        continue;
      }
      if (!bits) bits = &ramp[std::min(nr - 1, (int)std::floor(t * nr))];
      for (int gy = 0; gy < GH; gy++) for (int gx = 0; gx < GW; gx++) {
        if (!(*bits)[gy * GW + gx]) continue;
        int bx = x0 + gx * k, by = y0 + gy * k;
        for (int yy = by; yy < by + k && yy < h; yy++) for (int xx = bx; xx < bx + k && xx < w; xx++) T[(size_t)yy * w + xx] = 255;
      }
    }
  }
}

// ---------------------------------------------------------------- ink generators
struct Eng {
  int engine = ENG_DITHER; std::string algo = "fs"; double cellPx = 8, ps = 1; bool aa = false;
  bool hasTune = false; Tune tune; double w = 0, h = 0; double lsc = 1;
  int mox = 0, moy = 0, seedOff = 0;
};

static U8 screenInk(const U8& demand, int w, int h, const std::string& kindS, double cellPx, double angle, bool aa, double ox, double oy, int seedOff) {
  U8 out((size_t)w * h, 0);
  const int kind = spotKind(kindS);
  const auto& lut = rankLUT(kind); const int N = (int)lut.size();
  const double th = angle * PI / 180, c = std::cos(th), s = std::sin(th);
  const double cp = std::max(1.5, cellPx);
  const double iu = 1 / cp, iv = 1 / (cp * screenVS(kind));
  const bool grain = kind == 10; const double k = cp * 0.8;
  for (int y = 0; y < h; y++) {
    const double py = y + oy; const size_t row = (size_t)y * w;
    for (int x = 0; x < w; x++) {
      const int d0 = demand[row + x]; if (d0 == 0) continue;
      const double pxx = x + ox;
      const double u = (pxx * c + py * s) * iu, v = (-pxx * s + py * c) * iv;
      const double fu = u - std::floor(u), fv = v - std::floor(v);
      double thr = lut[(int)(spotFast(kind, fu, fv) * (N - 1) + 0.5)];
      if (grain) thr = clamp(thr + (hash2(x, y, 7 + seedOff) - 0.5) * 0.32, 0.0005, 0.9995);
      const double d = d0 / 255.0;
      if (aa) { double a = d * (k + 1) - thr * k; out[row + x] = a <= 0 ? 0 : (a >= 1 ? 255 : (uint8_t)(int)(a * 255)); }
      else if (d > thr) out[row + x] = 255;
    }
  }
  return out;
}

static U8 diffuseMono(const U8& demand, int w, int h, const Kernel& K, double jit, int seed, double est) {
  const size_t n = (size_t)w * h; std::vector<float> buf(n); U8 out(n);
  for (size_t i = 0; i < n; i++) buf[i] = demand[i];
  const int div = K.d;
  for (int y = 0; y < h; y++) {
    const bool rev = (y & 1) == 1;
    const int xs = rev ? w - 1 : 0, xe = rev ? -1 : w, st = rev ? -1 : 1;
    for (int x = xs; x != xe; x += st) {
      const size_t idx = (size_t)y * w + x; const double old = buf[idx];
      double thr = 127.5;
      if (jit) thr += (hash2(x, y, seed) - 0.5) * jit * 255;
      const double nv = old >= thr ? 255 : 0;
      out[idx] = (uint8_t)nv;
      const double err = est == 1 ? (old - nv) / div : (old - nv) * est / div;
      if (err == 0) continue;
      for (auto& e : K.k) {
        const int nx = x + (rev ? -e[0] : e[0]), ny = y + e[1];
        if (nx >= 0 && nx < w && ny < h) { float& b = buf[(size_t)ny * w + nx]; b = (float)((double)b + err * e[2]); }
      }
    }
  }
  return out;
}

static U8 ditherInk(const U8& demand, int w, int h, const Dither* D, int ox, int oy, const Eng& E, double lsc) {
  const size_t n = (size_t)w * h; U8 out(n, 0);
  const double st = E.hasTune ? clamp(E.tune.strength, 0, 100) / 100 : 1;
  if (D->t == T_LINE) return lineInk(demand, w, h, D->id, E.hasTune ? E.tune : Tune(), lsc, E.mox, E.moy);
  if (D->t == T_ED) return diffuseMono(demand, w, h, KERNELS().at(D->k), D->jit, 11 + ox + E.seedOff, st);
  if (D->t == T_ORD) {
    TMap M = mapFor(D); const int sz = M.n;
    const double jit = E.hasTune && E.tune.jitter ? clamp(E.tune.jitter, 0, 100) / 100 : 0;
    const bool plain = st == 1 && !jit;
    for (int y = 0; y < h; y++) {
      const int ry = pmod(y + oy + E.moy, sz) * sz;
      for (int x = 0; x < w; x++) {
        double t = M.m[ry + pmod(x + ox + E.mox, sz)];
        if (!plain) { t = 0.5 + (t - 0.5) * st; if (jit) t += (hash2(x, y, 23 + ox + E.seedOff) - 0.5) * jit; }
        if (demand[(size_t)y * w + x] / 255.0 > t) out[(size_t)y * w + x] = 255;
      }
    }
    return out;
  }
  if (D->t == T_IGN) {
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      double f = 0.06711056 * (x + ox + E.mox) + 0.00583715 * (y + oy + E.moy);
      f -= std::floor(f);
      double r = 52.9829189 * f; r -= std::floor(r);
      if (demand[(size_t)y * w + x] / 255.0 > r) out[(size_t)y * w + x] = 255;
    }
    return out;
  }
  if (D->t == T_WHITE) {
    for (size_t i = 0; i < n; i++) if (demand[i] / 255.0 > hash2((int)(i % w), (int)(i / w), 5 + ox + E.seedOff)) out[i] = 255;
    return out;
  }
  for (size_t i = 0; i < n; i++) out[i] = demand[i] >= 128 ? 255 : 0;
  return out;
}

static ThrFn makeThr(const Eng& E, double angle) {
  if (E.engine == ENG_HALFTONE) {
    const int kind = spotKind(E.algo); const std::vector<float>* lut = &rankLUT(kind); const int N = (int)lut->size();
    const double th = angle * PI / 180, c = std::cos(th), s = std::sin(th);
    const double cp = std::max(1.5, E.cellPx), iu = 1 / cp, iv = 1 / (cp * screenVS(kind));
    const int mox = E.mox, moy = E.moy, so = E.seedOff;
    return [=](int xi, int yi) {
      const double x = xi + mox, y = yi + moy;
      const double u = (x * c + y * s) * iu, v = (-x * s + y * c) * iv;
      double t = (*lut)[(int)(spotFast(kind, u - std::floor(u), v - std::floor(v)) * (N - 1) + 0.5)];
      if (kind == 10) t = clamp(t + (hash2(xi, yi, 7 + so) - 0.5) * 0.32, 0, 1);
      return t;
    };
  }
  const Dither* D = ditherById(E.algo); if (!D) D = &DITHERS[0];
  if (D->t == T_LINE) {
    double div = E.ps > 1.01 ? E.ps : 1;
    ThrFn f = lineThr(D->id, E.tune, (E.w ? E.w : 512) / div, (E.h ? E.h : 512) / div, E.lsc);
    const int mox = E.mox, moy = E.moy;
    if (!mox && !moy) return f;
    return [=](int x, int y) { return f(std::max(0, x + mox), std::max(0, y + moy)); };
  }
  if (D->t == T_ORD) { TMap M = mapFor(D); const int sz = M.n, mox = E.mox, moy = E.moy; return [=](int x, int y) { return (double)M.m[pmod(y + moy, sz) * sz + pmod(x + mox, sz)]; }; }
  if (D->t == T_IGN) { const int mox = E.mox, moy = E.moy; return [=](int x, int y) { double f = 0.06711056 * (x + mox) + 0.00583715 * (y + moy); f -= std::floor(f); double r = 52.9829189 * f; return r - std::floor(r); }; }
  if (D->t == T_WHITE) { const int so = E.seedOff; return [=](int x, int y) { return hash2(x, y, 5 + so); }; }
  return [](int, int) { return 0.5; };
}

static U8 inkFromPlane(const U8& demandIn, int w, int h, const Eng& E, double angle, int phx, int phy, const Asc* asc) {
  const U8* demand = &demandIn; U8 d2;
  const double thr = E.hasTune ? E.tune.threshold : 50;
  if (thr != 50) {
    const double sh = (50 - thr) * 2.55; d2.resize(demandIn.size());
    for (size_t i = 0; i < d2.size(); i++) d2[i] = demandIn[i] ? u8(clamp(demandIn[i] + sh, 0, 255)) : 0;
    demand = &d2;
  }
  if (E.engine == ENG_HALFTONE) return screenInk(*demand, w, h, E.algo, E.cellPx, angle, E.aa, phx + E.mox, phy + E.moy, E.seedOff);
  if (E.engine == ENG_ASCII) { U8 o((size_t)w * h, 0); asciiInk(*demand, w, h, *asc, o); return o; }
  const Dither* D = ditherById(E.algo); if (!D) D = &DITHERS[0];
  if (E.ps > 1.01) {
    const int w2 = std::max(2, jround(w / E.ps)), h2 = std::max(2, jround(h / E.ps));
    U8 small = downBox(*demand, w, h, w2, h2);
    Eng Es = E; Es.mox = (int)std::floor(E.mox / E.ps); Es.moy = (int)std::floor(E.moy / E.ps);
    return upNearest(ditherInk(small, w2, h2, D, phx, phy, Es, E.lsc), w2, h2, w, h);
  }
  return ditherInk(*demand, w, h, D, phx, phy, E, E.lsc);
}

// ---------------------------------------------------------------- pre-processing
static U8 boxBlurRGB(const U8& src, int w, int h, double rIn) {
  const int r = jround(rIn);
  if (r < 1) return src;
  const double win = 2 * r + 1;
  U8 tmp(src.size()), out(src.size());
  for (int y = 0; y < h; y++) for (int ch = 0; ch < 3; ch++) {
    double sum = 0;
    for (int k = -r; k <= r; k++) sum += src[((size_t)y * w + iclamp(k, 0, w - 1)) * 3 + ch];
    for (int x = 0; x < w; x++) {
      tmp[((size_t)y * w + x) * 3 + ch] = (uint8_t)(int)(sum / win + 0.5);
      sum += (double)src[((size_t)y * w + std::min(w - 1, x + r + 1)) * 3 + ch] - src[((size_t)y * w + std::max(0, x - r)) * 3 + ch];
    }
  }
  for (int x = 0; x < w; x++) for (int ch = 0; ch < 3; ch++) {
    double sum = 0;
    for (int k = -r; k <= r; k++) sum += tmp[((size_t)iclamp(k, 0, h - 1) * w + x) * 3 + ch];
    for (int y = 0; y < h; y++) {
      out[((size_t)y * w + x) * 3 + ch] = (uint8_t)(int)(sum / win + 0.5);
      sum += (double)tmp[((size_t)std::min(h - 1, y + r + 1) * w + x) * 3 + ch] - tmp[((size_t)std::max(0, y - r) * w + x) * 3 + ch];
    }
  }
  return out;
}

static void preprocess(U8& rgb, int w, int h, const Params& P, double s) {
  uint8_t lut[256];
  const double black = clamp(P.black, 0, 250), white = std::max(black + 1, clamp(P.white, 1, 255));
  const double gam = P.gamma > 0.05 ? P.gamma : 1;
  const double ct = clamp(P.contrast, -100, 100) * 2.55;
  const double cf = (259 * (ct + 255)) / (255 * (259 - ct));
  const double inv = clamp(P.invert, 0, 100) / 100;
  for (int v = 0; v < 256; v++) {
    double t = clamp((v - black) / (white - black), 0, 1);
    t = std::pow(t, 1 / gam);
    double x = t * 255;
    x = cf * (x - 128) + 128 + clamp(P.brightness, -100, 100) * 1.28;
    if (P.haze) { double hz = clamp(P.haze, 0, 100) / 100 * 96; x = hz + x * (1 - hz / 255); }
    x = clamp(x, 0, 255);
    if (inv) x = x + (255 - 2 * x) * inv;
    lut[v] = u8((double)(int)(x + 0.5));
  }
  for (auto& c : rgb) c = lut[c];
  U8 work = rgb; bool changed = false;
  const double br = P.blur * s;
  if (br >= 0.5) { work = boxBlurRGB(work, w, h, br); changed = true; }
  (void)changed;
  if (P.sharpen > 0) {
    U8 bl = boxBlurRGB(work, w, h, std::max(1, jround((P.radius != 0 ? P.radius : 1.5) * s)));
    const double amt = P.sharpen / 100 * 2;
    for (size_t i = 0; i < work.size(); i++) work[i] = u8(clamp(work[i] + amt * ((double)work[i] - bl[i]), 0, 255));
  }
  if (P.noise < 0) {
    const double a = std::min(100.0, -P.noise) / 100; U8 bl = boxBlurRGB(work, w, h, std::max(1, jround(2 * s)));
    for (size_t i = 0; i < work.size(); i++) work[i] = u8(work[i] + ((double)bl[i] - work[i]) * a);
  }
  if (P.noise > 0) {
    const double amp = P.noise / 100 * 64;
    for (size_t i = 0, p = 0; i < (size_t)w * h; i++, p += 3) {
      double nz = (hash2((int)(i % w), (int)(i / w), 3 + P.seedOff) - 0.5) * 2 * amp;
      work[p] = u8(clamp(work[p] + nz, 0, 255)); work[p + 1] = u8(clamp(work[p + 1] + nz, 0, 255)); work[p + 2] = u8(clamp(work[p + 2] + nz, 0, 255));
    }
  }
  rgb = work;
}

static U8 lumPlane(const U8& rgb, size_t n) {
  U8 out(n);
  for (size_t i = 0, j = 0; i < n; i++, j += 3) out[i] = (uint8_t)((rgb[j] * 77 + rgb[j + 1] * 150 + rgb[j + 2] * 29) >> 8);
  return out;
}

// ---------------------------------------------------------------- mask ops
static U8 morph(const U8& src, int w, int h, bool dilate, bool cross) {
  U8 out(src.size());
  for (int y = 0; y < h; y++) {
    const size_t y0 = (size_t)std::max(0, y - 1) * w, y1 = (size_t)y * w, y2 = (size_t)std::min(h - 1, y + 1) * w;
    for (int x = 0; x < w; x++) {
      const int xl = std::max(0, x - 1), xr = std::min(w - 1, x + 1);
      uint8_t v = src[y1 + x];
      const uint8_t a = src[y0 + x], b = src[y2 + x], c = src[y1 + xl], d = src[y1 + xr];
      if (dilate) {
        v = std::max({ v, a, b, c, d });
        if (!cross) v = std::max({ v, src[y0 + xl], src[y0 + xr], src[y2 + xl], src[y2 + xr] });
      } else {
        v = std::min({ v, a, b, c, d });
        if (!cross) v = std::min({ v, src[y0 + xl], src[y0 + xr], src[y2 + xl], src[y2 + xr] });
      }
      out[y1 + x] = v;
    }
  }
  return out;
}
static U8 dotGain(const U8& mask, int w, int h, double amount, double s) {
  const int iters = std::min(8, jround(std::fabs(amount) * s));
  if (!iters) return mask;
  U8 m = mask;
  for (int i = 0; i < iters; i++) m = morph(m, w, h, amount > 0, i % 2 == 0);
  return m;
}
static double vnoise(double x, double y, int seed) {
  const double xi = std::floor(x), yi = std::floor(y), xf = x - xi, yf = y - yi;
  const int X = (int)xi, Y = (int)yi;
  const double a = hash2(X, Y, seed), b = hash2(X + 1, Y, seed), c = hash2(X, Y + 1, seed), d = hash2(X + 1, Y + 1, seed);
  const double u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
static U8 distress(const U8& mask, int w, int h, double amount, double s, int seed) {
  const double th = clamp(amount, 0, 100) / 100 * 0.62;
  if (th <= 0) return mask;
  U8 out(mask.size(), 0);
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    const size_t i = (size_t)y * w + x;
    if (!mask[i]) continue;
    const double X = x / s, Y = y / s;
    const double n = 0.45 * vnoise(X / 7, Y / 7, seed) + 0.3 * vnoise(X / 2.5, Y / 2.5, seed + 1) + 0.25 * hash2(x, y, seed + 2);
    const double t = clamp((n - (th - 0.03)) / 0.06, 0, 1);
    out[i] = (uint8_t)(int)(mask[i] * t + 0.5);
  }
  return out;
}
static void removeSpecks(U8& mask, int w, int h, int minArea) {
  if (minArea <= 1) return;
  const size_t n = (size_t)w * h;
  std::vector<uint8_t> seen(n, 0); std::vector<int32_t> queue(n);
  for (size_t i = 0; i < n; i++) {
    if (seen[i] || mask[i] < 128) continue;
    int qs = 0, qe = 0; queue[qe++] = (int)i; seen[i] = 1;
    while (qs < qe) {
      const int p = queue[qs++], x = p % w, y = p / w;
      if (x > 0 && !seen[p - 1] && mask[p - 1] >= 128) { seen[p - 1] = 1; queue[qe++] = p - 1; }
      if (x < w - 1 && !seen[p + 1] && mask[p + 1] >= 128) { seen[p + 1] = 1; queue[qe++] = p + 1; }
      if (y > 0 && !seen[p - w] && mask[p - w] >= 128) { seen[p - w] = 1; queue[qe++] = p - w; }
      if (y < h - 1 && !seen[p + w] && mask[p + w] >= 128) { seen[p + w] = 1; queue[qe++] = p + w; }
    }
    if (qe < minArea) {
      for (int k = 0; k < qe; k++) {
        const int p = queue[k], x = p % w, y = p / w;
        mask[p] = 0;
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
          const int nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[(size_t)ny * w + nx] < 128) mask[(size_t)ny * w + nx] = 0;
        }
      }
    }
  }
}
static U8 shiftMask(const U8& mask, int w, int h, int dx, int dy) {
  if (!dx && !dy) return mask;
  U8 out(mask.size(), 0);
  for (int y = 0; y < h; y++) {
    const int sy = y - dy; if (sy < 0 || sy >= h) continue;
    for (int x = 0; x < w; x++) { const int sx = x - dx; if (sx >= 0 && sx < w) out[(size_t)y * w + x] = mask[(size_t)sy * w + sx]; }
  }
  return out;
}
static U8 edgeDemand(const U8& lum, int w, int h, const Params& P, double s) {
  U8 out((size_t)w * h, 0);
  const double gain = clamp(P.edgeStrength, 0, 100) / 100 * 1.1;
  for (int y = 1; y < h - 1; y++) for (int x = 1; x < w - 1; x++) {
    const size_t i = (size_t)y * w + x;
    const double gx = ((double)lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]) - ((double)lum[i - w - 1] + 2 * lum[i - 1] + lum[i + w - 1]);
    const double gy = ((double)lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]) - ((double)lum[i - w - 1] + 2 * lum[i - w] + lum[i - w + 1]);
    out[i] = u8(clamp(std::sqrt(gx * gx + gy * gy) * gain * 0.6, 0, 255));
  }
  U8 m = out;
  const int it = std::min(6, jround((P.edgeThick - 1) * s));
  for (int i = 0; i < it; i++) m = morph(m, w, h, true, false);
  for (auto& v : m) v = u8(clamp((v - 40) * 2.2, 0, 255));
  return m;
}
static U8 knockout(const U8& rgb, const U8& alpha, int w, int h, const Params& P) {
  const RGB g = hexRGB(P.garment);
  const double f = clamp(P.fuzz, 0, 100) / 100 * 0.5;
  const double fe = clamp(P.feather, 0, 100) / 100 * 0.5 + 0.004;
  U8 out((size_t)w * h, 0);
  for (size_t i = 0, p = 0; i < (size_t)w * h; i++, p += 3) {
    if (!alpha[i]) continue;
    const double dr = rgb[p] - g.r, dg = rgb[p + 1] - g.g, db = rgb[p + 2] - g.b;
    const double d = std::sqrt(dr * dr + dg * dg + db * db) / 441.673;
    double a = clamp((d - f) / fe, 0, 1);
    a = a * a * (3 - 2 * a);
    out[i] = (uint8_t)(int)(alpha[i] * a + 0.5);
  }
  return out;
}

// ---------------------------------------------------------------- colour
static void cmykPlanes(const U8& rgb, size_t n, double gcr, U8& C, U8& M, U8& Y, U8& K) {
  C.assign(n, 0); M.assign(n, 0); Y.assign(n, 0); K.assign(n, 0);
  const double g = clamp(gcr, 0, 100) / 100;
  for (size_t i = 0, p = 0; i < n; i++, p += 3) {
    const double r = rgb[p] / 255.0, gg = rgb[p + 1] / 255.0, b = rgb[p + 2] / 255.0;
    const double k0 = 1 - std::max({ r, gg, b }), k = k0 * g, d = 1 - k;
    double c = 0, m = 0, y = 0;
    if (d > 1e-6) { c = (1 - r - k) / d; m = (1 - gg - k) / d; y = (1 - b - k) / d; }
    C[i] = u8(clamp(c, 0, 1) * 255 + 0.5); M[i] = u8(clamp(m, 0, 1) * 255 + 0.5); Y[i] = u8(clamp(y, 0, 1) * 255 + 0.5); K[i] = u8(clamp(k, 0, 1) * 255 + 0.5);
  }
}

struct Near {
  std::vector<float> pr, pg, pb;
  explicit Near(const std::vector<RGB>& pal) { for (auto& c : pal) { pr.push_back((float)c.r); pg.push_back((float)c.g); pb.push_back((float)c.b); } }
  int operator()(double r, double g, double b) const {
    int best = 0; double bd = 1e18;
    for (size_t i = 0; i < pr.size(); i++) {
      const double dr = r - pr[i], dg = g - pg[i], db = b - pb[i];
      const double d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = (int)i; }
    }
    return best;
  }
};

static std::vector<U8> gradeDiffuse(const U8& rgb, int w, int h, const std::vector<RGB>& pal, const Kernel& K) {
  Near near(pal);
  std::vector<U8> masks(pal.size(), U8((size_t)w * h, 0));
  const int W3 = w * 3;
  std::vector<float> rows[3] = { std::vector<float>(W3), std::vector<float>(W3), std::vector<float>(W3) };
  auto load = [&](std::vector<float>& row, int y) { if (y >= h) { std::fill(row.begin(), row.end(), 0.f); return; } size_t o = (size_t)y * W3; for (int i = 0; i < W3; i++) row[i] = rgb[o + i]; };
  load(rows[0], 0); load(rows[1], 1); load(rows[2], 2);
  const int div = K.d;
  for (int y = 0; y < h; y++) {
    std::vector<float>* rr[3] = { &rows[y % 3], &rows[(y + 1) % 3], &rows[(y + 2) % 3] };
    const bool rev = (y & 1) == 1;
    const int xs = rev ? w - 1 : 0, xe = rev ? -1 : w, st = rev ? -1 : 1;
    for (int x = xs; x != xe; x += st) {
      const int p = x * 3;
      const double r = clamp((*rr[0])[p], 0, 255), g = clamp((*rr[0])[p + 1], 0, 255), b = clamp((*rr[0])[p + 2], 0, 255);
      const int bi = near(r, g, b);
      masks[bi][(size_t)y * w + x] = 255;
      const double er = (r - pal[bi].r) / div, eg = (g - pal[bi].g) / div, eb = (b - pal[bi].b) / div;
      for (auto& e : K.k) {
        const int nx = x + (rev ? -e[0] : e[0]), ny = y + e[1];
        if (nx < 0 || nx >= w || ny >= h) continue;
        std::vector<float>& t = *rr[e[1]]; const int q = nx * 3; const double wt = e[2];
        t[q] = (float)((double)t[q] + er * wt); t[q + 1] = (float)((double)t[q + 1] + eg * wt); t[q + 2] = (float)((double)t[q + 2] + eb * wt);
      }
    }
    load(rows[y % 3], y + 3);
  }
  return masks;
}
static std::vector<U8> gradeThreshold(const U8& rgb, int w, int h, const std::vector<RGB>& pal, const ThrFn& thr, double spread) {
  Near near(pal);
  std::vector<U8> masks(pal.size(), U8((size_t)w * h, 0));
  const double amp = clamp(spread, 0, 100) / 100 * 255;
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    const size_t p = ((size_t)y * w + x) * 3; const double off = (thr(x, y) - 0.5) * amp;
    masks[near(clamp(rgb[p] + off, 0, 255), clamp(rgb[p + 1] + off, 0, 255), clamp(rgb[p + 2] + off, 0, 255))][(size_t)y * w + x] = 255;
  }
  return masks;
}
static std::vector<U8> gradeAscii(const U8& rgb, int w, int h, const std::vector<RGB>& pal, const Asc& asc) {
  Near near(pal);
  std::vector<U8> masks(pal.size(), U8((size_t)w * h, 0));
  const int k = std::max(1, jround(asc.k)), cw = 6 * k, ch = 8 * k;
  const int cols = (int)std::ceil((double)w / cw), rows = (int)std::ceil((double)h / ch);
  std::vector<int16_t> idx((size_t)cols * rows);
  for (int cy = 0; cy < rows; cy++) for (int cx = 0; cx < cols; cx++) {
    double r = 0, g = 0, b = 0; int cnt = 0;
    for (int y = cy * ch; y < std::min(h, cy * ch + ch); y++) for (int x = cx * cw; x < std::min(w, cx * cw + cw); x++) {
      const size_t p = ((size_t)y * w + x) * 3; r += rgb[p]; g += rgb[p + 1]; b += rgb[p + 2]; cnt++;
    }
    idx[(size_t)cy * cols + cx] = (int16_t)(cnt ? near(r / cnt, g / cnt, b / cnt) : 0);
  }
  U8 demand((size_t)w * h);
  for (size_t i = 0; i < demand.size(); i++) demand[i] = (uint8_t)(255 - (*asc.lum)[i]);
  Asc a2 = asc; a2.cellMask = [&](int cx, int cy) { return &masks[idx[(size_t)cy * cols + cx]]; };
  U8 dummy((size_t)w * h, 0);
  asciiInk(demand, w, h, a2, dummy);
  return masks;
}

// ---------------------------------------------------------------- MAIN
bool render(const Image& src, const Params& P, Result& res, ProgressFn pf, void* ctx) {
  const double s = P.scale != 0 ? P.scale : 1, ppi = P.ppi != 0 ? P.ppi : 300;
  const int w = src.w, h = src.h; const size_t n = (size_t)w * h;
  res = Result(); res.w = w; res.h = h;
  auto prog = [&](int d, int t) { return !pf || pf(ctx, d, t); };

  // 1. composite on white, remember alpha
  U8 rgb(n * 3), alpha(n); bool anyA = false;
  for (size_t i = 0; i < n; i++) {
    double r = src.R[i], g = src.G[i], b = src.B[i];
    const int a = (int)clamp(src.A[i], 0, 255);
    if (a < 255) { anyA = true; const double t = a / 255.0; r = r * t + 255 * (1 - t); g = g * t + 255 * (1 - t); b = b * t + 255 * (1 - t); }
    rgb[i * 3] = u8((double)(int)(r + 0.5)); rgb[i * 3 + 1] = u8((double)(int)(g + 0.5)); rgb[i * 3 + 2] = u8((double)(int)(b + 0.5));
    alpha[i] = (uint8_t)a;
  }
  // 2. knock-out
  U8 alphaF; bool hasAlphaF = false;
  if (P.dtfOn || anyA) { alphaF = P.dtfOn ? knockout(rgb, alpha, w, h, P) : alpha; hasAlphaF = true; }
  // 3. shape the image
  if (P.preOn) preprocess(rgb, w, h, P, s);
  const U8 lum = lumPlane(rgb, n);
  // 4. engine configuration
  Eng E; E.engine = P.engine;
  E.algo = P.engine == ENG_HALFTONE ? P.algoHalftone : P.engine == ENG_DITHER ? P.algoDither : P.algoAscii;
  if (E.algo.empty()) E.algo = P.engine == ENG_HALFTONE ? "round" : "fs";
  E.cellPx = (ppi / clamp(P.lpi != 0 ? P.lpi : 35, 3, 300)) * s;
  const double pixel = P.pixel != 0 ? P.pixel : 1;
  E.ps = std::max(1.0, pixel * s);
  E.aa = P.aa; E.hasTune = true;
  E.tune.threshold = P.tThreshold; E.tune.strength = P.tStrength; E.tune.direction = P.tDirection; E.tune.weight = P.tWeight; E.tune.spacing = P.tSpacing; E.tune.jitter = P.tJitter;
  E.w = w; E.h = h;
  E.lsc = (pixel * s) / (E.ps > 1.01 ? E.ps : 1);
  E.mox = (int)std::floor(P.mox); E.moy = (int)std::floor(P.moy); E.seedOff = P.seedOff;
  Asc asc;
  asc.k = std::max(1, jround((P.aSize != 0 ? P.aSize : 4) * s));
  asc.ramp = buildRamp(P.algoAscii, P.aCustom, P.aKeepOrder);
  asc.lum = &lum; asc.edgeAmt = P.aEdge / 100; asc.textMode = P.aTextMode; asc.text = P.aText;
  U8 edgeD; const bool hasEdge = P.edgesOn;
  if (hasEdge) edgeD = edgeDemand(lum, w, h, P, s);

  // 5. alpha mask
  U8 aMask; bool hasAMask = false;
  if (hasAlphaF) {
    hasAMask = true;
    if (P.dtfOn) {
      if (P.dots) {
        Eng Ea = E;
        if (E.engine == ENG_ASCII) { Ea = Eng(); Ea.engine = ENG_DITHER; Ea.algo = "fs"; Ea.ps = E.ps; Ea.mox = E.mox; Ea.moy = E.moy; Ea.seedOff = E.seedOff; }
        aMask = inkFromPlane(alphaF, w, h, Ea, 45, 0, 0, nullptr);
      } else { aMask.assign(n, 0); for (size_t i = 0; i < n; i++) aMask[i] = alphaF[i] >= 128 ? 255 : 0; }
    } else aMask = alphaF;
  }

  // 6. per-layer post
  const int seed = 17 + P.seedOff;
  auto post = [&](const U8& mask, int idx) {
    U8 m = mask;
    if (hasAMask) for (size_t i = 0; i < n; i++) m[i] = (uint8_t)(int)((mask[i] * aMask[i] + 127) / 255.0);
    if (P.gainOn && P.gainAmount) m = dotGain(m, w, h, P.gainAmount, s);
    if (P.distressOn) m = distress(m, w, h, P.distressAmount, s, seed + idx);
    if (P.cleanOn) { const double dPx = P.cleanMm / 25.4 * ppi * s; removeSpecks(m, w, h, jround(PI * dPx * dPx / 4)); }
    if (P.misregOn && idx > 0) {
      static const int OFF[5][2] = { { 0, 0 }, { 1, 0 }, { 0, 1 }, { -1, -1 }, { 1, -1 } };
      const int* o = OFF[idx % 5]; const double a = P.misregAmount * s;
      m = shiftMask(m, w, h, jround(o[0] * a), jround(o[1] * a));
    }
    return m;
  };
  auto runPlane = [&](const U8& demand, double angle, int idx) {
    return post(inkFromPlane(demand, w, h, E, angle, idx * 3, idx * 5, E.engine == ENG_ASCII ? &asc : nullptr), idx);
  };

  if (P.mode == MODE_MONO) {
    if (!prog(0, 1)) return false;
    U8 dem(n); for (size_t i = 0; i < n; i++) dem[i] = (uint8_t)(255 - lum[i]);
    if (hasEdge) for (size_t i = 0; i < n; i++) if (edgeD[i] > dem[i]) dem[i] = edgeD[i];
    res.layers.push_back({ runPlane(dem, P.angle, 0), hexRGB(P.monoInk), BD_NORMAL });
    if (!P.monoPaper.empty()) { res.hasPaper = true; res.paper = hexRGB(P.monoPaper); }
  } else if (P.mode == MODE_TONAL) {
    struct Ink { RGB rgb; int i; }; std::vector<Ink> inks;
    for (size_t i = 0; i < P.tonalInks.size(); i++) if (isHex(P.tonalInks[i])) inks.push_back({ hexToRgb(P.tonalInks[i]), (int)inks.size() });
    std::stable_sort(inks.begin(), inks.end(), [](const Ink& a, const Ink& b) { return luma(b.rgb) - luma(a.rgb) < 0; });
    const int nk = std::max(1, (int)inks.size());
    for (int k = 0; k < (int)inks.size(); k++) {
      if (!prog(k, (int)inks.size())) return false;
      U8 dem(n);
      for (size_t i = 0; i < n; i++) { const double dk = (255 - lum[i]) / 255.0; dem[i] = u8(clamp(dk * nk - k, 0, 1) * 255 + 0.5); }
      if (hasEdge && k == (int)inks.size() - 1) for (size_t i = 0; i < n; i++) if (edgeD[i] > dem[i]) dem[i] = edgeD[i];
      const double ang = k < (int)P.tonalAngles.size() ? P.tonalAngles[k] : 45;
      res.layers.push_back({ runPlane(dem, ang, k), inks[k].rgb, BD_NORMAL });
    }
    if (!P.tonalPaper.empty()) { res.hasPaper = true; res.paper = hexRGB(P.tonalPaper); }
  } else if (P.mode == MODE_CMYK) {
    U8 C, M, Y, K; cmykPlanes(rgb, n, P.gcr, C, M, Y, K);
    struct Def { RGB col; U8* plane; int ai, i; bool black; };
    Def defs[4] = { { { 255, 242, 0 }, &Y, 2, 2, false }, { { 236, 0, 140 }, &M, 1, 1, false }, { { 0, 174, 239 }, &C, 0, 0, false }, { { 0, 0, 0 }, &K, 3, 3, true } };
    int cnt = 0;
    for (auto& df : defs) {
      if (!P.cmykOn[df.i]) continue;
      if (!prog(cnt++, 4)) return false;
      U8& dem = *df.plane;
      if (hasEdge && df.black) for (size_t i = 0; i < n; i++) if (edgeD[i] > dem[i]) dem[i] = edgeD[i];
      res.layers.push_back({ runPlane(dem, P.cmykAngles[df.ai], df.i), df.col, BD_MULTIPLY });
    }
  } else if (P.mode == MODE_RGB) {
    const RGB cols[3] = { { 255, 0, 0 }, { 0, 255, 0 }, { 0, 0, 255 } };
    int cnt = 0;
    for (int ch = 0; ch < 3; ch++) {
      if (!P.rgbOn[ch]) continue;
      if (!prog(cnt++, 3)) return false;
      U8 dem(n); const double st = clamp(P.rgbStrength[ch], 0, 200) / 100;
      for (size_t i = 0; i < n; i++) dem[i] = u8(clamp(rgb[i * 3 + ch] * st, 0, 255));
      res.layers.push_back({ runPlane(dem, P.rgbAngles[ch], ch), cols[ch], BD_LINEARDODGE });
    }
    res.hasPaper = true; res.paper = { 0, 0, 0 };
  } else if (P.mode == MODE_GRADE) {
    std::vector<RGB> cols; for (auto& c : P.gradeColors) if (isHex(c)) cols.push_back(hexToRgb(c));
    std::vector<RGB> pal;
    for (size_t i = 0; i < cols.size(); i++) if (std::find(P.gradeOff.begin(), P.gradeOff.end(), (int)i) == P.gradeOff.end()) pal.push_back(cols[i]);
    if (pal.size() < 2) pal = { { 0, 0, 0 }, { 255, 255, 255 } };
    if (!prog(0, 1)) return false;
    std::vector<U8> masks;
    const Dither* D = ditherById(E.algo);
    if (E.engine == ENG_ASCII) masks = gradeAscii(rgb, w, h, pal, asc);
    else if (E.engine == ENG_DITHER && D && D->t == T_ED) {
      const Kernel& K = KERNELS().at(D->k);
      if (E.ps > 1.01) {
        const int w2 = std::max(2, jround(w / E.ps)), h2 = std::max(2, jround(h / E.ps));
        U8 small((size_t)w2 * h2 * 3);
        for (int c = 0; c < 3; c++) {
          U8 ch(n); for (size_t i = 0; i < n; i++) ch[i] = rgb[i * 3 + c];
          U8 sm = downBox(ch, w, h, w2, h2);
          for (size_t i = 0; i < (size_t)w2 * h2; i++) small[i * 3 + c] = sm[i];
        }
        masks = gradeDiffuse(small, w2, h2, pal, K);
        for (auto& m : masks) m = upNearest(m, w2, h2, w, h);
      } else masks = gradeDiffuse(rgb, w, h, pal, K);
    } else {
      ThrFn thr = makeThr(E, P.angle);
      if (E.engine == ENG_DITHER && E.ps > 1.01) {
        const double ps = E.ps;
        ThrFn thr2 = [&](int x, int y) { return thr((int)std::floor(x / ps), (int)std::floor(y / ps)); };
        masks = gradeThreshold(rgb, w, h, pal, thr2, P.gradeSpread);
      } else masks = gradeThreshold(rgb, w, h, pal, thr, P.gradeSpread);
    }
    int skip = -1;
    if (P.skipLightest) { double bl = -1; for (size_t i = 0; i < pal.size(); i++) if (luma(pal[i]) > bl) { bl = luma(pal[i]); skip = (int)i; } }
    for (int i = 0; i < (int)pal.size(); i++) {
      if (i == skip) continue;
      res.layers.push_back({ post(masks[i], i), pal[i], BD_NORMAL });
    }
  }
  return prog(1, 1);
}

void compositeWhite(const Result& r, std::vector<uint8_t>& out) {
  const size_t n = (size_t)r.w * r.h;
  const RGB base = r.hasPaper ? r.paper : RGB{ 255, 255, 255 };
  out.resize(n * 3);
  for (size_t i = 0; i < n; i++) { out[i * 3] = (uint8_t)base.r; out[i * 3 + 1] = (uint8_t)base.g; out[i * 3 + 2] = (uint8_t)base.b; }
  for (auto& L : r.layers) {
    const double c[3] = { L.color.r, L.color.g, L.color.b };
    for (size_t i = 0, p = 0; i < n; i++, p += 3) {
      const int a = L.mask[i]; if (!a) continue;
      const double t = a / 255.0;
      for (int k = 0; k < 3; k++) {
        const double o = out[p + k]; double v;
        if (L.blend == BD_MULTIPLY) v = o * (1 - t + t * c[k] / 255);
        else if (L.blend == BD_LINEARDODGE) v = std::min(255.0, o + c[k] * t);
        else v = o * (1 - t) + c[k] * t;
        out[p + k] = u8(v);
      }
    }
  }
}

bool renderOut(const Image& src, const Params& P, bool transparent, OutImage& out, ProgressFn pf, void* ctx) {
  Result r; if (!render(src, P, r, pf, ctx)) return false;
  std::vector<uint8_t> rgb; compositeWhite(r, rgb);
  const size_t n = (size_t)r.w * r.h;
  out.resize(r.w, r.h);
  std::vector<double> cover;
  if (transparent) {
    cover.assign(n, 0);
    for (size_t i = 0; i < n; i++) { double keep = 1; for (auto& L : r.layers) keep *= 1 - L.mask[i] / 255.0; cover[i] = 1 - keep; }
  }
  for (size_t i = 0; i < n; i++) {
    float* p = &out.px[i * 4];
    p[0] = rgb[i * 3]; p[1] = rgb[i * 3 + 1]; p[2] = rgb[i * 3 + 2];
    p[3] = transparent ? (float)(cover[i] * 255) : 255.f;
    if (transparent && r.layers.size() == 1 && P.mode != MODE_RGB) { p[0] = (float)r.layers[0].color.r; p[1] = (float)r.layers[0].color.g; p[2] = (float)r.layers[0].color.b; }
  }
  return true;
}

}
