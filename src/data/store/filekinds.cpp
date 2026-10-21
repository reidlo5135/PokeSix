#include "data/store/filekinds.h"

#include <QFile>
#include <QFileInfo>
#include <QCoreApplication>

namespace com::yamada::studio {
namespace
{
QString tr(const char *text)
{
    return QCoreApplication::translate("com::yamada::studio::filekinds", text);
}
}

FileKind kindOf(const QString &path)
{
    const QString suffix = QFileInfo(path).suffix().toLower();
    if (suffix == QLatin1String("pks") || suffix == QLatin1String("json"))
        return FileKind::Squad;
    else if (suffix == QLatin1String("sav") || suffix == QLatin1String("dsv"))
        return FileKind::GameSave;
    else
        return FileKind::Unknown;
}

QString dialogFilter(FileKind kind)
{
    switch (kind) {
    case FileKind::Squad:
        return tr("PokeSix 스쿼드 파일(*.pks *.json)");
        break;
    case FileKind::GameSave:
        return tr("게임 세이브 파일(*.sav *.dsv)");
        break;
    default:
        return tr("지원하지 않는 형식의 파일");
        break;
    }
}
}