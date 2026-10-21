#pragma once

#include "data/store/squadfile.h"

#include <QString>

#include <optional>

// 게임 세이브(.sav · .dsv) → 스쿼드 (H2, ADR 0018). 가이드: docs/guides/h2-squad-sav-import.md
//
// 세이브를 읽고 해석하는 일은 savedocument::open이 한다(H10b — 원본 바이트 · 원본 값까지 든
// SaveDocument). load는 그 결과를 스쿼드 파일과 **같은 모양**(squadfile::Portable)으로 줄인다:
//
//   파일 ─▶ savedocument::open ─▶ SaveDocument ─▶ load: members[i].squad만 골라 ─▶ Portable
//
// 줄이면서 스쿼드에 칸이 없는 값(PID · 개체값 · 노력치 · 알)은 버린다.
namespace com::yamada::studio {
class Repository;
}

namespace com::yamada::studio::saveimport {
// 확장자로 고른다: .sav(melonDS · 실기 덤프) · .dsv(DeSmuME). 대소문자 무시
bool isSaveFile(const QString &path);

// 출신 게임 번호(PK4 0x5F) → PokéAPI version identifier. 모르는 값이면 빈 문자열
//   7 heartgold · 8 soulsilver · 10 diamond · 11 pearl · 12 platinum (4세대)
//   20 white · 21 black · 22 white-2 · 23 black-2 (5세대, H6)
QString versionOfOriginGame(int originGame);

// 실패하면 std::nullopt — error에 사람이 읽을 한 줄(파일을 못 연다 · 4세대 세이브가 아니다 …)
std::optional<squadfile::Portable> load(const QString &path, Repository &repository,
                                        QString *error = nullptr);
} // namespace com::yamada::studio::saveimport
