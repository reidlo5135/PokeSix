#pragma once

#include "core/save/partyndsreader.h"

namespace com::yamada::studio::save {
bool writeMember(MutableBytes save, const NdsSeries &series, int index, const Pkm &plain);
}
