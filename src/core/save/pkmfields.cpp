#include "core/save/pkmfields.h"

namespace com::yamada::studio::save {
void setMoves(Pkm &plain, const std::array<int, 4> &moves, const std::array<int, 4> &pp)
{
    for (std::size_t k = 0; k < 4; ++k) {
        writeU16(plain, 0x28 + 2 * k, static_cast<std::uint16_t>(moves[k]));
        plain[0x30 + k] = static_cast<std::uint8_t>(pp[k]);
        plain[0x34 + k] = 0;
    }
}

void setHeldItem(Pkm &plain, int gameItem)
{
    writeU16(plain, 0x0A, static_cast<std::uint8_t>(gameItem));
}
} // namespace com::yamada::studio::save
