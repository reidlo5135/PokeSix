#pragma once

#include <QString>

namespace com::yamada::studio {
enum class FileKind {
    Squad,
    GameSave,
    Unknown,
};

FileKind kindOf(const QString &path);

QString dialogFilter(FileKind kind);
}
