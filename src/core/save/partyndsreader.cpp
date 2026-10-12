#include "core/save/partyndsreader.h"

namespace com::yamada::studio::save {
std::string_view PartyNdsReader::platform() const
{
    return "nds";
}

std::optional<ReadParty> PartyNdsReader::read(Bytes save) const
{
    for (const auto &knds : kNdsSeries) {
        if (auto s = readSeries(save, knds))
            return s;
    }
    return std::nullopt;
}

std::optional<ReadParty> PartyNdsReader::readSeries(Bytes save, const NdsSeries &series)
{
    if (save.size() < kSaveSize)
        return std::nullopt;
    // 행에 든 검증 방식(FooterSlots · ChecksumTable)에 맞는 findBase 오버로드가 불린다
    const std::optional<std::size_t> base
            = std::visit([&](const auto &check) { return findBase(save, check); }, series.check);

    if (!base)
        return std::nullopt;

    ReadParty party;
    party.generation = series.generation;
    party.versionGroup = series.versionGroup;
    party.partyOffset = *base + series.partyOffset;

    const int count = save[*base + series.partyCountOffset];
    if (count < 1 || count > 6)
        return std::nullopt;
    for (int i = 0; i < count; ++i) {
        const std::size_t at = party.partyOffset + std::size_t(i) * series.pkm->partySize;
        const DecodedPkm pkm = decodePkm(save.subspan(at, series.pkm->partySize));
        party.members.push_back(parseMember(pkm, *series.pkm));
    }
    return party;
}

std::optional<std::size_t> PartyNdsReader::findBase(Bytes save, const FooterSlots &check)
{
    return activeGeneralBlock(save, check);
}

std::optional<std::size_t> PartyNdsReader::findBase(Bytes save, const ChecksumTable &check)
{
    if (checksumTableValid(save, check) && partyBlockValid(save, check))
        return 0;

    return std::nullopt;
}
} // namespace com::yamada::studio::save
