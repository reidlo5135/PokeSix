#include "core/save/partyreader.h"
#include "syntheticsave.h"

#include <gtest/gtest.h>

using namespace com::yamada::studio::save;
using synth::buildSave;
using synth::buildTableSave;
using synth::MemberSpec;
using synth::SlotSpec;
using synth::TableSaveSpec;

TEST(PartyWriter, WritesLittleEndian) // C1
{
    std::array<std::uint8_t, 6> data {};
    writeU16(data, 0, 0x1234);
    writeU32(data, 2, 0xCAFEBABE);
    EXPECT_EQ(data[0], 0x34);
    EXPECT_EQ(data[1], 0x12);
    EXPECT_EQ(readU32(data, 2), 0xCAFEBABEu);
    writeU16(data, 5, 0xFFFF); // 범위 밖 — 아무것도 안 한다
    EXPECT_EQ(data[5], 0xCA);
}

TEST(PartyWriter, ShuffleUndoesUnshuffleForEveryOrder) // C2
{
    std::array<std::uint8_t, kBlocksSize> blocks {};
    for (std::size_t i = 0; i < blocks.size(); ++i)
        blocks[i] = std::uint8_t(i);
    for (int s = 0; s < 24; ++s)
        EXPECT_EQ(unshuffle(shuffle(blocks, s), s), blocks) << "shuffle " << s;
}

TEST(PartyWriter, EncodesLikeTheIndependentEncoder) // C2 — 정답지(syntheticsave)와 비교
{
    for (std::uint32_t pid : {0x12345678u, 0x00000000u, 0xFFFFFFFFu, 0x0003E000u}) {
        synth::MemberSpec spec;
        spec.pid = pid;
        const Pkm plain = synth::plainPkm(spec);
        EXPECT_EQ(encodePkm(plain, kPk4.partySize), synth::encodePkm(plain)) << std::hex << pid;
    }
}

TEST(PartyWriter, RoundTripsAPk5) // C2 — 220바이트
{
    const Pkm plain = synth::plainPkm({});
    const Pkm encoded = encodePkm(plain, kPk5.partySize);
    const DecodedPkm decoded = decodePkm(Bytes(encoded).first(kPk5.partySize));
    ASSERT_TRUE(decoded.ok());
    EXPECT_TRUE(std::equal(plain.begin(), plain.begin() + kPk5.partySize, decoded.data.begin()));
}

// TEST(PartyWriter, RefreshesAFooterAfterAnEdit) // C4
// {
//     const NdsSeries &pt = synth::seriesOf("platinum");
//     auto save = synth::buildSave(pt, synth::SlotSpec {.party = {{}}});
//     save[0x10] ^= 0xFF; // 데이터를 바꾸면 CRC가 틀린다
//     ASSERT_FALSE(readFooter(save, 0, synth::footerSlotsOf(pt)).crcOk());
//     refreshFooter(save, 0, synth::footerSlotsOf(pt));
//     EXPECT_TRUE(readFooter(save, 0, synth::footerSlotsOf(pt)).crcOk());
// }

// TEST(PartyWriter, RefreshesThePartyBlockAndTheTable) // C4
// {
//     const NdsSeries &bw = synth::seriesOf("black-white");
//     auto save = synth::buildTableSave(bw, {.party = {{}}});
//     const ChecksumTable &check = synth::checksumTableOf(bw);
//     save[bw.partyOffset + 0x20] ^= 0xFF;
//     ASSERT_FALSE(partyBlockValid(save, check));
//     refreshPartyBlock(save, check);
//     EXPECT_TRUE(partyBlockValid(save, check));
//     EXPECT_TRUE(checksumTableValid(save, check)); // 사본이 바뀐 뒤의 모음표 CRC까지
// }

// // C5 — 진짜 편집 왕복: 4세대
// TEST(PartyWriter, ChangesOneMemberOfAPlatinumSave)
// {
//     const NdsSeries &pt = synth::seriesOf("platinum");
//     synth::MemberSpec second;
//     second.species = 35;
//     auto save = synth::buildSave(pt, synth::SlotSpec {.party = {{}, second}},
//                                  synth::SlotSpec {.major = 0, .party = {{}}}); // 슬롯 1 = 옛
//                                  저장
//     const std::vector<std::uint8_t> before = save;

//     const auto party = readParty(save);
//     ASSERT_TRUE(party.has_value());
//     const std::size_t at = party->partyOffset + kPk4.partySize; // 둘째 자리
//     Pkm plain = decodePkm(Bytes(save).subspan(at, kPk4.partySize)).data;
//     setMoves(plain, {33, 45, 0, 0}, {35, 40, 0, 0});
//     setHeldItem(plain, 234);

//     ASSERT_TRUE(writeMember(save, pt, 1, plain));

//     const auto after = readParty(save); // 체크섬이 다 맞아야 다시 읽힌다
//     ASSERT_TRUE(after.has_value());
//     EXPECT_EQ(after->members[1].moves, (std::array<int, 4> {33, 45, 0, 0}));
//     EXPECT_EQ(after->members[1].heldItem, 234);
//     EXPECT_TRUE(after->members[1].checksumOk);
//     EXPECT_EQ(after->members[0].moves, party->members[0].moves); // 다른 자리는 그대로
//     // 옛 저장 슬롯(0x40000~)은 한 바이트도 안 바뀐다
//     EXPECT_TRUE(std::equal(before.begin() + kSlotSize, before.end(), save.begin() + kSlotSize));
// }

// // C5 — 5세대
// TEST(PartyWriter, ChangesOneMemberOfABlackWhiteSave)
// {
//     const NdsSeries &bw = synth::seriesOf("black-white");
//     auto save = synth::buildTableSave(bw, {.party = {{}}});
//     const auto party = readParty(save);
//     ASSERT_TRUE(party.has_value());
//     Pkm plain = decodePkm(Bytes(save).subspan(party->partyOffset, kPk5.partySize)).data;
//     setMoves(plain, {89, 0, 0, 0}, {10, 0, 0, 0});

//     ASSERT_TRUE(writeMember(save, bw, 0, plain));

//     const auto after = readParty(save);
//     ASSERT_TRUE(after.has_value());
//     EXPECT_EQ(after->members[0].moves, (std::array<int, 4> {89, 0, 0, 0}));
// }

// TEST(PartyWriter, RefusesWhatItCannotWrite) // C5
// {
//     const NdsSeries &pt = synth::seriesOf("platinum");
//     auto save = synth::buildSave(pt, synth::SlotSpec {.party = {{}}});
//     const Pkm plain = synth::plainPkm({});
//     EXPECT_FALSE(writeMember(save, pt, 1, plain)); // 파티는 1마리 — 2번째 자리는 없다
//     EXPECT_FALSE(writeMember(save, synth::seriesOf("black-white"), 0, plain)); // 다른 시리즈
//     EXPECT_EQ(findSeries("platinum"), &pt);
//     EXPECT_EQ(findSeries("x-y"), nullptr);
// }
