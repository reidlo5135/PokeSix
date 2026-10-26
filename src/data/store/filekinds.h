#pragma once

#include <QString>

namespace com::yamada::studio {
enum class FileKind {
    Squad,
    GameSave,
    Unknown,
};
}

namespace com::yamada::studio::filekinds {
FileKind kindOf(const QString &path);
QString dialogFilter(FileKind kind);
} // namespace com::yamada::studio::filekinds
