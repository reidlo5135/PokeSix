#include "data/store/filekinds.h"

#include <QFile>
#include <QTemporaryDir>

#include <gtest/gtest.h>

namespace com::yamada::studio::filekinds {
namespace {
TEST(FileKinds, RecognisesSaveFilesByExtension)
{
    EXPECT_EQ(kindOf(QStringLiteral("PLATINUM.SAV")), FileKind::GameSave);
    EXPECT_EQ(kindOf(QStringLiteral("squad.pks")), FileKind::Squad);
    EXPECT_EQ(kindOf(QStringLiteral("save")), FileKind::Unknown);
}
}
}