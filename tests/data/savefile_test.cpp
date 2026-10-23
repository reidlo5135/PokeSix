// 게임 세이브 → SaveFile (H2 · H6 · H8 · H10b). ctest -R SaveFile
// 합성 세이브(tests/core/syntheticsave.h)를 임시 파일로 쓰고 픽스처 DB로 연다. 픽스처: 한카리아스
// 445 · 삐삐 35, 성격 개구쟁이 = 게임 번호 4 · id 17, 4세대 아이템 234 = item 211. H10b에서
// saveimport_test(세이브 → Portable)를 옮겨 왔다 — 6자리 배열 squad.members[i]가 파티 수만큼의 목록
// members[i].squad로 바뀐 것 말고는 확인하는 값이 같다.
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

    // origin: 출신 게임(0x5F) — 7 HG · 8 SS · 10 D · 12 Pt · 20 W · 21 B · 22 W2 · 23 B2
    static MemberSpec member(std::uint16_t species, std::uint8_t origin = 12)
    {
        MemberSpec spec;
        spec.species = species;
        spec.originGame = origin;
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

TEST_F(SaveFileTest, TurnsAPartyIntoASquad) // H2-CP4-3 … 7
{
    MemberSpec garchomp = member(445, 12);
    garchomp.pid = 0x2313;   // % 25 = 4 → 개구쟁이 → natures.id 17
    garchomp.heldItem = 234; // 4세대 게임 번호 → item 211
    garchomp.ability = 8;    // 모래숨기 — 특성은 번호 그대로
    garchomp.moves = {89, 337, 0, 0};
    const MemberSpec clefairy = member(35, 12);
    const auto bytes = synth::buildSave(synth::seriesOf("platinum"),
                                        SlotSpec {.party = {garchomp, clefairy}});

    Repository repository(s_dbPath);
    QString error;
    const auto saveFile
            = savefile::open(writeSave(bytes, QStringLiteral("pt.sav")), repository, &error);
    ASSERT_TRUE(saveFile.has_value()) << qPrintable(error);
    EXPECT_EQ(saveFile->generation, 4);
    EXPECT_EQ(saveFile->game, QStringLiteral("platinum"));

    const SquadMember &first = saveFile->members[0].squad;
    EXPECT_EQ(first.pokemonId, 445);
    EXPECT_EQ(first.itemId, 211);
    EXPECT_EQ(first.natureId, 17);
    EXPECT_EQ(first.abilityId, 8);
    EXPECT_EQ(first.moves, (std::array<int, 4> {89, 337, 0, 0}));
    EXPECT_EQ(saveFile->members[1].squad.pokemonId, 35);
    EXPECT_EQ(saveFile->members[1].squad.itemId, 0); // 물건 없음은 0 그대로
    EXPECT_EQ(saveFile->members.size(), 2);
}

TEST_F(SaveFileTest, CarriesTheLevelAndStatsInDexOrder) // H8-CP2-3
{
    MemberSpec trained
            = member(445, 8); // 픽스처에 있는 종(한카리아스)에 프테라 Lv.48의 숫자를 얹는다
    trained.level = 48;
    trained.maxHp = 151;
    trained.battleStats = {139, 88, 152, 75, 74}; // 게임 순서: 공격 방어 스피드 특공 특방
    const auto bytes = synth::buildSave(synth::seriesOf("heartgold-soulsilver"),
                                        SlotSpec {.party = {trained}});
    Repository repository(s_dbPath);
    QString error;
    const auto saveFile
            = savefile::open(writeSave(bytes, QStringLiteral("ss.sav")), repository, &error);
    ASSERT_TRUE(saveFile.has_value()) << qPrintable(error);
    const SquadMember &first = saveFile->members[0].squad;
    EXPECT_EQ(first.level, 48);
    // DB 순서(HP 공격 방어 특공 특방 스피드) — 스피드 152가 맨 뒤로
    EXPECT_EQ(first.stats, (std::array<int, 6> {151, 139, 88, 75, 74, 152}));
}

TEST_F(SaveFileTest, PicksTheVersionMostOfThePartyCameFrom) // H2-CP4-5
{
    const auto bytes
            = synth::buildSave(synth::seriesOf("heartgold-soulsilver"),
                               SlotSpec {.party = {member(445, 8), member(35, 8), member(36, 7)}});
    Repository repository(s_dbPath);
    const auto saveFile = savefile::open(writeSave(bytes, QStringLiteral("ss.sav")), repository);
    ASSERT_TRUE(saveFile.has_value());
    EXPECT_EQ(saveFile->game, QStringLiteral("soulsilver"));
}

TEST_F(SaveFileTest, FallsBackToTheFirstVersionOfTheGame) // H2-CP4-5
{
    // 파티가 전부 다른 게임(다이아)에서 데려온 포켓몬이면 그 묶음의 첫 버전
    const auto bytes = synth::buildSave(synth::seriesOf("heartgold-soulsilver"),
                                        SlotSpec {.party = {member(445, 10)}});
    Repository repository(s_dbPath);
    const auto saveFile
            = savefile::open(writeSave(bytes, QStringLiteral("traded.sav")), repository);
    ASSERT_TRUE(saveFile.has_value());
    EXPECT_EQ(saveFile->game, QStringLiteral("heartgold"));
}

TEST_F(SaveFileTest, RejectsWhatIsNotASave) // H2-CP4-3 · 4
{
    Repository repository(s_dbPath);
    QString error;
    EXPECT_FALSE(savefile::open(s_dir->filePath(QStringLiteral("missing.sav")), repository, &error)
                         .has_value());
    EXPECT_FALSE(error.isEmpty());

    error.clear();
    const QString junk = writeSave(std::vector<std::uint8_t>(1000, 0), QStringLiteral("junk.sav"));
    EXPECT_FALSE(savefile::open(junk, repository, &error).has_value());
    EXPECT_FALSE(error.isEmpty());
}

// ── H6: 5세대 세이브 ───────────────────────────────────────────
// 픽스처: 성격 촐랑 = 게임 번호 9 · id 18, 5세대 아이템 234 = item 211, 버전 black · white ·
// black-2 · white-2

TEST_F(SaveFileTest, TurnsABlackWhitePartyIntoASquad) // H6-CP5
{
    MemberSpec garchomp = member(445, 21); // 블랙 출신
    garchomp.natureByte = 9;               // 5세대는 성격이 0x41에 따로 있다(촐랑)
    garchomp.heldItem = 234;
    garchomp.moves = {89, 337, 0, 0};
    const auto bytes = synth::buildTableSave(synth::seriesOf("black-white"),
                                             synth::TableSaveSpec {.party = {garchomp}});

    Repository repository(s_dbPath);
    QString error;
    const auto saveFile
            = savefile::open(writeSave(bytes, QStringLiteral("bw.sav")), repository, &error);
    ASSERT_TRUE(saveFile.has_value()) << qPrintable(error);
    EXPECT_EQ(saveFile->generation, 5); // 상수 4가 아니라 세이브가 알려 준 세대
    EXPECT_EQ(saveFile->game, QStringLiteral("black"));
    const SquadMember &first = saveFile->members[0].squad;
    EXPECT_EQ(first.pokemonId, 445);
    EXPECT_EQ(first.natureId, 18); // 촐랑
    EXPECT_EQ(first.itemId, 211);  // 5세대 번호표로 변환
    EXPECT_EQ(first.moves, (std::array<int, 4> {89, 337, 0, 0}));
}

TEST_F(SaveFileTest, PicksBlack2OrWhite2ByOrigin) // H6-CP5-3
{
    const auto bytes = synth::buildTableSave(
            synth::seriesOf("black-2-white-2"),
            synth::TableSaveSpec {.party = {member(445, 22), member(35, 22), member(36, 23)}});
    Repository repository(s_dbPath);
    const auto saveFile = savefile::open(writeSave(bytes, QStringLiteral("w2.sav")), repository);
    ASSERT_TRUE(saveFile.has_value());
    EXPECT_EQ(saveFile->generation, 5);
    EXPECT_EQ(saveFile->game, QStringLiteral("white-2"));
}

TEST(SaveFile, NamesTheOriginGame) // H2-CP4-2
{
    EXPECT_EQ(savefile::versionOfOriginGame(7), QStringLiteral("heartgold"));
    EXPECT_EQ(savefile::versionOfOriginGame(8), QStringLiteral("soulsilver"));
    EXPECT_EQ(savefile::versionOfOriginGame(10), QStringLiteral("diamond"));
    EXPECT_EQ(savefile::versionOfOriginGame(11), QStringLiteral("pearl"));
    EXPECT_EQ(savefile::versionOfOriginGame(12), QStringLiteral("platinum"));
    EXPECT_TRUE(savefile::versionOfOriginGame(99).isEmpty());
}

TEST(SaveFile, NamesTheFifthGenerationOriginGames) // H6-CP5-3
{
    EXPECT_EQ(savefile::versionOfOriginGame(20), QStringLiteral("white"));
    EXPECT_EQ(savefile::versionOfOriginGame(21), QStringLiteral("black"));
    EXPECT_EQ(savefile::versionOfOriginGame(22), QStringLiteral("white-2"));
    EXPECT_EQ(savefile::versionOfOriginGame(23), QStringLiteral("black-2"));
}

TEST(SaveFile, PutsStatsInDexOrder) // H10b-B2
{
    // 게임: HP · 공격 · 방어 · 스피드 · 특공 · 특방 → 앱: … 방어 · 특공 · 특방 · 스피드
    EXPECT_EQ(dexOrder({1, 2, 3, 4, 5, 6}), (std::array<int, 6> {1, 2, 3, 5, 6, 4}));
}
