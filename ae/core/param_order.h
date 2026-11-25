// Lab suite 3.0 - After Effects Effect Controls order.
// The param ids (disk ids) never change, so old projects keep their values; only the order in
// Effect Controls does: Motion first, then the Primary cards, Advanced (collapsed), Colour.
// A "block" is one topic (or the shared Motion group), named by its first id; it runs up to the
// next block's first id. ParamsSetup adds the blocks in ORDER, and params[] (which AE indexes by
// position) is remapped to ids with byId() before any code reads it.
#pragma once
#include <algorithm>
#include <vector>

namespace brew {
struct ParamOrder {
  std::vector<int> ix;                 // id -> position in Effect Controls
  ParamOrder(const int* order, int nBlocks, int numParams) : ix(numParams, 0) {
    std::vector<int> firsts(order, order + nBlocks);
    std::sort(firsts.begin(), firsts.end());
    int pos = 1;                       // position 0 is the input layer
    for (int b = 0; b < nBlocks; b++) {
      const int first = order[b];
      auto it = std::upper_bound(firsts.begin(), firsts.end(), first);
      const int end = it == firsts.end() ? numParams : *it;
      for (int id = first; id < end; id++) ix[id] = pos++;
    }
  }
  int operator()(int id) const { return ix[id]; }
  // params[] by position -> by id (same PF_ParamDef objects, so writes still reach AE)
  template <class P> P** byId(P** params, P** buf) const {
    for (size_t id = 0; id < ix.size(); id++) buf[id] = params[ix[id]];
    return buf;
  }
};
}  // namespace brew
