#include "core/save/partywriter.h"

#include <algorithm>
#include <cstddef>
#include <optional>
#include <variant>

namespace com::yamada::studio::save {
namespace {
void refresh(MutableBytes save, std::size_t base, const FooterSlots &check)
{
    refreshFooter(save, base, check);
}
void refresh(MutableBytes save, std::size_t, const ChecksumTable &check)
{
    refreshPartyBlock(save, check);
}
} // namespace
bool writeMember(MutableBytes save, const NdsSeries &series, int index, const Pkm &plain)
{
    const std::optional<std::size_t> base = PartyNdsReader::baseOf(save, series);
    if (!base)
        return false;
    const int count = save[*base + series.partyCountOffset];
    if (index < 0 || index >= count)
        return false;
    const std::size_t size = series.pkm->partySize;
    const std::size_t at = *base + series.partyOffset + std::size_t(index) * size;
    const Pkm encoded = encodePkm(plain, size);
    std::copy_n(encoded.begin(), size, save.begin() + std::ptrdiff_t(at));
    std::visit([&](const auto &check) { refresh(save, *base, check); }, series.check);
    return true;
}
} // namespace com::yamada::studio::save
