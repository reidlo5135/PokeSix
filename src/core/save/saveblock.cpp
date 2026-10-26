#include "core/save/saveblock.h"

#include "core/save/savebytes.h"

#include <utility> // std::pair

namespace com::yamada::studio::save {
BlockFooter readFooter(Bytes save, std::size_t blockStart, const FooterSlots &check)
{
    BlockFooter footer;
    const std::size_t end = blockStart + check.generalSize;
    if (end > save.size())
        return footer;
    footer.inFile = true;
    footer.major = readU32(save, end - 0x14);
    footer.minor = readU32(save, end - 0x10);
    footer.size = readU32(save, end - 0x0C);
    footer.magic = readU32(save, end - 0x08);
    footer.storedCrc = readU16(save, end - 0x02);
    footer.computedCrc = crc16Ccitt(save.subspan(blockStart, check.generalSize - check.footerSize));

    return footer;
}

void refreshFooter(MutableBytes save, std::size_t blockStart, const FooterSlots &check)
{
    std::size_t end = blockStart + check.generalSize;
    writeU16(save, end - 0x02,
             crc16Ccitt(save.subspan(blockStart, check.generalSize - check.footerSize)));
}

void refreshPartyBlock(MutableBytes save, const ChecksumTable &check)
{
    const std::size_t table = checksumTableStart(check);
    const std::uint16_t crc = crc16Ccitt(save.subspan(check.partyBlock, check.partyBlockSize));
    writeU16(save, check.partyCrcAt, crc);
    writeU16(save, table + check.partyCrcMirror, crc);
    writeU16(save, table + check.tableLength + 0x0E,
             crc16Ccitt(save.subspan(table, check.tableLength)));
}

std::optional<std::size_t> activeGeneralBlock(Bytes save, const FooterSlots &check)
{
    const BlockFooter slot0Footer = readFooter(save, 0, check);
    const BlockFooter slot1Footer = readFooter(save, kSlotSize, check);
    if (slot0Footer.crcOk() && slot1Footer.crcOk()) {
        if (std::pair {slot0Footer.major, slot0Footer.minor}
            > std::pair {slot1Footer.major, slot1Footer.minor}) {
            return 0;
        } else if (std::pair {slot0Footer.major, slot0Footer.minor}
                   < std::pair {slot1Footer.major, slot1Footer.minor}) {
            return kSlotSize;
        } else {
            return 0;
        }
    } else if (!slot0Footer.crcOk() && slot1Footer.crcOk()) {
        return kSlotSize;
    } else if (slot0Footer.crcOk() && !slot1Footer.crcOk()) {
        return 0;
    } else {
        return std::nullopt;
    }
}

std::size_t checksumTableStart(const ChecksumTable &check)
{
    return check.mainSize - 0x100;
}

bool checksumTableValid(Bytes save, const ChecksumTable &check)
{
    const std::size_t start = checksumTableStart(check);
    const std::size_t at = start + check.tableLength + 0x0E;

    // 파일 밖은 읽지 않는다 — span은 범위를 검사하지 않는다
    if (at + 2 > save.size())
        return false;

    return crc16Ccitt(save.subspan(start, check.tableLength)) == readU16(save, at);
}

bool partyBlockValid(Bytes save, const ChecksumTable &check)
{
    const std::size_t mirror = checksumTableStart(check) + check.partyCrcMirror;
    if (check.partyCrcAt + 2 > save.size() || mirror + 2 > save.size())
        return false;

    const std::uint16_t crc = crc16Ccitt(save.subspan(check.partyBlock, check.partyBlockSize));

    return crc == readU16(save, check.partyCrcAt) && crc == readU16(save, mirror);
}
} // namespace com::yamada::studio::save
