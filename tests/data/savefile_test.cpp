// H10b — 세이브 → SaveFile. ctest -R SaveFile
// saveimport_test(Portable만 본다)가 확인하지 않는 것 — 원본 바이트 · 게임 원본 값 · 알 자리 — 을
// 본다. 합성 세이브(tests/core/syntheticsave.h)를 임시 파일로 쓰고 픽스처 DB로 연다.
#include "data/repository/repository.h"
#include "data/store/savefile.h"
#include "data/update/csvimporter.h"
#include "syntheticsave.h"

#include <QFile>
#include <QTemporaryDir>

#include <gtest/gtest.h>

using namespace com::yamada::studio;
using synth::MemberSpec;
using synth::SlotSpec;

namespace {
class SaveFileTest : public ::testing::Test
{
protected:
    static void SetUpTestSuite()
    {
        s_dir = new QTemporaryDir;
        s_dbPath = s_dir->filePath(QStringLiteral("pokesix.sqlite"));
        CsvImporter importer;
        s_ok = importer.run(QStringLiteral(POKESIX_FIXTURES_DIR "/pokeapi-csv"), s_dbPath);
    }
    static void TearDownTestSuite()
    {
        delete s_dir;
        s_dir = nullptr;
    }
    void SetUp() override { ASSERT_TRUE(s_ok); }

    static QString writeSave(const std::vector<std::uint8_t> &bytes, const QString &name)
    {
        const QString path = s_dir->filePath(name);
        QFile file(path);
        EXPECT_TRUE(file.open(QIODevice::WriteOnly));
        file.write(reinterpret_cast<const char *>(bytes.data()), qint64(bytes.size()));
        return path;
    }

    static MemberSpec member(std::uint16_t species)
    {
        MemberSpec spec;
        spec.species = species;
        spec.originGame = 12; // 플라티나
        spec.heldItem = 0;
        return spec;
    }

    static inline QTemporaryDir *s_dir = nullptr;
    static inline QString s_dbPath;
    static inline bool s_ok = false;
};
} // namespace

TEST_F(SaveFileTest, KeepsTheWholeFile) // H10b-B4
{
    const auto bytes
            = synth::buildSave(synth::seriesOf("platinum"), SlotSpec {.party = {member(445)}});
    Repository repository(s_dbPath);
    QString error;
    const auto saveFile
            = savefile::open(writeSave(bytes, QStringLiteral("pt.sav")), repository, &error);
    ASSERT_TRUE(saveFile.has_value()) << error.toStdString();
    ASSERT_EQ(std::size_t(saveFile->bytes.size()), bytes.size());
    EXPECT_TRUE(std::equal(bytes.begin(), bytes.end(),
                           reinterpret_cast<const std::uint8_t *>(saveFile->bytes.constData())));
    EXPECT_EQ(saveFile->generation, 4);
    EXPECT_EQ(saveFile->versionGroup, QStringLiteral("platinum"));
    EXPECT_EQ(saveFile->game, QStringLiteral("platinum"));
    // 플라티나의 파티는 일반 블록 + 0xA0, 고른 슬롯은 0 → 파일 위치 0xA0
    EXPECT_EQ(saveFile->partyOffset, std::size_t(0xA0));
}

TEST_F(SaveFileTest, KeepsTheGameValues) // H10b-B4
{
    MemberSpec spec = member(445);
    spec.pid = 0xCAFEBABE;
    spec.iv32 = 31;                  // HP 개체값 31, 나머지 0 (비트 0–4 = HP)
    spec.evs = {252, 0, 0, 6, 0, 0}; // 게임 순서: HP · 공격 · 방어 · 스피드 · 특공 · 특방
    const auto bytes = synth::buildSave(synth::seriesOf("platinum"), SlotSpec {.party = {spec}});
    Repository repository(s_dbPath);
    const auto saveFile = savefile::open(writeSave(bytes, QStringLiteral("raw.sav")), repository);
    ASSERT_TRUE(saveFile.has_value());
    ASSERT_EQ(saveFile->members.size(), 1);
    const SaveMember &first = saveFile->members[0];
    EXPECT_EQ(first.raw.pid, 0xCAFEBABEu);
    EXPECT_EQ(first.raw.ivs[0], 31);
    EXPECT_EQ(first.raw.ivs[1], 0);
    EXPECT_EQ(first.raw.evs[0], 252);
    EXPECT_EQ(first.raw.evs[3], 6);        // 게임 순서 그대로(스피드가 넷째)
    EXPECT_EQ(first.squad.pokemonId, 445); // 앱 id로 바꾼 쪽도 같이 든다
}

TEST_F(SaveFileTest, KeepsTheEggSlot) // H10b-B4
{
    MemberSpec egg = member(35);
    egg.iv32 = 1u << 30; // 개체값 묶음의 비트 30 = 알
    const auto bytes
            = synth::buildSave(synth::seriesOf("platinum"), SlotSpec {.party = {member(445), egg}});
    Repository repository(s_dbPath);
    const auto saveFile = savefile::open(writeSave(bytes, QStringLiteral("egg.sav")), repository);
    ASSERT_TRUE(saveFile.has_value());
    ASSERT_EQ(saveFile->members.size(), 2); // 알도 자리를 지킨다(쓰기 때 위치가 맞아야 한다)
    EXPECT_FALSE(saveFile->members[0].raw.egg);
    EXPECT_EQ(saveFile->members[0].squad.pokemonId, 445);
    EXPECT_TRUE(saveFile->members[1].raw.egg);
    EXPECT_EQ(saveFile->members[1].raw.species, 35);   // 원본 값은 알이어도 남는다
    EXPECT_TRUE(saveFile->members[1].squad.isEmpty()); // 카드에는 빈 자리
}

TEST(SaveFile, PutsStatsInDexOrder) // H10b-B2
{
    // 게임: HP · 공격 · 방어 · 스피드 · 특공 · 특방 → 앱: … 방어 · 특공 · 특방 · 스피드
    EXPECT_EQ(dexOrder({1, 2, 3, 4, 5, 6}), (std::array<int, 6> {1, 2, 3, 5, 6, 4}));
}
