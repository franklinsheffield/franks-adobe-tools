// Version + out flags for Frank's Decompressor Brew (AE). dc_pipl.r carries the same numbers.
#pragma once
#define BREW_MAJOR 1
#define BREW_MINOR 0
#define BREW_VERSION_PACKED 524289      /* PF_VERSION(1, 0, 0, PF_Stage_DEVELOP, 1) */
// WIDE_TIME_INPUT: the temporal datamosh reads earlier frames of the layer.
#define BREW_OUT_FLAGS  (PF_OutFlag_WIDE_TIME_INPUT | PF_OutFlag_NON_PARAM_VARY | PF_OutFlag_DEEP_COLOR_AWARE)
#define BREW_OUT_FLAGS_NUM 33554438
#define BREW_OUT_FLAGS2 (PF_OutFlag2_SUPPORTS_THREADED_RENDERING | PF_OutFlag2_PARAM_GROUP_START_COLLAPSED_FLAG)
#define BREW_OUT_FLAGS2_NUM 134217736
#ifdef __cplusplus
static_assert(PF_VERSION(1, 0, 0, PF_Stage_DEVELOP, 1) == BREW_VERSION_PACKED, "PiPL version drift");
static_assert((BREW_OUT_FLAGS) == BREW_OUT_FLAGS_NUM, "PiPL out flags drift");
static_assert((BREW_OUT_FLAGS2) == BREW_OUT_FLAGS2_NUM, "PiPL out flags2 drift");
#endif
