#include "data/store/saveimport.h"

#include "data/store/savefile.h"

#include <QFileInfo>
#include <QHash>

namespace com::yamada::studio::saveimport {
bool isSaveFile(const QString &path)
{
    const QString suffix = QFileInfo(path).suffix().toLower();
    return suffix == QStringLiteral("sav") || suffix == QStringLiteral("dsv");
}

QString versionOfOriginGame(int originGame)
{
    static const QHash<int, QString> versions
            = {{7, QStringLiteral("heartgold")}, {8, QStringLiteral("soulsilver")},
               {10, QStringLiteral("diamond")},  {11, QStringLiteral("pearl")},
               {12, QStringLiteral("platinum")}, {20, QStringLiteral("white")},
               {21, QStringLiteral("black")},    {22, QStringLiteral("white-2")},
               {23, QStringLiteral("black-2")}};
    return versions.value(originGame);
}

std::optional<squadfile::Portable> load(const QString &path, Repository &repository, QString *error)
{
    // 읽기 · 해석은 savefile::open이 한다(H10b). 여기서는 그 결과를 스쿼드 모양으로 줄이기만
    // 한다
    const std::optional<SaveFile> saveFile = savefile::open(path, repository, error);
    if (!saveFile)
        return std::nullopt; // error는 open이 채웠다

    // 이름은 비워 둔다 — 스쿼드 화면이 기본 이름("소울실버 스쿼드")을 보인다
    squadfile::Portable portable;
    portable.generation = saveFile->generation;
    portable.game = saveFile->game;
    // 자리 순서를 그대로(세이브의 i번째 → 스쿼드의 i번째). 알은 squad가 비어 있어 빈 자리가 된다
    for (qsizetype i = 0;
         i < saveFile->members.size() && i < qsizetype(portable.squad.members.size()); ++i)
        portable.squad.members[std::size_t(i)] = saveFile->members[i].squad;
    return portable;
}
} // namespace com::yamada::studio::saveimport
