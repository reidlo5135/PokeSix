#include "data/store/squadstore.h"

#include <QFile>
#include <QTemporaryDir>

#include <gtest/gtest.h>

namespace com::yamada::studio {
namespace {
TEST(SquadStore, RoundTripsTheShuttle)
{
    QTemporaryDir dir;
    ASSERT_TRUE(dir.isValid());
    const QString path = dir.filePath(QStringLiteral("squads.json"));
    {
        SquadStore store(path);
        Squad squad;
        squad.name = QStringLiteral("셔틀 확인");
        squad.members[0].pokemonId = 130;
        squad.shuttle.pokemonId = 143;
        squad.shuttle.moves = {57, 70, 0, 0}; // 파도타기 · 괴력
        store.setSquad(4, QStringLiteral("soulsilver"), squad);
        ASSERT_TRUE(store.flush());
    }
    SquadStore store(path);
    const Squad loaded = store.squad(4, QStringLiteral("soulsilver"));
    EXPECT_EQ(loaded.shuttle.pokemonId, 143);
    EXPECT_EQ(loaded.shuttle.moves, (std::array<int, 4> {57, 70, 0, 0}));
    EXPECT_EQ(loaded.members[0].pokemonId, 130);
    EXPECT_EQ(loaded.filled(), 1); // 비전셔틀은 본편 수에 세지 않는다
}

TEST(SquadStore, ReadsAFileSavedBeforeTheShuttle)
{
    QTemporaryDir dir;
    ASSERT_TRUE(dir.isValid());
    const QString path = dir.filePath(QStringLiteral("squads.json"));
    QFile file(path);
    ASSERT_TRUE(file.open(QIODevice::WriteOnly));
    file.write(R"({"version": 2, "squads": {"4": {"current": "soulsilver", "games": {
        "soulsilver": {"name": "", "members": [{"pokemon": 130, "memo": "",
        "moves": [89, 0, 0, 0], "ability": 0, "nature": 0, "item": 0}]}}}}})");
    file.close();
    SquadStore store(path);
    const Squad loaded = store.squad(4, QStringLiteral("soulsilver"));
    EXPECT_EQ(loaded.members[0].pokemonId, 130); // 옛 파일 그대로 읽힌다
    EXPECT_TRUE(loaded.shuttle.isEmpty());       // 셔틀 키가 없으면 빈 자리
}

TEST(SquadStore, RoundTripsLevelAndStats) // H8-CP2-1 · 2
{
    QTemporaryDir dir;
    ASSERT_TRUE(dir.isValid());
    const QString path = dir.filePath(QStringLiteral("squads.json"));
    {
        SquadStore store(path);
        Squad squad;
        squad.members[0].pokemonId = 142; // 프테라 — 세이브에서 온 개체
        squad.members[0].level = 48;
        squad.members[0].stats = {151, 139, 88, 75, 74, 152};
        squad.members[1].pokemonId = 143; // 손으로 넣은 개체
        store.setSquad(4, QStringLiteral("soulsilver"), squad);
        ASSERT_TRUE(store.flush());
    }
    SquadStore store(path);
    const Squad loaded = store.squad(4, QStringLiteral("soulsilver"));
    EXPECT_EQ(loaded.members[0].level, 48);
    EXPECT_EQ(loaded.members[0].stats, (std::array<int, 6> {151, 139, 88, 75, 74, 152}));
    EXPECT_FALSE(loaded.members[1].hasStats()); // 모르는 값은 모르는 채로
}

TEST(SquadStore, LeavesOutStatsTheMemberDoesNotHave) // H8-CP2-1 — 파일을 깨끗하게
{
    QTemporaryDir dir;
    ASSERT_TRUE(dir.isValid());
    const QString path = dir.filePath(QStringLiteral("squads.json"));
    {
        SquadStore store(path);
        Squad squad;
        squad.members[0].pokemonId = 143;
        store.setSquad(4, QStringLiteral("soulsilver"), squad);
        ASSERT_TRUE(store.flush());
    }
    QFile file(path);
    ASSERT_TRUE(file.open(QIODevice::ReadOnly));
    const QByteArray json = file.readAll();
    EXPECT_FALSE(json.contains("\"level\""));
    EXPECT_FALSE(json.contains("\"stats\""));
}

TEST(SquadStore, ReadsAFileSavedBeforeStats) // H8-CP2-2
{
    QTemporaryDir dir;
    ASSERT_TRUE(dir.isValid());
    const QString path = dir.filePath(QStringLiteral("squads.json"));
    QFile file(path);
    ASSERT_TRUE(file.open(QIODevice::WriteOnly));
    file.write(R"({"version": 2, "squads": {"4": {"current": "soulsilver", "games": {
        "soulsilver": {"name": "", "members": [{"pokemon": 142, "memo": "",
        "moves": [0, 0, 0, 0], "ability": 0, "nature": 0, "item": 0}]}}}}})");
    file.close();
    SquadStore store(path);
    const SquadMember member = store.squad(4, QStringLiteral("soulsilver")).members[0];
    EXPECT_EQ(member.pokemonId, 142);
    EXPECT_EQ(member.level, 0);
    EXPECT_FALSE(member.hasStats());
}

// 버전 키가 아직 없는 스쿼드(게임 묶음 키에서 이어받은 것)를 비우면, 빈 스쿼드도 그 버전 키로
// 남아야 한다. 안 남으면 다시 열 때 묶음 키의 옛 스쿼드가 돌아온다(일괄 비우기 → 게임 전환 → 복귀)
TEST(SquadStore, KeepsAnEmptySquadOverTheGroupItCameFrom)
{
    QTemporaryDir dir;
    ASSERT_TRUE(dir.isValid());
    const QString path = dir.filePath(QStringLiteral("squads.json"));
    {
        SquadStore store(path);
        Squad old; // 버전으로 나누기 전에 저장한 스쿼드
        old.members[0].pokemonId = 6;
        store.setSquad(3, QStringLiteral("firered-leafgreen"), old);
        store.setSquad(3, QStringLiteral("firered"), Squad()); // 이어받은 스쿼드를 비웠다
        EXPECT_TRUE(store.hasSquad(3, QStringLiteral("firered")));
        ASSERT_TRUE(store.flush());
    }
    SquadStore store(path);
    EXPECT_TRUE(store.hasSquad(3, QStringLiteral("firered"))); // 파일에도 남는다
    EXPECT_EQ(store.squad(3, QStringLiteral("firered")).filled(), 0);
}
} // namespace
} // namespace com::yamada::studio
