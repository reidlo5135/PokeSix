#include "app/desktopentry.h"

#include "ui/logging/logging.h"

#include <QtGlobal>

#if defined(Q_OS_LINUX)
#include <QDir>
#include <QDirIterator>
#include <QFile>
#include <QFileInfo>
#include <QSaveFile>
#include <QStandardPaths>
#include <QStringList>

#include <algorithm>

namespace {
// 파일 이름은 setDesktopFileName(Wayland app_id)과 같아야 실행 중인 창이 이 항목과 짝지어진다
constexpr auto kDesktopFile = "com.yamada.studio.pokesix.desktop";

enum class Write { Unchanged, Written, Failed };

// 내용이 이미 같으면 쓰지 않는다 — 매 실행마다 파일이 바뀌면 데스크톱이 메뉴를 다시 읽는다
Write writeIfChanged(const QString &path, const QByteArray &bytes)
{
    QFile current(path);
    if (current.open(QIODevice::ReadOnly) && current.readAll() == bytes)
        return Write::Unchanged;
    current.close();
    if (!QDir().mkpath(QFileInfo(path).absolutePath()))
        return Write::Failed;
    QSaveFile file(path); // 임시 파일에 쓰고 바꿔치기 — 메뉴가 반쯤 쓴 파일을 읽지 않게
    if (!file.open(QIODevice::WriteOnly) || file.write(bytes) != bytes.size())
        return Write::Failed;
    return file.commit() ? Write::Written : Write::Failed;
}

// 문자열 값의 역슬래시 이스케이프(Desktop Entry 명세 "Possible value types")
QString escapeString(QString value)
{
    return value.replace(QLatin1Char('\\'), QStringLiteral("\\\\"));
}

// Exec의 실행 파일 인자. 공백 같은 예약 문자가 있으면 큰따옴표로 감싸고, 그 안에서 " ` $ \ 는
// 역슬래시로 이스케이프한다. %는 필드 코드라서 %%로(명세 "The Exec key")
QString execArgument(const QString &path)
{
    static const QString reserved = QStringLiteral(" \t\n\"'\\><~|&;$*?#()`");
    static const QString escapedInQuotes = QStringLiteral("\"`$\\");
    QString arg = path;
    arg.replace(QLatin1Char('%'), QStringLiteral("%%"));
    if (std::ranges::any_of(arg, [](QChar c) { return reserved.contains(c); })) {
        QString quoted = QStringLiteral("\"");
        for (const QChar c : std::as_const(arg)) {
            if (escapedInQuotes.contains(c))
                quoted += QLatin1Char('\\');
            quoted += c;
        }
        arg = quoted + QLatin1Char('"');
    }
    return escapeString(arg);
}

// AppImage 안의 .desktop에서 Exec만 이 파일의 절대 경로로 바꾸고 TryExec를 더한다
QByteArray desktopEntry(const QByteArray &bundled, const QString &appImage)
{
    QStringList lines;
    for (const QString &line : QString::fromUtf8(bundled).split(QLatin1Char('\n'))) {
        if (line.startsWith(QLatin1String("TryExec=")))
            continue;
        if (line.startsWith(QLatin1String("Exec="))) {
            lines << QStringLiteral("Exec=") + execArgument(appImage);
            lines << QStringLiteral("TryExec=") + escapeString(appImage);
            continue;
        }
        lines << line;
    }
    return lines.join(QLatin1Char('\n')).toUtf8();
}
} // namespace
#endif

namespace com::yamada::studio::desktopentry {
void registerAppImage()
{
#if defined(Q_OS_LINUX)
    const QString appImage = qEnvironmentVariable("APPIMAGE");
    const QString appDir = qEnvironmentVariable("APPDIR");
    if (appImage.isEmpty() || appDir.isEmpty())
        return; // AppImage가 아니다(빌드 폴더 · cmake --install로 실행)

    const QString dataHome = QStandardPaths::writableLocation(QStandardPaths::GenericDataLocation);
    const QString bundledShare = appDir + QStringLiteral("/usr/share");
    QFile bundled(bundledShare + QStringLiteral("/applications/") + QLatin1String(kDesktopFile));
    if (dataHome.isEmpty() || !bundled.open(QIODevice::ReadOnly)) {
        qCWarning(lcUi) << "app menu: cannot read" << bundled.fileName();
        return;
    }

    // 아이콘 먼저, .desktop은 마지막 — 메뉴가 항목을 읽을 때 아이콘이 이미 있게
    QList<Write> results;
    const QString iconRoot = bundledShare + QStringLiteral("/icons/hicolor");
    QDirIterator icons(iconRoot, {QStringLiteral("pokesix.*")}, QDir::Files,
                       QDirIterator::Subdirectories);
    while (icons.hasNext()) {
        const QString source = icons.next();
        QFile icon(source);
        const QString target = dataHome + QStringLiteral("/icons/hicolor/")
                               + QDir(iconRoot).relativeFilePath(source);
        results << (icon.open(QIODevice::ReadOnly) ? writeIfChanged(target, icon.readAll())
                                                   : Write::Failed);
    }
    const QString entryPath
            = dataHome + QStringLiteral("/applications/") + QLatin1String(kDesktopFile);
    results << writeIfChanged(entryPath, desktopEntry(bundled.readAll(), appImage));

    if (results.contains(Write::Failed))
        qCWarning(lcUi) << "app menu: could not write everything under" << dataHome;
    else if (results.contains(Write::Written))
        qCInfo(lcUi) << "app menu: registered" << appImage << "->" << entryPath;
#endif
}
} // namespace com::yamada::studio::desktopentry
