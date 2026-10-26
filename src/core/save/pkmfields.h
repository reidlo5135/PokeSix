#pragma once

#include "core/save/pkmcodec.h"

namespace com::yamada::studio::save {
void setMoves(Pkm &plain, const std::array<int, 4> &moves, const std::array<int, 4> &pp);
void setHeldItem(Pkm &plain, int gameItem);
} // namespace com::yamada::studio::save
