// Version + out flags for Frank's Mobglow Brew (AE). mob_pipl.r carries the same numbers.
#pragma once
#define BREW_MAJOR 3
#define BREW_MINOR 0
#define BREW_VERSION_PACKED 1572865      /* PF_VERSION(3, 0, 0, PF_Stage_DEVELOP, 1) */
#define BREW_OUT_FLAGS  (PF_OutFlag_NON_PARAM_VARY | PF_OutFlag_DEEP_COLOR_AWARE)
#define BREW_OUT_FLAGS_NUM 33554436
#define BREW_OUT_FLAGS2 (PF_OutFlag2_SUPPORTS_THREADED_RENDERING | PF_OutFlag2_PARAM_GROUP_START_COLLAPSED_FLAG)
#define BREW_OUT_FLAGS2_NUM 134217736
#ifdef __cplusplus
static_assert(PF_VERSION(3, 0, 0, PF_Stage_DEVELOP, 1) == BREW_VERSION_PACKED, "PiPL version drift");
static_assert((BREW_OUT_FLAGS) == BREW_OUT_FLAGS_NUM, "PiPL out flags drift");
static_assert((BREW_OUT_FLAGS2) == BREW_OUT_FLAGS2_NUM, "PiPL out flags2 drift");
#endif
