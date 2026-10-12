#include "core/save/partyreader.h"

#include "core/save/partyndsreader.h"

namespace com::yamada::studio::save {
ReadMember parseMember(const DecodedPkm &pkm, const PkmFormat &format)
{
    ReadMember member;
    const Bytes data(pkm.data);
    member.pid = pkm.pid;
    member.checksumOk = pkm.ok();
    member.species = readU16(data, 0x08);
    member.heldItem = readU16(data, 0x0A);
    member.ability = data[0x15];
    member.form = data[0x40] >> 3;
    member.nature = member.pid % 25;
    if (format.natureAt)
        member.nature = data[*format.natureAt];
    if (format.hiddenAbilityAt)
        member.hiddenAbility = (data[*format.hiddenAbilityAt] & 0x01) != 0;

    for (int k = 0; k < 4; ++k) {
        member.moves[k] = readU16(data, 0x28 + 2 * k);
    }
    for (int k = 0; k < 6; ++k) {
        member.evs[k] = data[0x18 + k];
    }
    member.egg = (readU32(data, 0x38) >> 30) & 1;
    const std::uint32_t iv32 = readU32(data, 0x38);
    for (int k = 0; k < 6; ++k) {
        member.ivs[k] = (iv32 >> (5 * k)) & 0x1F;
    }
    member.originGame = data[0x5F];
    member.level = data[0x8C];
    member.hp = readU16(data, 0x8E);
    member.maxHp = readU16(data, 0x90);
    // 실제 능력치 6개(u16, 게임 순서 HP · 공격 · 방어 · 스피드 · 특공 · 특방). 첫 칸이 최대 HP다
    for (int k = 0; k < 6; ++k) {
        member.stats[k] = readU16(data, 0x90 + 2 * k);
    }

    return member;
}

std::span<const PartyReader *const> partyReaders()
{
    // 자식(PartyNdsReader)의 주소를 부모 포인터(const PartyReader *)로 담는다 — 부르는 쪽은 어느
    // 기기인지 몰라도 reader->read(save)만 부르면 자식의 read가 불린다(가상 함수)
    static const PartyNdsReader nds;
    static const std::array<const PartyReader *, 1> readers = {&nds};
    return readers;
}

std::optional<ReadParty> readParty(Bytes save)
{
    const auto &readers = partyReaders();
    for (const auto &reader : readers) {
        if (auto r = reader->read(save))
            return r;
    }
    return std::nullopt;
}
} // namespace com::yamada::studio::save
