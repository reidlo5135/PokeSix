#include "data/store/savedocument.h"

#include "data/logging/logging.h"
#include "data/repository/repository.h"
#include "data/store/saveimport.h"

#include <QCoreApplication>
#include <QFile>
#include <QHash>

namespace com::yamada::studio {
std::array<int, 6> dexOrder(const std::array<int, 6> &gameOrder)
{
    // 게임: HP · 공격 · 방어 · 스피드 · 특공 · 특방 → 앱: HP · 공격 · 방어 · 특공 · 특방 · 스피드
    return {gameOrder[0], gameOrder[1], gameOrder[2], gameOrder[4], gameOrder[5], gameOrder[3]};
}
} // namespace com::yamada::studio

namespace com::yamada::studio::savedocument {
namespace {
QString tr(const char *text)
{
    // 번역 문맥은 옮기기 전(saveimport)과 같게 둔다 — 이미 채운 en/ja가 그대로 쓰인다
    return QCoreApplication::translate("com::yamada::studio::saveimport", text);
}

// 게임 묶음("heartgold-soulsilver")의 버전들({"heartgold", "soulsilver"}) — DB의 게임 표에서
QStringList versionsOfGroup(Repository &repository, const QString &versionGroup, int generation)
{
    for (const GameInfo &game : repository.gamesForGeneration(generation)) {
        if (game.versionGroup == versionGroup)
            return game.versions;
    }
    return {};
}

// 묶음의 버전 중 파티 멤버의 출신 게임이 가장 많은 쪽. 아무도 안 맞으면(다른 게임에서 데려온
// 포켓몬뿐) 묶음의 첫 버전
QString chooseVersion(const QStringList &versions, const std::vector<save::ReadMember> &members)
{
    QHash<QString, int> votes; // 버전 → 그 버전 출신 멤버 수
    for (const save::ReadMember &member : members) {
        const QString version = saveimport::versionOfOriginGame(member.originGame);
        if (versions.contains(version))
            ++votes[version];
    }
    QString chosen = versions.isEmpty() ? QString() : versions.constFirst();
    int best = 0;
    for (const QString &version : versions) {
        if (votes.value(version) > best) {
            best = votes.value(version);
            chosen = version;
        }
    }
    return chosen;
}

// 게임 번호로 된 한 마리 → 앱 id로 된 한 마리. 물건 · 성격은 게임 번호라 DB id로 바꾸고, 종 ·
// 기술 · 특성은 번호가 같다
SquadMember toSquadMember(const save::ReadMember &member, int generation, Repository &repository)
{
    if (member.form != 0)
        qCWarning(lcData) << "save import: species" << member.species << "form" << member.form
                          << "has no form table yet — using the default form";
    SquadMember out;
    out.pokemonId = repository.defaultPokemonId(member.species);
    out.moves = member.moves; // 둘 다 std::array<int, 4>, 번호도 PokéAPI id와 같다
    out.abilityId = member.ability;
    out.natureId = repository.natureIdForGameIndex(member.nature);
    out.itemId
            = member.heldItem == 0 ? 0 : repository.itemIdForGameIndex(generation, member.heldItem);
    out.level = member.level;
    out.stats = dexOrder(member.stats);
    return out;
}
} // namespace

std::optional<SaveDocument> open(const QString &path, Repository &repository, QString *error)
{
    // ① 파일 → 바이트. 바이트는 문서에 그대로 둔다(쓰기 때 이 사본을 고친다)
    QFile file(path);
    if (!file.open(QIODevice::ReadOnly)) {
        if (error) // 부르는 쪽이 error를 안 넘길 수도 있다(기본값 nullptr)
            *error = tr("파일을 열 수 없어요: %1").arg(file.errorString());
        return std::nullopt;
    }
    SaveDocument document;
    document.path = path;
    document.bytes = file.readAll();

    // ② 바이트 → 파티: QByteArray를 core가 아는 save::Bytes(std::span)로 — 레이어 경계의 변환.
    // bytes는 document.bytes를 빌려 보는 창이라, 아래에서 document.bytes를 바꾸지 않는다
    const save::Bytes bytes(reinterpret_cast<const std::uint8_t *>(document.bytes.constData()),
                            std::size_t(document.bytes.size()));
    const std::optional<save::ReadParty> party = save::readParty(bytes);
    if (!party) {
        if (error)
            *error = tr("4세대(DP · Pt · HGSS) · 5세대(BW · B2W2) 세이브가 아니에요");
        return std::nullopt;
    }
    document.generation = party->generation;
    document.versionGroup
            = QString::fromUtf8(party->versionGroup.data(), qsizetype(party->versionGroup.size()));
    document.partyOffset = party->partyOffset;

    // ③ 버전 고르기
    const QStringList versions
            = versionsOfGroup(repository, document.versionGroup, document.generation);
    document.game = chooseVersion(versions, party->members);

    // ④ 멤버마다 SaveMember 하나: 원본 값(raw)은 늘 두고, 알이 아니면 앱 id로 바꾼 값(squad)도.
    // 알도 자리를 지킨다 — 세이브의 i번째 = 문서의 i번째(쓰기 때 위치를 이 순서로 찾는다)
    for (const save::ReadMember &member : party->members) {
        SaveMember saveMember;
        saveMember.raw = member;
        if (!member.egg) // 알은 싸우지 않는다 — squad는 빈 자리로 남는다
            saveMember.squad = toSquadMember(member, document.generation, repository);
        document.members.append(saveMember);
    }

    qCInfo(lcData).noquote() << QStringLiteral("save open: %1 · %2 members")
                                        .arg(document.game)
                                        .arg(document.members.size());
    return document;
}
} // namespace com::yamada::studio::savedocument
