#include "data/store/filekinds.h"

#include <QCoreApplication>
#include <QFileInfo>

namespace com::yamada::studio {
namespace {
QString tr(const char *text)
{
    return QCoreApplication::translate("com::yamada::studio::filekinds", text);
}
} // namespace
} // namespace com::yamada::studio

namespace com::yamada::studio::filekinds {
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
    case FileKind::Unknown:
        return QString();
        break;
    }
}
} // namespace com::yamada::studio::filekinds
